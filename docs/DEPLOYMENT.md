# Firebase Hosting deployment and recovery

**Dedicated Google resources, billing link and WIF were configured after owner approval on 2026-11-17. No Hosting release or DNS change has been executed.** On 2026-11-17 the owner selected Firebase Hosting and accepted Google's retention of visitor IP data for a few months. Review the exact project, costs and DNS changes before execution approval. Git merges do not publish the site.

## Architecture and privacy

Astro builds static pages/assets; Firebase Hosting delivers them and the original approved ZIPs through its CDN/TLS. No Firebase SDK, Analytics, database, Auth, Functions, Cloud Run backend or web app registration is required. The former AWS stacks, IAM proposal and publishing scripts are retired. No AWS resources were created during setup. Route 53 remains the existing domain/DNS manager.

The operator collects no forms, accounts, uploads, tracking identifiers or visitor logs, and enables no additional analytics or request-log exports. Google's own Hosting service retains incoming IP data for a few months for abuse detection and usage analysis. This is an accepted, disclosed exception to the original provider-wide no-retention requirement. See [Firebase privacy](https://firebase.google.com/support/privacy). Review existing organization integrations/log exports before launch without disabling unrelated administrator auditing. Use aggregate traffic/storage/cost metrics.

## Reviewable configuration

| Location                                | Purpose                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `infra/gcp/main.tf`                     | Required APIs/Firebase on an existing dedicated project; Hosting site, publisher identity and restricted GitHub WIF |
| `scripts/firebase-config.mjs`           | Shared security/cache headers, root redirect and trailing slashes; no server rewrites                               |
| `firebase.generated.json`               | Generated local static-engine configuration, without project credentials                                            |
| `infra/generated/firebase-serving.json` | Matching Hosting REST configuration                                                                                 |
| `config/distribution-lock.json`         | Append-only size/SHA-256 records for immutable download URLs                                                        |
| `config/revoked-downloads.json`         | Stopped URLs, removed from catalog links and staged files                                                           |

Terraform 1.17.2 and Google beta provider 8.11.0 are pinned. The provider lock is committed; state, plans, actual tfvars and credentials are ignored. Firebase resources require the beta provider. The actual dedicated-project plan/apply completed and a refresh plan showed no differences. This does not establish live delivery, DNS or application smoke-test acceptance.

```sh
terraform -chdir=infra/gcp init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/gcp fmt -check
terraform -chdir=infra/gcp validate
```

Terraform does not create/link billing, redeem credits, create the Cloud project, manage DNS or publish content. Adding Firebase to a project cannot be undone: use an owner-approved D-Apps-only project. Import an existing Firebase project/default site rather than creating duplicates. Service Usage API must already be usable for bootstrap. Keep state in an approved private location, never in GitHub artifacts. Initial provisioning used a private Cloud Shell directory; its state/config/lock backup was downloaded to the ignored local operations directory and verified by SHA-256. Preserve that backup when resuming, restore it only for this same project, and run a fresh plan before applying anything. Terraform `prevent_destroy` protects the Firebase project/site; the Hosting site additionally uses its provider deletion-prevention policy.

## Identity and publication limits

Follow [the dedicated Google setup](GOOGLE-CLOUD-AUTH.md). Short-lived Workload Identity Federation replaces long-lived service-account keys. Trust requires repository ID `1459714940`, owner ID `178877625`, main, the exact production subject with immutable owner/repository IDs, and one of the two exact publishing workflow paths. Restrict the GitHub environment to main and owner approval. Pull-request CI has only content-read permission and no Google credentials.

