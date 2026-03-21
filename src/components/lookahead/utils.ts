import type { LookaheadRow } from "@/types";

export function formatAssetType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatWeekRange(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  return `${fmt(d)}–${fmt(end)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export interface PivotResult {
  weeks: string[];
  assets: string[];
  matrix: Map<string, Map<string, LookaheadRow>>;
}

export function pivotRows(rows: LookaheadRow[]): PivotResult {
  const weekSet = new Set<string>();
  const assetSet = new Set<string>();
  const matrix = new Map<string, Map<string, LookaheadRow>>();

  for (const row of rows) {
    weekSet.add(row.week_start);
    assetSet.add(row.asset_type);
    if (!matrix.has(row.asset_type)) matrix.set(row.asset_type, new Map());
    matrix.get(row.asset_type)!.set(row.week_start, row);
  }

  return {
    weeks: Array.from(weekSet).sort(),
    assets: Array.from(assetSet).sort(),
    matrix,
  };
}
