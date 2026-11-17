# Google Modern Web Guidance

Implementation used the official [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) skill from [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), skill version `2026_11_09-5bcc021b`. The installed skill is local to this project; `skills-lock.json` records its source and hash.

Before UI implementation, searches for `responsive card grid`, `strict content security policy`, and `accessible keyboard navigation` identified the guides below. Full guides were retrieved before applying them.

- **card**: “keep links and buttons for independent actions as separate native controls”. I used semantic articles and separate native links, avoiding an anchor wrapped around nested controls. A CSS container query adapts the card's contents to available width.
- **responsive-design**: “Use `aspect-ratio` for media elements”. I reserved image geometry, preserved the overview's intrinsic ratio, used flexible grids and rem-based text, and fixed a heading that overflowed when text was enlarged to 200%.
- **security**: “use hash-based CSP”. I generated the CSP hash and SRI from the same optional filter script, forbade inline handlers and dangerous resource types, and retained a meta CSP for static HTML where an error response may skip a viewer-response function. HTTP `frame-ancestors` provides a separate framing control.
- **privacy**: “collect data speculatively”. I followed the guide's **DON'T** rule: no analytics, persistence, third-party fonts, embeddings, or forms. I deliberately omitted CSP reporting endpoints and `report-sample`, because the requested privacy policy excludes collecting visitor request information.
- **accessibility**: “Don't rely purely on scores”. I used native controls, an explicit skip target, keyboard focus outlines, meaningful alternatives, and reduced-motion handling; checked JavaScript-disabled navigation, enlarged text and narrow screens separately from automated axe scores. A limited native Safari navigation check also passed; Edge and human screen-reader review remain release checks.

The security guide mentions per-response nonces as well. They are not used for this static Firebase Hosting site; the filter is an external script with a matching content hash and `strict-dynamic`. The initial one-app site ships no executable page script. The site avoids unsupported-feature polyfills by relying on widely available layout primitives and native navigation; unsupported security headers remain defense in depth, not the sole boundary.

## Site-readiness pass (2026-11-17)

Searches for `accessible keyboard navigation` and `respect text size preferences` were followed by complete retrieval of `accessibility`, `respect-os-text-scale`, and `typography` before editing.

- **accessibility**: “Do declare changes in the page's human language”. I marked English section labels as English on Japanese pages, made the language link visibly say “English”, and explicitly associated future category/platform labels with their native selects. Automated checks now cover all localized pages plus the 404, while native Safari keyboard navigation and the remaining human screen-reader checks are recorded separately.
- **respect-os-text-scale**: “Do not set a custom font size on `:root` or `html`.” I removed the fixed root size and added the `text-scale` meta opt-in. I did not apply `env(preferred-text-scale)` as a second scaling mechanism. Browsers without this meta feature keep their ordinary zoom/default-size behavior.
- **typography**: “Prefer `rem` to honor the user's browser font-size preferences”. I retained relative component sizes and unitless line heights, and checked every localized page at 320 CSS pixels with doubled root text and a wide fallback font rather than checking only the app detail.
