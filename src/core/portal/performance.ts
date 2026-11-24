import compareJson from '@/data/performance/compare.json';
import historyJson from '@/data/performance/history.json';
import latestJson from '@/data/performance/latest.json';

export type Direction = 'better' | 'worse' | 'same';

export type MetricCompare = {
  baseline: number | null;
  latest: number | null;
  delta: number | null;
  direction: Direction | null;
};

export type MetricKind = 'score' | 'time' | 'cls' | 'bytes' | 'count';

type MetricKey = 'score' | 'lcp' | 'fcp' | 'tbt' | 'speed_index' | 'cls' | 'page_weight' | 'requests';

export const COMPARE_METRICS: { key: MetricKey; label: string; kind: MetricKind }[] = [
  { key: 'score', label: 'Performance score', kind: 'score' },
  { key: 'lcp', label: 'Largest content (LCP)', kind: 'time' },
  { key: 'fcp', label: 'First content (FCP)', kind: 'time' },
  { key: 'tbt', label: 'Busy time (TBT)', kind: 'time' },
  { key: 'cls', label: 'Layout shift (CLS)', kind: 'cls' },
  { key: 'speed_index', label: 'Speed index', kind: 'time' },
  { key: 'page_weight', label: 'Page weight', kind: 'bytes' },
  { key: 'requests', label: 'Requests', kind: 'count' },
];

type StrategyCompare = {
  source: string;
  field: unknown;
  lighthouse_version: { baseline: string | null; latest: string | null };
  run_to_run: {
    baseline: { runs: number; scores: number[]; min: number; max: number; spread: number } | null;
    latest: { runs: number; scores: number[]; min: number; max: number; spread: number } | null;
  };
  score: MetricCompare;
  lcp: MetricCompare;
  fcp: MetricCompare;
  tbt: MetricCompare;
  speed_index: MetricCompare;
  cls: MetricCompare;
  page_weight: MetricCompare;
  requests: MetricCompare;
};

type CompareFile = {
  schema_version: number;
  generated_at: string;
  client: { id: string; name: string };
  baseline_date: string;
  latest_date: string | null;
  urls: string[];
  source: string;
  field: unknown;
  caveats: string[];
  by_url: Record<
    string,
    {
      url: string;
      mobile: StrategyCompare | null;
      desktop: StrategyCompare | null;
    }
  >;
};

type HistoryMonth = {
  month: string;
  run_date: string | null;
  other_snapshots_in_month: Array<{
    date: string;
    timestamp: string;
    performance: { mobile?: number; desktop?: number };
  }>;
  mobile: { scores: { performance: number | null }; run_date: string | null } | null;
  desktop: { scores: { performance: number | null }; run_date: string | null } | null;
};

type HistoryFile = {
  schema_version: number;
  url: string;
  months: HistoryMonth[];
};

type LatestFile = {
  latest_date: string;
  path: string;
  urls: string[];
};

export const compareData = compareJson as CompareFile;
export const historyData = historyJson as HistoryFile;
export const latestData = latestJson as LatestFile;

export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMetric(kind: MetricKind, value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (kind === 'score' || kind === 'count') return String(Math.round(value));
  if (kind === 'time') return `${(value / 1000).toFixed(1)} s`;
  if (kind === 'cls') return value.toFixed(3);
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(value / 1024)} KB`;
}

export function formatDelta(kind: MetricKind, delta: number | null): string {
  if (delta == null || Number.isNaN(delta) || delta === 0) return '0';
  const formatted = formatMetric(kind, Math.abs(delta));
  return `${delta > 0 ? '+' : '−'}${formatted}`;
}

export function directionLabel(direction: Direction | null): string {
  if (direction === 'better') return 'Better';
  if (direction === 'worse') return 'Worse';
  if (direction === 'same') return 'Same';
  return '—';
}

/** Rewrite lab-tool caveats into client language. Numbers come from the snapshot, not invented. */
export function clientCaveats(raw: string[]): string[] {
  const out: string[] = ['These are lab test results, not real-visitor data yet.'];
  for (const item of raw) {
    if (/Chrome UX|CRUX|real-user/i.test(item)) continue;
    const spread = item.match(/spread from (\d+) to (\d+)/i);
    if (spread) {
      out.push(
        `The November 1 mobile score varied from ${spread[1]} to ${spread[2]} across three tests. Treat that number as approximate.`,
      );
      continue;
    }
    if (/Lighthouse version differed/i.test(item)) {
      out.push('The testing tool version changed between these runs, so scores are not a perfect match.');
      continue;
    }
    const cleaned = item.replace(/\s*\([^)]*API_KEY[^)]*\)/g, '').replace(/CRUX_API_KEY/g, '').trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
}

export type HistoryRow = {
  date: string;
  label: string;
  mobile: number | null;
  desktop: number | null;
};

export function historyRows(history: HistoryFile): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const seen = new Set<string>();
  for (const month of history.months) {
    for (const extra of month.other_snapshots_in_month || []) {
      if (seen.has(extra.date)) continue;
      seen.add(extra.date);
      rows.push({
        date: extra.date,
        label: formatDay(extra.date),
        mobile: extra.performance?.mobile ?? null,
        desktop: extra.performance?.desktop ?? null,
      });
    }
    const date = (month.run_date || '').slice(0, 10);
    if (date && !seen.has(date)) {
      seen.add(date);
      rows.push({
        date,
        label: formatDay(date),
        mobile: month.mobile?.scores?.performance ?? null,
        desktop: month.desktop?.scores?.performance ?? null,
      });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export function homepageCompare(data: CompareFile) {
  const url = data.urls[0];
  const page = url ? data.by_url[url] : undefined;
  return {
    url: url || data.urls[0] || '',
    mobile: page?.mobile ?? null,
    desktop: page?.desktop ?? null,
  };
}
