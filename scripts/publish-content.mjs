// Manual, protected-environment content staging. Does not enable delivery or change DNS.
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
const [siteBucket, downloadsBucket, releaseId] = process.argv.slice(2);
if (
  ![siteBucket, downloadsBucket].every((s) =>
    /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s || ''),
  ) ||
  !/^[a-f0-9]{40}$/.test(releaseId || '')
)
  throw new Error(
    'Usage: publish-content.mjs SITE_BUCKET DOWNLOADS_BUCKET COMMIT_SHA',
  );
const run = (args) => {
  const result = spawnSync('aws', args, { encoding: 'utf8' });
  if (result.status !== 0)
    throw new Error(
      `AWS operation ${args[0]} ${args[1]} failed: ${result.stderr}`,
    );
  return result.stdout;
};
const app = JSON.parse(await readFile('src/data/oneclip.json', 'utf8'));
const verification = JSON.parse(
  await readFile('.artifacts/releases/verification.json', 'utf8'),
);
const item = app.distributions[0];
if (
  verification.signing !== 'passed' ||
  verification.sha256 !== item.sha256 ||
  verification.version !== item.version
)
  throw new Error(
    'Fresh macOS signature verification required before publishing',
  );
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
async function put(bucket, key, path, type, disposition) {
  const bytes = await readFile(path);
  const digest = createHash('sha256').update(bytes).digest('base64');
  const existing = spawnSync(
    'aws',
    [
      's3api',
      'head-object',
      '--bucket',
      bucket,
      '--key',
      key,
      '--checksum-mode',
      'ENABLED',
    ],
    { encoding: 'utf8' },
  );
  if (existing.status === 0) {
    const value = JSON.parse(existing.stdout);
    if (value.ChecksumSHA256 !== digest)
      throw new Error(`Refusing to replace existing object: ${key}`);
    return;
  }
  // Conditional creation prevents races or overwriting a release even when HEAD is denied.
  const cache =
    disposition || key.includes('/_astro/')
      ? 'public,max-age=31536000,immutable'
      : 'public,max-age=0,s-maxage=300,must-revalidate';
  run([
    's3api',
    'put-object',
    '--bucket',
    bucket,
    '--key',
    key,
    '--body',
    path,
    '--if-none-match',
    '*',
    '--checksum-sha256',
    digest,
    '--content-type',
    type,
    '--cache-control',
    cache,
    ...(disposition ? ['--content-disposition', disposition] : []),
  ]);
  const checked = JSON.parse(
    run([
      's3api',
      'head-object',
      '--bucket',
      bucket,
      '--key',
      key,
      '--checksum-mode',
      'ENABLED',
    ]),
  );
  if (
    checked.ChecksumSHA256 !== digest ||
    checked.ContentLength !== bytes.length
  )
    throw new Error(`Uploaded object verification failed: ${key}`);
}
const archive = `.artifacts/releases/${item.filename}`;
const bytes = await readFile(archive);
if (
  bytes.length !== item.bytes ||
  createHash('sha256').update(bytes).digest('hex') !== item.sha256
)
  throw new Error('Artifact mismatch');
await put(
  downloadsBucket,
  `downloads/${app.id}/${item.version}/${item.filename}`,
  archive,
  'application/zip',
  `attachment; filename="${item.filename}"`,
);
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const key = prefix + entry.name;
    if (entry.isDirectory()) await walk(path, key + '/');
    else
      await put(
        siteBucket,
        `releases/${releaseId}/${key}`,
        path,
        mime[extname(key)] || 'application/octet-stream',
      );
  }
}
await walk('dist');
console.log(
  `Verified content staged at releases/${releaseId}. Delivery and DNS were not changed. Review/apply the matching edge template separately.`,
);
