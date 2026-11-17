import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { readCatalog, readRevocations } from '../src/lib/catalog-data.mjs';

export function verifyRevocationHistory(current, previous) {
  if (previous.some((path) => !current.includes(path)))
    throw new Error('Previously revoked downloads must remain revoked');
}

export function verifyLock(current, previous = {}) {
  for (const [path, record] of Object.entries(previous)) {
    if (
      current[path]?.sha256 !== record.sha256 ||
      current[path]?.bytes !== record.bytes
    )
      throw new Error(
        'Existing distribution URLs must never change or disappear from the lock',
      );
  }
  for (const [path, record] of Object.entries(current)) {
    if (
      !/^\/downloads\/[a-z0-9-]+\/\d+\.\d+\.\d+\/[A-Za-z0-9._-]+$/.test(path) ||
      !/^[a-f0-9]{64}$/.test(record.sha256) ||
      !Number.isSafeInteger(record.bytes) ||
      record.bytes <= 0
    )
      throw new Error('Invalid immutable distribution record');
  }
}

if (process.argv[1]?.endsWith('/verify-distribution-lock.mjs')) {
  const current = JSON.parse(
    await readFile('config/distribution-lock.json', 'utf8'),
  );
  let previous = {};
  const base = process.env.DISTRIBUTION_BASE_SHA;
  if (base) {
    if (!/^[a-f0-9]{40}$/.test(base))
      throw new Error('Full base commit SHA required');
    // Before the migration commit the lock did not exist. Only that absence is allowed.
    const files = execFileSync(
      'git',
      ['ls-tree', '--name-only', base, 'config/distribution-lock.json'],
      { encoding: 'utf8' },
    ).trim();
    if (files)
      previous = JSON.parse(
        execFileSync('git', ['show', `${base}:config/distribution-lock.json`], {
          encoding: 'utf8',
        }),
      );
    const previousRevocations = JSON.parse(
      execFileSync('git', ['show', `${base}:config/revoked-downloads.json`], {
        encoding: 'utf8',
      }),
    );
    verifyRevocationHistory(readRevocations(), previousRevocations);
  }
  verifyLock(current, previous);
  for (const app of readCatalog())
    for (const item of app.distributions.filter((d) => d.kind === 'direct')) {
      const path = `/downloads/${app.id}/${item.version}/${item.filename}`;
      if (
        current[path]?.sha256 !== item.sha256 ||
        current[path]?.bytes !== item.bytes
      )
        throw new Error(
          'Catalog does not match the immutable distribution lock',
        );
    }
  console.log('Distribution URL history and catalog integrity verified.');
}
