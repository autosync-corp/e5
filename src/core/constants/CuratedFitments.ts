/**
 * E5 Wheels Curated Fitment Specifications
 *
 * These are the exact, approved fitments for each Corvette generation/trim.
 * When a vehicle matches this list, ONLY these options are shown.
 * API fallback is used only for vehicles NOT in this list.
 */

export interface FitmentSpec {
  diameter: number;
  width: number;
  offset: number;
  boltPattern: string;
}

export interface VehicleFitment {
  front: FitmentSpec;
  rear: FitmentSpec;
}

export interface CuratedFitmentEntry {
  generation: string;
  trims: string[]; // Multiple trims can share the same fitment
  options: VehicleFitment[]; // Multiple fitment options for the same vehicle
}

/**
 * E5 Wheels Curated Fitment Database
 * Priority: These fitments take precedence over API data
 */
export const CURATED_FITMENTS: CuratedFitmentEntry[] = [
  // C8 Z06, ZR1, and E-Ray
  {
    generation: 'C8',
    trims: ['Z06', 'ZR1', 'ZR-1', 'E-Ray'],
    options: [
      {
        front: { diameter: 20, width: 10, offset: 25, boltPattern: '5x120' },
        rear: { diameter: 21, width: 13, offset: 20, boltPattern: '5x120' }
      }
    ]
  },

  // C8 Stingray (2 options)
  {
    generation: 'C8',
    trims: ['Stingray', 'Base'],
    options: [
      {
        front: { diameter: 19, width: 9, offset: 35, boltPattern: '5x120' },
        rear: { diameter: 20, width: 11, offset: 45, boltPattern: '5x120' }
      },
      {
        front: { diameter: 20, width: 9, offset: 35, boltPattern: '5x120' },
        rear: { diameter: 21, width: 12, offset: 52, boltPattern: '5x120' }
      }
    ]
  },

  // C7 Z06 and Grand Sport
  {
    generation: 'C7',
    trims: ['Z06', 'Grand Sport'],
    options: [
      {
        front: { diameter: 19, width: 10, offset: 30, boltPattern: '5x120.65' },
        rear: { diameter: 20, width: 12, offset: 50, boltPattern: '5x120.65' }
      }
    ]
  },

  // C7 Stingray
  {
    generation: 'C7',
    trims: ['Stingray', 'Base'],
    options: [
      {
        front: { diameter: 19, width: 9.5, offset: 53, boltPattern: '5x120.65' },
        rear: { diameter: 20, width: 11, offset: 76, boltPattern: '5x120.65' }
      }
    ]
  },

  // C6 Z06 and Grand Sport
  {
    generation: 'C6',
    trims: ['Z06', 'Grand Sport'],
    options: [
      {
        front: { diameter: 19, width: 10, offset: 30, boltPattern: '5x120.65' },
        rear: { diameter: 20, width: 12, offset: 50, boltPattern: '5x120.65' }
      }
    ]
  },

  // C6 Base
  {
    generation: 'C6',
    trims: ['Base'],
    options: [
      {
        front: { diameter: 19, width: 9.5, offset: 53, boltPattern: '5x120.65' },
        rear: { diameter: 20, width: 11, offset: 76, boltPattern: '5x120.65' }
      }
    ]
  },

  // C5 Base Coupe and Z06
  {
    generation: 'C5',
    trims: ['Base', 'Z06'],
    options: [
      {
        front: { diameter: 18, width: 10, offset: 58, boltPattern: '5x120.65' },
        rear: { diameter: 19, width: 11, offset: 59, boltPattern: '5x120.65' }
      }
    ]
  }
];

/**
 * Get curated fitment for a specific generation and trim
 * Returns null if no curated fitment exists (triggers API fallback)
 */
export function getCuratedFitment(generation: string, trim: string): VehicleFitment[] | null {
  if (!generation || !trim) return null;

  // Normalize inputs for comparison
  const normalizedGen = generation.toUpperCase();
  const normalizedTrim = trim.toLowerCase();

  // Find matching entry
  const entry = CURATED_FITMENTS.find(fitment => {
    const genMatch = fitment.generation.toUpperCase() === normalizedGen;
    const trimMatch = fitment.trims.some(t => t.toLowerCase() === normalizedTrim);
    return genMatch && trimMatch;
  });

  return entry ? entry.options : null;
}

/**
 * Check if a vehicle has curated fitment data
 */
export function hasCuratedFitment(generation: string, trim: string): boolean {
  return getCuratedFitment(generation, trim) !== null;
}

/**
 * Wheel series that are explicitly excluded from specific vehicles.
 * These override fitment logic regardless of size/spec compatibility.
 */
export const WHEEL_SERIES_EXCLUSIONS: Record<string, { generation: string; trims: string[] }[]> = {
  'sebring 2p': [
    { generation: 'C8', trims: ['ZR1', 'ZR-1'] }
  ]
};

/**
 * Check if a wheel series is excluded for a specific vehicle generation/trim.
 * Returns true if the wheel should NOT be shown as compatible.
 */
export function isWheelExcludedForVehicle(seriesSlug: string, generation: string, trim: string): boolean {
  const exclusions = WHEEL_SERIES_EXCLUSIONS[seriesSlug.toLowerCase()];
  if (!exclusions) return false;

  const normalizedTrim = trim.toLowerCase();
  return exclusions.some(exclusion =>
    exclusion.generation.toUpperCase() === generation.toUpperCase() &&
    exclusion.trims.some(t => t.toLowerCase() === normalizedTrim)
  );
}

/**
 * Format fitment spec as display string (e.g., "20\" x 10\" +25mm")
 */
export function formatFitmentSpec(spec: FitmentSpec): string {
  const offset = spec.offset >= 0 ? `+${spec.offset}` : `${spec.offset}`;
  return `${spec.diameter}" x ${spec.width}" ${offset}mm`;
}
