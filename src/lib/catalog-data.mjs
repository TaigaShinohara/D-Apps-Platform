import { readFileSync, readdirSync } from 'node:fs';
export function readRevocations() {
  const revoked = JSON.parse(
    readFileSync('config/revoked-downloads.json', 'utf8'),
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
  return revoked;
}
export function withoutRevoked(catalog, revoked) {
  return catalog
    .map((app) => ({
      ...app,
      distributions: app.distributions.filter(
        (item) =>
          item.kind !== 'direct' ||
          !revoked.includes(
            `/downloads/${app.id}/${item.version}/${item.filename}`,
          ),
      ),
    }))
    .filter((app) => app.distributions.length > 0);
}
export function readCatalog({ includeRevoked = false } = {}) {
  const catalog = readdirSync('src/data')
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(`src/data/${name}`, 'utf8')));
  return includeRevoked ? catalog : withoutRevoked(catalog, readRevocations());
}
