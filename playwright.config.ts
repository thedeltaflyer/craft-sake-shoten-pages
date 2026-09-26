import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: 4,
  use: { baseURL: "http://127.0.0.1:4321", browserName: "chromium" },
  webServer: {
    env: { ASTRO_PREVIEW_BACKGROUND: "1" },
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
  },
  reporter: "list",
});
