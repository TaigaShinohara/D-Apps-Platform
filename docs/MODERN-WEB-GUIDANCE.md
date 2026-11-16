# Google Modern Web Guidance

Implementation used the official [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) skill from [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), skill version `2026_11_09-5bcc021b`. The installed skill is local to this project; `skills-lock.json` records its source and hash.

Before UI implementation, searches for `responsive card grid`, `strict content security policy`, and `accessible keyboard navigation` identified the guides below. Full guides were retrieved before applying them.

- **card**: “keep links and buttons for independent actions as separate native controls”. I used semantic articles and separate native links, avoiding an anchor wrapped around nested controls. A CSS container query adapts the card's contents to available width.
- **responsive-design**: “Use `aspect-ratio` for media elements”. I reserved image geometry, preserved the overview's intrinsic ratio, used flexible grids and rem-based text, and fixed a heading that overflowed when text was enlarged to 200%.
- **security**: “use hash-based CSP”. I generated the CSP hash and SRI from the same optional filter script, forbade inline handlers and dangerous resource types, and retained a meta CSP for static HTML where an error response may skip a viewer-response function. HTTP `frame-ancestors` provides a separate framing control.
- **privacy**: “collect data speculatively”. I followed the guide's **DON'T** rule: no analytics, persistence, third-party fonts, embeddings, or forms. I deliberately omitted CSP reporting endpoints and `report-sample`, because the requested privacy policy excludes collecting visitor request information.
- **accessibility**: “Don't rely purely on scores”. I used native controls, an explicit skip target, keyboard focus outlines, meaningful alternatives, and reduced-motion handling; checked JavaScript-disabled navigation, enlarged text and narrow screens separately from automated axe scores. A limited native Safari navigation check also passed; Edge and human screen-reader review remain release checks.

The security guide mentions per-response nonces as well. They are not used for this static S3 site; the filter is an external script with a matching content hash and `strict-dynamic`. The initial one-app site ships no executable page script. The site avoids unsupported-feature polyfills by relying on widely available layout primitives and native navigation; unsupported security headers remain defense in depth, not the sole boundary.
