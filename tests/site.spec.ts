import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import en from "../src/i18n/locales/en.json" with { type: "json" };
import ja from "../src/i18n/locales/ja.json" with { type: "json" };
const key = "craft-sake-language";
const routes = ["/", "/yokohama/", "/kawasaki/"];
async function context(
  browser: Browser,
  languages: string[] | null = ["en-US"],
  saved?: string,
  blocked = false,
  language = "",
) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(
    ({ languages, saved, blocked, key, language }) => {
      Object.defineProperty(navigator, "languages", {
        configurable: true,
        get: () => languages,
      });
      Object.defineProperty(navigator, "language", { get: () => language });
      if (blocked) {
        Object.defineProperty(window, "localStorage", {
          get: () => {
            throw new DOMException("Blocked", "SecurityError");
          },
        });
      } else if (saved !== undefined) localStorage.setItem(key, saved);
    },
    { languages, saved, blocked, key, language },
  );
  return ctx;
}
async function ready(ctx: BrowserContext, route = "/", language = "en") {
  const page = await ctx.newPage();
  await page.goto(route);
  await expect(page.locator("[data-language-switcher]")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", language);
  return page;
}
function flatten(
  data: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).flatMap(([k, v]) =>
      typeof v === "object"
        ? Object.entries(
            flatten(v as Record<string, unknown>, `${prefix}${k}.`),
          )
        : [[prefix + k, String(v)]],
    ),
  );
}
for (const route of routes)
  for (const language of ["en", "ja"] as const)
    test(`${route} complete ${language} translation, accessibility and responsive layout`, async ({
      browser,
    }) => {
      const ctx = await context(browser, [language]);
      const page = await ready(ctx, route, language);
      const translations = flatten(language === "en" ? en : ja);
      if (route === "/") {
        const detail = page.locator('[data-i18n="storyDetail"]');
        expect(await detail.textContent()).toBe(translations.storyDetail);
        await expect(detail).toHaveCSS("white-space", "pre-line");
      }
      const bindings = await page.locator("[data-i18n]").evaluateAll((nodes) =>
        nodes.map((n) => ({
          key: n.getAttribute("data-i18n")!,
          text: n.textContent,
        })),
      );
      for (const binding of bindings)
        if (!binding.key.startsWith("address."))
          expect(binding.text).toBe(translations[binding.key]);
      for (const attribute of ["alt", "aria-label", "content", "title"])
        for (const binding of await page
          .locator(`[data-i18n-${attribute}]`)
          .evaluateAll(
            (nodes, attr) =>
              nodes.map((n) => ({
                key: n.getAttribute(`data-i18n-${attr}`)!,
                text: n.getAttribute(attr),
              })),
            attribute,
          ))
          expect(binding.text).toBe(translations[binding.key]);
      expect(
        await page.evaluate((key) => localStorage.getItem(key), key),
      ).toBeNull();
      if (route === "/kawasaki/")
        await expect(
          page
            .getByText(
              language === "en" ? en.kawasakiPolicy : ja.kawasakiPolicy,
            )
            .first(),
        ).toBeVisible();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const results = await new AxeBuilder({ page }).analyze();
        expect(
          results.violations.filter((v) =>
            ["serious", "critical"].includes(v.impact!),
          ),
        ).toEqual([]);
      }
      await ctx.close();
    });
