export type TestStatus = "passed" | "failed" | "skipped" | "timedOut" | "interrupted" | "unknown";

export interface HistoryRow {
  schemaVersion: "1.0";
  testId: string;
  testName: string;
  file: string;
  project: string;
  executionDateTime: string;
  durationMs: number;
  environment: string;
  reportName: string;
  status: TestStatus;
  failureMessage: string;
  reportUrl: string;
  build: string;
}

export interface ExtractOptions {
  reportName?: string;
  environment?: string;
  baseUrl?: string;
  build?: string;
}