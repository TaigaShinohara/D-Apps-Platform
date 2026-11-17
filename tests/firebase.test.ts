import test from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import {
  encodeFiles,
  stageVersion,
  releaseVersion,
  releaseLabels,
  validateUploadURL,
} from '../scripts/firebase-api.mjs';
import { hostingConfig, servingConfig } from '../scripts/firebase-config.mjs';
import {
  verifyLock,
  verifyRevocationHistory,
} from '../scripts/verify-distribution-lock.mjs';
import { withoutRevoked } from '../src/lib/catalog-data.mjs';

const site = 'd-apps-test';
const version = `sites/${site}/versions/v1`;
const commit = 'a'.repeat(40);
const config = servingConfig(hostingConfig());
const files = {
  '/404.html': Buffer.from('not found'),
  '/ja/index.html': Buffer.from('日本語'),
};
const { hashes } = encodeFiles(files);
const remote = {
  status: 'FINALIZED',
  config,
  labels: releaseLabels(commit, config, hashes),
};

test('staging uploads gzip bytes by their hashes, finalizes, and never publishes', async () => {
  const calls: string[] = [];
  let uploaded = 0;
  const api = async (method: string, path: string, data: any) => {
    calls.push(`${method} ${path}`);
    if (path === `sites/${site}/versions`) return { name: version };
    if (path.endsWith(':populateFiles')) {
      assert.deepEqual(data.files, hashes);
      return {
        uploadUrl: `https://upload-firebasehosting.googleapis.com/upload/${version}/files`,
        uploadRequiredHashes: Object.values(hashes),
      };
    }
    assert.equal(data.status, 'FINALIZED');
    return { status: 'FINALIZED' };
  };
  await stageVersion({
    api,
    upload: async (url: string, bytes: Buffer) => {
      const path = Object.keys(hashes).find((p) => url.endsWith(hashes[p]))!;
      assert.deepEqual(gunzipSync(bytes), files[path as keyof typeof files]);
      uploaded++;
    },
    site,
    commit,
    config,
    files,
  });
  assert.equal(uploaded, 2);
  assert.equal(
    calls.some((call) => call.includes('/releases')),
    false,
  );
});

test('staging rejects foreign sites, malicious upload targets and unknown hashes', async () => {
  assert.throws(() =>
    validateUploadURL(
      site,
      version,
      `https://evil.example/upload/${version}/files`,
    ),
  );
  assert.throws(() =>
    validateUploadURL(
      site,
      version,
      `https://upload-firebasehosting.googleapis.com/upload/${version}/files?redirect=x`,
    ),
  );
  assert.throws(() => encodeFiles({ '/../secret': Buffer.from(''), ...files }));
  assert.throws(() => encodeFiles({ '/__/auth': Buffer.from(''), ...files }));
  await assert.rejects(
    stageVersion({
      api: async () => ({ name: 'sites/another-site/versions/v1' }),
      upload: async () => assert.fail(),
      site,
      commit,
      config,
      files,
    }),
    /another site/,
  );
  await assert.rejects(
    stageVersion({
      api: async (_m: string, path: string) =>
        path.endsWith('/versions')
          ? { name: version }
          : {
              uploadUrl: `https://upload-firebasehosting.googleapis.com/upload/${version}/files`,
              uploadRequiredHashes: ['unknown'],
            },
      upload: async () => assert.fail(),
      site,
      commit,
      config,
      files,
    }),
    /unknown upload hash/,
  );
});

function fakeRelease({
  changedConfig = false,
  extraFile = false,
  changedLive = false,
  wrongCommit = false,
} = {}) {
  let published = false;
  const api = async (method: string, path: string) => {
    if (path === version)
      return {
        ...remote,
        config: changedConfig
          ? { ...config, rewrites: [{ glob: '**', path: '/ja/index.html' }] }
          : config,
        labels: wrongCommit ? {} : remote.labels,
      };
    if (path.includes('/files?'))
      return {
        files: [
          ...Object.entries(hashes).map(([path, hash]) => ({ path, hash })),
          ...(extraFile ? [{ path: '/secret', hash: 'bad' }] : []),
        ],
      };
    if (method === 'POST') {
      published = true;
      return { name: `sites/${site}/releases/r1`, version: { name: version } };
    }
    return {
      releases:
        published || changedLive ? [{ version: { name: version } }] : [],
    };
  };
  return { api, published: () => published };
}
test('publication refuses changed config, unexpected files, commit and live-version mismatch', async () => {
  for (const options of [
    { changedConfig: true },
    { extraFile: true },
    { wrongCommit: true },
    { changedLive: true },
  ]) {
    const fake = fakeRelease(options);
    await assert.rejects(
      releaseVersion({
        api: fake.api,
        site,
        version,
        commit,
        config,
        files,
        expectedCurrent: 'NONE',
      }),
    );
    assert.equal(fake.published(), false);
  }
});
test('publication verifies files and reads back the released version', async () => {
  const fake = fakeRelease();
  const result = await releaseVersion({
    api: fake.api,
    site,
    version,
    commit,
    config,
    files,
    expectedCurrent: 'NONE',
  });
  assert.equal(fake.published(), true);
  assert.equal(result.version, version);
});
test('immutable URL history cannot be changed or deleted, and revocations remove links', () => {
  const path = '/downloads/example/1.0.0/example.zip';
  const previous = { [path]: { sha256: 'a'.repeat(64), bytes: 10 } };
  verifyLock(previous, previous);
  assert.throws(() => verifyLock({}, previous));
  assert.throws(() => verifyRevocationHistory([], [path]));
  verifyRevocationHistory([path], [path]);
  assert.throws(() =>
    verifyLock({ [path]: { sha256: 'b'.repeat(64), bytes: 10 } }, previous),
  );
  const app = {
    id: 'example',
    distributions: [
      { kind: 'direct', version: '1.0.0', filename: 'example.zip' },
    ],
  };
  assert.deepEqual(withoutRevoked([app], [path]), []);
  assert.equal(
    withoutRevoked(
      [{ ...app, distributions: [...app.distributions, { kind: 'store' }] }],
      [path],
    )[0].distributions.length,
    1,
  );
});
