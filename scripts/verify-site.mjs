import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dangerousScheme = /^(?:javascript|data|vbscript|blob|file):/i;
const namedReferences = new Map([
  ['amp', '&'],
  ['colon', ':'],
  ['tab', '\t'],
  ['newline', '\n'],
]);

function characterFromReference(codePoint, original) {
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  )
    return original;
  return String.fromCodePoint(codePoint);
}

function decodeCharacterReferences(value) {
  return value.replace(
    /&(?:#x([0-9a-f]{1,6})|#([0-9]{1,7})|([a-z][a-z0-9]*));?/gi,
    (match, hex, decimal, name) => {
      if (name) {
        if (!match.endsWith(';')) return match;
        return namedReferences.get(name.toLowerCase()) ?? match;
      }
      return characterFromReference(
        hex ? Number.parseInt(hex, 16) : Number(decimal),
        match,
      );
    },
  );
}

function decodeScheme(value) {
  let decoded = value.trim();
  for (let pass = 0; pass < 4; pass++) {
    const next = decodeCharacterReferences(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  let normalized = '';
  for (const character of decoded) {
    const code = character.codePointAt(0);
    if (code <= 0x20 || code === 0x7f) continue;
    normalized += character;
  }
  return normalized;
}

function attributeValues(html) {
  const values = [];
  for (const match of html.matchAll(
    /\s(href|src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
  )) {
    const name = match[1].toLowerCase();
    const raw = match[2] ?? match[3] ?? match[4] ?? '';
    if (name === 'srcset') {
      for (const candidate of raw.split(','))
        values.push(candidate.trim().split(/\s+/)[0] || '');
    } else values.push(raw);
  }
  return values;
}

export function assertSafeDocument(html, path) {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (/http-equiv\s*=\s*["']?\s*refresh\b/i.test(tag[0]))
      throw new Error(`Meta refresh is not allowed in ${path}`);
  }
  for (const value of attributeValues(html)) {
    if (dangerousScheme.test(decodeScheme(value)))
      throw new Error(`Disallowed link scheme in ${path}`);
  }
}

async function verifyBuiltSite() {
  const manifest = JSON.parse(
    await readFile('infra/generated/manifest.json', 'utf8'),
  );
  let pages = 0;
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (!path.endsWith('.html')) continue;
      pages++;
      const html = await readFile(path, 'utf8');
      assertSafeDocument(html, path);
      if (
        /<(?:iframe|form|input|textarea|style)\b|\s(?:on\w+|style)=|<script[^>]*>\s*[^\s<]/i.test(
          html,
        )
      )
        throw new Error(`Unexpected active content in ${path}`);
      if (
        !html.includes('Content-Security-Policy') ||
        !html.includes('no-referrer')
      )
        throw new Error(`Missing privacy headers in ${path}`);
      for (const [tag] of html.matchAll(
        /<(?:link|img|script|source)\b[^>]*>/gi,
      )) {
        if (
          /^<link\b/i.test(tag) &&
          /\srel="(?:canonical|alternate)"/i.test(tag)
        )
          continue;
        for (const [, url] of tag.matchAll(
          /\s(?:href|src|srcset)="([^"]+)"/gi,
        )) {
          if (/(?:^|,\s*)(?:https?:\/\/|\/\/|data:)/i.test(url))
            throw new Error(`Embedded or third-party subresource in ${path}`);
        }
      }
      for (const match of html.matchAll(/\s(?:src|href)="([^"#]*)[^"\n]*"/g)) {
        const value = match[1];
        if (manifest.revoked.includes(value))
          throw new Error(
            `Remove the revoked download link: ${value} in ${path}`,
          );
        if (
          value.startsWith('/') &&
          !value.startsWith('//') &&
          !manifest.routes[value] &&
          !manifest.downloads.includes(value)
        )
          throw new Error(`Broken internal link: ${value} in ${path}`);
      }
    }
  }
  await walk('dist');
  console.log(
    `Verified ${pages} HTML pages: internal links, CSP, no forms/inline handlers/meta refresh/dangerous link schemes/third-party subresources.`,
  );
}

if (process.argv[1]?.endsWith('/verify-site.mjs')) await verifyBuiltSite();
