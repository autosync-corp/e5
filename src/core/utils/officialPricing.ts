/**
 * Official E5 per-wheel prices, keyed by part number.
 *
 * Source of truth: `src/data/e5-official-pricing.csv` (Dave, 2026-11-15).
 * Future price updates are a one-file change in that CSV.
 *
 * Lookup is by PN, never by the CSV Submodel column. GT.01 rows all say
 * Submodel AB even when the PN suffix is BK/SB — the suffix is the finish.
 *
 * E5SE2P211209 is $1,200 in this file (matching its 21x12 BZPL siblings).
 * The original spreadsheet cell was $1,050; Dave chose the higher amount.
 */
import officialPricingCsv from '@/data/e5-official-pricing.csv?raw';

export const FINISH_CODE_TO_SITE_NAME: Record<string, string> = {
  AB: 'Brushed Aluminum',
  BK: 'Gloss Black',
  SB: 'Satin Black',
  PO: 'Polished',
  BBT: 'Bronze Brushed Tint',
  TIU: 'Titanium Brushed',
  CH: 'Chrome',
  DB: 'Dark Bronze',
  BKPO: 'Gloss Black Polished Lip',
  BZBL: 'Bronze Black Lip',
  BZPL: 'Bronze Polished Lip',
  GBPL: 'Gray Black Lip',
  TBL: 'Titanium Black Lip',
  TPL: 'Titanium Polished Lip',
};

export function finishCodeFromPn(pn: string): string | null {
  const match = pn.trim().match(/([A-Z]{2,4})$/i);
  return match ? match[1].toUpperCase() : null;
}

export function parseOfficialPricingCsv(csv: string): Map<string, number> {
  const prices = new Map<string, number>();
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const columns = line.split(',');
    const pn = (columns[3] || '').trim();
    const price = Number((columns[4] || '').trim());
    if (!pn || !Number.isFinite(price) || price <= 0) continue;
    prices.set(pn, price);
  }
  return prices;
}

export const officialPriceByPn = parseOfficialPricingCsv(officialPricingCsv);

export function officialPriceForPn(pn: string | null | undefined): number | undefined {
  if (!pn) return undefined;
  return officialPriceByPn.get(pn);
}

export function applyOfficialPrice<T extends { Pn?: string; Price?: number | null }>(
  wheel: T,
  prices: Map<string, number> = officialPriceByPn
): T {
  const pn = wheel.Pn;
  if (!pn) return wheel;
  const official = prices.get(pn);
  if (official == null) return wheel;
  if (wheel.Price === official) return wheel;
  return { ...wheel, Price: official };
}

export function applyOfficialPrices<T extends { Pn?: string; Price?: number | null }>(
  wheels: T[],
  prices: Map<string, number> = officialPriceByPn
): T[] {
  return wheels.map((wheel) => applyOfficialPrice(wheel, prices));
}
