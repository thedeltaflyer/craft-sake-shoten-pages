# Verification record

Tested locally on 2026-09-21, macOS arm64, Node 22.22.0, Astro 7.3.3, Playwright 1.63.0 / Chromium 153.0.8010.12.

- Dependencies reused from the earlier successful `npm ci`; Node 22.22.0 used for every application check.
- `npm run assets`: passed; both location sharing images regenerated at 1200 × 630. All six new photos have matching pre/post-move SHA-256 checksums and dimensions recorded in `content-and-assets.md`. Previous originals remain preserved.
- `npm run check`: passed with zero errors, warnings or hints.
- `npm run build`: passed; four static HTML documents, including the technical 404.
- `npm run verify:build`: passed; translation/interpolation parity, canonical/sitemap entries, internal links and local assets, revised policy copy, retained anchors, and no archive/temporary-directory dependencies. Obsolete Kawasaki wording is rejected; the complete English story detail is required in static HTML.
- `npm run test:e2e`: 29 passed after adding the supplied story paragraphs. The initial sandbox attempt could not bind the preview port; the successful run used approved local preview/browser access.
- Both languages on all three content routes at 320, 390, 768 and 1440px: no horizontal overflow and zero serious/critical axe violations at each width. All page and attribute translations match their resources.
- Additional browser regression checks cover all four routes (including the 404 footer), all four widths, and EN→JA→EN. Instagram SVGs persist, canonical destinations and shop-specific accessible names remain correct, and targets are at least 44 × 44px. Sharing metadata and JSON-LD stay stable. Every image decodes after scrolling. Hero height/corner geometry matches across the three content routes. Visit and FAQ policy placement matches across locations; no hero/card policy callouts remain.
- Disabled and failed JavaScript cases retain usable English pages, the complete supplied English paragraph, and accessible Instagram icon links. Existing language precedence, direct ja/jp queries, saved preference, blocked storage, focus, query/fragment and local-request checks pass.
- Visual review: all four routes in both languages at mobile (390px) and desktop (1440px), both location heroes at all four target widths, the natural-ratio Yokohama gallery, and both 1200 × 630 sharing images. Kawasaki uses a 65% horizontal focal position to retain the two central faces inside the arch. Gallery derivatives are capped at the source width (including the 813px crowd photo); Yokohama hero/card derivatives stop at 957px. Supporting images remain lazy.
- The supplied English/Japanese story paragraphs are published verbatim after the existing story copy. Browser assertions verify exact text (including Japanese newlines), scoped pre-line rendering, and EN→JA→EN preservation. The final story layout was visually reviewed in both languages at 390px and 1440px. The content record documents the explicit publishing decision without treating the service claims as independently verified.
- Earlier baseline checks (not repeated here): archive-free fresh installation/build verification, icon transparency review, and dependency audit. Full manual assistive-technology review remains pending.

## Mobile Lighthouse

Run `npm run preview -- --host 127.0.0.1` followed by `npm run test:lighthouse`. The runner uses the installed Playwright Chromium and Lighthouse 13.5.0, default simulated mobile throttling, three sequential samples per route and explicit language query, and writes raw samples and medians to `docs/lighthouse-results.json`. Measurements describe the local production build, not Cloudflare network performance. Run again after deployment. All six route/language medians meet the requested targets. Results below; the JSON contains all 18 samples.

## Not verified here

No Cloudflare account/project was configured or deployed. Actual Pages redirect behavior, query/fragment preservation, preview noindex headers, production indexability, cache/security headers and HTTP 404 remain preview acceptance checks. Local Astro preview cannot validate `_headers` or `_redirects`; for unknown paths without a trailing slash, Astro preview may show its own 404 instead of the custom document.

Owner confirmation is still needed for Kawasaki's current schedule and exact unit, official naming, Instagram/contact validity and Japanese wording. Unconfirmed Kawasaki hours remain omitted. The requested verbatim story copy is included as explicitly authorized by the user. See `content-and-assets.md`. A human screen-reader session and production-domain performance checks remain pending.

| Route | Language | Performance | Accessibility | SEO | LCP (s) | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| / | en | 100 | 100 | 100 | 1.66 | 0.000 |
| / | ja | 100 | 100 | 100 | 1.73 | 0.027 |
| /yokohama/ | en | 100 | 100 | 100 | 1.73 | 0.000 |
| /yokohama/ | ja | 100 | 100 | 100 | 1.43 | 0.021 |
| /kawasaki/ | en | 100 | 100 | 100 | 1.50 | 0.000 |
| /kawasaki/ | ja | 100 | 100 | 100 | 1.50 | 0.000 |

