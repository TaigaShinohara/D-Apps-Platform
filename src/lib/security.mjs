import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const scriptIntegrity =
  'sha384-' +
  createHash('sha384')
    .update(readFileSync('public/scripts/filter.js'))
    .digest('base64');
export const metaCsp = `default-src 'none'; script-src '${scriptIntegrity}' 'strict-dynamic'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'`;
export const securityHeaders = {
  'content-security-policy': metaCsp + "; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};
