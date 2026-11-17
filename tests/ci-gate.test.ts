import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCiSucceeded,
  fetchCiRuns,
} from '../scripts/require-ci-success.mjs';
import { assertComparisonBase } from '../scripts/verify-distribution-lock.mjs';

const sha = 'a'.repeat(40);

function run(overrides: Record<string, unknown> = {}) {
  return {
    head_sha: sha,
    path: '.github/workflows/ci.yml',
    status: 'completed',
    conclusion: 'success',
    updated_at: '2026-11-17T00:00:00Z',
    ...overrides,
  };
}

test('publication requires the latest completed CI run to succeed', () => {
  assert.doesNotThrow(() => assertCiSucceeded([run()], sha));
  assert.throws(
    () => assertCiSucceeded([run({ conclusion: 'failure' })], sha),
    /did not succeed/,
  );
  assert.throws(
    () =>
      assertCiSucceeded(
        [
          run({ updated_at: '2026-11-17T00:00:00Z' }),
          run({
            conclusion: 'cancelled',
            updated_at: '2026-11-17T01:00:00Z',
          }),
        ],
        sha,
      ),
    /did not succeed/,
  );
  assert.throws(
    () => assertCiSucceeded([run({ status: 'in_progress' })], sha),
    /has not finished/,
  );
  assert.throws(() => assertCiSucceeded([], sha), /No CI run/);
  assert.throws(
    () => assertCiSucceeded([run({ head_sha: 'b'.repeat(40) })], sha),
    /different commit/,
  );
});

test('CI lookup stays on the GitHub API and fails closed', async () => {
  const calls: string[] = [];
  const fetchImpl = async (url: URL) => {
    calls.push(url.toString());
    const page = url.searchParams.get('page');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        workflow_runs:
          page === '1' ? [run({ updated_at: '2026-11-17T02:00:00Z' })] : [],
      }),
    };
  };
  const runs = await fetchCiRuns({
    token: 'test-token',
    repository: 'TaigaShinohara/D-Apps-Platform',
    sha,
    fetchImpl: fetchImpl as typeof fetch,
    pageSize: 1,
  });
  assert.equal(calls.length, 2);
  assert.ok(calls[0].startsWith('https://api.github.com/repos/'));
  assert.equal(new URL(calls[0]).origin, 'https://api.github.com');
  assertCiSucceeded(runs, sha);
  await assert.rejects(
    fetchCiRuns({
      token: '',
      repository: 'TaigaShinohara/D-Apps-Platform',
      sha,
      fetchImpl: fetchImpl as typeof fetch,
    }),
    /token is required/,
  );
  await assert.rejects(
    fetchCiRuns({
      token: 'test-token',
      repository: 'https://evil.example/repo',
      sha,
      fetchImpl: fetchImpl as typeof fetch,
    }),
    /Invalid GitHub repository/,
  );
  await assert.rejects(
    fetchCiRuns({
      token: 'test-token',
      repository: 'TaigaShinohara/D-Apps-Platform',
      sha,
      fetchImpl: (async (_url: URL) => ({
        ok: false,
        status: 403,
        json: async () => ({ message: 'hidden' }),
      })) as unknown as typeof fetch,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /HTTP 403/);
      assert.equal(error.message.includes('hidden'), false);
      return true;
    },
  );
});

test('stage and release require a real previous commit', () => {
  assert.equal(assertComparisonBase('', false), '');
  assert.equal(assertComparisonBase(sha, true), sha);
  assert.throws(() => assertComparisonBase('', true), /Previous main commit/);
  assert.throws(
    () => assertComparisonBase('0'.repeat(40), true),
    /Previous main commit/,
  );
  assert.throws(() => assertComparisonBase('abc', false), /Full base commit/);
});
