import assert from "node:assert/strict";
import test from "node:test";
import { mergeHistory, latestCatalogRows } from "../src/history.js";

const oldRow = {
  schemaVersion: "1.0",
  testId: "a",
  testName: "A",
  executionDateTime: "2026-06-01T00:00:00.000Z",
  environment: "dev",
  reportName: "web",
  status: "passed",
  reportUrl: "../reports/1/",
  build: "1"
};

const currentRow = {
  ...oldRow,
  executionDateTime: "2026-06-29T00:00:00.000Z",
  status: "failed",
  build: "2"
};

test("merges history, replaces same build, prunes by retention, and sorts newest first", () => {
  const rows = mergeHistory({
    existingRows: [oldRow, { ...currentRow, status: "passed" }],
    currentRows: [currentRow],
    days: 14,
    now: new Date("2026-06-30T00:00:00.000Z")
  });

  assert.deepEqual(rows, [currentRow]);
});

test("latest catalog is computed per environment", () => {
  const rows = [
    { ...oldRow, testId: "removed-dev-test", environment: "dev", build: "1", executionDateTime: "2026-06-28T00:00:00.000Z" },
    { ...oldRow, testId: "current-dev-test", environment: "dev", build: "2", executionDateTime: "2026-06-29T00:00:00.000Z" },
    { ...oldRow, testId: "canary-test", environment: "canary", build: "7", executionDateTime: "2026-06-28T12:00:00.000Z" }
  ];

  const visible = latestCatalogRows(rows).map((row) => row.testId).sort();

  assert.deepEqual(visible, ["canary-test", "current-dev-test"]);
});
