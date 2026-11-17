import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { GoogleAuth } from 'google-auth-library';
import { prepareHosting } from './prepare-hosting.mjs';
import {
  apiOrigin,
  stageVersion,
  releaseVersion,
  validateSite,
  validateVersion,
} from './firebase-api.mjs';

const [mode, site, commit, version, expectedCurrent, ...extra] =
  process.argv.slice(2);
if (
  !['stage', 'release'].includes(mode) ||
  extra.length ||
  (mode === 'stage' && (version || expectedCurrent))
)
  throw new Error(
    'Usage: firebase-publish.mjs stage SITE COMMIT | release SITE COMMIT VERSION EXPECTED_CURRENT',
  );
validateSite(site);
if (!/^[a-f0-9]{40}$/.test(commit || ''))
  throw new Error('Reviewed commit SHA required');
if (
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !==
    commit ||
  execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error(
    'Publishing requires a clean checkout at the reviewed commit',
  );
if (mode === 'release') {
  validateVersion(site, version);
  if (expectedCurrent !== 'NONE') validateVersion(site, expectedCurrent);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  throw new Error(
    'Explicit short-lived Google credential configuration is required; no default project or key is selected',
  );
const hashes = await prepareHosting({ requireSigning: true });
const files = {};
for (const path of Object.keys(hashes))
  files[path] = await readFile('.artifacts/hosting/public' + path);
const config = JSON.parse(
  await readFile('infra/generated/firebase-serving.json', 'utf8'),
);
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/firebase.hosting'],
});
const client = await auth.getClient();
async function request(method, url, data) {
  try {
    return (
      await client.request({
        method,
        url,
        data,
        headers: {
          'Content-Type': Buffer.isBuffer(data)
            ? 'application/octet-stream'
            : 'application/json',
        },
        maxRedirects: 0,
        timeout: 60_000,
      })
    ).data;
  } catch (error) {
    // Gaxios errors can contain bearer tokens and credential configuration.
    // eslint-disable-next-line preserve-caught-error
    throw new Error(
      `Firebase operation failed (HTTP ${error.response?.status || 'unavailable'}). Credentials and response details were not logged.`,
    );
  }
}
const api = (method, path, data) => request(method, apiOrigin + path, data);
const upload = (url, data) => request('POST', url, data);
const result =
  mode === 'stage'
    ? await stageVersion({ api, upload, site, commit, config, files })
    : await releaseVersion({
        api,
        site,
        commit,
        config,
        files,
        version,
        expectedCurrent,
      });
await writeFile(
  `.artifacts/hosting/${mode}-result.json`,
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify({ operation: mode, ...result }));