## Workers deployment configuration — 2026-09-22

Added an assets-only Wrangler configuration and pinned Wrangler 4.136.1. With Node 22.22.0, `npm run deploy:check` passed: its custom build ran Astro check (zero errors/warnings/hints), the static build, and build verification, then Wrangler read 77 asset files and exited without publishing. The subsequent browser suite passed all 29 tests. Workers/default preview hostnames now have a noindex header rule. Actual Cloudflare deployment, domain attachment, redirects, header matching, and remote 404 behavior remain unverified.

## Node upgrade — 2026-09-22

Updated the development/build pin to Node 24.21.0 and the package engine minimum to 24.21.0. With Node 24.21.0 and npm 11.19.0, a clean `npm ci` completed with zero reported vulnerabilities; Astro check, build, build verification, Wrangler deployment dry run, and all 29 Playwright tests passed. npm emitted install-script approval warnings for esbuild, fsevents, and workerd, but the checks completed successfully. A separate temporary npm cache was used because the existing cache contains root-owned files. Earlier verification and Lighthouse records above retain their original Node versions. Cloudflare dashboard overrides must be updated to `NODE_VERSION=24.21.0` separately; no remote deployment or dashboard change was performed.

## Bilingual Worker contact form — 2026-09-26

Node 24.21.0; existing locked dependencies reused. All three static content routes now have one form; the technical 404 stays separate. No production deployment, DNS/domain change, real secrets or real recipient messages were performed.

- Astro check: zero errors/warnings/hints. Static build and extended build verification passed, retaining four documents, canonical routes, policies, legacy anchors, archive isolation and translation parity. Synthetic private recipient/sender/Turnstile markers supplied during a build did not appear in static HTML or bundles.
- Node Worker tests: 27 passed. Coverage includes bounded streamed bodies without Content-Length, malformed/types/unknown fields, Unicode multiline content, injection attempts, forged shops/topics, method/media/origin/config rejection, honeypot suppression, Siteverify failures and hostname/action mismatches, expired/replayed tokens, safe errors, private recipient/Reply-To/body and exactly one send for a valid attempt. No real email is sent by tests.
- Playwright: 43 passed, including 14 new contact tests. Both languages on all three routes have no horizontal overflow and zero serious/critical axe violations at 320, 390, 768 and 1440px, including invalid-field states. Tests cover draft/focus/selection retention, verification expiry, blocked scripts/key absence, send failures, double submission, uncertain network outcome, Unicode, forged and over-limit values, static fallbacks and existing site behavior. Turnstile and the API boundary are mocked; live widget behavior is not established.
- Wrangler deployment dry run passed with the EMAIL and ASSETS bindings, selective API routing and exact production hostname allowlist. No publishing occurred.
- Visual review: English mobile and Japanese desktop form captures inspected; responsive layout, labels, disclaimer, unavailable state and Instagram alternatives are legible. Other route/language/width combinations have automated geometry/accessibility coverage. Keyboard focus and live-region semantics are exercised by tests; a human screen-reader session remains pending.
- Lighthouse: the requested three mobile samples per route/language were attempted. Chrome blocked page loads with CHROME_INTERSTITIAL_ERROR; a diagnostic run confirmed null category scores. The existing runner coerced null scores to zero, so the recorded JSON has been corrected to explicit null metrics with failure annotations. There are no valid new performance/LCP/CLS measurements. Prior historical scores above do not establish the current form build's performance. Re-run in a working browser environment and on the deployed preview.
- Initial sandbox browser execution could not bind port 4321; approved local preview/Chromium access allowed the passing browser run. Existing browser installation was sufficient.

Cloudflare Email Sending beta/account readiness, authenticated domain, verified destination, runtime secrets, actual managed Turnstile under CSP, real test-inbox receipt and Reply-To, preview hostname/noindex/cache/security headers, redirects and custom 404 remain pending operator-authorized deployed-preview checks. Dummy Turnstile metadata may use action `test`; strict production checks intentionally reject it. Deterministic Node tests simulate successful delivery; a dedicated development widget is documented for full local Wrangler simulated-email testing. Exactly-once delivery is not promised after ambiguous network failures.

The repository previously ignored all documentation. Ignore exceptions now expose this content record, verification record and Lighthouse results for review/versioning; other documentation remains under the existing ignore policy.

## Contact form spacing and copy — 2026-09-26

Removed the pre-submit reservation disclaimer in both languages at the user's request. The verification container starts hidden and only reserves space while loading or displaying the widget; unavailable and empty states no longer leave a 150px gap. Astro check, build and build verification passed. All 43 browser tests passed, covering both languages, responsive widths and verification/fallback behavior.
