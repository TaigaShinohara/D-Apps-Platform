import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  rm,
  copyFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readDirectDownloads } from '../src/lib/catalog-data.mjs';

export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
export async function prepareHosting({ requireSigning = false } = {}) {
  const manifest = JSON.parse(
    await readFile('infra/generated/manifest.json', 'utf8'),
  );
  const output = '.artifacts/hosting/public';
  // Only this generated staging directory is reset; releases/credentials are separate.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const hashes = {};
  async function copyTree(source, prefix = '') {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      // Single narrow exception to the dotfile ban: the RFC 9116 contact
      // file must live at /.well-known/security.txt. The directory itself
      // is allowed only at the root, and security.txt is the only file
      // allowed inside it; every other dotfile is still rejected.
      const isWellKnownDir =
        prefix === '' && entry.name === '.well-known' && entry.isDirectory();
      const isSecurityTxt =
        prefix === '.well-known/' &&
        entry.name === 'security.txt' &&
        entry.isFile();
      if (
        !isWellKnownDir &&
        !isSecurityTxt &&
        (prefix === '.well-known/' ||
          !/^[A-Za-z0-9._-]+$/.test(entry.name) ||
          entry.name.startsWith('.'))
      )
        throw new Error('Unexpected public file name');
      const relative = prefix + entry.name;
      if (entry.isDirectory())
        await copyTree(join(source, entry.name), relative + '/');
      else {
        if (!entry.isFile() || relative.startsWith('downloads/'))
          throw new Error('Only regular approved site files may be staged');
        const bytes = await readFile(join(source, entry.name));
        await mkdir(join(output, prefix), { recursive: true });
        await copyFile(join(source, entry.name), join(output, relative));
        hashes['/' + relative] = sha256(bytes);
      }
    }
  }
  await copyTree('dist');
  const lock = JSON.parse(
    await readFile('config/distribution-lock.json', 'utf8'),
  );
  for (const { item, path } of readDirectDownloads()) {
    if (manifest.revoked.includes(path)) continue;
    if (lock[path]?.sha256 !== item.sha256 || lock[path]?.bytes !== item.bytes)
      throw new Error('An immutable download record is required');
    const bytes = await readFile(`.artifacts/releases/${item.filename}`);
    if (bytes.length !== item.bytes || sha256(bytes) !== item.sha256)
      throw new Error('Download integrity check failed');
    if (requireSigning) {
      const check = JSON.parse(
        await readFile('.artifacts/releases/verification.json', 'utf8'),
      );
      const age = Date.now() - Date.parse(check.checkedAt);
      if (
        check.signing !== 'passed' ||
        check.sha256 !== item.sha256 ||
        check.version !== item.version ||
        !Number.isFinite(age) ||
        age < 0 ||
        age > 24 * 60 * 60 * 1000
      )
        throw new Error('Fresh macOS signing verification required');
    }
    await mkdir(join(output, path.slice(1, path.lastIndexOf('/'))), {
      recursive: true,
    });
    await writeFile(join(output, path.slice(1)), bytes);
    hashes[path] = item.sha256;
  }
  for (const path of manifest.revoked)
    if (hashes[path])
      throw new Error('Revoked binary included in hosting bundle');
  await writeFile(
    '.artifacts/hosting/hashes.json',
    JSON.stringify(hashes, null, 2) + '\n',
  );
  return hashes;
}
if (process.argv[1]?.endsWith('/prepare-hosting.mjs')) {
  const hashes = await prepareHosting({
    requireSigning: process.argv.includes('--require-signing'),
  });
  console.log(
    `Prepared ${Object.keys(hashes).length} verified public files. No upload performed.`,
  );
}
