import fs from "node:fs";
import path from "node:path";
import { mergeHistory } from "./history.js";
import { extractRowsFromPlaywrightJson } from "./playwright-json.js";
import { writeDashboard } from "./render.js";

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(helpText());
    return 0;
  }
  if (!args.input || !args.out) {
    process.stderr.write("Missing required --input and --out.\n\n" + helpText());
    return 1;
  }

  const inputPath = path.resolve(args.input);
  const outDir = path.resolve(args.out);
  const historyPath = path.resolve(args.history || path.join(outDir, "history.json"));
  const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const currentRows = extractRowsFromPlaywrightJson(report, {
    reportName: args["report-name"] || "",
    environment: args.environment,
    baseUrl: args["base-url"] || "",
    build: args.build || process.env.GITHUB_RUN_ID || process.env.CIRCLE_BUILD_NUM || ""
  });
  const existingRows = readExistingHistory(historyPath);
  const rows = mergeHistory({ existingRows, currentRows, days: Number(args.days || 14) });

  writeDashboard({ outDir, rows });
  process.stdout.write(`Wrote ${rows.length} history rows to ${outDir}\n`);
  return 0;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      args.help = true;
    } else if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = "true";
      } else {
        args[key] = next;
        index += 1;
      }
    }
  }
  return args;
}

function readExistingHistory(historyPath) {
  if (!fs.existsSync(historyPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function helpText() {
  return `Usage:\n  playwright-history-dashboard --input playwright-report/results.json --out history-dashboard [options]\n\nOptions:\n  --input <file>          Playwright JSON reporter output. Required.\n  --out <dir>             Output directory for index.html and history.json. Required.\n  --history <file>        Existing history JSON. Default: <out>/history.json.\n  --report-name <name>    Label for this report/run.\n  --environment <name>    Environment label. Falls back to JSON metadata or unknown.\n  --base-url <url>        URL to the Playwright HTML report for this run.\n  --build <id>            Build/run id. Falls back to common CI env vars.\n  --days <number>         Retention window. Default: 14.\n`;
}
