import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "../smoke-output/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "../smoke-output/playwright-report", open: "never" }],
    ["json", { outputFile: "../smoke-output/playwright-results.json" }]
  ],
  use: {
    trace: "retain-on-failure"
  }
});
