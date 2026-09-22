import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless", "--no-sandbox"],
});
const rows = [];
try {
  for (const route of ["/", "/yokohama/", "/kawasaki/"])
    for (const lang of ["en", "ja"]) {
      const samples = [];
      for (let run = 0; run < 3; run++) {
        const { lhr } = await lighthouse(
          `http://127.0.0.1:4321${route}?lang=${lang}`,
          {
            port: chrome.port,
            onlyCategories: ["performance", "accessibility", "seo"],
            output: "json",
            logLevel: "error",
          },
        );
        samples.push({
          performance: lhr.categories.performance.score * 100,
          accessibility: lhr.categories.accessibility.score * 100,
          seo: lhr.categories.seo.score * 100,
          lcp: lhr.audits["largest-contentful-paint"].numericValue,
          cls: lhr.audits["cumulative-layout-shift"].numericValue,
        });
        console.log(route, lang, run + 1, JSON.stringify(samples.at(-1)));
      }
      rows.push({
        route,
        lang,
        samples,
        medians: Object.fromEntries(
          Object.keys(samples[0]).map((key) => [
            key,
            samples.map((s) => s[key]).sort((a, b) => a - b)[1],
          ]),
        ),
      });
    }
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/lighthouse-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        conditions:
          "Local Astro production preview; Lighthouse default simulated mobile throttling; Chromium supplied by pinned Playwright; three sequential cold-storage runs per route/language; explicit language query selects language.",
        rows,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await Promise.resolve(chrome.kill());
}
