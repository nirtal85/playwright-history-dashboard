# Test Shift Playwright History Dashboard

Zero-dependency Playwright execution history dashboard from the native JSON reporter output.

This first version is intentionally small:

- Reads one Playwright JSON reporter file.
- Merges it into a rolling `history.json`.
- Writes a static `index.html` control tower.
- Shows latest-run summary cards, failed-first rows, failure grouping, per-test trend, and expandable failure details.
- Works with GitHub Pages.
- Does not require Allure, a database, a server, or a GitHub App.

## Why

Playwright HTML reports are excellent for one run. They do not keep a simple cross-run table of executions over time. This package fills that gap for teams that want a lightweight history view without adopting a full test-management platform.

## Install

```bash
npm install -D @test-shift/playwright-history-dashboard
```

## Configure Playwright

Enable Playwright's native JSON reporter next to the reporters you already use:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    ["list"],
    ["html"],
    ["json", { outputFile: "playwright-report/results.json" }]
  ]
});
```

## Generate Dashboard

```bash
npx playwright-history-dashboard \
  --input playwright-report/results.json \
  --out history-dashboard \
  --report-name web \
  --environment dev \
  --base-url ../reports/${GITHUB_RUN_ID}/ \
  --build ${GITHUB_RUN_ID} \
  --days 14
```

Output:

```text
history-dashboard/
  index.html
  history.json
```

Open locally with any static server:

```bash
python -m http.server 8080 --directory history-dashboard
```

## Local Smoke Check

This repo includes a real Playwright smoke flow with one passing test and one intentionally failing test:

```bash
npm run smoke:playwright
python -m http.server 8080 --directory smoke-output/history-dashboard
```

The command expects Playwright to fail, then builds the dashboard from the JSON reporter output and verifies that `history.json` contains both `passed` and `failed` rows.

## GitHub Pages Shape

Recommended published layout:

```text
pages-root/
  history/
    index.html
    history.json
  reports/<run-id>/
    index.html
```

The dashboard rows link to the Playwright HTML report through `--base-url`.

The dashboard is not a replacement for the Playwright HTML report. It is the history and triage layer above it. Keep publishing the Playwright HTML report and pass its URL through `--base-url`.

## GitHub Actions Example

See [`examples/github-pages.yml`](examples/github-pages.yml).

## Sharded Runs

For Playwright blob reports, let Playwright merge first and emit JSON:

```bash
npx playwright merge-reports --reporter=json ./all-blob-reports > playwright-report/results.json
npx playwright-history-dashboard --input playwright-report/results.json --out history-dashboard
```

This package does not parse blob reports directly in v0.1.

## Data Model

`history.json` is an array of rows:

```json
{
  "schemaVersion": "1.0",
  "testId": "tests/checkout.spec.ts::customer can pay::chromium",
  "testName": "customer can pay",
  "file": "tests/checkout.spec.ts",
  "project": "chromium",
  "executionDateTime": "2026-06-29T10:00:00.000Z",
  "durationMs": 1234,
  "environment": "dev",
  "reportName": "web",
  "status": "failed",
  "failureMessage": "expect(locator).toBeVisible failed",
  "reportUrl": "../reports/42/",
  "build": "42"
}
```

## Scope

Current version is history-only. No hosted upload, auth, flaky detection, Slack alerts, or custom reporter yet. Those are good next steps after the static flow proves useful.
