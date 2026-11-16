import { toSlug } from '@/core/utils/wheelUrl';
import { priceRangeFromProducts } from '@/core/utils/priceDisplay';

export function catalogFinishName(wheel: {
  Finish?: string | null;
  Color?: string | null;
  Accent?: string | null;
}): string {
  const parts = [wheel.Finish, wheel.Color, wheel.Accent].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' ') : 'Standard';
}

export function wheelsForSeries(
  wheels: Array<{ Model: string }>,
  series: string
) {
  const seriesSlug = toSlug(series);
  return wheels.filter((wheel) => toSlug(wheel.Model) === seriesSlug);
}

export function wheelsMatchingFinish<
  T extends {
    Model: string;
    Finish?: string | null;
    Color?: string | null;
    Accent?: string | null;
    Price?: number | null;
  },
>(wheels: T[], series: string, finishSlug: string): T[] {
  const seriesWheels = wheelsForSeries(wheels, series) as T[];
  const want = finishSlug.toLowerCase();
  const exact = seriesWheels.filter((wheel) => toSlug(catalogFinishName(wheel)) === want);
  if (exact.length > 0) return exact;

  return seriesWheels.filter((wheel) => {
    const name = catalogFinishName(wheel).toLowerCase();
    return (
      (want.includes('titanium') && name.includes('gray') && name.includes('brushed')) ||
      (want.includes('gray') && name.includes('titanium') && name.includes('brushed'))
    );
  });
}

export function offerRangeFromProducts(
  products: Array<{ Price?: number | null }>
): { lowPrice: string; highPrice: string } | null {
  const range = priceRangeFromProducts(products);
  if (!range) return null;
  return {
    lowPrice: String(range.min),
    highPrice: String(range.max),
  };
}
