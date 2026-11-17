import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { securityHeaders } from '../src/lib/security.mjs';
const manifest = JSON.parse(
  await readFile('infra/generated/manifest.json', 'utf8'),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
};
createServer(async (req, res) => {
  for (const [key, value] of Object.entries(securityHeaders))
    res.setHeader(key, value);
  res.setHeader('Cache-Control', 'no-store');
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  if (pathname === '/') {
    res.writeHead(302, { Location: '/ja/' });
    res.end();
    return;
  }
  if (manifest.revoked.includes(pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      req.method === 'HEAD' ? undefined : await readFile('dist/404.html'),
    );
    return;
  }
  if (!manifest.routes[pathname] && manifest.routes[pathname + '/']) {
    res.writeHead(308, { Location: pathname + '/' });
    res.end();
    return;
  }
  let path = manifest.routes[pathname]
    ? resolve('dist', '.' + manifest.routes[pathname])
    : undefined;
  const download = manifest.downloads.includes(pathname);
  if (download)
    path = resolve('.artifacts/releases', pathname.split('/').at(-1));
  try {
    if (!path) throw new Error('Not found');
    const data = await readFile(path);
    res.setHeader(
      'Content-Type',
      mime[extname(path)] || 'application/octet-stream',
    );
    if (download)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${pathname.split('/').at(-1)}"`,
      );
    res.setHeader('Content-Length', data.length);
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      req.method === 'HEAD' ? undefined : await readFile('dist/404.html'),
    );
  }
}).listen(Number(process.env.PORT || 4321), '127.0.0.1', () =>
  console.log('D-Apps preview: http://127.0.0.1:4321 (local only)'),
);
