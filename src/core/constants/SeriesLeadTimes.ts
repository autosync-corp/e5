import { toSlug } from '@/core/utils/wheelUrl';

/**
 * Made-to-order lead times, keyed by the series' URL slug.
 *
 * The shop listing, the single-product page and the product JSON-LD all read this one
 * table, so the three can no longer drift apart (they previously each hardcoded their
 * own copy of the series list *and* the wording).
 *
 * A series that isn't listed here is treated as a normally stocked series and falls
 * back to the API's `InStock` flag.
 *
 * Keyed by slug so both the catalog name and the URL segment resolve:
 * `getSeriesLeadTime('GT.03')` and `getSeriesLeadTime('gt03')` both hit `gt03`.
 *
 * NOTE: the separator is written as the `\u00B7` escape rather than a literal middot so
 * the string can't be corrupted by a non-UTF-8 save; it renders as "Made to Order - 6
 * Week Lead Time" with a middot, matching the `&middot;` the templates used before.
 */
const SERIES_LEAD_TIMES: Record<string, string> = {
  // Forged family - 4 week
  talladega: 'Made to Order \u00B7 4 Week Lead Time',
  sonoma: 'Made to Order \u00B7 4 Week Lead Time',

  // GT family - 6 week
  gt01: 'Made to Order \u00B7 6 Week Lead Time',
  gt02: 'Made to Order \u00B7 6 Week Lead Time',
  gt03: 'Made to Order \u00B7 6 Week Lead Time',
  gt04: 'Made to Order \u00B7 6 Week Lead Time',
};

/**
 * Returns the made-to-order lead-time label for a series, or null if the series is
 * stocked normally.
 *
 * Accepts either the catalog model name ("GT.03", "Talladega") or a URL slug ("gt03").
 */
export function getSeriesLeadTime(series: string | null | undefined): string | null {
  if (!series) return null;
  return SERIES_LEAD_TIMES[toSlug(series)] ?? null;
}

/**
 * True when the series is made to order (used for schema.org availability).
 */
export function isMadeToOrderSeries(series: string | null | undefined): boolean {
  return getSeriesLeadTime(series) !== null;
}
