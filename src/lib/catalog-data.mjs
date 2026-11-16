import { readFileSync, readdirSync } from 'node:fs';
export function readCatalog() {
  return readdirSync('src/data')
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(`src/data/${name}`, 'utf8')));
}
