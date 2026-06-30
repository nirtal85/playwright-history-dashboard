import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "smoke-output");
const dashboardDir = path.join(outputDir, "history-dashboard");
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const run = spawnSync("npx", ["playwright", "test", "--config", "smoke/playwright.config.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (run.status === 0) {
  console.error("Smoke expected one Playwright test to fail, but all passed.");
  process.exit(1);
}

const cli = spawnSync("node", [
  "dist/cli.js",
  "--input", "smoke-output/playwright-results.json",
  "--out", "smoke-output/history-dashboard",
  "--history", "smoke-output/history-dashboard/history.json",
  "--report-name", "smoke",
  "--environment", "local",
  "--base-url", "../playwright-report/",
  "--build", "smoke-1",
  "--days", "14"
], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (cli.status !== 0) {
  process.exit(cli.status ?? 1);
}

type HistoryRow = {
  status: string;
};

const rows = JSON.parse(fs.readFileSync(path.join(dashboardDir, "history.json"), "utf8")) as HistoryRow[];
const statuses = new Set(rows.map((row) => row.status));
if (!statuses.has("passed") || !statuses.has("failed")) {
  console.error("Smoke dashboard history must contain passed and failed rows.");
  process.exit(1);
}

console.log(`Smoke dashboard: ${path.join(dashboardDir, "index.html")}`);
console.log("Serve it with: python -m http.server 8080 --directory smoke-output/history-dashboard");
