import type { ExtractOptions, HistoryRow, TestStatus } from "./types.js";

interface PlaywrightJsonReport {
  config?: { metadata?: Record<string, unknown> };
  suites?: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title?: string;
  file?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title?: string;
  tests?: PlaywrightTestCase[];
}

interface PlaywrightTestCase {
  projectName?: string;
  results?: PlaywrightResult[];
}

interface PlaywrightResult {
  status?: string;
  startTime?: string;
  start?: string | number;
  stop?: string | number;
  duration?: number;
  error?: PlaywrightError;
  errors?: PlaywrightError[];
}

interface PlaywrightError {
  message?: string;
  value?: string;
}

interface SpecVisit {
  suitePath: string[];
  file: string;
  spec: PlaywrightSpec;
}

export function extractRowsFromPlaywrightJson(report: PlaywrightJsonReport, options: ExtractOptions = {}): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const reportName = options.reportName ?? "";
  const environment = options.environment ?? inferEnvironment(report);
  const build = options.build ?? inferBuild();
  const reportUrl = normalizeReportUrl(options.baseUrl ?? "");

  for (const suite of report.suites ?? []) {
    visitSuite(suite, [], ({ suitePath, file, spec }) => {
      const testName = spec.title || "(unnamed)";
      for (const testCase of spec.tests ?? []) {
        const project = testCase.projectName ?? "";
        for (const result of testCase.results ?? []) {
          rows.push({
            schemaVersion: "1.0",
            testId: buildTestId({ file, suitePath, testName, project }),
            testName,
            file,
            project,
            executionDateTime: toIso(result.startTime ?? result.start ?? result.stop ?? Date.now()),
            durationMs: Number.isFinite(result.duration) ? Number(result.duration) : 0,
            environment,
            reportName,
            status: normalizeStatus(result.status),
            failureMessage: firstFailureMessage(result),
            reportUrl,
            build
          });
        }
      }
    });
  }

  return rows;
}

function visitSuite(suite: PlaywrightSuite, parentTitles: string[], onSpec: (visit: SpecVisit) => void): void {
  const title = suite.title ? [suite.title] : [];
  const suitePath = [...parentTitles, ...title];
  const file = suite.file ?? "";

  for (const spec of suite.specs ?? []) {
    onSpec({ suitePath, file, spec });
  }

  for (const child of suite.suites ?? []) {
    visitSuite(child, suitePath, onSpec);
  }
}

function buildTestId({ file, suitePath, testName, project }: { file: string; suitePath: string[]; testName: string; project: string }): string {
  const testPath = file || suitePath.filter(Boolean).join(" > ") || "unknown-file";
  return [testPath, testName || "(unnamed)", project].filter(Boolean).join("::");
}

function inferEnvironment(report: PlaywrightJsonReport): string {
  const metadataEnvironment = report.config?.metadata?.environment;
  return String(metadataEnvironment || process.env.TEST_ENV || process.env.ENVIRONMENT || "unknown");
}

function inferBuild(): string {
  return process.env.GITHUB_RUN_ID || process.env.CIRCLE_BUILD_NUM || process.env.CI_PIPELINE_ID || "";
}

function normalizeReportUrl(baseUrl: string): string {
  if (!baseUrl) return "";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function normalizeStatus(status: string | undefined): TestStatus {
  if (status === "passed" || status === "failed" || status === "skipped" || status === "timedOut" || status === "interrupted") {
    return status;
  }
  return "unknown";
}

function firstFailureMessage(result: PlaywrightResult): string {
  const error = result.error ?? result.errors?.[0];
  return String(error?.message ?? error?.value ?? "");
}

function toIso(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}