/**
 * Display rules for wheel prices.
 *
 * Catalog / CSV amounts are per wheel. The site sells complete sets:
 * 4 of one size when no vehicle is selected or the fitment is square,
 * or 2 front + 2 rear when a staggered vehicle is selected (see the
 * product page). Listing cards, forged finish labels, and shop Product
 * JSON-LD show that set total — never the raw per-wheel CSV cell.
 *
 * A real price is a finite number greater than 0 (the AutoSync catalog uses
 * `null` for unpriced SKUs). "CALL" is only for SKUs with no price.
 */

export const WHEELS_PER_SET = 4;

export function hasRealPrice(price: unknown): price is number {
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatPriceOrCall(price: unknown): string {
  return hasRealPrice(price) ? formatPrice(price) : 'CALL';
}

export function pricedAmounts(products: Array<{ Price?: number | null }>): number[] {
  return products.map((product) => product.Price).filter(hasRealPrice);
}

export function priceRangeFromProducts(
  products: Array<{ Price?: number | null }>
): { min: number; max: number } | null {
  const prices = pricedAmounts(products);
  if (prices.length === 0) return null;
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function formatPriceRangeOrCall(
  products: Array<{ Price?: number | null }>
): string {
  return formatRangeOrCall(priceRangeFromProducts(products));
}

export function setPriceFromUnit(unit: number): number {
  return unit * WHEELS_PER_SET;
}

export function staggeredSetPrice(frontUnit: number, rearUnit: number): number {
  return frontUnit * 2 + rearUnit * 2;
}

export function setRangeFromUnitRange(
  range: { min: number; max: number } | null
): { min: number; max: number } | null {
  if (!range) return null;
  return {
    min: setPriceFromUnit(range.min),
    max: setPriceFromUnit(range.max),
  };
}

export function setRangeFromProducts(
  products: Array<{ Price?: number | null }>
): { min: number; max: number } | null {
  return setRangeFromUnitRange(priceRangeFromProducts(products));
}

export function formatRangeOrCall(range: { min: number; max: number } | null): string {
  if (!range) return 'CALL';
  if (range.min === range.max) return formatPrice(range.min);
  return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
}

export function formatSetPriceRangeOrCall(
  products: Array<{ Price?: number | null }>
): string {
  return formatRangeOrCall(setRangeFromProducts(products));
}
