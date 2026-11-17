import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
      if (/^<link\b/i.test(tag) && /\srel="(?:canonical|alternate)"/i.test(tag))
        continue;
      for (const [, url] of tag.matchAll(/\s(?:href|src|srcset)="([^"]+)"/gi)) {
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
  `Verified ${pages} HTML pages: internal links, CSP, no forms/inline handlers/third-party subresources.`,
);
