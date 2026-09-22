# Craft Sake Shoten

Three static Astro pages: `/`, `/yokohama/`, `/kawasaki/`. English HTML is complete without JavaScript; locally bundled i18next adds Japanese at the same URLs. There is no server adapter, API, CMS, remote font or runtime image service.

## Develop and verify

Use Node **24.21.0** (`.node-version`).

```sh
npm ci
npm run check
npm run build
npm run verify:build
npx playwright install chromium
npm run test:e2e
npm run dev
```

`npm run preview -- --host 127.0.0.1` serves the production build on port 4321. The tests start their own preview server; stop any existing server on port 4321 first. Under an agent, Astro may start preview in the background; use `npm run preview -- stop` to stop it. Build verification checks translation/interpolation parity, exactly three content routes and canonical sitemap URLs, internal links, assets, policy copy and static output. Browser tests cover every page/language, supported preference ordering, persistence, blocked storage, missing languages, query compatibility, keyboard focus, script failure, local-only requests, 404, responsive widths and axe serious/critical violations.

## Content and images

Edit matching keys in `src/i18n/locales/en.json` and `ja.json`; all translatable text uses `Text.astro` or an explicit binding. Keep sentences complete. `data-i18n` changes textContent only; attribute bindings permit only alt, aria-label, title and content. Never put translated HTML or links in resources. Store addresses in `src/data/addresses.ts` and shared schedules/map/social links in `src/data/locations.ts`. Preserve factual parity. Brand/origin is in `src/data/site.ts`; if changing origin, also update the Astro config and canonical assertions.

Approved originals live under `src/assets`; use Astro Image with widths/sizes, dimensions and appropriate loading. `npm run assets` regenerates public icons and sharing images. See `docs/content-and-assets.md` for provenance and unresolved content checks. Do not delete the archive until preservation is reviewed.

## Language behavior

Arrival priority: supported `?lang=en|ja|jp`, valid manual preference, first supported navigator.languages entry, navigator.language when that list is absent/empty, English fallback. Regional tags are matched case-insensitively by primary subtag. Only explicit query/manual choices are persisted in `craft-sake-language`. Recognized queries are consumed without losing other parameters or fragments. Invalid values are ignored. Storage failure is safe; the next page detects again. Controls are hidden until initialization succeeds. Switching retains focus, links, page URL, and structure, and updates text, alt/accessibility labels, title, description and html lang. Static English sharing metadata and JSON-LD remain stable.

No Japanese URLs or hreflang are emitted. Japanese depends on scripting and has no separately indexable document or social preview.

## Cloudflare Workers

`wrangler.jsonc` configures Workers Static Assets to publish `dist`, enforce trailing slashes, and serve the custom `404.html` with a 404 status for missing pages. No Worker script or Astro server adapter is needed. Wrangler is pinned in `package-lock.json`.

For a Git-connected Worker, use these dashboard settings:

- Worker name: `craft-sake-shoten` (must match `name` in `wrangler.jsonc`; change both if needed).
- Root directory: repository root.
- Build command: `npm run build:cloudflare`.
- Deploy command: `npm run deploy`.
- Non-production branch deploy command: `npx wrangler versions upload`.
- Build variable: `NODE_VERSION=24.21.0` (also recorded in `.node-version`).

Cloudflare installs dependencies from the npm lockfile. The build command runs the Astro check, static build, and build verification. Set the dashboard build command explicitly: Workers Builds does not honor the custom `build.command` in Wrangler configuration. That hook also builds and verifies the site for local Wrangler commands.

For local deployment, use Node 24.21.0, run `npm ci`, authenticate with `npx wrangler login`, then run `npm run deploy`. To validate packaging without publishing, run `npm run deploy:check`. Keep the existing Playwright checks as a separate pre-release step.

The existing `_redirects` and `_headers` are copied into the asset directory. Workers preview/default hostnames receive `X-Robots-Tag: noindex`; the production canonical remains `https://craftsakeshoten.com`. Attach the custom domain only after owner approval and remote checks of redirects, query/fragment preservation, security/cache headers, noindex behavior, and unknown-path 404 responses. No deployment or domain change is performed by adding this configuration. The Pages setup below remains available as an alternative.

References: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [custom builds](https://developers.cloudflare.com/workers/wrangler/custom-builds/).

## Cloudflare Pages

Connect this repository, select build command `npm run build`, output `dist`, and Node 24.21.0 (set NODE_VERSION if the dashboard overrides `.node-version`). No Functions, Worker or adapter is needed. The production canonical origin is `https://craftsakeshoten.com`; confirm domain ownership before attaching it. Preview deployments must not become the canonical origin.

`public/_redirects` handles archived route names without unsupported query-match rules. Existing `#reservation` and `#yuyue` fragments land at current visit policies. `public/_headers` sets security headers, immutable caching only for fingerprinted assets, and noindex on project/branch Pages hostnames. The explicit root 404 document prevents SPA fallback. CSP permits inline structured data and the local bundle, with no third-party resources.

Before production cutover, deploy a branch preview through the Cloudflare dashboard and verify:

```sh
curl -I 'https://PROJECT.pages.dev/yokohamabar?lang=jp&source=archive'
curl -I 'https://BRANCH.PROJECT.pages.dev/kawasakikitchen?lang=en'
curl -I 'https://PROJECT.pages.dev/does-not-exist'
curl -I 'https://PROJECT.pages.dev/'
curl -I 'https://craftsakeshoten.com/'
```

Follow redirects in a browser, confirm query selection and retained fragments, verify X-Robots-Tag on both preview hostname forms and its absence on production, inspect CSP/cache/security headers, and test map/Instagram destinations. Local Astro preview does not implement Cloudflare rules. No Cloudflare project/account credentials are provided in this workspace; remote deployment and its checks are pending.

Rollback: retain prior successful Pages deployment and use “Rollback to this deployment” in the dashboard. Revert the source change separately before the next deployment.

## Release verification

See `docs/verification.md` for actual results and remaining checks. Run three mobile Lighthouse samples per route and explicit language query against the production build, record medians and tool/browser versions; targets are Performance ≥90, Accessibility/SEO ≥95, LCP ≤2.5s and CLS ≤0.1. Check initial language changes under throttling, keyboard focus, contrast, and screen-reader reading order. A passing build alone does not establish these targets or content approval.
