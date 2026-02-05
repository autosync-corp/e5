/**
 * Parse generation and trim from vehicle data with smart defaults
 *
 * Default trim logic:
 * - C8 without specific trim → Stingray
 * - C7 without specific trim → Stingray
 * - C6 without specific trim → Base
 * - C5 without specific trim → Base
 *
 * Smart trim detection from vehicle names:
 * - Detects keywords: "Grand Sport", "Z06", "ZR1", "E-Ray", "Stingray"
 * - Example: "2017 C7 Corvette Grand Sport Collectors Edition" → "Grand Sport"
 */

interface ParsedVehicleInfo {
  generation: string | null;
  trim: string;
}

const TRIM_KEYWORDS = [
  'Grand Sport',
  'Z06',
  'ZR1',
  'E-Ray',
  'Stingray'
] as const;

const DEFAULT_TRIMS: Record<string, string> = {
  'C8': 'Stingray',
  'C7': 'Stingray',
  'C6': 'Base',
  'C5': 'Base'
};

/**
 * Extract trim from vehicle title or trim field
 */
function extractTrimFromText(text: string): string | null {
  if (!text) return null;

  // Check for each trim keyword in the text
  for (const trimKeyword of TRIM_KEYWORDS) {
    // Case-insensitive search
    const regex = new RegExp(trimKeyword, 'i');
    if (regex.test(text)) {
      return trimKeyword;
    }
  }

  return null;
}

/**
 * Parse generation and trim from vehicle data
 *
 * @param submodel - The vehicle submodel (e.g., "C8", "C7", "C6", "C5")
 * @param vehicleTitle - The full vehicle title (e.g., "2020 C8 Corvette 70th Anniversary Edition")
 * @param trim - The explicit trim field (if available)
 * @returns Parsed generation and trim information
 */
export function parseVehicleGenerationAndTrim(
  submodel: string | null,
  vehicleTitle: string | null,
  trim: string | null
): ParsedVehicleInfo {
  // Extract generation from submodel
  const generation = submodel;

  if (!generation) {
    return { generation: null, trim: 'Base' };
  }

  // Try to extract trim from explicit trim field first
  let detectedTrim = trim ? extractTrimFromText(trim) : null;

  // If not found in trim field, try vehicle title
  if (!detectedTrim && vehicleTitle) {
    detectedTrim = extractTrimFromText(vehicleTitle);
  }

  // If still no trim detected, use default for the generation
  if (!detectedTrim) {
    detectedTrim = DEFAULT_TRIMS[generation] || 'Base';
  }

  return {
    generation,
    trim: detectedTrim
  };
}
