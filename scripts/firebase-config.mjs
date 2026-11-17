import {
  securityHeaders,
  wavariumCspHeader,
  wavariumPagePaths,
} from '../src/lib/security.mjs';

export function hostingConfig(downloads = []) {
  return {
    public: '.artifacts/hosting/public',
    ignore: [],
    cleanUrls: false,
    trailingSlash: true,
    redirects: [{ source: '/', destination: '/ja/', type: 302 }],
    headers: [
      {
        source: '**',
        headers: Object.entries({
          ...securityHeaders,
          'cache-control': 'public,max-age=0,s-maxage=300,must-revalidate',
        }).map(([key, value]) => ({ key, value })),
      },
      ...wavariumPagePaths.map((source) => ({
        source,
        headers: [{ key: 'content-security-policy', value: wavariumCspHeader }],
      })),
      {
        source: '/_astro/**',
        headers: [
          { key: 'cache-control', value: 'public,max-age=31536000,immutable' },
        ],
      },
      ...downloads.map((path) => ({
        source: path,
        headers: [
          {
            key: 'content-disposition',
            value: `attachment; filename="${path.split('/').at(-1)}"`,
          },
        ],
      })),
    ],
  };
}

export function servingConfig(config) {
  // REST uses different field names from firebase.json. No Functions/Run rewrites.
  return {
    cleanUrls: config.cleanUrls,
    trailingSlashBehavior: config.trailingSlash ? 'ADD' : 'REMOVE',
    redirects: config.redirects.map(({ source, destination, type }) => ({
      glob: source,
      location: destination,
      statusCode: type,
    })),
    headers: config.headers.map(({ source, headers }) => ({
      glob: source,
      headers: Object.fromEntries(
        headers.map(({ key, value }) => [key, value]),
      ),
    })),
  };
}
