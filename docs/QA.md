# Verification record

Records: 2026-11-16–17. Website interaction results refer to a localhost production build; authenticated cloud checks are identified separately. Build checks were preceded by process, memory and free-disk checks.

## Website readiness (2026-11-17, after cloud setup)

- Scope: finish the website before the separate OneClip launch/capture/save smoke test. No Hosting release, public preview or DNS change was part of this pass.
- Type checking: 0 errors/warnings/hints; lint, 17 unit tests, build, 16-page internal-link/privacy inspection and Firebase static-engine checks passed.
- Local Playwright: 44 passed using installed Chrome, Firefox, WebKit and mobile WebKit. The first attempt omitted the existing SSD browser-cache path and could not launch Firefox/WebKit; rerunning with `PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright"` passed. This was an environment-path error, not a website failure.
- Coverage expanded from home/app/privacy to all 14 localized pages: axe WCAG A/AA checks, page language, one H1, canonical and matching language links, skip-link focus, 320 CSS-pixel width and 200% text with a wide fallback font. All tested pages had no unwanted external requests, cookies, localStorage or sessionStorage. The bilingual 404 and keyboard expansion/collapse of file-verification details are also covered.
- CI additionally installs actual Microsoft Edge and runs the same suite with `PLAYWRIGHT_INCLUDE_EDGE=1`: [PR #6 verification](https://github.com/TaigaShinohara/D-Apps-Platform/actions/runs/44023769575) passed all 55 browser tests, including 11 on Edge. The local Mac has no Edge installation. WebKit emulation is not claimed as an iPhone hardware test.
- Native Safari: keyboard-only skip-to-content → collection → OneClip navigation; English switching, file-hash disclosure and privacy navigation passed. Safari's accessibility tree exposed headings, lists, download names and image descriptions. This is agent-operated UI verification, not a user acceptance test.
- VoiceOver: the initial prompt and running application were reached, but spoken output/rotor behavior could not be independently observed through the available controls. No screen-reader pass is claimed. The VoiceOver setting was explicitly restored to **off** and observed in System Settings. Physical mobile use and human screen-reader experience remain unverified.
- Visual review: refreshed Japanese/English home, Japanese OneClip and 390px mobile screenshots were reviewed for clipping, navigation and download visibility. Full-page desktop capture omitted the already-loaded illustration even though it rendered normally in the viewport and mobile capture; the desktop detail reference therefore uses a verified viewport capture. The reference screenshots below are from this pass; previous PNG files are historical.
- All ten unique external links in the generated pages returned HTTP 200 without changing destination, including the original OneClip release, support and verification notes. This confirms link reachability, not the content or future availability of third-party pages.
- Firebase custom-domain **validate-only** calls for apex and www returned 200; the subsequent custom-domain list remained empty. No DNS values were returned, so none are invented in the [cutover review](DOMAIN-CUTOVER.md). Public DNS confirmed existing SES MX and SPF that must be preserved.

Updated local Lighthouse 13.6.0 measurements used the same mobile/DevTools throttling conditions documented below, with no runtime error:

| Page             | Performance | Accessibility | LCP    | CLS |
| ---------------- | ----------- | ------------- | ------ | --- |
| Japanese home    | 100         | 100           | 1.54 s | 0   |
| English home     | 99          | 100           | 1.60 s | 0   |
| Japanese OneClip | 99          | 100           | 1.59 s | 0   |

Reports and DNS/link evidence are in ignored `.artifacts/qa/site-readiness/`. These are local single-run lab results, not production or field measurements. The exact merged commit and fresh unpublished version belong in the staging workflow report/private task record after integration.

Current screens: [Japanese home](screens/home-ja.jpg), [English home](screens/home-en.jpg), [OneClip detail](screens/oneclip-ja.jpg), [mobile home](screens/mobile-ja.jpg), [mobile download](screens/mobile-oneclip-ja.jpg).

## Firebase migration checks (2026-11-17, before cloud setup)

- Astro/TypeScript: 0 errors, warnings or hints. ESLint/Prettier, production build and 16-page static inspection passed.
- Node: 14 tests passed. Catalog/archive cases plus compressed-hash uploads, no publication during staging, malicious upload endpoints, cross-site versions, remote file/config/commit/live-version mismatch rejection, immutable URLs, retained revocations, tampered/unsigned binaries and symlink rejection.
- Firebase official static engine (superstatic 10.0.0): generated config, root redirect, Japanese/English privacy disclosure, normal/custom-404 security headers, original ZIP bytes/attachment/HEAD and unapproved-path rejection passed on localhost. No Cloud login or upload was used for this test. Additional method probes confirmed that the static engine can serve other methods without changing files; no GET/HEAD-only enforcement is claimed.
- Playwright: 36 passed across installed Chrome, Firefox, WebKit and mobile WebKit; navigation, JavaScript-disabled access, keyboard, narrow/200% text, axe and no unwanted requests/cookies/browser storage checked. These browser tests use the project's local preview; the separate superstatic checks test Hosting rule compatibility.
- OneClip ZIP re-fetched: pinned size/SHA-256, strict signing, team/bundle, notarization ticket and Gatekeeper passed on macOS at 2026-11-17T03:00:13Z. No application launch/capture/save smoke test was performed.
- Terraform 1.17.2 / google-beta 8.11.0: Linux CI exposed a missing platform-specific provider hash; the lock now includes signed macOS ARM64 and Linux AMD64 packages. format and provider-schema validation passed. No cloud plan/apply or project creation was run. Provider package signatures/checksums verified during init.
- Dependency audit: 0 known vulnerabilities. The full Firebase CLI was removed after its unrelated transitive dependencies produced moderate advisories; only the official auth library and static engine are used.
- Isolated revocation drill: a copied build with the real OneClip URL revoked passed all 16-page link checks and static-engine 404 checks, retained Japanese/English detail pages with a stopped-distribution notice, and omitted the ZIP. The production revocation list remained unchanged.
- Secret scan and GitHub CI results are recorded with the migration PR. No Google service-account keys or account-specific credential files are tracked.

At the migration-only checkpoint, no cloud changes had been performed. The later setup record below supersedes that account/infrastructure status. Managed TLS/CDN/headers/errors and actual rollback remain unverified. Previous Lighthouse/Safari observations below are historical; no new Lighthouse or full human visual/accessibility assessment is claimed for this migration.

## Dedicated cloud setup and staging integration (2026-11-17)

- Owner-approved project/billing/Firebase/Hosting/SA/WIF provisioning completed. The refreshed Terraform plan had no changes. A too-long pool display name was shortened after the Google API rejected it.
- Publisher user-managed keys: zero. Only standard `_Default`/`_Required` logging sinks were present, with no added export. Analytics details returned 404. Hosting releases/custom domains were empty and only the empty live channel existed. These are setup observations, not evidence of live visitor behavior.
- The first GitHub authentication attempt rejected a legacy name-only subject. The repository's OIDC settings API reported `use_immutable_subject: true` and its exact prefix; Terraform now requires that ID-bearing production subject, retaining owner/repository IDs, main and the two workflow paths. Retesting successfully exchanged GitHub OIDC for the publisher's short-lived Google identity.
- The authenticated macOS stage run passed original ZIP hash/signing/notarization/Gatekeeper and static checks. Finalization succeeded; strict inventory comparison then correctly stopped on two Google-managed additions (`/__/firebase/init.js` and `init.json`). The revised verifier records only these known entries separately and continues to reject all other unexpected files, altered application hashes, duplicates and invalid managed metadata.
- Local regression coverage: 17 tests, including paginated inventories and the managed-file boundary. The final exact commit, finalized version, bundle labels and managed-file hashes belong in the [manual stage workflow report](https://github.com/TaigaShinohara/D-Apps-Platform/actions/workflows/stage-content.yml) and private operations record; a successful workflow is required before release.
- Private Terraform state/config/lock backup was downloaded and checked against the source SHA-256. No credential files or private state are in Git or Actions artifacts.

No live release or DNS change was performed for this setup. Full browser/device/human accessibility checks, OneClip launch/capture/save, public TLS/CDN/error behavior and recovery remain separate acceptance gates.

## Previous implementation checks (2026-11-16; AWS infrastructure retired)

| Check                 | Result                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astro/TypeScript      | 0 errors, 0 warnings, 0 hints                                                                                                                                                         |
| ESLint and Prettier   | Passed                                                                                                                                                                                |
| Node tests            | 12 passed: catalog/translation validation, hostile URLs, release approval, store link labels, ZIP extraction boundaries, edge routing/revocation, headers and infrastructure defaults |
| Built-site inspection | 16 HTML pages; internal links, meta CSP, no forms/inline event handlers/third-party subresources                                                                                      |
| Playwright            | 32 passed across installed Chrome, Firefox, WebKit and iPhone-size WebKit                                                                                                             |
| axe                   | No violations under the selected WCAG 2/2.1/2.2 A/AA tags on both homepages, both OneClip pages and both privacy pages                                                                |
| Reduced capabilities  | Critical navigation and download work with JavaScript disabled; skip links, 320px width and 200% root text enlargement checked                                                        |
| Privacy               | No external subresource requests, console errors, cookies, localStorage or sessionStorage during tested discovery/language/download paths                                             |
| Conditional filters   | Six-card synthetic fixture verifies category/OS filtering under the same enforced CSP and SRI as production. Fake apps/store URLs are absent from public data                         |
| ZIP                   | 3,821,021 bytes, pinned SHA-256 matched; codesign strict verification, Gatekeeper Notarized Developer ID, and stapled ticket validation passed on macOS                               |
| CloudFormation        | Four generated templates passed cfn-lint 1.60.1; no resource deployment performed                                                                                                     |
| Dependencies          | `npm audit --audit-level=moderate`: no known vulnerabilities at verification time                                                                                                     |
| Secrets               | Gitleaks 8.30.1: no leaks in the publishable working tree; CI also scans committed history with redacted output. GitHub secret scanning and push protection enabled                   |

Release verification checks ZIP traversal and resolves framework symlinks within the app before extracting. The exact bundle identifier `local.OneClip` and signing team `MY4L8GVM2L` are checked. The app was not launched by the script.

## Lighthouse

Mobile form factor, Lighthouse 13.6.0, installed Chrome 157, DevTools throttling: request latency 562.5 ms, download 1,474.56 Kbit/s, upload 675 Kbit/s and 4× CPU slowdown. Initial simulated-throttling trace collection failed with `NO_NAVSTART`; that run is **not** a performance result. Final valid measurements:

| Page                    | Performance | Accessibility | LCP    | CLS |
| ----------------------- | ----------- | ------------- | ------ | --- |
| Japanese homepage       | 100         | 100           | 1.43 s | 0   |
| English homepage        | 99          | 100           | 1.79 s | 0   |
| Japanese OneClip detail | 100         | 100           | 1.45 s | 0   |

Reports are retained locally in `.artifacts/qa/final-*.report.{json,html}`. These are single laboratory runs, not field percentiles or a guarantee of live performance.

Lighthouse and axe scores do not prove screen-reader usability or full WCAG conformance. Performance on the Firebase Hosting deployment must be measured after approval and deployment.

## Visual review and limits

The desktop and 390px mobile screenshots were visually inspected by the implementation agent. This found and corrected an awkward heading wrap; the browser tests separately found a 200%-text overflow, which was fixed. Safari's default Option-Tab link navigation on macOS is represented explicitly in the WebKit keyboard test.

Native Safari was additionally operated through its UI: Japanese homepage → OneClip detail → corresponding English detail succeeded, with correct requirements and download target in the accessibility tree. This is a limited navigation check, not a complete Safari accessibility/device audit. Edge is not installed in this environment. Actual VoiceOver use, Edge/physical-device checks, OneClip new-user smoke testing, live Firebase routing/headers/privacy settings and recovery remain in [the release checklist](RELEASE-READINESS.md). No deployment or DNS check is reported as passed solely from template tests.

Screens: [Japanese home](screens/home-ja.png), [English home](screens/home-en.png), [OneClip detail](screens/oneclip-ja.png), [mobile layout](screens/mobile-ja.png).
