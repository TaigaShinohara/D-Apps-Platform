import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  symlink,
  rm,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { sha256 } from '../scripts/prepare-hosting.mjs';

test('bundle refuses tampered/unsigned files and revocation works without the upstream ZIP', async () => {
  const root = await mkdtemp(join(tmpdir(), 'd-apps-bundle-'));
  const script = resolve('scripts/prepare-hosting.mjs');
  const verifier = resolve('scripts/verify-release.mjs');
  const path = '/downloads/oneclip/1.0.1/OneClip-1.0.1.zip';
  const bytes = Buffer.from('synthetic binary, never distributed');
  const item = {
    kind: 'direct',
    version: '1.0.1',
    filename: 'OneClip-1.0.1.zip',
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  const run = (signing = false) =>
    execFileSync(
      process.execPath,
      [script, ...(signing ? ['--require-signing'] : [])],
      { cwd: root, stdio: 'pipe' },
    );
  try {
    for (const directory of [
      'dist',
      'src/data',
      'config',
      'infra/generated',
      '.artifacts/releases',
    ])
      await mkdir(join(root, directory), { recursive: true });
    await writeFile(join(root, 'dist/404.html'), 'not found');
    await writeFile(
      join(root, 'src/data/oneclip.json'),
      JSON.stringify({ id: 'oneclip', distributions: [item] }),
    );
    await writeFile(
      join(root, 'config/distribution-lock.json'),
      JSON.stringify({ [path]: { sha256: item.sha256, bytes: item.bytes } }),
    );
    await writeFile(join(root, 'config/revoked-downloads.json'), '[]');
    await writeFile(
      join(root, 'infra/generated/manifest.json'),
      JSON.stringify({ revoked: [] }),
    );
    const zip = join(root, '.artifacts/releases', item.filename);
    await writeFile(zip, bytes);
    run();
    assert.deepEqual(
      await readFile(join(root, '.artifacts/hosting/public', path)),
      bytes,
    );
    assert.throws(() => run(true));
    await writeFile(zip, 'tampered');
    assert.throws(() => run());
    await writeFile(zip, bytes);
    await symlink(zip, join(root, 'dist/unapproved.zip'));
    assert.throws(() => run());
    await rm(join(root, 'dist/unapproved.zip'));
    await writeFile(
      join(root, 'config/revoked-downloads.json'),
      JSON.stringify([path]),
    );
    await writeFile(
      join(root, 'infra/generated/manifest.json'),
      JSON.stringify({ revoked: [path] }),
    );
    await rm(zip);
    const unavailableUpstream =
      'data:text/javascript,' +
      encodeURIComponent(
        'globalThis.fetch = async () => { throw new Error("Upstream ZIP unavailable"); };',
      );
    execFileSync(
      process.execPath,
      ['--import', unavailableUpstream, verifier, '--fetch', '--macos'],
      { cwd: root, stdio: 'pipe' },
    );
    await assert.rejects(
      access(join(root, '.artifacts/releases/verification.json')),
    );
    run(true);
    await assert.rejects(access(join(root, '.artifacts/hosting/public', path)));
    assert.equal(
      await readFile(join(root, '.artifacts/hosting/public/404.html'), 'utf8'),
      'not found',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
