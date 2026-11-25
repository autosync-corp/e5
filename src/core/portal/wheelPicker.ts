import officialPricingCsv from '@/data/e5-official-pricing.csv?raw';
import { FINISH_CODE_TO_SITE_NAME, finishCodeFromPn } from '@/core/utils/officialPricing.ts';

export type WheelCatalogOption = {
  pn: string;
  style: string;
  size: string;
  finish: string;
  label: string;
};

function sizeFromPn(pn: string): string {
  const gt = pn.match(/^E5GT0[1-4](\d{2})(\d{2})E(\d{2,3})/i);
  if (gt) {
    const diameter = Number(gt[1]);
    const widthRaw = Number(gt[2]);
    const width = widthRaw >= 80 ? widthRaw / 10 : widthRaw;
    const offset = Number(gt[3]);
    return `${diameter}" x ${width}" +${offset}mm`;
  }
  const twoP = pn.match(/^E5[A-Z]{2}2P(\d{2})(\d{2})/i);
  if (twoP) {
    const diameter = Number(twoP[1]);
    const widthRaw = Number(twoP[2]);
    const width = widthRaw >= 80 ? widthRaw / 10 : widthRaw;
    return `${diameter}" x ${width}"`;
  }
  const std = pn.match(/^E5[A-Z]{2}(\d{2})(\d{2})E(\d{2,3})/i);
  if (std) {
    const diameter = Number(std[1]);
    const widthRaw = Number(std[2]);
    const width = widthRaw >= 80 ? widthRaw / 10 : widthRaw;
    const offset = Number(std[3]);
    return `${diameter}" x ${width}" +${offset}mm`;
  }
  return '';
}

export function parseOfficialWheelCatalog(csv: string = officialPricingCsv): WheelCatalogOption[] {
  const seen = new Set<string>();
  const options: WheelCatalogOption[] = [];
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const columns = line.split(',');
    const style = (columns[1] || '').trim();
    const sub = (columns[2] || '').trim().toUpperCase();
    const pn = (columns[3] || '').trim().toUpperCase();
    if (!pn || !style || seen.has(pn)) continue;
    seen.add(pn);
    const finish = FINISH_CODE_TO_SITE_NAME[sub] || FINISH_CODE_TO_SITE_NAME[finishCodeFromPn(pn) || ''] || sub;
    const size = sizeFromPn(pn);
    const label = [style, size, finish, pn].filter(Boolean).join(' · ');
    options.push({ pn, style, size, finish, label });
  }
  options.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
  return options;
}

export const wheelCatalogOptions = parseOfficialWheelCatalog();

export function wheelStylesFromCatalog(options: WheelCatalogOption[] = wheelCatalogOptions): string[] {
  return [...new Set(options.map((row) => row.style))].sort((a, b) => a.localeCompare(b));
}
