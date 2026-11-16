# Verification record

Date: 2026-11-16. All website results below refer to a localhost production build, not the live domain. Build checks were preceded by process, memory and free-disk checks.

## Automated checks

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

Lighthouse and axe scores do not prove screen-reader usability or full WCAG conformance. Performance on the AWS distribution must be measured after approval and deployment.

## Visual review and limits

The desktop and 390px mobile screenshots were visually inspected by the implementation agent. This found and corrected an awkward heading wrap; the browser tests separately found a 200%-text overflow, which was fixed. Safari's default Option-Tab link navigation on macOS is represented explicitly in the WebKit keyboard test.

Native Safari was additionally operated through its UI: Japanese homepage → OneClip detail → corresponding English detail succeeded, with correct requirements and download target in the accessibility tree. This is a limited navigation check, not a complete Safari accessibility/device audit. Edge is not installed in this environment. Actual VoiceOver use, Edge/physical-device checks, OneClip new-user smoke testing, live AWS routing/headers/logging and recovery remain in [the release checklist](RELEASE-READINESS.md). No deployment or DNS check is reported as passed solely from template tests.

Screens: [Japanese home](screens/home-ja.png), [English home](screens/home-en.png), [OneClip detail](screens/oneclip-ja.png), [mobile layout](screens/mobile-ja.png).
