import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { server as superstatic } from 'superstatic';
import { sha256, prepareHosting } from './prepare-hosting.mjs';
import { securityHeaders } from '../src/lib/security.mjs';

await prepareHosting();
const { hosting } = JSON.parse(
  await readFile('firebase.generated.json', 'utf8'),
);
const server = superstatic({
  config: hosting,
  port: 0,
  hostname: '127.0.0.1',
  debug: false,
  compression: true,
  stack: 'strict',
}).listen();
await new Promise((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (path, options = {}) =>
    fetch(base + path, { redirect: 'manual', ...options });
  const root = await get('/');
  assert.equal(root.status, 302);
  assert.equal(root.headers.get('location'), '/ja/');
  const manifest = JSON.parse(
    await readFile('infra/generated/manifest.json', 'utf8'),
  );
  for (const path of [
    '/ja/',
    '/en/',
    '/ja/privacy/',
    '/en/privacy/',
    '/missing-file.zip',
  ]) {
    const response = await get(path);
    assert.equal(
      response.status,
      path === '/missing-file.zip' ? 404 : 200,
      path,
    );
    for (const [name, value] of Object.entries(securityHeaders))
      assert.equal(response.headers.get(name), value, `${path} ${name}`);
    assert.equal(response.headers.get('set-cookie'), null);
    const body = await response.text();
    if (path === '/ja/privacy/') assert.match(body, /数か月間保持/);
    if (path === '/en/privacy/')
      assert.match(body, /retains IP data for a few months/);
  }
  for (const path of manifest.downloads.filter(
    (path) => !manifest.revoked.includes(path),
  )) {
    const response = await get(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /^attachment;/);
    assert.equal(
      sha256(Buffer.from(await response.arrayBuffer())),
      sha256(await readFile('.artifacts/hosting/public' + path)),
    );
    assert.equal((await get(path, { method: 'HEAD' })).status, 200);
  }
  for (const path of [
    ...manifest.revoked,
    '/.env',
    '/.git/config',
    '/downloads/unapproved/1.0.0/file.zip',
  ])
    assert.equal((await get(path)).status, 404, path);
  for (const path of manifest.revoked) {
    assert.equal((await get(path, { method: 'HEAD' })).status, 404, path);
    assert.equal(
      (await get(path, { headers: { Range: 'bytes=0-15' } })).status,
      404,
      path,
    );
  }
  const originalPage = await (await get('/ja/')).text();
  const methodStatuses = {};
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await get('/ja/', { method, body: 'synthetic test' });
    methodStatuses[method] = response.status;
    assert.equal(
      await (await get('/ja/')).text(),
      originalPage,
      `${method} must not mutate static content`,
    );
  }
  console.log(
    'Local static engine method statuses (not a method allowlist):',
    JSON.stringify(methodStatuses),
  );
  // This static engine does not emulate Google-managed TLS, reserved /__/
  // endpoints, anti-abuse protections, retention or CDN invalidation.
  console.log(
    'Firebase static engine: bilingual privacy, headers/404, redirects, downloads, HEAD and unapproved files verified.',
  );
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
