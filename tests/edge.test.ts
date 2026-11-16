import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  requestFunctionSource,
  responseFunctionSource,
} from '../scripts/edge.mjs';
import { securityHeaders } from '../src/lib/security.mjs';
import { generateTemplates } from '../scripts/templates.mjs';
const artifact = '/downloads/oneclip/1.0.1/OneClip-1.0.1.zip';
function request(
  uri: string,
  extra: Record<string, unknown> = {},
  revoked: string[] = [],
) {
  const scope = vm.createContext({});
  vm.runInContext(
    requestFunctionSource({
      headers: securityHeaders,
      routes: { '/ja/': '/ja/index.html', '/en/': '/en/index.html' },
      downloads: [artifact],
      revoked,
    }),
    scope,
  );
  return scope.handler({
    request: {
      uri,
      method: 'GET',
      headers: {
        host: { value: 'deepledeeple.com' },
        cookie: { value: 'private' },
      },
      cookies: { private: { value: 'test' } },
      querystring: { email: { value: 'do-not-forward' } },
      ...extra,
    },
  });
}
test('canonical routes preserve locale, strip query and cookies, and keep downloads distinct', () => {
  assert.equal(request('/').headers.location.value, '/ja/');
  const result = request('/en/');
  assert.equal(result.uri, '/en/index.html');
  assert.deepEqual(Object.keys(result.querystring), []);
  assert.deepEqual(Object.keys(result.cookies), []);
  assert.equal(result.headers.cookie, undefined);
  assert.equal(request('/ja').headers.location.value, '/ja/');
  assert.equal(request(artifact).uri, artifact);
});
test('unknown downloads, traversal, revoked files, writes and arbitrary hosts fail closed', () => {
  for (const uri of [
    '/downloads/not-approved.exe',
    '/downloads/../private',
    '/%2e%2e/private',
    '//attacker.example/',
  ])
    assert.equal(request(uri).statusCode, 404);
  assert.equal(request(artifact, {}, [artifact]).statusCode, 410);
  assert.equal(request('/ja/', { method: 'POST' }).statusCode, 405);
  assert.equal(
    request('/ja/', { headers: { host: { value: 'attacker.example' } } })
      .statusCode,
    403,
  );
  assert.equal(
    request('/en/', { headers: { host: { value: 'www.deepledeeple.com' } } })
      .headers.location.value,
    'https://deepledeeple.com/en/',
  );
  assert.equal(request('/missing').headers['x-frame-options'].value, 'DENY');
});
test('response protection adds enforced CSP without collecting reports or setting cookies', () => {
  const scope = vm.createContext({});
  vm.runInContext(responseFunctionSource(securityHeaders), scope);
  const result = scope.handler({
    response: { headers: {}, cookies: { tracking: { value: 'no' } } },
  });
  assert.equal(result.cookies, undefined);
  assert.match(
    result.headers['content-security-policy'].value,
    /connect-src 'none'/,
  );
  assert.doesNotMatch(
    result.headers['content-security-policy'].value,
    /report-to|unsafe-inline|unsafe-eval/,
  );
});
test('infrastructure defaults to private origins, disabled delivery, free plan and no visitor logs', () => {
  const templates = generateTemplates({
    request: 'function handler(){}',
    response: 'function handler(){}',
  });
  const edge = templates.edge;
  assert.equal(edge.Parameters.EnableDistribution.Default, 'false');
  assert.equal(edge.Resources.FreePlan.Properties.PlanTier, 'FREE');
  assert.equal(
    edge.Resources.WAF.Properties.VisibilityConfig.SampledRequestsEnabled,
    false,
  );
  for (const rule of edge.Resources.WAF.Properties.Rules)
    assert.equal(rule.VisibilityConfig.SampledRequestsEnabled, false);
  assert.doesNotMatch(
    JSON.stringify(templates),
    /LoggingConfiguration|LoggingConfig|AccessKey|SecretAccessKey|CAPTCHA|Challenge/,
  );
  assert.equal(
    templates.storage.Resources.SiteBucket.Properties
      .PublicAccessBlockConfiguration.BlockPublicPolicy,
    true,
  );
  const trust =
    templates.publisher.Resources.PublisherRole.Properties
      .AssumeRolePolicyDocument.Statement[0];
  assert.equal(
    trust.Condition.StringEquals['token.actions.githubusercontent.com:sub'],
    'repo:TaigaShinohara/D-Apps-Platform:environment:production',
  );
});
