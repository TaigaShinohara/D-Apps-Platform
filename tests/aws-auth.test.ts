import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isolatedEnvironment,
  readCommand,
  validateConfig,
} from '../scripts/aws-readonly.mjs';

test('dedicated AWS entry removes inherited credentials and provider overrides', () => {
  const environment: Record<string, string> = isolatedEnvironment(
    {
      PATH: '/usr/bin',
      HOME: '/Users/example',
      AWS_ACCESS_KEY_ID: 'test-only',
      AWS_SECRET_ACCESS_KEY: 'test-only',
      AWS_SESSION_TOKEN: 'test-only',
      AWS_PROFILE: 'other-project',
      AWS_CONFIG_FILE: '/elsewhere/config',
      AWS_WEB_IDENTITY_TOKEN_FILE: '/elsewhere/token',
      AWS_ENDPOINT_URL: 'https://example.invalid',
      AWS_CONTAINER_CREDENTIALS_FULL_URI: 'http://example.invalid',
    },
    '/private/auth',
  );
  assert.equal(environment.HOME, '/Users/example');
  assert.equal(environment.AWS_PROFILE, 'd-apps-readonly');
  assert.equal(environment.AWS_CONFIG_FILE, '/private/auth/config');
  assert.equal(environment.AWS_LOGIN_CACHE_DIRECTORY, '/private/auth/cache');
  for (const key of [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'AWS_ENDPOINT_URL',
    'AWS_WEB_IDENTITY_TOKEN_FILE',
    'AWS_CONTAINER_CREDENTIALS_FULL_URI',
  ])
    assert.equal(environment[key], undefined);
});

test('profile validation rejects alternate providers, root, endpoints and duplicate settings', () => {
  const base =
    '[profile d-apps-readonly]\nregion = ap-northeast-1\noutput = json\n';
  assert.doesNotThrow(() => validateConfig(base));
  assert.equal(validateConfig(base), false);
  assert.equal(
    validateConfig(
      base + 'login_session = arn:aws:iam::123456789012:user/DAppsReadOnly\n',
    ),
    true,
  );
  assert.doesNotThrow(() =>
    validateConfig(
      base + 'login_session = arn:aws:iam::123456789012:root\n',
      true,
    ),
  );
  assert.doesNotThrow(() =>
    validateConfig(
      base + 'login_session = arn:aws:iam::123456789012:user/DAppsReadOnly\n',
    ),
  );
  for (const extra of [
    'credential_process = anything',
    'source_profile = other-project',
    'endpoint_url = https://example.invalid',
    '[plugins]',
    '[default]',
    'region = us-east-1',
    'login_session = arn:aws:iam::123456789012:root',
  ])
    assert.throws(() => validateConfig(base + extra));
});

test('read-only entry cannot forward arbitrary AWS operations or options', () => {
  assert.deepEqual(readCommand('identity').slice(0, 2), [
    'sts',
    'get-caller-identity',
  ]);
  assert.deepEqual(readCommand('zones').slice(0, 2), [
    'route53',
    'list-hosted-zones-by-name',
  ]);
  for (const operation of [
    'deploy',
    'assume-role',
    'export-credentials',
    '--debug',
    '--endpoint-url',
    'constructor',
    '__proto__',
    'change-resource-record-sets',
  ])
    assert.throws(() => readCommand(operation));
});

test('proposed IAM identity cannot create resources, fetch secrets or read object contents', () => {
  const template = JSON.parse(
    readFileSync(
      new URL('../infra/auth-readonly.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(Object.keys(template.Resources).length, 1);
  const user = template.Resources.ReadOnlyUser;
  assert.equal(user.Type, 'AWS::IAM::User');
  assert.equal(user.Properties.LoginProfile, undefined);
  assert.equal(user.Properties.ManagedPolicyArns, undefined);
  for (const statement of user.Properties.Policies[0].PolicyDocument
    .Statement) {
    for (const action of [statement.Action].flat()) {
      assert.match(
        action,
        /^(signin:(AuthorizeOAuth2Access|CreateOAuth2Token)|[a-z0-9]+:(Get|List|Describe)[A-Za-z]+)$/,
      );
      assert.doesNotMatch(
        action,
        /secretsmanager:|ssm:|GetObject|GetLogEvents|GetQueryResults|LookupEvents|GetSecret|GetPassword|GetSessionToken|GetAccessKey/,
      );
    }
  }
});
