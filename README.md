# Craft Sake Shoten

Three static Astro pages: `/`, `/yokohama/`, `/kawasaki/`. English HTML is complete without JavaScript; locally bundled i18next adds Japanese at the same URLs. Astro remains static, with a separate Cloudflare Worker serving the same-origin contact API. There is no server adapter, CMS, remote font or runtime image service.

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

`wrangler.jsonc` configures Workers Static Assets to publish `dist`, enforce trailing slashes, and serve the custom `404.html` with a 404 status for missing pages. The Worker handles `/api/contact`; selective `/api/*` routing runs it first and all other requests retain asset routing. The `ASSETS` binding delegates non-contact paths. No Astro server adapter is needed. Wrangler is pinned in `package-lock.json`.

For a Git-connected Worker, use these dashboard settings:

- Worker name: `craftsakeshoten` (must match `name` in `wrangler.jsonc`; change both if needed).
- Root directory: repository root.
- Build command: `npm run build:cloudflare`.
- Deploy command: `npm run deploy`.
- Non-production branch deploy command: `npx wrangler versions upload`.
- Build variable: `NODE_VERSION=24.21.0` (also recorded in `.node-version`).

Cloudflare installs dependencies from the npm lockfile. The build command runs the Astro check, static build, and build verification. Set the dashboard build command explicitly: Workers Builds does not honor the custom `build.command` in Wrangler configuration. That hook also builds and verifies the site for local Wrangler commands.

For local deployment, use Node 24.21.0, run `npm ci`, authenticate with `npx wrangler login`, then run `npm run deploy`. To validate packaging without publishing, run `npm run deploy:check`. Keep the existing Playwright checks as a separate pre-release step.

The existing `_redirects` and `_headers` are copied into the asset directory. Workers preview/default hostnames receive `X-Robots-Tag: noindex`; the production canonical remains `https://craftsakeshoten.com`. Attach the custom domain only after owner approval and remote checks of redirects, query/fragment preservation, security/cache headers, noindex behavior, and unknown-path 404 responses. No deployment or domain change is performed by adding this configuration. The Pages setup below serves the static UI only; working contact delivery requires the Workers deployment.

