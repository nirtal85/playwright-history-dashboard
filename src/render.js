import fs from "node:fs";
import path from "node:path";

export function writeDashboard({ outDir, rows }) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "history.json"), `${JSON.stringify(rows, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "index.html"), dashboardHtml());
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Shift Playwright History</title>
<style>
:root { color-scheme: dark; --bg: #101214; --panel: #171b1f; --line: #2b3239; --text: #edf2f7; --muted: #9aa6b2; --green: #65d48f; --red: #ff6b7a; --amber: #f4bd50; --blue: #7ab7ff; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(circle at 20% 0%, #1d2522 0, #101214 36rem); color: var(--text); }
main { width: min(1440px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 40px; }
.header { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 20px; }
h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
.sub { margin: 6px 0 0; color: var(--muted); }
.brand { color: var(--green); font-weight: 800; }
.filters { display: grid; grid-template-columns: minmax(220px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr); gap: 10px; padding: 12px; border: 1px solid var(--line); background: color-mix(in srgb, var(--panel) 92%, transparent); position: sticky; top: 0; z-index: 2; }
label { display: grid; gap: 6px; color: var(--muted); font-size: 12px; text-transform: uppercase; }
input, select { width: 100%; border: 1px solid var(--line); background: #0d0f11; color: var(--text); padding: 9px 10px; font: inherit; }
.summary { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); margin: 16px 0; }
.summary strong { color: var(--text); }
table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); background: var(--panel); table-layout: fixed; }
th, td { padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; text-align: left; overflow-wrap: anywhere; }
th { color: var(--muted); font-size: 12px; text-transform: uppercase; background: #1d2329; }
tr:hover td { background: #1b2228; }
.status { display: inline-block; min-width: 76px; text-align: center; padding: 3px 8px; border: 1px solid currentColor; font-weight: 800; }
.passed { color: var(--green); }
.failed, .timedOut, .interrupted { color: var(--red); }
.skipped { color: var(--amber); }
.unknown { color: var(--muted); }
a { color: var(--blue); }
small { color: var(--muted); }
.empty { padding: 28px; border: 1px dashed var(--line); color: var(--muted); }
@media (max-width: 760px) { .header, .filters { display: block; } .filters label { margin-bottom: 10px; } table { font-size: 13px; } th:nth-child(3), td:nth-child(3), th:nth-child(5), td:nth-child(5) { display: none; } }
</style>
</head>
<body>
<main>
  <section class="header">
    <div><h1><span class="brand">Test Shift</span> Playwright History</h1><p class="sub">Static cross-run execution history from Playwright JSON.</p></div>
    <small id="loadedAt"></small>
  </section>
  <section class="filters">
    <label>Test name<input id="nameFilter" placeholder="contains..."></label>
    <label>Environment<select id="environmentFilter"><option value="">All</option></select></label>
    <label>Status<select id="statusFilter"><option value="">All</option></select></label>
  </section>
  <section class="summary" id="summary"></section>
  <table aria-label="Playwright execution history">
    <thead><tr><th>Test Name</th><th>Date & Time</th><th>Environment</th><th>Status</th><th>Report</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
</main>
<script>
const state = { rows: [], latestIdsByEnv: new Map() };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\\"": "&quot;", "'": "&#39;" }[char]));
const byId = (id) => document.getElementById(id);
function latestCatalog(rows) {
  const latest = new Map();
  for (const row of rows) {
    const env = row.environment || "unknown";
    const current = latest.get(env);
    if (!current || String(row.executionDateTime).localeCompare(String(current.executionDateTime)) > 0) latest.set(env, row);
  }
  return new Map([...latest.entries()].map(([env, row]) => [env, new Set(rows.filter((item) => (item.environment || "unknown") === env && (row.build ? item.build === row.build : item.executionDateTime === row.executionDateTime)).map((item) => item.testId))]));
}
function visibleRows() {
  const name = byId("nameFilter").value.trim().toLowerCase();
  const env = byId("environmentFilter").value;
  const status = byId("statusFilter").value;
  const latestIds = env ? state.latestIdsByEnv.get(env) ?? new Set() : new Set([...state.latestIdsByEnv.values()].flatMap((set) => [...set]));
  return state.rows.filter((row) => latestIds.has(row.testId) && (!name || String(row.testName).toLowerCase().includes(name)) && (!env || row.environment === env) && (!status || row.status === status));
}
function render() {
  const rows = visibleRows();
  const uniqueTests = new Set(rows.map((row) => row.testId)).size;
  byId("summary").innerHTML = "<span><strong>" + uniqueTests + "</strong> tests in latest catalog</span><span><strong>" + rows.length + "</strong> executions shown</span>";
  byId("rows").innerHTML = rows.length ? rows.map((row) => {
    const detail = esc(row.file || row.project || "");
    const build = row.build ? " build " + esc(row.build) : "";
    const report = row.reportUrl ? "<a href=\"" + esc(row.reportUrl) + "\" target=\"_blank\" rel=\"noreferrer\">Open report</a>" : "-";
    return "<tr><td>" + esc(row.testName) + "<br><small>" + detail + "</small></td><td>" + esc(new Date(row.executionDateTime).toLocaleString()) + "<br><small>" + esc(row.reportName || "") + build + "</small></td><td>" + esc(row.environment || "unknown") + "</td><td><span class=\"status " + esc(row.status || "unknown") + "\">" + esc(row.status || "unknown") + "</span></td><td>" + report + "</td></tr>";
  }).join("") : "<tr><td colspan=\"5\"><div class=\"empty\">No matching history rows.</div></td></tr>";
}
fetch("history.json", { cache: "no-store" }).then((res) => res.json()).then((rows) => {
  state.rows = rows;
  state.latestIdsByEnv = latestCatalog(rows);
  byId("loadedAt").textContent = "Loaded " + rows.length + " rows";
  for (const env of [...new Set(rows.map((row) => row.environment || "unknown"))].sort()) byId("environmentFilter").insertAdjacentHTML("beforeend", "<option value=\"" + esc(env) + "\">" + esc(env) + "</option>");
  for (const status of [...new Set(rows.map((row) => row.status || "unknown"))].sort()) byId("statusFilter").insertAdjacentHTML("beforeend", "<option value=\"" + esc(status) + "\">" + esc(status) + "</option>");
  ["nameFilter", "environmentFilter", "statusFilter"].forEach((id) => byId(id).addEventListener("input", render));
  render();
}).catch((error) => {
  byId("summary").innerHTML = "<span class=\"failed\">Failed to load history.json: " + esc(error.message) + "</span>";
});</script>
</body>
</html>
`;
}

