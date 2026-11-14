/**
 * Display rules for wheel prices.
 *
 * A real price is a finite number greater than 0 (the AutoSync catalog uses
 * `null` for unpriced SKUs). Shop cards, product pages, and schema must keep
 * those real numbers exactly as they come in. "CALL" is only for SKUs with
 * no price — never as a replacement for an existing one.
 */

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
  const range = priceRangeFromProducts(products);
  if (!range) return 'CALL';
  if (range.min === range.max) return formatPrice(range.min);
  return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
}
