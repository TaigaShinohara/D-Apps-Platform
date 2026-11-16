import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { securityHeaders } from '../src/lib/security.mjs';
import { requestFunctionSource, responseFunctionSource } from './edge.mjs';
import { generateTemplates } from './templates.mjs';
import { readCatalog } from '../src/lib/catalog-data.mjs';
const routes = {};
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      await walk(join(directory, entry.name), path + '/');
    else {
      const key = '/' + path;
      routes[key] = key;
      if (key.endsWith('/index.html')) routes[key.slice(0, -10)] = key;
    }
  }
}
await walk('dist');
const downloads = readCatalog().flatMap((app) =>
  app.distributions
    .filter((item) => item.kind === 'direct')
    .map((item) => {
      if (app.id !== 'oneclip' || item.filename !== 'OneClip-1.0.1.zip')
        throw new Error(
          'Add and verify a release policy before enabling a new direct download.',
        );
      return `/downloads/${app.id}/${item.version}/${item.filename}`;
    }),
);
const revoked = JSON.parse(
  await readFile('config/revoked-downloads.json', 'utf8'),
);
if (
  !Array.isArray(revoked) ||
  revoked.some(
    (path) =>
      typeof path !== 'string' ||
      !/^\/downloads\/[a-z0-9-]+\/\d+\.\d+\.\d+\/[A-Za-z0-9._-]+$/.test(path),
  )
)
  throw new Error('Invalid revoked download path');
const request = requestFunctionSource({
  headers: securityHeaders,
  routes,
  downloads,
  revoked,
});
const response = responseFunctionSource(securityHeaders);
if (Buffer.byteLength(request) > 10000 || Buffer.byteLength(response) > 10000)
  throw new Error(
    'CloudFront Function exceeds 10 KB; revise before publishing',
  );
await mkdir('infra/generated', { recursive: true });
await writeFile('infra/generated/request.js', request);
await writeFile('infra/generated/response.js', response);
await writeFile(
  'infra/generated/manifest.json',
  JSON.stringify({ routes, downloads, revoked }, null, 2),
);
for (const [name, template] of Object.entries(
  generateTemplates({ request, response }),
))
  await writeFile(
    `infra/generated/${name}.json`,
    JSON.stringify(template, null, 2) + '\n',
  );
console.log(
  `Prepared ${Object.keys(routes).length} paths, ${downloads.length} approved downloads, ${revoked.length} revocations.`,
);
