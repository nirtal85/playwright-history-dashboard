import type { HistoryRow } from "./types.js";

interface MergeHistoryOptions {
  existingRows?: HistoryRow[];
  currentRows?: HistoryRow[];
  days?: number;
  now?: Date;
}

export function mergeHistory({ existingRows = [], currentRows = [], days = 14, now = new Date() }: MergeHistoryOptions = {}): HistoryRow[] {
  const currentBuilds = new Set(currentRows.map((row) => row.build).filter(Boolean));
  const retainedExisting = currentBuilds.size > 0
    ? existingRows.filter((row) => !currentBuilds.has(row.build))
    : existingRows;
  const cutoff = now.getTime() - Number(days || 14) * 24 * 60 * 60 * 1000;

  return [...retainedExisting, ...currentRows]
    .filter((row) => {
      const time = new Date(row.executionDateTime).getTime();
      return Number.isFinite(time) && time >= cutoff;
    })
    .sort((left, right) => String(right.executionDateTime).localeCompare(String(left.executionDateTime)));
}

export function latestCatalogRows(rows: HistoryRow[] = []): HistoryRow[] {
  const latestRunByEnvironment = new Map<string, HistoryRow>();

  for (const row of rows) {
    const environment = row.environment || "unknown";
    const current = latestRunByEnvironment.get(environment);
    if (!current || compareRows(row, current) > 0) {
      latestRunByEnvironment.set(environment, row);
    }
  }

  return rows.filter((row) => {
    const latest = latestRunByEnvironment.get(row.environment || "unknown");
    if (!latest) return false;
    if (latest.build) return row.build === latest.build && row.environment === latest.environment;
    return row.executionDateTime === latest.executionDateTime && row.environment === latest.environment;
  });
}

function compareRows(left: HistoryRow, right: HistoryRow): number {
  const byDate = String(left.executionDateTime).localeCompare(String(right.executionDateTime));
  if (byDate !== 0) return byDate;
  return String(left.build ?? "").localeCompare(String(right.build ?? ""), undefined, { numeric: true });
}