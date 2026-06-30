export function extractRowsFromPlaywrightJson(report, options = {}) {
  const rows = [];
  const reportName = options.reportName ?? "";
  const environment = options.environment ?? inferEnvironment(report);
  const build = options.build ?? inferBuild();
  const reportUrl = normalizeReportUrl(options.baseUrl ?? "");

  for (const suite of report?.suites ?? []) {
    visitSuite(suite, [], ({ suitePath, file, spec }) => {
      const testName = spec?.title || "(unnamed)";
      for (const testCase of spec?.tests ?? []) {
        const project = testCase?.projectName ?? "";
        for (const result of testCase?.results ?? []) {
          const executionDateTime = toIso(result?.startTime ?? result?.start ?? result?.stop ?? Date.now());
          rows.push({
            schemaVersion: "1.0",
            testId: buildTestId({ file, suitePath, testName, project }),
            testName,
            file: file ?? "",
            project,
            executionDateTime,
            durationMs: Number.isFinite(result?.duration) ? result.duration : 0,
            environment,
            reportName,
            status: normalizeStatus(result?.status),
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

function visitSuite(suite, parentTitles, onSpec) {
  const title = suite?.title ? [suite.title] : [];
  const suitePath = [...parentTitles, ...title];
  const file = suite?.file ?? "";

  for (const spec of suite?.specs ?? []) {
    onSpec({ suitePath, file, spec });
  }

  for (const child of suite?.suites ?? []) {
    visitSuite(child, suitePath, onSpec);
  }
}

function buildTestId({ file, suitePath, testName, project }) {
  const path = file || suitePath.filter(Boolean).join(" > ") || "unknown-file";
  return [path, testName || "(unnamed)", project].filter(Boolean).join("::");
}

function inferEnvironment(report) {
  return report?.config?.metadata?.environment || process.env.TEST_ENV || process.env.ENVIRONMENT || "unknown";
}

function inferBuild() {
  return process.env.GITHUB_RUN_ID || process.env.CIRCLE_BUILD_NUM || process.env.CI_PIPELINE_ID || "";
}

function normalizeReportUrl(baseUrl) {
  if (!baseUrl) return "";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function normalizeStatus(status) {
  if (["passed", "failed", "skipped", "timedOut", "interrupted"].includes(status)) {
    return status;
  }
  return "unknown";
}

function firstFailureMessage(result) {
  const error = result?.error ?? result?.errors?.[0];
  return String(error?.message ?? error?.value ?? "");
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}
