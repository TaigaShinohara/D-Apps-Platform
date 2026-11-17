import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { hostingConfig, servingConfig } from './firebase-config.mjs';
import { readCatalog, readRevocations } from '../src/lib/catalog-data.mjs';
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
const revoked = readRevocations();
await rm('infra/generated', { recursive: true, force: true });
await mkdir('infra/generated', { recursive: true });
await writeFile(
  'infra/generated/manifest.json',
  JSON.stringify({ routes, downloads, revoked }, null, 2),
);
const hosting = hostingConfig(
  downloads.filter((path) => !revoked.includes(path)),
);
await writeFile(
  'firebase.generated.json',
  JSON.stringify(
    {
      hosting,
      emulators: {
        hosting: { host: '127.0.0.1', port: 4322 },
        ui: { enabled: false },
        singleProjectMode: true,
      },
    },
    null,
    2,
  ) + '\n',
);
await writeFile(
  'infra/generated/firebase-serving.json',
  JSON.stringify(servingConfig(hosting), null, 2) + '\n',
);
console.log(
  `Prepared ${Object.keys(routes).length} paths, ${downloads.length} approved downloads, ${revoked.length} revocations.`,
);
