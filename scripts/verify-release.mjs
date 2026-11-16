import { readFile, mkdir, writeFile, rename, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const app = JSON.parse(await readFile('src/data/oneclip.json', 'utf8'));
const item = app.distributions[0];
const directory = '.artifacts/releases';
const target = join(directory, item.filename);
await mkdir(directory, { recursive: true });
if (process.argv.includes('--fetch')) {
  let url = item.source;
  let response;
  for (let redirect = 0; redirect <= 5; redirect++) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      ![
        'github.com',
        'release-assets.githubusercontent.com',
        'objects.githubusercontent.com',
      ].includes(parsed.hostname)
    )
      throw new Error('Unapproved release download host');
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      url = new URL(response.headers.get('location'), url).href;
      continue;
    }
    break;
  }
  if (!response?.ok || !response.body)
    throw new Error('Release download failed');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > item.bytes) throw new Error('Release exceeds declared size');
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);
  if (
    bytes !== item.bytes ||
    createHash('sha256').update(data).digest('hex') !== item.sha256
  )
    throw new Error('Release integrity mismatch');
  await writeFile(target + '.part', data, { mode: 0o600 });
  await rename(target + '.part', target);
}
const data = await readFile(target);
const hash = createHash('sha256').update(data).digest('hex');
if ((await stat(target)).size !== item.bytes || hash !== item.sha256)
  throw new Error('Release integrity mismatch');
const report = {
  app: app.id,
  version: item.version,
  bytes: item.bytes,
  sha256: hash,
  integrity: 'passed',
  signing: 'not-checked',
  checkedAt: new Date().toISOString(),
};
if (process.argv.includes('--macos')) {
  if (process.platform !== 'darwin')
    throw new Error('macOS required for signature and Gatekeeper checks');
  const check = (command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8' });
    if (result.status !== 0)
      throw new Error(`${command} failed: ${result.stderr}`);
    return result.stdout + result.stderr;
  };
  check('python3', ['scripts/audit-archive.py', target]);
  const extracted = join(directory, 'verified-' + hash.slice(0, 12));
  await mkdir(extracted, { recursive: true });
  check('ditto', ['-x', '-k', target, extracted]);
  const bundle = join(extracted, 'OneClip.app');
  check('codesign', ['--verify', '--deep', '--strict', '--verbose=2', bundle]);
  const signature = check('codesign', ['-dv', '--verbose=4', bundle]);
  if (
    !signature.includes('Authority=Developer ID Application:') ||
    !signature.includes('Identifier=local.OneClip') ||
    !signature.includes('TeamIdentifier=MY4L8GVM2L')
  )
    throw new Error(
      'Unexpected signing identity; inspect publisher before accepting',
    );
  const gatekeeper = check('spctl', [
    '--assess',
    '--type',
    'execute',
    '--verbose=2',
    bundle,
  ]);
  check('xcrun', ['stapler', 'validate', bundle]);
  report.signing = 'passed';
  report.team = signature.match(/TeamIdentifier=(.+)/)?.[1];
  report.gatekeeper = gatekeeper.trim();
  await rm(extracted, { recursive: true });
}
await writeFile(
  join(directory, 'verification.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