References: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [custom builds](https://developers.cloudflare.com/workers/wrangler/custom-builds/).

## Cloudflare Pages

Connect this repository, select build command `npm run build`, output `dist`, and Node 24.21.0 (set NODE_VERSION if the dashboard overrides `.node-version`). This serves the static UI only: Pages alone does not provide `/api/contact`. Use the Workers deployment above for a functional form. The production canonical origin is `https://craftsakeshoten.com`; confirm domain ownership before attaching it. Preview deployments must not become the canonical origin.

`public/_redirects` handles archived route names without unsupported query-match rules. Existing `#reservation` and `#yuyue` fragments land at current visit policies. `public/_headers` sets security headers, immutable caching only for fingerprinted assets, and noindex on project/branch Pages hostnames. The explicit root 404 document prevents SPA fallback. CSP permits inline structured data, local bundles, and the intentional Turnstile script/frame origin. Turnstile loads only after form interaction; API connections and form actions remain same-origin.

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

## Contact form setup

All three pages include an English-first bilingual form. The homepage asks for a shop; location pages supply their shop. Private Reservation is an inquiry for either shop, never a confirmed booking. Name, email, topic and message are required. Messages go to one private inbox with the visitor as Reply-To. No recipient is built into HTML or JavaScript. Drafts remain only in page memory, survive failures and language changes, and clear after acceptance. An ambiguous network failure is never retried automatically; acceptance does not guarantee inbox delivery.

### Cloudflare prerequisites

1. Check that Email Sending is available to your account. Use Cloudflare DNS. In **Compute → Email Service → Email Sending → Onboard Domain**, choose the sending domain and review the DNS authentication records (SPF, DKIM, DMARC and bounce handling). Wait for verification before sending. See [Email Service onboarding](https://developers.cloudflare.com/email-service/get-started/send-emails/).
2. Verify the destination inbox in Cloudflare Email Service/Email Routing destination addresses and complete its confirmation email. The name-only `send_email` binding permits verified destinations; the Worker chooses only `CONTACT_TO_EMAIL`. Do not add a destination restriction address to committed configuration: that would expose the inbox in Git. See [send binding configuration](https://developers.cloudflare.com/email-service/configuration/send-bindings/).
3. Create a **Managed** Turnstile widget. Add `craftsakeshoten.com` and each explicitly approved preview hostname. Add the public build variable `PUBLIC_TURNSTILE_SITE_KEY` in Workers Builds (or the shell before building). This value is intentionally public and baked into HTML; rebuild to change it. No key means sending stays unavailable with Instagram alternatives. There is no production test-key fallback.
4. Set runtime secrets interactively, without values in shell history or source:

```sh
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Use the verified destination, an address on the authenticated sending domain, and the matching Turnstile secret respectively. Dashboard equivalent: Worker **Settings → Variables and Secrets**, type **Secret**. These are runtime secrets, never `PUBLIC_` variables. `wrangler secret put` can create/deploy a new Worker version immediately; coordinate with the operator. Use the dashboard/version workflow for staged releases. See [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

5. `CONTACT_ALLOWED_HOSTS` is a comma-separated exact host allowlist, with optional ports and no schemes, paths or wildcards. The committed production value is `craftsakeshoten.com`. For an approved preview, configure its exact hostname in this variable and Turnstile, and use a separate test inbox and secrets. Origin must equal the incoming request origin; Siteverify must return its hostname and action `contact`. Do not allow all `workers.dev` hosts. Named environments must explicitly configure their vars, email binding and independent secrets (`secret put … --env preview`); secrets and non-inheritable bindings do not carry over automatically. Keep public build keys paired with each environment's secret.
6. After authorization, use `npm run deploy` (Worker name `craftsakeshoten`) or the Git-connected settings above. Build-time variables and runtime secrets are separate. A plain Astro preview or Pages deployment cannot send the form. No production deployment, DNS changes or real recipient tests are authorized by implementing this feature.

### Local simulated delivery

Use Node 24.21.0. Copy the documented **always-pass visible site key** and matching **always-pass secret key** from [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/); the placeholders below are not usable keys. Never use test keys on production. Create an ignored `.dev.vars` file locally:

```dotenv
CONTACT_TO_EMAIL="test-inbox@example.com"
CONTACT_FROM_EMAIL="test-sender@example.com"
TURNSTILE_SECRET_KEY="<TURNSTILE_TEST_SECRET_KEY>"
CONTACT_ALLOWED_HOSTS="localhost:8787,127.0.0.1:8787"
```

Then build and start Wrangler:

```sh
PUBLIC_TURNSTILE_SITE_KEY='<TURNSTILE_TEST_SITE_KEY>' npm run build
npm run verify:build
PUBLIC_TURNSTILE_SITE_KEY='<TURNSTILE_TEST_SITE_KEY>' npm run dev:worker
```

The second public variable also covers Wrangler's custom build hook. Open `http://localhost:8787`. Wrangler runs locally with email remote binding mode disabled (do not add `remote: true` and do not use `--remote`). Email is simulated; terminal output can contain test message contents, so use fictitious personal data. Turnstile still requires network access. Cloudflare dummy validation responses can contain fixed `hostname: localhost` and `action: test`; this Worker intentionally requires the real request hostname and `action: contact`, so such dummy responses are rejected. Use the Node tests for deterministic successful simulated delivery. For the complete Wrangler browser-to-simulated-email flow, create a separate development widget approving `localhost`, use its public/secret key pair instead of the dummy keys, and keep the fictitious mailboxes and local email binding. Do not weaken hostname/action checks or reuse the production widget. See [local email simulation](https://developers.cloudflare.com/email-service/local-development/sending/). `.dev.vars` and environment-specific `.dev.vars.*` files are ignored; never commit them. Stop Wrangler when done and rebuild with the appropriate production public key before any deployment.

`npm run test:worker` uses fake bindings and mocked Siteverify; `npm run test:e2e` mocks the Turnstile/API boundary and tests all routes/languages without sending email. `npm run deploy:check` packages without publishing. Run the standard check/build/verify/browser sequence before release. Build verification scans static output for synthetic private markers; you can test build-time isolation with fictitious `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `TURNSTILE_SECRET_KEY` environment values as used in the Worker tests. Never use real secrets for this check.

### Troubleshooting and remote acceptance

- **Unavailable:** confirm the public key was present at build time and all three runtime secrets, `EMAIL` binding and host allowlist exist in the deployed environment. Missing configuration fails closed.
- **Verification failure:** check widget hostname approval, exact allowed host, matching public/secret keys, CSP permitting `https://challenges.cloudflare.com` for scripts/frames, and action `contact`. Tokens expire and are single-use; verify again after each server attempt. Ad/script blockers leave Instagram contact available.
- **Delivery failure:** check domain authentication, destination verification, account availability/quota and Email Service delivery logs. The browser receives only stable generic codes, never upstream errors or addresses. Avoid logging personal data or secrets in Worker code.
- **Uncertain outcome:** a disconnected response may follow a successful send. Do not automatically resend; confirm through Instagram first. Concurrent clicks are blocked, but exactly-once delivery is not guaranteed without persistent coordination.

On an approved deployed test preview, check real compact Turnstile under actual CSP, test-inbox receipt and Reply-To, rejected bot/forged requests, API no-store/noindex/nosniff headers, static redirects with queries/fragments, preview noindex, cache headers and custom 404. Local mocks and dry runs cannot establish these. Keep remote checks pending in the verification record until observed.