Firebase Hosting cannot be controlled with custom IAM roles. Its predefined `roles/firebasehosting.admin` can publish and delete Hosting resources. Staging and publishing are separate script/workflow steps, **not separate IAM privileges**. Restrict this role to the dedicated project and review protected-environment/workflow changes. It grants no Owner/Editor, billing, DNS or IAM administration. See [Hosting IAM limitations](https://firebase.google.com/docs/projects/iam/permissions#hosting).

After reviewing Terraform outputs, set these non-secret production environment variables: `GCP_PROJECT_ID`, `FIREBASE_SITE_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_PUBLISHER_SERVICE_ACCOUNT`. Credential files from the official Google action are ignored, automatically cleaned up and excluded from artifacts.

## Reviewed release sequence

1. Complete [release readiness](RELEASE-READINESS.md), including account/credit checks and OneClip smoke testing. Run lint, type checks, unit tests, build, static checks, distribution-lock history checks, browser tests and dependency/secret scans on the reviewed commit.
2. After execution approval, prepare the dedicated project and billing choice. Review a private Terraform plan for that exact project, importing existing Firebase/site resources as needed. Apply only the reviewed plan; do not enable Analytics in the console.
3. Set up the protected GitHub environment. Run **Stage verified Firebase version (manual)** from the reviewed main commit. It verifies original ZIP size, SHA-256, archive boundaries, signing identity/team, notarization and Gatekeeper on macOS before obtaining Google credentials.
4. Staging copies only built static files and approved original ZIPs, hashes compressed bytes for the Hosting API, uploads to the exact Google endpoint and finalizes a version. It then reads back configuration, commit/bundle labels and the complete file/hash inventory before reporting success. It creates **no live release or public preview channel**. Record the version name, commit and bundle digest from its report.
5. Inspect the current live version, or confirm `NONE` for initial publication. After publication approval, run **Publish reviewed Firebase version (manual)** from the same main commit, with the finalized version and expected current live version. If main changed, stage again. Rebuilding and fresh ZIP verification precede comparing every remote file/hash, config and commit label. The script checks current live state, creates the release and reads it back.
6. A release is public on `<site>.web.app` and `<site>.firebaseapp.com` immediately, before custom-domain DNS changes. These default hosts remain reachable; do not claim apex-only access. Publication approval is required even when the custom domain is not connected.
7. Connect `deepledeeple.com` in Firebase Hosting and add `www.deepledeeple.com` as a redirect to the apex. Use the exact records returned by the console; do not invent DNS values. Retain Route 53 registration/nameservers and preserve existing SES MX, NS, TXT and unrelated records. Record the previous apex/www values/TTL before the narrowly reviewed DNS changes.
8. Wait for domain/certificate status to become connected. Verify HTTP-to-HTTPS and www redirects, root/language navigation, normal/error headers, actual ZIP SHA-256, 404, cookies/subresources and non-GET/HEAD behavior on every live hostname. Inspect actual project integrations/log exports and billing/credit dashboards. Save observed versions, measurements and DNS rollback data in the private task record.

Both manual workflows share one concurrency group. Hosting has no atomic compare-and-swap release precondition: the current-version check detects prior changes but cannot prevent a console release between calls. Use a single publisher and no concurrent out-of-band releases. If release/read-back fails, inspect current state before retrying.

## Headers, caching and platform limits

The shared security module supplies CSP, nosniff, DENY framing, no-referrer, COOP/CORP and Permissions-Policy. HSTS starts at 300 seconds without includeSubDomains/preload. HTML, unversioned files and ZIPs require browser revalidation with a five-minute CDN TTL; hashed Astro assets use long immutable caching. Downloads have explicit attachment filenames; HTML retains meta CSP/no-referrer.

Local verification uses Firebase's official static engine, `superstatic`, with the generated configuration. It checks rules, redirects, normal/custom-404 headers and downloads without cloud login. It does not simulate Google-managed TLS, reserved `/__/` paths, all platform errors, method behavior, abuse protections, IP retention or CDN invalidation. The site uses no reserved SDK/Auth routes. The live staging API nevertheless adds `/__/firebase/init.js` and `/__/firebase/init.json` to the finalized inventory. Verification records only these two known Google-managed entries separately, checks their metadata, and still requires exact hashes for every application file; any other unexpected path is rejected. See [reserved Hosting URLs](https://firebase.google.com/docs/hosting/reserved-urls). Verify managed redirects/errors and methods live; do not claim every header where unmeasured. Firebase configuration does not provide the former GET/HEAD-only allowlist. The local engine serves static content for other methods without mutating files; live behavior must be measured. No form or server API processes those bodies. No custom WAF rate limit or CAPTCHA/cookie challenge is configured or promised.

## Stop, update and recover

For a new version, append its URL/hash/size to the distribution lock and update release validation for that formal artifact. CI rejects changes/removal of existing lock entries and removal of prior revocations relative to the base commit. Hosting has no former S3 conditional-write policy: repository review and byte checks enforce URL immutability.

For an incident, append the affected URL to the revocation list and rebuild/stage/release. Catalog links are filtered, an app with no remaining distributions is hidden from the catalog while its detail/support page remains with a stopped-distribution notice, and the binary is excluded. Static inspection rejects lingering links. New releases invalidate the Hosting CDN; verify **404**, including GET/HEAD/range requests on apex/www and both default hosts. Do not promise 410 or recall of already downloaded files. No public preview channels should retain release binaries. See [Hosting cache behavior](https://firebase.google.com/docs/hosting/manage-cache).

For rollback, restore prior site content in a new reviewed commit while **retaining current revocations and the complete distribution lock**, then stage/release normally. A direct console rollback can resurrect stopped binaries and must not be used. Missing/mismatched files fail closed. Urgent hosting-disable actions require explicit owner approval and verification on every hostname. No destructive cleanup is automated.

References: [Hosting config](https://firebase.google.com/docs/hosting/full-config), [REST deployment](https://firebase.google.com/docs/hosting/api-deploy), [GitHub WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
