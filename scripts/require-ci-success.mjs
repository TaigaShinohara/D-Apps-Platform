const workflowPath = '.github/workflows/ci.yml';
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function assertCiSucceeded(runs, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha || ''))
    throw new Error('Full commit SHA required');
  if (!Array.isArray(runs) || runs.length === 0)
    throw new Error('No CI run for this commit');
  for (const run of runs) {
    if (run?.head_sha !== sha)
      throw new Error('CI lookup returned a different commit');
    if (run.path && run.path !== workflowPath)
      throw new Error('CI lookup returned a different workflow');
    if (run.status !== 'completed')
      throw new Error('CI has not finished for this commit');
    if (typeof run.updated_at !== 'string' || !run.updated_at)
      throw new Error('CI run is missing its completion time');
  }
  const latest = [...runs].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  )[0];
  if (latest.conclusion !== 'success')
    throw new Error('CI did not succeed for this commit');
}

export async function fetchCiRuns({
  token,
  repository,
  sha,
  fetchImpl = fetch,
  pageSize = 100,
}) {
  if (!token) throw new Error('GitHub token is required to read CI status');
  if (!repositoryPattern.test(repository || ''))
    throw new Error('Invalid GitHub repository');
  if (!/^[a-f0-9]{40}$/.test(sha || ''))
    throw new Error('Full commit SHA required');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new Error('Invalid CI page size');
  const [owner, repo] = repository.split('/');
  const runs = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/ci.yml/runs`,
    );
    url.searchParams.set('head_sha', sha);
    url.searchParams.set('per_page', String(pageSize));
    url.searchParams.set('page', String(page));
    const response = await fetchImpl(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok)
      throw new Error(
        `CI status lookup failed (HTTP ${response.status}). Response details were not logged.`,
      );
    const body = await response.json();
    const batch = body.workflow_runs;
    if (!Array.isArray(batch))
      throw new Error('CI status lookup was incomplete');
    runs.push(...batch);
    if (batch.length < pageSize) return runs;
  }
  throw new Error('CI status lookup exceeded its page limit');
}

if (process.argv[1]?.endsWith('/require-ci-success.mjs')) {
  const sha = process.env.CI_COMMIT_SHA || process.env.GITHUB_SHA;
  const repository = process.env.CI_REPOSITORY || process.env.GITHUB_REPOSITORY;
  const runs = await fetchCiRuns({
    token: process.env.GITHUB_TOKEN,
    repository,
    sha,
  });
  assertCiSucceeded(runs, sha);
  console.log('CI succeeded for this commit.');
}
