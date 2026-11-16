import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// Synthetic archives exercise extraction boundaries without opening app binaries.
function audit(entries: [string, string, boolean?][]) {
  const directory = mkdtempSync(join(tmpdir(), 'd-apps-archive-test-'));
  const path = join(directory, 'fixture.zip');
  try {
    const create = spawnSync(
      'python3',
      [
        '-c',
        `
import json,sys,zipfile,stat
with zipfile.ZipFile(sys.argv[1], 'w') as z:
    for row in json.loads(sys.argv[2]):
        info=zipfile.ZipInfo(row[0])
        info.create_system=3
        info.external_attr=((stat.S_IFLNK if len(row)>2 and row[2] else stat.S_IFREG)|0o644)<<16
        z.writestr(info,row[1])
`,
        path,
        JSON.stringify(entries),
      ],
      { encoding: 'utf8' },
    );
    assert.equal(create.status, 0, create.stderr);
    return spawnSync('python3', ['scripts/audit-archive.py', path], {
      encoding: 'utf8',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
test('archive permits a relative framework symlink that stays within the app', () => {
  const result = audit([
    ['OneClip.app/Framework/B/file', 'data'],
    ['OneClip.app/Framework/Current', 'B/file', true],
  ]);
  assert.equal(result.status, 0, result.stderr);
});
test('archive rejects traversal, absolute paths, escaped links, cycles and dangling links', () => {
  for (const fixture of [
    [['../outside', 'x']],
    [['/absolute', 'x']],
    [['OneClip.app/link', '../../outside', true]],
    [['OneClip.app/link', 'link', true]],
    [['OneClip.app/link', 'missing', true]],
  ] as [string, string, boolean?][][])
    assert.notEqual(audit(fixture).status, 0);
});
test('archive rejects writes through a symlink parent and duplicate paths', () => {
  assert.notEqual(
    audit([
      ['OneClip.app/target', 'x'],
      ['OneClip.app/link', 'target', true],
      ['OneClip.app/LINK/payload', 'x'],
    ]).status,
    0,
  );
  assert.notEqual(
    audit([
      ['OneClip.app/file', 'x'],
      ['OneClip.app/FILE', 'changed'],
    ]).status,
    0,
  );
  assert.notEqual(
    audit([
      ['OneClip.app/target', 'x'],
      ['OneClip.app/link', 'target', true],
      ['OneClip.app/link/payload', 'x'],
    ]).status,
    0,
  );
  assert.notEqual(
    audit([
      ['OneClip.app/file', 'x'],
      ['OneClip.app/file', 'changed'],
    ]).status,
    0,
  );
});
