import { gzipSync } from 'node:zlib';
import { sha256 } from './prepare-hosting.mjs';

export const apiOrigin = 'https://firebasehosting.googleapis.com/v1beta1/';
export function validateSite(site) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(site || ''))
    throw new Error('Invalid Firebase site ID');
  return site;
}
export function validateVersion(site, name) {
  validateSite(site);
  if (!new RegExp(`^sites/${site}/versions/[A-Za-z0-9_-]+$`).test(name || ''))
    throw new Error('Version belongs to another site or is malformed');
  return name;
}
export function encodeFiles(files) {
  /** @type {Record<string, string>} */
  const hashes = {};
  const blobs = new Map();
  for (const [path, bytes] of Object.entries(files).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (
      !/^\/[A-Za-z0-9_./-]+$/.test(path) ||
      path.split('/').some((p) => p === '..' || p === '.') ||
      path.startsWith('/__/')
    )
      throw new Error('Invalid Hosting file path');
    const blob = gzipSync(bytes, { level: 9 });
    const hash = sha256(blob);
    hashes[path] = hash;
    blobs.set(hash, blob);
  }
  if (!hashes['/404.html']) throw new Error('A custom 404 page is required');
  return { hashes, blobs };
}
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, stable(v)]),
    );
  return value;
}
export function releaseLabels(commit, config, hashes) {
  if (!/^[a-f0-9]{40}$/.test(commit || ''))
    throw new Error('Full reviewed commit required');
  const digest = sha256(JSON.stringify(stable({ config, hashes })));
  return { commit, bundle_a: digest.slice(0, 32), bundle_b: digest.slice(32) };
}
export function validateUploadURL(site, version, url) {
  validateVersion(site, version);
  const parsed = new URL(url);
  if (
    parsed.origin !== 'https://upload-firebasehosting.googleapis.com' ||
    parsed.pathname !== `/upload/${version}/files` ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    throw new Error('Unexpected Firebase upload endpoint');
  return url;
}
export async function stageVersion({
  api,
  upload,
  site,
  commit,
  config,
  files,
}) {
  validateSite(site);
  const { hashes, blobs } = encodeFiles(files);
  const labels = releaseLabels(commit, config, hashes);
  const created = await api('POST', `sites/${site}/versions`, {
    config,
    labels,
  });
  const version = validateVersion(site, created.name);
  const entries = Object.entries(hashes);
  for (let offset = 0; offset < entries.length; offset += 1000) {
    const populated = await api('POST', `${version}:populateFiles`, {
      files: Object.fromEntries(entries.slice(offset, offset + 1000)),
    });
    const uploadURL =
      (populated.uploadRequiredHashes?.length || 0) > 0
        ? validateUploadURL(site, version, populated.uploadUrl)
        : undefined;
    for (const hash of populated.uploadRequiredHashes || []) {
      if (!blobs.has(hash))
        throw new Error('Server requested an unknown upload hash');
      await upload(`${uploadURL}/${hash}`, blobs.get(hash));
    }
  }
  const finalized = await api('PATCH', `${version}?updateMask=status`, {
    status: 'FINALIZED',
  });
  if (finalized.status !== 'FINALIZED')
    throw new Error('Version was not finalized');
  const { managedFiles } = await verifyStaged({
    api,
    site,
    version,
    commit,
    config,
    files,
  });
  return {
    site,
    version,
    commit,
    labels,
    fileCount: entries.length,
    managedFiles,
  };
}
export async function verifyStaged({
  api,
  site,
  version,
  commit,
  config,
  files,
}) {
  validateVersion(site, version);
  const { hashes } = encodeFiles(files);
  const labels = releaseLabels(commit, config, hashes);
  const remote = await api('GET', version);
  // Protobuf JSON may omit false booleans and empty repeated fields.
  const normalizedConfig = (value) => ({
    cleanUrls: false,
    headers: [],
    redirects: [],
    rewrites: [],
    ...value,
  });
  if (
    remote.status !== 'FINALIZED' ||
    Object.entries(labels).some(([k, v]) => remote.labels?.[k] !== v) ||
    JSON.stringify(stable(normalizedConfig(remote.config))) !==
      JSON.stringify(stable(normalizedConfig(config)))
  )
    throw new Error(
      'Staged version/configuration does not match the reviewed build',
    );
  const actual = {};
  const managedFiles = {};
  const seen = new Set();
  let pageToken;
  let pages = 0;
  do {
    if (++pages > 100)
      throw new Error('Unexpected Hosting file inventory size');
    const response = await api(
      'GET',
      `${version}/files?pageSize=1000${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`,
    );
    for (const file of response.files || []) {
      if (seen.has(file.path)) throw new Error('Duplicate remote file path');
      seen.add(file.path);
      // Hosting adds these documented SDK configuration routes itself.
      // They are never uploaded/referenced by our site. Record them separately;
      // all other paths, including unknown reserved paths, must match the build.
      if (
        ['/__/firebase/init.js', '/__/firebase/init.json'].includes(file.path)
      ) {
        if (!/^[a-f0-9]{64}$/.test(file.hash || '') || file.status !== 'ACTIVE')
          throw new Error('Invalid Firebase-managed file metadata');
        managedFiles[file.path] = file.hash;
        continue;
      }
      actual[file.path] = file.hash;
    }
    pageToken = response.nextPageToken;
  } while (pageToken);
  if (JSON.stringify(stable(actual)) !== JSON.stringify(stable(hashes)))
    throw new Error('Remote file hashes differ or include unexpected files');
  return { managedFiles };
}
export async function releaseVersion(options) {
  // This is the only live publication call; staging never invokes it.
  await verifyStaged(options);
  const { api, site, version, expectedCurrent } = options;
  if (expectedCurrent !== 'NONE') validateVersion(site, expectedCurrent);
  const current = await api('GET', `sites/${site}/releases?pageSize=1`);
  if ((current.releases?.[0]?.version?.name || 'NONE') !== expectedCurrent)
    throw new Error('Live version changed; review again before publishing');
  const released = await api(
    'POST',
    `sites/${site}/releases?versionName=${encodeURIComponent(version)}`,
    { message: `Reviewed commit ${options.commit}` },
  );
  if (released.version?.name !== version)
    throw new Error('Release response did not confirm the requested version');
  const confirmed = await api('GET', `sites/${site}/releases?pageSize=1`);
  if (confirmed.releases?.[0]?.version?.name !== version)
    throw new Error(
      'Live release read-back did not match; inspect Hosting before retrying',
    );
  return { version, release: released.name };
}