async function checkInstagram(page: Page, language: "en" | "ja") {
  const copy = language === "en" ? en : ja;
  const links = page.locator('a[href^="https://www.instagram.com/"]');
  for (const link of await links.all()) {
    const kawasaki = (await link.getAttribute("href"))!.includes("kawasaki");
    await expect(link).toHaveAttribute(
      "href",
      kawasaki
        ? "https://www.instagram.com/craftsakeshotenkawasaki/"
        : "https://www.instagram.com/craftsakeshoten/",
    );
    await expect(link).toHaveAccessibleName(
      kawasaki ? copy.kawasakiInstagram : copy.yokohamaInstagram,
    );
    await expect(
      link.locator('svg[aria-hidden="true"][focusable="false"]'),
    ).toHaveCount(1);
    const box = await link.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
}

test("photos, policy placement, shared heroes and Instagram survive language switching", async ({
  browser,
}) => {
  const ctx = await context(browser);
  const page = await ready(ctx);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    let geometry: unknown;
    for (const route of [...routes, "/does-not-exist/"]) {
      await page.goto(route + "?lang=en");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const metadata = await page
        .locator('meta[property^="og:"], script[type="application/ld+json"]')
        .evaluateAll((nodes) => nodes.map((n) => n.outerHTML));
      for (const language of ["en", "ja", "en"] as const) {
        await page.locator(`[data-language="${language}"]`).click();
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await checkInstagram(page, language);
        expect(
          await page
            .locator(
              'meta[property^="og:"], script[type="application/ld+json"]',
            )
            .evaluateAll((nodes) => nodes.map((n) => n.outerHTML)),
        ).toEqual(metadata);
        if (route === "/yokohama/" || route === "/kawasaki/") {
          const id = route === "/yokohama/" ? "yokohama" : "kawasaki";
          await expect(
            page.locator(`.hero [data-i18n="${id}Policy"]`),
          ).toHaveCount(0);
          await expect(
            page.locator(`#visit [data-i18n="${id}Policy"]`),
          ).toBeVisible();
          await page
            .locator("details")
            .nth(1)
            .evaluate((el) => el.setAttribute("open", ""));
          await expect(
            page.locator(`details [data-i18n="${id}Policy"]`),
          ).toHaveText((language === "en" ? en : ja)[`${id}Policy`]);
          await expect(page.locator(".gallery-grid img")).toHaveCount(
            id === "yokohama" ? 3 : 0,
          );
        }
        if (route === "/") {
          expect(
            await page.locator('[data-i18n="storyDetail"]').textContent(),
          ).toBe((language === "en" ? en : ja).storyDetail);
          await expect(page.locator(".shop-card .policy")).toHaveCount(0);
          await expect(page.locator(".story-photo")).toHaveCount(1);
        }
        if (routes.includes(route)) {
          const current = await page
            .locator(".hero-photo > img")
            .evaluate((el) => {
              const style = getComputedStyle(el);
              return {
                height: el.getBoundingClientRect().height,
                radius: style.borderRadius,
                fit: style.objectFit,
              };
            });
          geometry ??= current;
          expect(current).toEqual(geometry);
        }
        for (const img of await page.locator("img").all()) {
          await img.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              img.evaluate(
                (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
              ),
            )
            .toBe(true);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  }
  await ctx.close();
});
const cases: [string[] | null, string | undefined, string, string, string?][] =
  [
    [["ja"], undefined, "/", "ja"],
    [["ja-JP"], undefined, "/", "ja"],
    [["en-US"], undefined, "/", "en"],
    [["fr-FR", "ja-JP", "en-US"], undefined, "/", "ja"],
    [["en-US", "ja-JP"], undefined, "/", "en"],
    [["fr", "de"], undefined, "/", "en"],
    [[], undefined, "/", "en"],
    [null, undefined, "/", "en"],
    [[], undefined, "/", "ja", "ja-JP"],
    [["JA-jp"], undefined, "/", "ja"],
    [["ja"], "en", "/", "en"],
    [["en"], "ja", "/", "ja"],
    [["en"], "en", "/?lang=jp", "ja"],
    [["en"], "en", "/?lang=ja", "ja"],
    [["ja"], "ja", "/?lang=en", "en"],
    [["ja"], "invalid", "/?lang=invalid", "ja"],
  ];
for (const [
  index,
  [languages, saved, url, expected, fallback],
] of cases.entries())
  test(`language precedence ${index}`, async ({ browser }) => {
    const ctx = await context(browser, languages, saved, false, fallback);
    const page = await ready(ctx, url, expected);
    if (url.includes("lang=") && !url.includes("invalid")) {
      expect(new URL(page.url()).search).toBe("");
      expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
        expected,
      );
    }
    await ctx.close();
  });
test("manual switches retain URL, focus and links, and persist across pages", async ({
  browser,
}) => {
  const ctx = await context(browser, ["ja"]);
  const page = await ready(ctx, "/kawasaki/?tracking=1#visit", "ja");
  const original = page.url();
  const links = await page
    .locator("a")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
  for (const language of ["en", "ja", "en"]) {
    const button = page.locator(`[data-language="${language}"]`);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(page.url()).toBe(original);
    expect(
      await page
        .locator("a")
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))),
    ).toEqual(links);
  }
  await page.goto("/yokohama/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await ctx.close();
});
test("blocked storage and recognized query preserve unrelated URL state", async ({
  browser,
}) => {
  const ctx = await context(browser, ["ja"], undefined, true);
  const page = await ready(ctx, "/?lang=en&tracking=ok#shops");
  expect(page.url()).toContain("/?tracking=ok#shops");
  await page.getByRole("button", { name: "日本語" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await ctx.close();
});
test("automatic language is recomputed on the next visit", async ({
  browser,
}) => {
  const ctx = await context(browser, ["ja"]);
  const page = await ready(ctx, "/", "ja");
  await ctx.addInitScript(() =>
    Object.defineProperty(navigator, "languages", { get: () => ["en-US"] }),
  );
  await page.goto("/yokohama/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  await ctx.close();
});
for (const failure of ["disabled", "failed"])
  test(`English works with scripts ${failure}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: failure !== "disabled",
    });
    if (failure === "failed")
      await ctx.route("**/*.js", (route) => route.abort());
    const page = await ctx.newPage();
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("[data-language-switcher]")).toBeHidden();
      await expect(page.locator("h1")).toBeVisible();
      await checkInstagram(page, "en");
      if (route === "/")
        expect(
          await page.locator('[data-i18n="storyDetail"]').textContent(),
        ).toBe(en.storyDetail);
      expect(
        await page.locator('a[href^="https://www.instagram.com/"]').count(),
      ).toBeGreaterThan(0);
    }
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Yokohama" })
      .click();
    await expect(page).toHaveURL(/yokohama/);
    await ctx.close();
  });
test("requests remain local and unknown paths return 404", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("[data-language-switcher]")).toBeVisible();
  expect(
    requests.every((url) => url.startsWith("http://127.0.0.1:4321/")),
  ).toBe(true);
  const response = await page.goto("/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText(en.notFound);
});
