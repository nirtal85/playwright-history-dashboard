import assert from "node:assert/strict";
import test from "node:test";
import { extractRowsFromPlaywrightJson } from "../src/playwright-json.js";

test("extracts execution rows from Playwright JSON reporter output", () => {
  const report = {
    config: { metadata: { environment: "canary" } },
    suites: [
      {
        title: "checkout.spec.ts",
        file: "tests/checkout.spec.ts",
        specs: [
          {
            title: "customer can pay",
            tests: [
              {
                projectName: "chromium",
                expectedStatus: "passed",
                results: [
                  {
                    status: "failed",
                    startTime: "2026-06-29T10:00:00.000Z",
                    duration: 1234,
                    retry: 1,
                    error: {
                      message: "expect(locator).toBeVisible failed",
                      snippet: "> 12 | await expect(locator).toBeVisible();",
                      location: { file: "tests/checkout.spec.ts", line: 12, column: 18 }
                    },
                    attachments: [{ name: "trace", path: "test-results/trace.zip" }]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const rows = extractRowsFromPlaywrightJson(report, {
    reportName: "web_nightly",
    environment: "dev",
    baseUrl: "https://example.github.io/app/reports/42/",
    build: "42"
  });

  assert.deepEqual(rows, [
    {
      schemaVersion: "1.0",
      testId: "tests/checkout.spec.ts::customer can pay::chromium",
      testName: "customer can pay",
      file: "tests/checkout.spec.ts",
      project: "chromium",
      executionDateTime: "2026-06-29T10:00:00.000Z",
      durationMs: 1234,
      environment: "dev",
      reportName: "web_nightly",
      status: "failed",
      failureMessage: "expect(locator).toBeVisible failed",
      failureSnippet: "> 12 | await expect(locator).toBeVisible();",
      errorFile: "tests/checkout.spec.ts",
      errorLine: 12,
      errorColumn: 18,
      retry: 1,
      expectedStatus: "passed",
      attachments: [{
        name: "trace",
        contentType: "",
        path: "test-results/trace.zip"
      }],
      reportUrl: "https://example.github.io/app/reports/42/",
      build: "42"
    }
  ]);
});

test("falls back to metadata environment and unknown values", () => {
  const rows = extractRowsFromPlaywrightJson({
    config: { metadata: { environment: "staging" } },
    suites: [{ specs: [{ title: "loads", tests: [{ results: [{}] }] }] }]
  });

  assert.equal(rows[0].environment, "staging");
  assert.equal(rows[0].status, "unknown");
  assert.equal(rows[0].testName, "loads");
});
