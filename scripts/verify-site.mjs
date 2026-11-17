import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dangerousScheme = /^(?:javascript|data|vbscript|blob|file):/i;

function decodeScheme(value) {
  return value
    .trim()
    .replace(/&colon;/gi, ':')
    .replace(/&#0*58;?/gi, ':')
    .replace(/&#x0*3a;?/gi, ':')
    .replace(/\s+/g, '');
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
