import test from 'node:test';
import assert from 'node:assert/strict';
import oneclipData from '../src/data/oneclip.json';
import { distributionLink } from '../src/lib/distribution';
import {
  apps,
  appSchema,
  distributionSchema,
  downloadPath,
} from '../src/lib/catalog';

const oneclip = appSchema.parse(oneclipData);
const direct = oneclip.distributions[0];

test('external catalog entries are published and the OneClip ZIP keeps its original path', () => {
  for (const id of [
    'profilemaker',
    'yoriai',
    'personal-color-check',
    'charmshelf',
  ]) {
    assert.ok(
      apps.some((app) => app.id === id),
      id,
    );
  }
  assert.ok(direct.kind === 'direct');
  assert.equal(
    downloadPath(oneclip, direct),
    '/downloads/oneclip/1.0.1/OneClip-1.0.1.zip',
  );
});
test('incomplete translation, draft, path traversal and missing approval fail closed', () => {
  for (const change of [
    { summary: { ja: '説明', en: '' } },
    { status: 'draft' },
    { id: '../private' },
    {
      distributions: [{ ...direct, verification: { status: 'pending' } }],
    },
  ])
    assert.equal(appSchema.safeParse({ ...oneclip, ...change }).success, false);
});
test('untrusted direct download sources, altered hashes and unsafe filenames are rejected', () => {
  for (const change of [
    { source: 'https://github.com.attacker.example/a.zip' },
    { source: 'javascript:alert(1)' },
    { filename: '../OneClip.zip' },
    { sha256: '1234' },
    { version: '1.0.2' },
    {
      source:
        'https://github.com:444/TaigaShinohara/OneClip/releases/download/v1.0.1/OneClip-1.0.1.zip',
    },
    {
      source:
        'https://github.com/TaigaShinohara/OneClip/releases/download/latest/x.zip?tracking=1',
    },
  ])
    assert.equal(
      distributionSchema.safeParse({ ...direct, ...change }).success,
      false,
    );
});
test('store downloads support official product URLs and reject tracking and deceptive hosts', () => {
  assert.ok(
    distributionSchema.safeParse({
      kind: 'store',
      platform: 'iOS',
      store: 'apple',
      url: 'https://apps.apple.com/jp/app/example/id123456789',
    }).success,
  );
  assert.ok(
    distributionSchema.safeParse({
      kind: 'store',
      platform: 'Android',
      store: 'google',
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
    }).success,
  );
  for (const url of [
    'https://apps.apple.com.attacker.example/app/id123',
    'https://apps.apple.com/app/id123?utm_source=site',
    'https://user:password@apps.apple.com/app/id123',
    'http://apps.apple.com/app/id123',
    'https://apps.apple.com/',
    'https://apps.apple.com/redirect/attacker',
  ])
    assert.equal(
      distributionSchema.safeParse({
        kind: 'store',
        platform: 'iOS',
        store: 'apple',
        url,
      }).success,
      false,
    );
});
test('store link presentation names its destination and does not trigger direct downloading', () => {
  const item = distributionSchema.parse({
    kind: 'store',
    platform: 'iOS',
    store: 'apple',
    url: 'https://apps.apple.com/jp/app/example/id123456789',
  });
  assert.ok(item.kind === 'store');
  assert.deepEqual(distributionLink({ id: 'fixture' }, item, 'ja'), {
    href: item.url,
    download: undefined,
    rel: 'noopener noreferrer',
    label: 'App Storeで見る',
  });
  assert.equal(
    distributionLink({ id: 'fixture' }, item, 'en').label,
    'View on App Store',
  );
});

test('external Web and preview links require authorized hosts and a pinned release tag', () => {
  for (const [kind, platform, allowed, rejected] of [
    [
      'web',
      'Web',
      'https://taigashinohara.github.io/personal-color-check/',
      [
        'https://taigashinohara.github.io.example.org/personal-color-check/',
        'https://taigashinohara.github.io/personal-color-check/?utm_source=site',
      ],
    ],
    [
      'github-preview',
      'Android',
      'https://github.com/TaigaShinohara/CharmShelf/releases/tag/v1.0.12-oss.2',
      [
        'https://github.com/Other/CharmShelf/releases/tag/v1.0.12-oss.2',
        'https://github.com/TaigaShinohara/CharmShelf/releases/latest',
        'https://github.com/TaigaShinohara/CharmShelf/releases/download/v1.0.12-oss.2/CharmShelf.apk',
      ],
    ],
  ] as const) {
    assert.ok(
      distributionSchema.safeParse({ kind, platform, url: allowed }).success,
    );
    for (const url of rejected) {
      assert.equal(
        distributionSchema.safeParse({ kind, platform, url }).success,
        false,
        url,
      );
    }
  }
});
