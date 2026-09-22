import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://craftsakeshoten.com",
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  integrations: [
    {
      name: "three-page-sitemap",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          const { writeFile } = await import("node:fs/promises");
          await writeFile(
            new URL("sitemap.xml", dir),
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
              ["", "yokohama/", "kawasaki/"]
                .map(
                  (path) =>
                    `<url><loc>https://craftsakeshoten.com/${path}</loc></url>`,
                )
                .join("") +
              "</urlset>",
          );
        },
      },
    },
  ],
});
