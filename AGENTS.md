# Repository guidance

## Project and structure

Craft Sake Shoten is a static Astro site deployed to Cloudflare Pages. The content routes are `/`, `/yokohama/`, and `/kawasaki/`, with a separate 404 page. English HTML must remain complete without JavaScript; locally bundled i18next adds Japanese at the same URLs.

- `src/pages/`: route entry points and robots.txt.
- `src/layouts/BaseLayout.astro`: shared document layout and metadata.
- `src/components/`: shared page sections, language controls, and translated text.
- `src/data/`: canonical brand/origin, addresses, schedules, map links, and social links.
- `src/i18n/`: translation helpers, client language behavior, and matching English/Japanese JSON resources.
- `src/styles/global.css`: shared styling.
- `src/assets/`: preserved source images; `public/`: static files, generated sharing images/icons, and Cloudflare rules.
- `scripts/`: asset generation, static build verification, and Lighthouse measurement.
- `tests/site.spec.ts`: Playwright behavior and accessibility checks.
- `docs/content-and-assets.md`: content provenance and unresolved facts; `docs/verification.md`: verification results and remaining launch checks.

Read README.md and the relevant documentation before changing behavior or published facts. Preserve unrelated working-tree changes.

## Development commands

Use Node 24.21.0 from `.node-version` and npm with the committed package-lock.json.

```sh
npm ci
npm run dev
```

For application changes, run these checks in order:

```sh
npm run check
npm run build
npm run verify:build
npx playwright install chromium # first-time browser setup
npm run test:e2e
```

Build verification reads `dist`, so rebuild after source changes. Playwright starts its own production preview on `127.0.0.1:4321` and does not reuse an existing server; ensure the port is free. If Astro leaves a background preview running, use `npm run preview -- stop`.

For performance or release validation, start production preview with `npm run preview -- --host 127.0.0.1 --port 4321`, then run `npm run test:lighthouse`. This measures three mobile samples per route/language and rewrites `docs/lighthouse-results.json`. Targets: Performance >=90, Accessibility/SEO >=95, LCP <=2.5s, CLS <=0.1. Record actual results and limitations; do not infer release readiness from a successful build.

Documentation-only edits need a content/diff review rather than a full application test run.

## Implementation conventions

- Follow existing Astro components, strict TypeScript, and the Prettier configuration. Prefer formatting only touched files; `npm run format` rewrites a broad set of project files.
- Keep the static architecture: no server adapter, API, CMS, remote fonts, runtime image service, or third-party resource embeds unless the task explicitly changes that requirement.
- Reuse shared components and data instead of duplicating location facts in templates.
- Preserve responsive layouts, semantic markup, keyboard focus, and accessible names. Verify changed UI in both languages and at mobile and desktop widths.
- Edit source files rather than generated `dist/` or `.astro/` output.

## Translation and content rules

- Update matching keys and interpolation placeholders in both locale JSON files. Use complete sentences.
- Use `Text.astro` or an explicit existing translation binding. `data-i18n` replaces textContent; translated attribute bindings support only alt, aria-label, title, and content. Do not put HTML or links in translation resources.
- Preserve language priority: supported query (`en`, `ja`, `jp`), saved manual preference, supported browser language, then English. Only explicit query/manual choices persist in `craft-sake-language`.
- Language switching must preserve focus, links, page structure, unrelated query parameters, and fragments. Storage or script failure must leave usable English content.
- Keep English sharing metadata and JSON-LD stable during language switching. Do not add Japanese routes or hreflang for client-only translations.
- Keep addresses in `src/data/addresses.ts` and schedules/map/social links in `src/data/locations.ts`. If changing the canonical origin, update site data, Astro configuration, and verification assertions together.
- Consult content provenance before altering business facts. Kawasaki has no food service and does not accept reservations; its unverified hours must not be invented. Keep outstanding owner confirmations explicit.

## Assets and deployment

- Use Astro Image for source images, with suitable widths/sizes, dimensions, and loading behavior. Run `npm run assets` when intentionally regenerating public icons or sharing images.
- Preserve the `old/` archive pending preservation review. Do not serve archived scripts or assume newly supplied images have already been integrated or approved.
- Preserve legacy redirects, `#reservation` and `#yuyue` anchors, the explicit 404, canonical URLs, and security/cache/noindex rules.
- Cloudflare builds with `npm run build` and publishes `dist`. Local Astro preview does not implement Cloudflare headers or redirects; verify those on a deployed preview when relevant.
- Keep launch checks in the documentation accurate. Do not mark remote deployment, content approval, or external destination checks complete without evidence.
