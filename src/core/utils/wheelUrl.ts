/**
 * Utility functions for building and parsing wheel product URLs
 */

/**
 * Converts a string to a URL-friendly slug
 * Examples:
 * - "Gloss Black" → "gloss-black"
 * - "Titanium Brushed Tint" → "titanium-brushed-tint"
 * - "C7 Z06" → "c7-z06"
 */
export function toSlug(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

/**
 * Converts a slug back to title case
 * Examples:
 * - "gloss-black" → "Gloss Black"
 * - "titanium-brushed-tint" → "Titanium Brushed Tint"
 */
export function fromSlug(slug: string | null | undefined): string {
  if (!slug) return '';

  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalizes wheel size format for URL
 * Examples:
 * - '19" x 10" +30mm' → '19x10-et30'
 * - '20" x 12" +50mm' → '20x12-et50'
 * - '19"x9"+35mm' → '19x9-et35'
 */
export function normalizeSizeForUrl(size: string | null | undefined): string {
  if (!size) return '';

  // Remove quotes and spaces first
  let normalized = size
    .replace(/"/g, '')              // Remove quotes
    .replace(/\s+/g, '')            // Remove spaces
    .replace(/x/gi, 'x')            // Normalize x
    .toLowerCase();

  // Handle offsets: +30mm → -et30, -25mm → -et-25
  normalized = normalized.replace(/([+-]\d+)mm/g, (_match, offset) => {
    if (offset.startsWith('+')) {
      return `-et${offset.substring(1)}`;
    } else {
      return `-et${offset}`;
    }
  });

  return normalized;
}

/**
 * Parses a size string from URL format back to display format
 * Examples:
 * - '19x10-et30' → '19" x 10" +30mm'
 * - '20x12-et50' → '20" x 12" +50mm'
 */
export function parseSizeFromUrl(urlSize: string | null | undefined): string {
  if (!urlSize) return '';

  // Split by 'et' to get size and offset
  const [sizepart, offset] = urlSize.split('-et');

  if (!sizepart) return '';

  // Split size part (e.g., '19x10')
  const [diameter, width] = sizepart.split('x');

  if (!diameter || !width) return '';

  // Build display format
  if (offset) {
    // Add + prefix for positive offsets, negative offsets already have -
    const offsetWithSign = offset.startsWith('-') ? offset : `+${offset}`;
    return `${diameter}" x ${width}" ${offsetWithSign}mm`;
  }

  return `${diameter}" x ${width}"`;
}

/**
 * Builds a staggered fitment string (front + rear)
 * Examples:
 * - front: '19x10-et30', rear: '20x12-et50' → '19x10-et30-20x12-et50'
 */
export function buildStaggeredSize(frontSize: string, rearSize: string): string {
  const normalizedFront = normalizeSizeForUrl(frontSize);
  const normalizedRear = normalizeSizeForUrl(rearSize);

  if (!normalizedFront && !normalizedRear) return '';
  if (!normalizedRear) return normalizedFront;
  if (!normalizedFront) return normalizedRear;

  return `${normalizedFront}-${normalizedRear}`;
}

/**
 * Parses staggered fitment string back to front/rear
 * Examples:
 * - '19x10-et30-20x12-et50' → { front: '19" x 10" +30mm', rear: '20" x 12" +50mm' }
 */
export function parseStaggeredSize(staggeredSize: string): { front: string; rear: string } {
  if (!staggeredSize) return { front: '', rear: '' };

  // Match pattern: {diameter}x{width}-et{offset}-{diameter}x{width}-et{offset}
  // Support decimal widths like 9.5, 10.5 and negative offsets
  const pattern = /^(\d+(?:\.\d+)?x\d+(?:\.\d+)?(?:-et-?\d+)?)-(\d+(?:\.\d+)?x\d+(?:\.\d+)?(?:-et-?\d+)?)$/;
  const match = staggeredSize.match(pattern);

  if (match) {
    return {
      front: parseSizeFromUrl(match[1]),
      rear: parseSizeFromUrl(match[2])
    };
  }

  // Fallback: try to parse as single size
  const parsed = parseSizeFromUrl(staggeredSize);
  return { front: parsed, rear: '' };
}

/**
 * Combines generation and trim into vehicle slug
 * Examples:
 * - generation: 'C7', trim: 'Z06' → 'c7-z06'
 * - generation: 'C8', trim: 'Stingray' → 'c8-stingray'
 */
export function buildVehicleSlug(generation: string, trim: string): string {
  if (!generation && !trim) return '';
  if (!trim) return toSlug(generation);
  if (!generation) return toSlug(trim);

  return `${toSlug(generation)}-${toSlug(trim)}`;
}

/**
 * Parses vehicle slug back to generation and trim
 * Examples:
 * - 'c7-z06' → { generation: 'C7', trim: 'Z06' }
 * - 'c8-stingray' → { generation: 'C8', trim: 'Stingray' }
 */
export function parseVehicleSlug(vehicleSlug: string): { generation: string; trim: string } {
  if (!vehicleSlug) return { generation: '', trim: '' };

  const parts = vehicleSlug.split('-');

  if (parts.length < 2) {
    return { generation: fromSlug(parts[0] || ''), trim: '' };
  }

  // First part is generation (C5, C6, C7, C8)
  const generation = (parts[0] || '').toUpperCase();

  // Rest is trim
  const trim = fromSlug(parts.slice(1).join('-'));

  return { generation, trim };
}

/**
 * Builds the new wheel product URL
 *
 * @param series - Wheel series (e.g., "Daytona", "Speedway")
 * @param finish - Wheel finish (e.g., "Gloss Black", "Titanium Brushed Tint")
 * @param generation - Optional Corvette generation (e.g., "C7", "C8")
 * @param trim - Optional Corvette trim (e.g., "Z06", "Stingray")
 * @param frontSize - Optional front wheel size (e.g., '19" x 10" +30mm')
 * @param rearSize - Optional rear wheel size (e.g., '20" x 12" +50mm')
 * @returns URL path like "/shop/daytona/gloss-black" or "/shop/daytona/gloss-black/c7-z06/19x10-et30-20x12-et50"
 */
export function buildWheelUrl(
  series: string,
  finish: string,
  generation?: string,
  trim?: string,
  frontSize?: string,
  rearSize?: string
): string {
  const seriesSlug = toSlug(series);
  const finishSlug = toSlug(finish);

  if (!seriesSlug || !finishSlug) {
    return '/shop';
  }

  let url = `/shop/${seriesSlug}/${finishSlug}`;

  // Add vehicle if provided
  if (generation || trim) {
    const vehicleSlug = buildVehicleSlug(generation || '', trim || '');
    if (vehicleSlug) {
      url += `/${vehicleSlug}`;
    }
  }

  // Add sizes if provided
  if (frontSize || rearSize) {
    const sizeSlug = buildStaggeredSize(frontSize || '', rearSize || '');
    if (sizeSlug) {
      url += `/${sizeSlug}`;
    }
  }

  return url;
}

/**
 * Parses a wheel URL back into its components
 *
 * @param url - URL path like "/wheels/daytona/gloss-black/c7-z06/19x10-et30-20x12-et50"
 * @returns Object with series, finish, generation, trim, frontSize, rearSize
 */
export function parseWheelUrl(url: string): {
  series: string;
  finish: string;
  generation?: string;
  trim?: string;
  frontSize?: string;
  rearSize?: string;
} {
  // Remove leading/trailing slashes and split
  const parts = url.replace(/^\/|\/$/g, '').split('/');

  // Expected format: shop / series / finish / [vehicle] / [size]
  if (parts.length < 3 || parts[0] !== 'shop') {
    return { series: '', finish: '' };
  }

  const result = {
    series: fromSlug(parts[1]),
    finish: fromSlug(parts[2]),
    generation: undefined as string | undefined,
    trim: undefined as string | undefined,
    frontSize: undefined as string | undefined,
    rearSize: undefined as string | undefined,
  };

  // Parse optional vehicle (4th segment)
  if (parts[3]) {
    // Check if it looks like a size (contains 'x' and numbers, including decimals)
    if (/^\d+(?:\.\d+)?x\d+(?:\.\d+)?/.test(parts[3])) {
      // It's a size, not a vehicle
      const sizes = parseStaggeredSize(parts[3]);
      result.frontSize = sizes.front;
      result.rearSize = sizes.rear;
    } else {
      // It's a vehicle
      const vehicle = parseVehicleSlug(parts[3]);
      result.generation = vehicle.generation;
      result.trim = vehicle.trim;

      // Parse optional size (5th segment)
      if (parts[4]) {
        const sizes = parseStaggeredSize(parts[4]);
        result.frontSize = sizes.front;
        result.rearSize = sizes.rear;
      }
    }
  }

  return result;
}

/**
 * Builds a wheel URL from query parameters (for backwards compatibility)
 * Used to convert old ?series=X&finish=Y URLs to new format
 */
export function buildWheelUrlFromParams(params: URLSearchParams): string {
  const series = params.get('series') || '';
  const finish = params.get('finish') || '';
  const generation = params.get('generation') || undefined;
  const trim = params.get('trim') || undefined;
  const frontSize = params.get('frontSize') || undefined;
  const rearSize = params.get('rearSize') || undefined;

  return buildWheelUrl(series, finish, generation, trim, frontSize, rearSize);
}
