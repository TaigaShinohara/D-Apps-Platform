import { z } from 'zod';
import { readCatalog, readRevocations } from './catalog-data.mjs';

export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
const text = z.string().trim().min(1);
const bilingual = z.object({ ja: text, en: text }).strict();
const httpsUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    !url.port &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash
  );
}, 'Use a plain HTTPS URL without credentials, tracking parameters or fragments.');
const storeHosts = {
  apple: 'apps.apple.com',
  google: 'play.google.com',
  microsoft: 'apps.microsoft.com',
  chrome: 'chromewebstore.google.com',
} as const;
const storeUrl = z.url();
export const distributionSchema = z
  .discriminatedUnion('kind', [
    z
      .object({
        kind: z.literal('direct'),
        platform: text,
        version: z.string().regex(/^\d+\.\d+\.\d+$/),
        filename: z
          .string()
          .regex(
            /^[A-Za-z0-9][A-Za-z0-9._-]*\.(zip|dmg|exe|msi|apk|AppImage)$/,
          ),
        bytes: z.number().int().positive(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        source: httpsUrl,
        releaseUrl: httpsUrl,
        verification: z
          .object({
            status: z.literal('approved'),
            evidence: httpsUrl,
            signing: text,
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        kind: z.literal('store'),
        platform: text,
        store: z.enum(['apple', 'google', 'microsoft', 'chrome']),
        url: storeUrl,
      })
      .strict(),
  ])
  .superRefine((value, ctx) => {
    const url = new URL(value.kind === 'direct' ? value.source : value.url);
    if (value.kind === 'direct') {
      if (
        url.hostname !== 'github.com' ||
        !/^\/TaigaShinohara\/[^/]+\/releases\/download\/[^/]+\/[^/]+$/.test(
          url.pathname,
        ) ||
        !url.pathname.endsWith('/v' + value.version + '/' + value.filename) ||
        value.releaseUrl !==
          'https://github.com' +
            url.pathname.split('/releases/download/')[0] +
            '/releases/tag/v' +
            value.version
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Direct releases must use an approved, versioned publisher asset.',
        });
      }
    } else {
      const productPaths = {
        apple: /^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+\/?$/,
        google: /^\/store\/apps\/details$/,
        microsoft: /^\/detail\/(?:[^/]+\/)?[A-Z0-9]+\/?$/i,
        chrome: /^\/detail\/(?:[a-z0-9-]+\/)?[a-p]{32}\/?$/,
      };
      const allowedQuery =
        value.store === 'google' &&
        [...url.searchParams.keys()].every((key) => key === 'id') &&
        url.searchParams.getAll('id').length === 1 &&
        /^[A-Za-z][A-Za-z0-9_.]+$/.test(url.searchParams.get('id') ?? '');
      if (
        url.protocol !== 'https:' ||
        url.hostname !== storeHosts[value.store] ||
        url.port ||
        url.username ||
        url.password ||
        url.hash ||
        (url.search && !allowedQuery) ||
        !productPaths[value.store].test(url.pathname) ||
        (value.store === 'google' && !allowedQuery)
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Store URL must be an official product URL without tracking.',
        });
      }
    }
  });
export const appSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    name: text,
    status: z.literal('published'),
    category: z.enum(['productivity', 'creative', 'utilities', 'games']),
    summary: bilingual,
    tagline: bilingual,
    description: bilingual,
    price: bilingual,
    requirements: bilingual,
    permissions: bilingual,
    privacy: bilingual,
    limitations: bilingual,
    features: z.array(bilingual).min(1),
    instructions: z.array(bilingual).min(1),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sourceUrl: httpsUrl,
    supportUrl: httpsUrl,
    license: text,
    distributions: z.array(distributionSchema).min(1),
  })
  .strict();
export type App = z.infer<typeof appSchema>;
export type Distribution = z.infer<typeof distributionSchema>;
const revoked = readRevocations();
export const appDetails: App[] = readCatalog({ includeRevoked: true }).map(
  (value: unknown) => {
    const app = appSchema.parse(value);
    return {
      ...app,
      distributions: app.distributions.filter(
        (item) =>
          item.kind !== 'direct' || !revoked.includes(downloadPath(app, item)),
      ),
    };
  },
);
export const apps: App[] = appDetails.filter(
  (app) => app.distributions.length > 0,
);
if (new Set(appDetails.map((app) => app.id)).size !== appDetails.length)
  throw new Error('Duplicate app identifier.');
export const categories: Record<App['category'], Record<Locale, string>> = {
  productivity: { ja: '仕事・効率化', en: 'Productivity' },
  creative: { ja: 'クリエイティブ', en: 'Creative' },
  utilities: { ja: 'ユーティリティ', en: 'Utilities' },
  games: { ja: 'ゲーム', en: 'Games' },
};
export const storeNames = {
  apple: 'App Store',
  google: 'Google Play',
  microsoft: 'Microsoft Store',
  chrome: 'Chrome Web Store',
} as const;
export function downloadPath(
  app: Pick<App, 'id'>,
  item: Extract<Distribution, { kind: 'direct' }>,
) {
  return `/downloads/${app.id}/${item.version}/${item.filename}`;
}
