# Security policy

Please report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/TaigaShinohara/D-Apps-Platform/security/advisories/new). This opens an external service governed by GitHub's privacy policy. Do not include access keys, personal screenshots, or unrelated personal information. Avoid public issues for details that could enable an attack.

脆弱性は上記の GitHub の非公開報告窓口へお知らせください。サイト自身には入力窓口を設けていません。通常の改善提案は GitHub Issues を利用できます。

The supported site version is the current `main` branch. App vulnerabilities belong to each app's maintainer; OneClip is maintained in [its own repository](https://github.com/TaigaShinohara/OneClip).

## Maintainer response

1. Verify the report with synthetic data, preserving relevant management audit evidence without enabling visitor request logging.
2. For a distribution issue, add the exact download path to `config/revoked-downloads.json` and retain its immutable record in `config/distribution-lock.json`. Build, stage, and publish the new Firebase Hosting version using the approved release workflow. The revoked file and its links are excluded, even if the original ZIP is unavailable.
3. Confirm the download link is gone and the path returns HTTP 404 for GET, HEAD, and Range on the canonical and both Firebase hostnames. Verify the `www` redirect preserves the path. A file that has already been downloaded cannot be recalled. Follow the recovery runbook for a broader incident.
4. Publish a corrected release under a new versioned URL. Never replace an existing release in place.
5. Document scope, verification, remaining limitations, and the recovery action. See [the deployment runbook](docs/DEPLOYMENT.md).
