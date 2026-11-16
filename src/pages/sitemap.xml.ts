import { apps, locales } from '../lib/catalog';
export function GET() {
  const paths = [
    '',
    'about/',
    'privacy/',
    'safety/',
    'license/',
    'support/',
    ...apps.map((app) => `apps/${app.id}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locales.flatMap((lang) => paths.map((path) => `<url><loc>https://deepledeeple.com/${lang}/${path}</loc></url>`)).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
