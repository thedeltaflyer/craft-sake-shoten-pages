import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function mockVerification(page: Page) {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest()) {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace(
          /data-site-key(?:="[^"]*")?/g,
          'data-site-key="test-public-key"',
        ),
      });
    } else await route.fallback();
  });
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.turnstile = {
      render(node, options) { window.contactVerification = options; window.contactLanguage = options.language; queueMicrotask(() => options.callback('mock-token')); return 'widget'; },
      remove() {}, reset() {}
    };`,
    }),
  );
}
async function fill(page: Page) {
  await page.locator('[name="name"]').fill("山田 太郎");
  await page.locator('[name="email"]').fill("visitor@example.com");
  if (await page.locator('select[name="shop"]').count())
    await page.locator('[name="shop"]').selectOption("kawasaki");
  await page.locator('[name="topic"]').selectOption("private-reservation");
  await page.locator('[name="message"]').fill("日本語の質問\nSecond line");
  await expect(page.locator('[data-contact] [type="submit"]')).toBeEnabled();
}
for (const route of ["/", "/yokohama/", "/kawasaki/"])
  for (const language of ["en", "ja"]) {
    test(`${route} ${language}: submission, localized errors and responsive accessibility`, async ({
      page,
    }) => {
      await mockVerification(page);
      let sent: Record<string, string> | undefined;
      await page.route("**/api/contact", async (route) => {
        sent = route.request().postDataJSON();
        await route.fulfill({ json: { code: "accepted" } });
      });
      await page.goto(`${route}?lang=${language}`);
      await expect(page.locator("[data-contact]")).toHaveCount(1);
      await fill(page);
      await page.locator('[name="name"]').fill("   ");
      await page.locator('[name="message"]').fill("  \n ");
      await page.locator('[data-contact] [type="submit"]').click();
      await expect(page.locator('[name="name"]')).toBeFocused();
      await expect(page.locator('[name="message"]')).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const result = await new AxeBuilder({ page }).analyze();
        expect(
          result.violations.filter((v) =>
            ["serious", "critical"].includes(v.impact || ""),
          ),
        ).toEqual([]);
      }
      await fill(page);
      await page.locator('[data-contact] [type="submit"]').click();
      await expect(page.locator("[data-contact-status]")).toContainText(
        language === "en" ? "accepted" : "受け付け",
      );
      expect(sent?.shop).toBe(route === "/yokohama/" ? "yokohama" : "kawasaki");
      expect(sent?.topic).toBe("private-reservation");
      expect(sent?.message).toContain("\n");
      await expect(
        page.locator('[data-contact] [type="submit"]'),
      ).toBeDisabled();
      await page
        .locator(`[data-language="${language === "en" ? "ja" : "en"}"]`)
        .click();
      await expect(page.locator("[data-contact-status]")).toContainText(
        language === "en" ? "受け付け" : "accepted",
      );
      await expect(page.locator('[name="message"]')).toHaveValue("");
    });
  }
test("language switching preserves draft, focus and URL; expiry blocks sending", async ({
  page,
}) => {
  await mockVerification(page);
  await page.goto("/?lang=en&source=test#shops");
  await fill(page);
  for (const language of ["ja", "en"]) {
    await page.locator(`[data-language="${language}"]`).click();
    await expect(page.locator(`[data-language="${language}"]`)).toBeFocused();
    await expect(page.locator('[name="name"]')).toHaveValue("山田 太郎");
    await expect(page.locator('[name="topic"]')).toHaveValue(
      "private-reservation",
    );
    await expect(page.locator('[name="shop"]')).toHaveValue("kawasaki");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { contactLanguage: string }).contactLanguage,
        ),
      )
      .toBe(language);
  }
  expect(page.url()).toContain("?source=test#shops");
  await page.evaluate(() =>
    (
      window as unknown as {
        contactVerification: { "expired-callback"(): void };
      }
    ).contactVerification["expired-callback"](),
  );
  await expect(page.locator('[data-contact] [type="submit"]')).toBeDisabled();
  await page.locator("[data-retry]").click();
  await expect(page.locator('[data-contact] [type="submit"]')).toBeEnabled();
});
test("failure preserves draft, double submission sends once, retry needs verification", async ({
  page,
}) => {
  await mockVerification(page);
  let calls = 0;
  await page.route("**/api/contact", async (route) => {
    calls++;
    await new Promise((r) => setTimeout(r, 200));
    await route.fulfill({ status: 502, json: { code: "delivery" } });
  });
  await page.goto("/");
  await fill(page);
  await page.locator("[data-contact]").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator("[data-contact-status]")).toContainText(
    "could not send",
  );
  expect(calls).toBe(1);
  await expect(page.locator('[name="message"]')).toHaveValue(
    "日本語の質問\nSecond line",
  );
  await expect(page.locator('[data-contact] [type="submit"]')).toBeDisabled();
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('[name="message"]')).toHaveValue(
    "日本語の質問\nSecond line",
  );
  await expect(page.locator("[data-contact-status]")).toContainText(
    "送信できませんでした",
  );
  await page.route("**/api/contact", (route) => route.abort());
  await expect(page.locator('[data-contact] [type="submit"]')).toBeEnabled();
  await page.locator('[data-contact] [type="submit"]').click();
  await expect(page.locator("[data-contact-status]")).toContainText(
    "確認できません",
  );
});
test("over-limit and forged fields are rejected without requests", async ({
  page,
}) => {
  await mockVerification(page);
  await page.goto("/");
  await fill(page);
  let calls = 0;
  await page.route("**/api/contact", (route) => {
    calls++;
    return route.fulfill({ json: { code: "accepted" } });
  });
  for (const [name, value] of [
    ["name", "x".repeat(101)],
    ["email", "invalid"],
    ["message", "x".repeat(5001)],
    ["shop", "forged"],
    ["topic", "forged"],
  ]) {
    await fill(page);
    await page.locator(`[name="${name}"]`).evaluate((control, value) => {
      if (control instanceof HTMLSelectElement)
        control.add(new Option(value, value));
      (control as HTMLInputElement).value = value;
    }, value);
    await page.locator('[data-contact] [type="submit"]').click();
    await expect(page.locator(`[name="${name}"]`)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  }
  expect(calls).toBe(0);
});
test("blocked Turnstile fails closed with Instagram alternatives", async ({
  page,
}) => {
  await mockVerification(page);
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.locator('[name="name"]').fill("Draft");
  await expect(page.locator("[data-contact-status]")).toContainText(
    "unavailable",
  );
  await expect(page.locator('[data-contact] [type="submit"]')).toBeDisabled();
  await expect(
    page.locator('[data-contact] a[href*="instagram.com"]'),
  ).toHaveCount(2);
});
for (const route of ["/", "/yokohama/", "/kawasaki/"])
  test(`${route} no JavaScript retains English fallback`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4321${route}`);
    await expect(page.locator("[data-contact-status]")).toContainText(
      "requires JavaScript",
    );
    await expect(page.locator('[data-contact] [type="submit"]')).toBeDisabled();
    expect(
      await page.locator('[data-contact] a[href*="instagram.com"]').count(),
    ).toBeGreaterThan(0);
    await context.close();
  });
test("missing public key stays unavailable without loading Turnstile", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest()) {
      const r = await route.fetch();
      await route.fulfill({
        response: r,
        body: (await r.text()).replace(
          /data-site-key(?:="[^"]*")?/g,
          'data-site-key=""',
        ),
      });
    } else await route.fallback();
  });
  await page.goto("/");
  await page.locator('[name="name"]').fill("Draft");
  await expect(page.locator("[data-contact-status]")).toContainText(
    "unavailable",
  );
  await expect(page.locator('[data-contact] [type="submit"]')).toBeDisabled();
});
