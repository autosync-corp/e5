/**
 * Parse generation and trim from vehicle data with smart defaults
 *
 * Default trim logic:
 * - C8 without specific trim → Stingray
 * - C7 without specific trim → Stingray
 * - C6 without specific trim → Base Model
 * - C5 without specific trim → Base Model
 *
 * Smart trim detection from vehicle names:
 * - ONLY extracts from vehicleTitle (ignores trim field due to data quality issues)
 * - Detects keywords: "Grand Sport", "Z06", "ZR1", "E-Ray", "Stingray"
 * - Validates that the detected trim is valid for the generation
 * - Example: "2017 C7 Corvette Grand Sport Collectors Edition" → "Grand Sport"
 * - Invalid example: "2006 C6 Grand Sport" → "Base Model" (Grand Sport invalid for 2006)
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
  'C6': 'Base Model',
  'C5': 'Base Model'
};

// Valid trims for each generation (matches VehicleSelector GENERATION_MAP)
const VALID_TRIMS: Record<string, string[]> = {
  'C8': ['Stingray', 'Z06', 'ZR1', 'E-Ray'],
  'C7': ['Stingray', 'Grand Sport', 'Z06', 'ZR1'],
  'C6': ['Base Model', 'Grand Sport', 'Z06', 'ZR1'],
  'C5': ['Base Model', 'Z06']
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
 * Validate if a trim is valid for a given generation
 */
function isValidTrimForGeneration(generation: string, trim: string): boolean {
  const validTrims = VALID_TRIMS[generation];
  if (!validTrims) return false;

  // Case-insensitive comparison
  return validTrims.some(validTrim =>
    validTrim.toLowerCase() === trim.toLowerCase()
  );
}

/**
 * Normalize trim name to match VehicleSelector options
 */
function normalizeTrim(_generation: string, trim: string): string {
  // Return trim as-is to match VehicleSelector labels exactly
  return trim;
}

/**
 * Parse generation and trim from vehicle data
 *
 * @param submodel - The vehicle submodel (e.g., "C8", "C7", "C6", "C5")
 * @param vehicleTitle - The full vehicle title (e.g., "2020 C8 Corvette 70th Anniversary Edition")
 * @param trim - The explicit trim field (IGNORED due to data quality issues)
 * @returns Parsed generation and trim information
 */
export function parseVehicleGenerationAndTrim(
  submodel: string | null,
  vehicleTitle: string | null,
  _trim: string | null
): ParsedVehicleInfo {
  // Extract generation from submodel
  const generation = submodel;

  if (!generation) {
    return { generation: null, trim: 'Base' };
  }

  // ONLY extract trim from vehicle title (ignore trim field due to data quality issues)
  let detectedTrim = vehicleTitle ? extractTrimFromText(vehicleTitle) : null;

  // Validate the detected trim is valid for this generation
  if (detectedTrim && !isValidTrimForGeneration(generation, detectedTrim)) {
    // Invalid trim for this generation, use default
    detectedTrim = null;
  }

  // If still no valid trim detected, use default for the generation
  if (!detectedTrim) {
    detectedTrim = DEFAULT_TRIMS[generation] || 'Base';
  }

  // Normalize trim name
  detectedTrim = normalizeTrim(generation, detectedTrim);

  return {
    generation,
    trim: detectedTrim
  };
}
