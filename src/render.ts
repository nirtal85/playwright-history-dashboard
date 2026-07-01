import fs from "node:fs";
import path from "node:path";
import type { HistoryRow } from "./types.js";

interface WriteDashboardOptions {
  outDir: string;
  rows: HistoryRow[];
}

export function writeDashboard({ outDir, rows }: WriteDashboardOptions): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "history.json"), `${JSON.stringify(rows, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "index.html"), dashboardHtml());
}

function dashboardHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Shift Playwright History</title>
<style>
:root { color-scheme: dark; --bg: #0f151c; --panel: #151d26; --panel2: #1c2834; --line: #2d3c4c; --text: #edf4fb; --muted: #9fb0c0; --green: #65d48f; --red: #ff6b7a; --amber: #f4bd50; --blue: #7ab7ff; --violet: #bca7ff; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
* { box-sizing: border-box; }
body { margin: 0; background: linear-gradient(180deg, #101924 0, #0f151c 28rem); color: var(--text); }
main { width: min(1500px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 40px; }
.header { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 18px; }
h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
.sub { margin: 7px 0 0; color: var(--muted); }
.brand { color: var(--green); font-weight: 900; }
.loaded { color: var(--muted); text-align: right; }
.cards, .groups { display: grid; gap: 10px; margin: 14px 0; }
.cards { grid-template-columns: repeat(6, minmax(120px, 1fr)); }
.card, .group { border: 1px solid var(--line); background: var(--panel); padding: 12px; border-radius: 8px; }
.card .label { color: var(--muted); font-size: 11px; text-transform: uppercase; }
.card .value { display: block; margin-top: 8px; font-size: 24px; font-weight: 900; }
.filters { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr); gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: color-mix(in srgb, var(--panel2) 92%, transparent); position: sticky; top: 0; z-index: 2; }
label { display: grid; gap: 6px; color: var(--muted); font-size: 12px; text-transform: uppercase; }
input, select { width: 100%; border: 1px solid var(--line); background: #0d0f11; color: var(--text); padding: 9px 10px; font: inherit; }
.summary { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); margin: 14px 0; }
.summary strong, .group strong { color: var(--text); }
table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--panel); table-layout: fixed; }
th, td { padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; text-align: left; overflow-wrap: anywhere; }
th { color: #bdd5ee; font-size: 12px; text-transform: uppercase; background: #1d2a37; }
tr:hover td { background: #1b2228; }
.status { display: inline-block; min-width: 76px; text-align: center; padding: 3px 8px; border: 1px solid currentColor; border-radius: 999px; font-weight: 900; }
.passed { color: var(--green); }
.failed, .timedOut, .interrupted { color: var(--red); }
.skipped { color: var(--amber); }
.unknown { color: var(--muted); }
a { color: var(--blue); }
small { color: var(--muted); }
.trend { display: flex; gap: 4px; align-items: center; }
.dot { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; border: 1px solid currentColor; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip { border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 2px 7px; font-size: 11px; }
.details { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px; }
summary { cursor: pointer; color: var(--blue); }
pre { max-height: 220px; overflow: auto; white-space: pre-wrap; background: #0b1016; border: 1px solid var(--line); padding: 10px; color: #ffd7de; }
.attachments a { display: inline-block; margin: 6px 10px 0 0; }
.groups { grid-template-columns: repeat(3, minmax(180px, 1fr)); }
.group { color: var(--muted); }
.group code { color: #ffd7de; }
.empty { padding: 28px; border: 1px dashed var(--line); color: var(--muted); }
@media (max-width: 1000px) { .cards, .groups { grid-template-columns: repeat(2, minmax(130px, 1fr)); } }
@media (max-width: 760px) { .header, .filters { display: block; } .filters label { margin-bottom: 10px; } .cards, .groups { grid-template-columns: 1fr; } table { font-size: 13px; } th:nth-child(3), td:nth-child(3), th:nth-child(6), td:nth-child(6) { display: none; } }
</style>
</head>
<body>
<main>
  <section class="header">
    <div><h1><span class="brand">Test Shift</span> Control Tower</h1><p class="sub">Latest Playwright catalog, execution history, failure signals, and report links.</p></div>
    <small class="loaded" id="loadedAt"></small>
  </section>
  <section class="cards" id="cards"></section>
  <section class="groups" id="failureGroups"></section>
  <section class="filters">
    <label>Test name<input id="nameFilter" placeholder="contains..."></label>
    <label>Environment<select id="environmentFilter"><option value="">All</option></select></label>
    <label>Status<select id="statusFilter"><option value="">All</option></select></label>
  </section>
  <section class="summary" id="summary"></section>
  <table aria-label="Playwright execution history">
    <thead><tr><th>Test Name</th><th>Date & Time</th><th>Environment</th><th>Status</th><th>Trend</th><th>Links</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
</main>
<script>
const state = { rows: [], latestIdsByEnv: new Map() };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const byId = (id) => document.getElementById(id);
const statusOrder = { failed: 0, timedOut: 1, interrupted: 2, unknown: 3, skipped: 4, passed: 5 };
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
  return state.rows
    .filter((row) => latestIds.has(row.testId) && (!name || String(row.testName).toLowerCase().includes(name)) && (!env || row.environment === env) && (!status || row.status === status))
    .sort((left, right) => (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9) || String(right.executionDateTime).localeCompare(String(left.executionDateTime)));
}
function trendFor(row) {
  return state.rows
    .filter((item) => item.testId === row.testId && (item.environment || "unknown") === (row.environment || "unknown"))
    .sort((left, right) => String(left.executionDateTime).localeCompare(String(right.executionDateTime)))
    .slice(-8)
    .map((item) => '<span class="dot ' + esc(item.status || "unknown") + '" title="' + esc(item.status + " " + item.build) + '">' + esc((item.status || "?").slice(0, 1).toUpperCase()) + '</span>')
    .join("");
}
function shortFailure(row) {
  const message = String(row.failureMessage || row.failureSnippet || "").replace(/\\u001b\\[[0-9;]*m/g, "").trim();
  return message.split("\\n").find(Boolean) || "No failure message";
}
function renderCards(rows) {
  const counts = rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status || "unknown"] = (acc[row.status || "unknown"] || 0) + 1;
    acc.duration += Number(row.durationMs || 0);
    return acc;
  }, { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0, unknown: 0, duration: 0 });
  const flaky = rows.filter((row) => {
    const statuses = new Set(state.rows.filter((item) => item.testId === row.testId && (item.environment || "unknown") === (row.environment || "unknown")).map((item) => item.status));
    return statuses.has("passed") && [...statuses].some((status) => status !== "passed");
  }).length;
  byId("cards").innerHTML = [
    ["Total", counts.total, ""],
    ["Passed", counts.passed, "passed"],
    ["Failed", counts.failed + counts.timedOut + counts.interrupted, "failed"],
    ["Skipped", counts.skipped, "skipped"],
    ["Flaky signals", flaky, "unknown"],
    ["Duration", Math.round(counts.duration / 1000) + "s", ""]
  ].map(([label, value, cls]) => '<div class="card"><span class="label">' + esc(label) + '</span><span class="value ' + esc(cls) + '">' + esc(value) + '</span></div>').join("");
}
function renderFailureGroups(rows) {
  const failed = rows.filter((row) => row.status && row.status !== "passed" && row.status !== "skipped");
  const groups = new Map();
  for (const row of failed) {
    const key = shortFailure(row);
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  const top = [...groups.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3);
  byId("failureGroups").innerHTML = top.length ? top.map(([message, count]) => '<div class="group"><strong>' + count + '</strong> tests share failure<br><code>' + esc(message.slice(0, 160)) + '</code></div>').join("") : '<div class="group"><strong>0</strong> active failure groups<br><span>Latest catalog is clean.</span></div>';
}
function attachmentLinks(row) {
  const links = (row.attachments || []).filter((item) => item.path).map((item) => {
    const path = String(item.path || "");
    const label = item.name || "attachment";
    const isLinkable = /^https?:\\/\\//.test(path) || (!/^[A-Za-z]:[\\\\/]/.test(path) && !path.startsWith("/"));
    return isLinkable ? '<a href="' + esc(path) + '" target="_blank" rel="noreferrer">' + esc(label) + '</a>' : '<span class="chip">' + esc(label) + ' local artifact</span>';
  });
  return links.length ? '<div class="attachments">' + links.join("") + '</div>' : "";
}
function rowDetails(row) {
  const location = [row.errorFile || row.file, row.errorLine, row.errorColumn].filter(Boolean).join(":");
  const failure = row.failureSnippet || row.failureMessage || "";
  const meta = [
    row.project ? "project " + row.project : "",
    row.retry ? "retry " + row.retry : "retry 0",
    row.expectedStatus ? "expected " + row.expectedStatus : "",
    location ? "location " + location : ""
  ].filter(Boolean).map((item) => '<span class="chip">' + esc(item) + '</span>').join("");
  return '<details class="details"><summary>Details</summary><div class="meta">' + meta + '</div>' + (failure ? '<pre>' + esc(failure) + '</pre>' : '') + attachmentLinks(row) + '</details>';
}
function render() {
  const rows = visibleRows();
  const uniqueTests = new Set(rows.map((row) => row.testId)).size;
  renderCards(rows);
  renderFailureGroups(rows);
  byId("summary").innerHTML = '<span><strong>' + uniqueTests + '</strong> tests in latest catalog</span><span><strong>' + rows.length + '</strong> executions shown</span>';
  byId("rows").innerHTML = rows.length ? rows.map((row) => {
    const detail = esc(row.file || row.project || "");
    const build = row.build ? ' build ' + esc(row.build) : '';
    const report = row.reportUrl ? '<a href="' + esc(row.reportUrl) + '" target="_blank" rel="noreferrer">Open report</a>' : '-';
    return '<tr><td>' + esc(row.testName) + '<br><small>' + detail + '</small>' + rowDetails(row) + '</td><td>' + esc(new Date(row.executionDateTime).toLocaleString()) + '<br><small>' + esc(row.reportName || '') + build + '</small></td><td>' + esc(row.environment || 'unknown') + '</td><td><span class="status ' + esc(row.status || 'unknown') + '">' + esc(row.status || 'unknown') + '</span></td><td><div class="trend">' + trendFor(row) + '</div></td><td>' + report + '</td></tr>';
  }).join("") : '<tr><td colspan="6"><div class="empty">No matching history rows.</div></td></tr>';
}
fetch("history.json", { cache: "no-store" }).then((res) => res.json()).then((rows) => {
  state.rows = rows;
  state.latestIdsByEnv = latestCatalog(rows);
  byId("loadedAt").textContent = "Loaded " + rows.length + " history rows";
  for (const env of [...new Set(rows.map((row) => row.environment || "unknown"))].sort()) byId("environmentFilter").insertAdjacentHTML("beforeend", '<option value="' + esc(env) + '">' + esc(env) + '</option>');
  for (const status of [...new Set(rows.map((row) => row.status || "unknown"))].sort()) byId("statusFilter").insertAdjacentHTML("beforeend", '<option value="' + esc(status) + '">' + esc(status) + '</option>');
  ["nameFilter", "environmentFilter", "statusFilter"].forEach((id) => byId(id).addEventListener("input", render));
  render();
}).catch((error) => {
  byId("summary").innerHTML = '<span class="failed">Failed to load history.json: ' + esc(error.message) + '</span>';
});</script>
</body>
</html>
`;
}
