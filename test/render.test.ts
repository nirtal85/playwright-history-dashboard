import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { writeDashboard } from "../src/render.js";
import type { HistoryRow } from "../src/types.js";

test("writes static dashboard files and escapes embedded data", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "history-dashboard-"));
  const rows: HistoryRow[] = [{
    schemaVersion: "1.0",
    testId: "x",
    testName: "<script>alert(1)</script>",
    file: "tests/x.spec.ts",
    project: "chromium",
    executionDateTime: "2026-06-29T00:00:00.000Z",
    durationMs: 1,
    environment: "dev",
    reportName: "web",
    status: "passed",
    failureMessage: "",
    reportUrl: "../reports/1/",
    build: "1"
  }];

  writeDashboard({ outDir, rows });

  const history = JSON.parse(fs.readFileSync(path.join(outDir, "history.json"), "utf8"));
  const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
  assert.deepEqual(history, rows);
  assert.match(html, /Test Shift/);
  assert.doesNotMatch(html, /<script>alert/);
});