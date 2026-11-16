import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const authDir = join(root, '.artifacts/aws-auth');
const cli = join(
  root,
  '.artifacts/tools/awscli-2.40.3/aws-cli.pkg/Payload/aws-cli/aws',
);
const profile = 'd-apps-readonly';

export function isolatedEnvironment(parent, directory) {
  // Do not inherit another project's keys, profile, endpoints or token providers.
  const env = Object.fromEntries(
    Object.entries(parent).filter(([key]) => !key.startsWith('AWS_')),
  );
  return {
    ...env,
    AWS_CONFIG_FILE: join(directory, 'config'),
    AWS_SHARED_CREDENTIALS_FILE: join(directory, 'credentials.empty'),
    AWS_LOGIN_CACHE_DIRECTORY: join(directory, 'cache'),
    AWS_PROFILE: profile,
    AWS_EC2_METADATA_DISABLED: 'true',
    AWS_PAGER: '',
    AWS_CLI_AUTO_PROMPT: 'off',
  };
}

export function validateConfig(contents, allowRootForSignInOrOut = false) {
  let section = false;
  const seen = new Set();
  for (const line of contents
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)) {
    if (line === `[profile ${profile}]` && !section) {
      section = true;
      continue;
    }
    const match = line.match(/^(region|output|login_session)\s*=\s*(\S+)$/);
    if (!section || !match || seen.has(match[1]))
      throw new Error('Unexpected AWS configuration; refusing to load it.');
    const [, key, value] = match;
    if (
      (key === 'region' && value !== 'ap-northeast-1') ||
      (key === 'output' && value !== 'json') ||
      (key === 'login_session' &&
        !/^arn:aws:(iam|sts)::\d{12}:(user|role|assumed-role)\/[\w+=,.@/-]+$/.test(
          value,
        ) &&
        !(allowRootForSignInOrOut && /^arn:aws:iam::\d{12}:root$/.test(value)))
    ) {
      throw new Error('Only a non-root console login session is allowed.');
    }
    seen.add(key);
  }
  if (!seen.has('region') || !seen.has('output'))
    throw new Error('Missing dedicated AWS profile.');
  return seen.has('login_session');
}

export function readCommand(operation) {
  const commands = {
    identity: [
      'sts',
      'get-caller-identity',
      '--query',
      '{Account:Account,Arn:Arn}',
    ],
    zones: [
      'route53',
      'list-hosted-zones-by-name',
      '--dns-name',
      'deepledeeple.com',
      '--query',
      "HostedZones[?Name=='deepledeeple.com.'].{Id:Id,Name:Name,PrivateZone:Config.PrivateZone}",
    ],
  };
  if (!Object.hasOwn(commands, operation))
    throw new Error(
      'Allowed commands: setup, login, identity, zones, logout. No AWS mutations are available.',
    );
  return [
    ...commands[operation],
    '--profile',
    profile,
    '--no-cli-pager',
    '--output',
    'json',
    '--cli-connect-timeout',
    '10',
    '--cli-read-timeout',
    '20',
  ];
}

function privateDirectory(path) {
  if (!existsSync(path)) mkdirSync(path, { mode: 0o700 });
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.mode & 0o077)
    throw new Error('AWS authentication directory must be private (0700).');
}

function privateFile(path, initial) {
  if (!existsSync(path))
    writeFileSync(path, initial, { flag: 'wx', mode: 0o600 });
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)
    throw new Error('AWS authentication files must be private (0600).');
}

function run(args, env, interactive = false) {
  // Login opens the browser itself. Never copy its authorization URL/code to chat or a log.
  const result = spawnSync(cli, args, {
    env,
    encoding: 'utf8',
    stdio: interactive ? 'ignore' : 'pipe',
    timeout: interactive ? 300_000 : 90_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const code = result.stderr?.match(
      /\((AccessDenied[^)]*|ExpiredToken[^)]*|InvalidClientTokenId)\)/,
    )?.[1];
    throw new Error(
      `AWS operation did not complete${code ? ` (${code})` : ''}. Check the selected identity, permissions and browser sign-in; credentials were not printed.`,
    );
  }
  return result.stdout;
}

function main() {
  const [operation, ...extra] = process.argv.slice(2);
  if (extra.length)
    throw new Error('Extra flags, profiles and endpoints are not accepted.');
  if (!['setup', 'login', 'logout', 'identity', 'zones'].includes(operation))
    readCommand(operation);
  if (!existsSync(cli))
    throw new Error(
      'Install the verified project-local AWS CLI described in docs/AWS-AUTH.md first.',
    );
  process.umask(0o077);
  if (!existsSync(join(root, '.artifacts')))
    mkdirSync(join(root, '.artifacts'));
  if (lstatSync(join(root, '.artifacts')).isSymbolicLink())
    throw new Error('The artifacts directory must not be a symlink.');
  privateDirectory(authDir);
  privateDirectory(join(authDir, 'cache'));
  privateFile(
    join(authDir, 'config'),
    `[profile ${profile}]\nregion = ap-northeast-1\noutput = json\n`,
  );
  privateFile(join(authDir, 'credentials.empty'), '');
  if (readFileSync(join(authDir, 'credentials.empty'), 'utf8') !== '')
    throw new Error('Static credentials are not accepted.');
  const hasLogin = validateConfig(
    readFileSync(join(authDir, 'config'), 'utf8'),
    operation === 'login' || operation === 'logout',
  );
  const env = isolatedEnvironment(process.env, authDir);
  if (['identity', 'zones'].includes(operation) && !hasLogin)
    throw new Error(
      'Complete the dedicated browser login first. No fallback credential provider will be used.',
    );
  if (operation === 'setup') {
    console.log(
      'Dedicated profile prepared. No AWS sign-in or resource changes performed.',
    );
    return;
  }
  if (operation === 'login') {
    console.log(
      'Complete sign-in in the browser with the intended D-Apps non-root identity. This is a dedicated profile, not an IAM permission boundary.',
    );
    run(['login', '--profile', profile, '--no-cli-pager'], env, true);
    validateConfig(readFileSync(join(authDir, 'config'), 'utf8'));
    console.log(
      'Browser sign-in completed. Verify the identity and hosted zone next.',
    );
    return;
  }
  if (operation === 'logout') {
    run(['logout', '--profile', profile], env);
    console.log(
      'Dedicated CLI session signed out. Other profiles were not used.',
    );
    return;
  }
  const identity = JSON.parse(run(readCommand('identity'), env));
  if (
    !/^arn:aws:(iam|sts)::\d{12}:(user|role|assumed-role)\//.test(
      identity.Arn,
    ) ||
    !/^\d{12}$/.test(identity.Account)
  )
    throw new Error('A non-root IAM identity is required.');
  if (operation === 'identity') console.log(JSON.stringify(identity, null, 2));
  else console.log(run(readCommand(operation), env));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
