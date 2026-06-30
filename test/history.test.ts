import assert from "node:assert/strict";
import test from "node:test";
import { mergeHistory, latestCatalogRows } from "../src/history.js";
import type { HistoryRow } from "../src/types.js";

const oldRow: HistoryRow = {
  schemaVersion: "1.0",
  testId: "a",
  testName: "A",
  file: "tests/a.spec.ts",
  project: "chromium",
  executionDateTime: "2026-06-01T00:00:00.000Z",
  durationMs: 10,
  environment: "dev",
  reportName: "web",
  status: "passed",
  failureMessage: "",
  reportUrl: "../reports/1/",
  build: "1"
};

const currentRow: HistoryRow = {
  ...oldRow,
  executionDateTime: "2026-06-29T00:00:00.000Z",
  status: "failed",
  failureMessage: "boom",
  build: "2"
};

test("merges history, replaces same build, prunes by retention, and sorts newest first", () => {
  const rows = mergeHistory({
    existingRows: [oldRow, { ...currentRow, status: "passed", failureMessage: "" }],
    currentRows: [currentRow],
    days: 14,
    now: new Date("2026-06-30T00:00:00.000Z")
  });

  assert.deepEqual(rows, [currentRow]);
});

test("latest catalog is computed per environment", () => {
  const rows: HistoryRow[] = [
    { ...oldRow, testId: "removed-dev-test", environment: "dev", build: "1", executionDateTime: "2026-06-28T00:00:00.000Z" },
    { ...oldRow, testId: "current-dev-test", environment: "dev", build: "2", executionDateTime: "2026-06-29T00:00:00.000Z" },
    { ...oldRow, testId: "canary-test", environment: "canary", build: "7", executionDateTime: "2026-06-28T12:00:00.000Z" }
  ];

  const visible = latestCatalogRows(rows).map((row) => row.testId).sort();

  assert.deepEqual(visible, ["canary-test", "current-dev-test"]);
});