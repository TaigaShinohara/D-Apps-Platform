# Firebase Hosting deployment and recovery

The dedicated Google project, billing link and WIF were configured after owner approval. The site went live on [dobulab.com](https://dobulab.com/ja/) and the two Firebase hostnames on 2026-11-17. See the [DNS cutover record](DOMAIN-CUTOVER.md). Git merges do not publish site updates.

## Architecture and privacy

Astro builds static pages/assets; Firebase Hosting delivers them and the original approved ZIPs through its CDN/TLS. No Firebase SDK, Analytics, database, Auth, Functions, Cloud Run backend or web app registration is required. The former AWS stacks, IAM proposal and publishing scripts are retired. No AWS resources were created during setup. Route 53 remains the existing domain/DNS manager.

The operator collects no forms, accounts, uploads, tracking identifiers or visitor logs, and enables no additional analytics or request-log exports. Google's Hosting service retains incoming IP data for a few months for abuse detection and usage analysis. See [Firebase privacy](https://firebase.google.com/support/privacy). Review organization integrations and log exports after configuration changes, and use aggregate traffic, storage and cost metrics.

## Reviewable configuration

| Location                                | Purpose                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `infra/gcp/main.tf`                     | Required APIs/Firebase on an existing dedicated project; Hosting site, separate stager and releaser identities, and restricted GitHub WIF |
| `scripts/firebase-config.mjs`           | Shared security/cache headers, root redirect and trailing slashes; no server rewrites                                                     |
| `firebase.generated.json`               | Generated local static-engine configuration, without project credentials                                                                  |
| `infra/generated/firebase-serving.json` | Matching Hosting REST configuration                                                                                                       |
| `config/distribution-lock.json`         | Append-only size/SHA-256 records for immutable download URLs                                                                              |
| `config/revoked-downloads.json`         | Stopped URLs, removed from catalog links and staged files                                                                                 |

Terraform 1.17.2 and Google beta provider 8.11.0 are pinned. The provider lock is committed; state, plans, actual tfvars and credentials are ignored. Firebase resources require the beta provider. The actual dedicated-project plan/apply completed and a refresh plan showed no differences. This does not establish live delivery, DNS or application smoke-test acceptance.

```sh
terraform -chdir=infra/gcp init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/gcp fmt -check
terraform -chdir=infra/gcp validate
```

Terraform does not create/link billing, redeem credits, create the Cloud project, manage DNS or publish content. Adding Firebase to a project cannot be undone: use an owner-approved D-Apps-only project. Import an existing Firebase project/default site rather than creating duplicates. Service Usage API must already be usable for bootstrap. Keep state in an approved private location, never in GitHub artifacts. Initial provisioning used a private Cloud Shell directory; its state/config/lock backup was downloaded to the ignored local operations directory and verified by SHA-256. Preserve that backup when resuming, restore it only for this same project, and run a fresh plan before applying anything. Terraform `prevent_destroy` protects the Firebase project/site; the Hosting site additionally uses its provider deletion-prevention policy.

## Identity and publication limits

Follow [the dedicated Google setup](GOOGLE-CLOUD-AUTH.md). Short-lived Workload Identity Federation replaces long-lived service-account keys. Trust requires repository ID `1459714940`, owner ID `178877625`, and `refs/heads/main`. The stage workflow can authenticate only as the staging environment subject, and only that subject can impersonate the stager. The release workflow can authenticate only as the production environment subject, and only that subject can impersonate the releaser. Pull-request CI has only content-read permission and no Google credentials.

[Firebase Hosting IAM](https://firebase.google.com/docs/projects/iam/permissions#hosting) does not offer a preview-only or live-release-only role, and custom roles cannot control Hosting. Both accounts therefore use the predefined `roles/firebasehosting.admin` on this dedicated project. That role can still delete Hosting resources. It does not grant Owner, Editor, billing, DNS, or IAM administration. The separation that IAM can enforce is which GitHub subject may borrow which account. Stage and release remain different workflow steps, and each workflow reads CI for the exact commit before it contacts Google.

Credential files from the official Google action are ignored, cleaned up by the action, and excluded from artifacts.

## Owner checklist before the next stage or release

Do this once after the identity change is merged. Do not run the stage or release workflow until the last step. Applying Terraform and changing GitHub settings are manual; this repository does not apply them.

1. Open the private Terraform directory that already holds this project's state. Copy the reviewed `infra/gcp` files into that work, keeping the existing state for this same project. Do not create a second Firebase project or Hosting site.
2. Run `terraform plan` and read it. Expect the single publisher account to be removed, two accounts (`d-apps-hosting-stager` and `d-apps-hosting-releaser`) to be added, and the Workload Identity provider condition to require each workflow together with its own environment subject. The impersonation bindings should name those exact subjects, not the whole repository.
3. Run `terraform apply` only after that plan matches the review. Record the outputs `GCP_PROJECT_ID`, `FIREBASE_SITE_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_STAGER_SERVICE_ACCOUNT`, and `GCP_RELEASER_SERVICE_ACCOUNT`.
4. In GitHub, create an environment named exactly `staging` before the stage workflow runs. Limit deployments to the `main` branch. Require a reviewer, and choose the owner. These protection rules are available for this public repository without a paid plan.
5. On the `staging` environment, set the non-secret variables `GCP_PROJECT_ID`, `FIREBASE_SITE_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, and `GCP_STAGER_SERVICE_ACCOUNT` from the Terraform outputs. Do not store them in git.
6. On the existing `production` environment, keep deployment branches limited to `main` and keep a required owner reviewer. Set `GCP_RELEASER_SERVICE_ACCOUNT` from the outputs. Keep `GCP_PROJECT_ID`, `FIREBASE_SITE_ID`, and `GCP_WORKLOAD_IDENTITY_PROVIDER` there as well. Remove the retired `GCP_PUBLISHER_SERVICE_ACCOUNT` variable so a run cannot keep using the deleted account.
7. Confirm the next stage run uses the `staging` environment and the next release run uses `production`. Both workflows refuse to continue unless the previous `main` commit is available and the `Verify site` workflow succeeded for that exact commit. Wait for that CI run to finish before starting either manual workflow.

## Reviewed release sequence

1. Check CI for the reviewed main commit. It covers lint, types, unit tests, build, static checks, distribution history, browsers, dependencies and secret scanning. Smoke-test a new app binary when it is part of the release. The stage and release workflows also refuse a commit whose `Verify site` run is unfinished or unsuccessful.
2. Run **Stage verified Firebase version (manual)** from the reviewed `main` commit, in the `staging` environment. It compares the distribution lock and revocation list with the previous `main` commit, then downloads and verifies the size, SHA-256, archive boundaries, signature, notarization and Gatekeeper assessment of each active direct download on macOS. Staging finalizes a version and compares its file hashes, configuration and labels with the build. It does not change the live site. Record the version, commit and bundle digest.
3. Read the current live version. After publication approval, run **Publish reviewed Firebase version (manual)** from the same commit in the `production` environment with the staged version and the expected live version. Use `NONE` for a site with no live version. If main changed, stage again. The workflow repeats the distribution-history and CI checks, rebuilds, and verifies the staged files, configuration and labels before changing the live version.
4. Verify the result on the canonical and both default Firebase hostnames. Check language navigation, normal and error responses, and the hash of each active ZIP. Confirm the `www` redirect preserves the path. Record the confirmed release, checks and any open issues.

Both workflows share a concurrency group. The current-version check cannot prevent a Firebase Console release between the check and the publication request. Let one person run the release.

If publication fails, read the `firebase-release-result` artifact or the workflow log and compare the requested version with the live release in Firebase Console before rerunning:

- `submission-unconfirmed` records the intended version and expected previous version before the publication request. Check the live release history to see whether Firebase applied it.
- `accepted` includes Firebase's release ID. The workflow makes up to three attempts to confirm the live version by reading only. If it fails, check which version is live and record the result.
- `confirmed` means the workflow observed the requested live version. Complete the public HTTP checks in step 4.

## Headers, caching and platform limits

The shared security module supplies CSP, nosniff, DENY framing, no-referrer, COOP/CORP and Permissions-Policy. HSTS has a one-year max age with `includeSubDomains`. HTML, unversioned files and ZIPs require browser revalidation with a five-minute CDN TTL; hashed Astro assets use long immutable caching. Downloads have explicit attachment filenames; HTML retains meta CSP/no-referrer.

The generated Hosting rules set the WAV/ARIUM script hash only on its HTML paths. The document uses the same hash for its meta policy and script integrity. Its CSS, images and fonts are served from the same origin. The Playwright WAV/ARIUM checks use the generated Hosting configuration through the Firebase static engine to catch header and resource regressions before release.

Local verification uses Firebase's official static engine, `superstatic`, with the generated configuration. It checks rules, redirects, normal/custom-404 headers and downloads without cloud login. It does not simulate Google-managed TLS, reserved `/__/` paths, all platform errors, method behavior, abuse protections, IP retention or CDN invalidation. The site uses no reserved SDK/Auth routes. The live staging API nevertheless adds `/__/firebase/init.js` and `/__/firebase/init.json` to the finalized inventory. Verification records only these two known Google-managed entries separately, checks their metadata, and still requires exact hashes for every application file; any other unexpected path is rejected. See [reserved Hosting URLs](https://firebase.google.com/docs/hosting/reserved-urls). Verify managed redirects/errors and methods live; do not claim every header where unmeasured. Firebase configuration does not provide the former GET/HEAD-only allowlist. The local engine serves static content for other methods without mutating files; live behavior must be measured. No form or server API processes those bodies. No custom WAF rate limit or CAPTCHA/cookie challenge is configured or promised.

## Stop, update and recover

For a new version, append its URL/hash/size to the distribution lock and update release validation for that formal artifact. CI rejects changes/removal of existing lock entries and removal of prior revocations relative to the base commit. Hosting has no former S3 conditional-write policy: repository review and byte checks enforce URL immutability.

For an incident, append the affected path to the revocation list and rebuild, stage and publish. A revoked ZIP is excluded from the links, verification and bundle, so an unavailable upstream ZIP does not block publication. An app with no remaining downloads keeps its detail and support pages with a stopped-distribution notice. New releases invalidate the Hosting CDN. Verify **404** for GET, HEAD and Range requests on the canonical and both Firebase hostnames, and follow the `www` redirect to verify the same result. Files already downloaded cannot be recalled. See [Hosting cache behavior](https://firebase.google.com/docs/hosting/manage-cache).

For rollback, restore prior site content in a new reviewed commit while **retaining current revocations and the complete distribution lock**, then stage/release normally. A direct console rollback can resurrect stopped binaries and must not be used. Missing/mismatched files fail closed. Urgent hosting-disable actions require explicit owner approval and verification on every hostname. No destructive cleanup is automated.

References: [Hosting config](https://firebase.google.com/docs/hosting/full-config), [REST deployment](https://firebase.google.com/docs/hosting/api-deploy), [GitHub WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
