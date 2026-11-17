import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
function integrity(filename) {
  const hash = createHash('sha384')
    .update(readFileSync(`public/scripts/${filename}`))
    .digest('base64');
  return `sha384-${hash}`;
}

function policy(scriptHash) {
  return `default-src 'none'; script-src '${scriptHash}' 'strict-dynamic'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'`;
}

export const scriptIntegrity = integrity('filter.js');
export const wavariumIntegrity = integrity('wavarium.js');
export const metaCsp = policy(scriptIntegrity);
export const wavariumCsp = policy(wavariumIntegrity);
export const wavariumPagePaths = ['/wavarium/', '/wavarium/index.html'];
export const wavariumCspHeader = wavariumCsp + "; frame-ancestors 'none'";
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
