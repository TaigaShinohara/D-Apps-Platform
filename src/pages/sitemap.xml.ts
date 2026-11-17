import type { APIRoute } from 'astro';
import { apps, locales } from '../lib/catalog';
import { projects } from '../data/showcase';

export const GET: APIRoute = ({ site }) => {
  const paths = [
    '',
    'about/',
    'privacy/',
    'safety/',
    'license/',
    'support/',
    ...apps.map((app) => `apps/${app.id}/`),
    ...projects.map((project) => `projects/${project.id}/`),
  ];
  const entries = locales.flatMap((lang) =>
    paths.map(
      (path) =>
        `<url><loc>${new URL(`/${lang}/${path}`, site).href}</loc></url>`,
    ),
  );
  entries.push(`<url><loc>${new URL('/wavarium/', site).href}</loc></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
