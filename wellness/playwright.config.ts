import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8080",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 8080",
        url: "http://127.0.0.1:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
