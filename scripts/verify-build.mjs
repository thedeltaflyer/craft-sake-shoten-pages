import { readFile, readdir, access } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
const read = (file) => readFile(file, "utf8");
const en = JSON.parse(await read("src/i18n/locales/en.json"));
const ja = JSON.parse(await read("src/i18n/locales/ja.json"));
function flatten(data, prefix = "") {
  return Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) =>
      typeof value === "object"
        ? Object.entries(flatten(value, `${prefix}${key}.`))
        : [[`${prefix}${key}`, value]],
    ),
  );
}
const translations = flatten(en);
assert.deepEqual(
  Object.keys(translations).sort(),
  Object.keys(flatten(ja)).sort(),
  "Translation key parity",
);
for (const [key, value] of Object.entries(translations)) {
  assert.ok(value.length, key);
  assert.deepEqual(
    value.match(/{{.*?}}/g),
    flatten(ja)[key].match(/{{.*?}}/g),
    `Interpolation parity: ${key}`,
  );
}
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : [path.join(dir, entry.name)],
      ),
    )
  ).flat();
}
const files = await walk("dist");
assert.deepEqual(files.filter((f) => f.endsWith(".html")).sort(), [
  "dist/404.html",
  "dist/index.html",
  "dist/kawasaki/index.html",
  "dist/yokohama/index.html",
]);
assert.ok(
  !files.some((f) => /server|_worker|functions/.test(f)),
  "No server artifacts",
);
const sitemap = await read("dist/sitemap.xml");
assert.deepEqual(
  [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]).sort(),
  [
    "https://craftsakeshoten.com/",
    "https://craftsakeshoten.com/kawasaki/",
    "https://craftsakeshoten.com/yokohama/",
  ],
);
for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = await read(file);
  assert.match(html, /<html lang="en"/);
  if (file === "dist/index.html")
    assert.ok(
      html.includes(en.storyDetail),
      "Complete English story in static HTML",
    );
  assert.ok(
    !/new_photos|No food service|reservations are not accepted|web\.archive|\/old\/|umat-operation|curator\.io|cgt_ez1n|food3|iframe|hreflang|smtp/i.test(
      html,
    ),
    `Forbidden output in ${file}`,
  );
  for (const match of html.matchAll(
    /data-i18n(?:-(?:alt|aria-label|title|content))?="([^"]+)"/g,
  ))
    assert.ok(match[1] in translations, `Unknown key ${match[1]}`);
  if (!file.endsWith("404.html")) {
    const route = file === "dist/index.html" ? "/" : `/${file.split("/")[1]}/`;
    assert.ok(
      html.includes(
        `rel="canonical" href="https://craftsakeshoten.com${route}"`,
      ),
    );
  }
  for (const id of ["yokohama", "kawasaki"])
    if (file.includes(`${id}/`)) {
      assert.ok(html.includes(en[`${id}Policy`]));
      assert.ok(html.includes('id="reservation"'));
      assert.ok(html.includes('id="yuyue"'));
    }
  for (const obsolete of [
    "お食事の提供はありません",
    "ご予約は承っておりません",
  ])
    assert.ok(!JSON.stringify(ja).includes(obsolete));
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const url = match[1].replace(/&amp;/g, "&");
    if (!url.startsWith("/")) continue;
    const pathname = new URL(url, "https://craftsakeshoten.com").pathname;
    await access(
      path.join(
        "dist",
        pathname.endsWith("/") ? `${pathname}index.html` : pathname,
      ),
    );
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g))
    assert.ok(html.includes(`id="${match[1]}"`), `Missing anchor ${match[1]}`);
}
for (const file of (await walk("src")).filter((f) =>
  /\.(ts|astro|css)$/.test(f),
))
  assert.ok(
    !/['"][^'"]*\b(?:old|new_photos)\//.test(await read(file)),
    `Archive dependency: ${file}`,
  );
console.log(
  "Verified: translation parity, exactly three canonical pages, links/assets, policies, and static output.",
);
