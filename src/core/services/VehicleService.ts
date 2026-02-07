// Vehicle Service for E5 Wheels Vehicle Fitment API

const API_BASE_URL = 'https://api.autosyncstudio.com/vehicles';
const API_KEY = 'efive';

export interface VehicleFitment {
  RimDiameter: number | null;
  RimWidth: number | null;
  RimWidthMin: number | null;
  RimWidthMax: number | null;
  MinOffset: number | null;
  MaxOffset: number | null;
  Position: string | null; // 'Front', 'Rear', or null for non-staggered (used in Fitments and OptionalFitments)
  Type: string | null; // 'F' (Front), 'R' (Rear), or null (used in PlusSizes)
}

export interface Vehicle {
  Id: number;
  Year: number;
  Make: string;
  Model: string;
  Submodel: string;
  Body: string | null;
  Bed: string | null;
  Doors: number | null;
  LugCount: number;
  BoltCircle: number;
  Bore: number;
  MaxWheelLoad: number;
  Fitments: VehicleFitment[];
  OptionalFitments: VehicleFitment[];
  PlusSizes: VehicleFitment[];
}

export interface VehicleApiResponse {
  Vehicles: Vehicle[];
}

export interface WheelFitmentResult {
  fits: boolean;
  reasons: string[];
  matchedFitment?: VehicleFitment;
  fitmentType?: 'standard' | 'optional' | 'plus';
  position?: 'Front' | 'Rear' | null;
}

export interface StaggeredFitmentResult {
  frontFits: boolean;
  rearFits: boolean;
  frontReasons: string[];
  rearReasons: string[];
  frontMatchedFitment?: VehicleFitment;
  rearMatchedFitment?: VehicleFitment;
  fitmentType?: 'standard' | 'optional' | 'plus';
}

/**
 * Fetch vehicle by ID with all fitment data
 */
export async function fetchVehicleById(vehicleId: number): Promise<Vehicle | null> {
  const params = new URLSearchParams({
    key: API_KEY,
    'f-id': vehicleId.toString(),
    'i-fitments': 'true',
    'i-optionalFitments': 'true',
    'i-plusSizes': 'true',
    'i-tags': 'true',
  });

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Vehicle API error: ${response.status}`);
    }
    const data: VehicleApiResponse = await response.json();
    return data.Vehicles.length > 0 ? data.Vehicles[0] : null;
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    return null;
  }
}

/**
 * Fetch vehicle by query string (Year Make Model Submodel Body Bed Doors)
 * If multiple vehicles return, picks the first
 */
export async function fetchVehicleByQuery(query: string): Promise<Vehicle | null> {
  const params = new URLSearchParams({
    key: API_KEY,
    'f-query': query,
    'i-fitments': 'true',
    'i-optionalFitments': 'true',
    'i-plusSizes': 'true',
    'i-tags': 'true',
  });

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Vehicle API error: ${response.status}`);
    }
    const data: VehicleApiResponse = await response.json();
    // If multiple vehicles return, pick the first
    return data.Vehicles.length > 0 ? data.Vehicles[0] : null;
  } catch (error) {
    console.error('Error fetching vehicle by query:', error);
    return null;
  }
}

/**
 * Search vehicles by year, make, model, submodel
 */
export async function searchVehicles(
  year: number,
  make: string,
  model: string,
  submodel?: string
): Promise<Vehicle | null> {
  const queryParts = [year.toString(), make, model];
  if (submodel) {
    queryParts.push(submodel);
  }
  const query = queryParts.join(' ');
  return fetchVehicleByQuery(query);
}

/**
 * Check if vehicle has staggered fitment (different front/rear sizes)
 * Checks Position field in Fitments/OptionalFitments and Type field in PlusSizes
 */
export function hasStaggeredFitment(vehicle: Vehicle): boolean {
  const allFitments = [
    ...vehicle.Fitments,
    ...vehicle.OptionalFitments,
    ...vehicle.PlusSizes
  ];
  return allFitments.some(f =>
    f.Position === 'Front' ||
    f.Position === 'Rear' ||
    f.Type === 'F' ||
    f.Type === 'R'
  );
}

/**
 * Get front fitments from vehicle
 * Uses Position field for Fitments/OptionalFitments and Type='F' for PlusSizes
 */
export function getFrontFitments(vehicle: Vehicle): VehicleFitment[] {
  return [
    ...vehicle.Fitments.filter(f => f.Position === 'Front'),
    ...vehicle.OptionalFitments.filter(f => f.Position === 'Front'),
    ...vehicle.PlusSizes.filter(f => f.Type === 'F'),
  ];
}

/**
 * Get rear fitments from vehicle
 * Uses Position field for Fitments/OptionalFitments and Type='R' for PlusSizes
 */
export function getRearFitments(vehicle: Vehicle): VehicleFitment[] {
  return [
    ...vehicle.Fitments.filter(f => f.Position === 'Rear'),
    ...vehicle.OptionalFitments.filter(f => f.Position === 'Rear'),
    ...vehicle.PlusSizes.filter(f => f.Type === 'R'),
  ];
}

/**
 * Check if wheel matches vehicle lug count
 */
function checkLugCount(wheelLugCount: number, vehicleLugCount: number): boolean {
  return wheelLugCount === vehicleLugCount;
}

/**
 * Check if wheel bolt circle matches vehicle bolt circle (exact match required)
 */
function checkBoltCircle(
  wheelBoltCircle1: number,
  wheelBoltCircle2: number,
  vehicleBoltCircle: number
): boolean {
  // Exact match required - no tolerance
  return wheelBoltCircle1 === vehicleBoltCircle || wheelBoltCircle2 === vehicleBoltCircle;
}

/**
 * Check if wheel bore is compatible with vehicle bore (wheel bore must be >= vehicle bore)
 */
function checkBore(wheelBore: number | null, vehicleBore: number | null): boolean {
  // If either is missing/null, treat as "unknown" (pass)
  if (wheelBore === null || vehicleBore === null) {
    return true;
  }
  // Wheel bore must be equal or larger than vehicle bore
  return wheelBore >= vehicleBore;
}

/**
 * Check if wheel load rating meets or exceeds vehicle requirement
 */
function checkLoadRating(wheelLoadRating: number | null, vehicleMaxWheelLoad: number | null): boolean {
  // If either is missing/null, treat as "unknown" (pass)
  if (wheelLoadRating === null || vehicleMaxWheelLoad === null) {
    return true;
  }
  // Wheel load rating must be equal or higher
  return wheelLoadRating >= vehicleMaxWheelLoad;
}

/**
 * Check if wheel size matches a specific fitment entry
 */
function checkFitmentSize(
  wheelDiameter: number,
  wheelWidth: number,
  wheelOffset: number,
  fitment: VehicleFitment
): boolean {
  // Check diameter - must match exactly
  if (fitment.RimDiameter !== null && fitment.RimDiameter !== undefined && wheelDiameter !== fitment.RimDiameter) {
    return false;
  }

  // Check width (range or exact) with ±0.5" tolerance
  const WIDTH_TOLERANCE = 0.5; // ±0.5" tolerance

  if (fitment.RimWidthMin !== null && fitment.RimWidthMin !== undefined &&
      fitment.RimWidthMax !== null && fitment.RimWidthMax !== undefined) {
    // Width range provided - extend range by tolerance
    const minWidthWithTolerance = fitment.RimWidthMin - WIDTH_TOLERANCE;
    const maxWidthWithTolerance = fitment.RimWidthMax + WIDTH_TOLERANCE;

    if (wheelWidth < minWidthWithTolerance || wheelWidth > maxWidthWithTolerance) {
      return false;
    }
  } else if (fitment.RimWidth !== null && fitment.RimWidth !== undefined) {
    // Exact width provided - check with tolerance
    const widthDiff = Math.abs(wheelWidth - fitment.RimWidth);
    if (widthDiff > WIDTH_TOLERANCE) {
      return false;
    }
  }

  // Offset check is OPTIONAL - we don't validate offset
  // This allows wheels with any offset to fit as long as diameter and width match
  wheelOffset;

  return true;
}

/**
 * Main function to check if a wheel fits a vehicle
 * Returns detailed fitment result with reasons
 */
export function checkWheelFitment(
  wheel: {
    LugCount: number;
    BoltCircle1: number;
    BoltCircle2: number;
    Bore: number | null;
    LoadRating: number | null;
    Diameter: number;
    Width: number;
    Offset: number;
  },
  vehicle: Vehicle
): WheelFitmentResult {
  const reasons: string[] = [];

  // Rule A1: Check lug count
  if (!checkLugCount(wheel.LugCount, vehicle.LugCount)) {
    reasons.push(`Lug count mismatch: wheel has ${wheel.LugCount}, vehicle requires ${vehicle.LugCount}`);
    return { fits: false, reasons };
  }

  // Rule A2: Check bolt circle
  if (!checkBoltCircle(wheel.BoltCircle1, wheel.BoltCircle2, vehicle.BoltCircle)) {
    reasons.push(
      `Bolt circle mismatch: wheel has ${wheel.BoltCircle1}${wheel.BoltCircle2 ? `/${wheel.BoltCircle2}` : ''}, vehicle requires ${vehicle.BoltCircle}`
    );
    return { fits: false, reasons };
  }

  // Rule A3: Check bore
  if (!checkBore(wheel.Bore, vehicle.Bore)) {
    reasons.push(
      `Bore too small: wheel has ${wheel.Bore}mm, vehicle requires ${vehicle.Bore}mm (minimum)`
    );
    return { fits: false, reasons };
  }

  // Rule A4: Check load rating
  if (!checkLoadRating(wheel.LoadRating, vehicle.MaxWheelLoad)) {
    reasons.push(
      `Load rating insufficient: wheel rated for ${wheel.LoadRating}lbs, vehicle requires ${vehicle.MaxWheelLoad}lbs`
    );
    return { fits: false, reasons };
  }

  // Rule B: Check size compatibility against fitment sets
  // Try standard fitments first
  for (const fitment of vehicle.Fitments) {
    if (checkFitmentSize(wheel.Diameter, wheel.Width, wheel.Offset, fitment)) {
      reasons.push('Matches standard fitment');
      return {
        fits: true,
        reasons,
        matchedFitment: fitment,
        fitmentType: 'standard',
      };
    }
  }

  // Try optional fitments
  for (const fitment of vehicle.OptionalFitments) {
    if (checkFitmentSize(wheel.Diameter, wheel.Width, wheel.Offset, fitment)) {
      reasons.push('Matches optional fitment');
      return {
        fits: true,
        reasons,
        matchedFitment: fitment,
        fitmentType: 'optional',
      };
    }
  }

  // Try plus sizes
  for (const fitment of vehicle.PlusSizes) {
    if (checkFitmentSize(wheel.Diameter, wheel.Width, wheel.Offset, fitment)) {
      reasons.push('Matches plus size fitment');
      return {
        fits: true,
        reasons,
        matchedFitment: fitment,
        fitmentType: 'plus',
      };
    }
  }

  // No fitment match found
  reasons.push(
    `Size incompatible: ${wheel.Diameter}" x ${wheel.Width}" with ${wheel.Offset > 0 ? '+' : ''}${wheel.Offset}mm offset does not match any fitment`
  );
  return { fits: false, reasons };
}

/**
 * Check staggered fitment with separate front and rear wheels
 */
export function checkStaggeredFitment(
  frontWheel: {
    LugCount: number;
    BoltCircle1: number;
    BoltCircle2: number;
    Bore: number | null;
    LoadRating: number | null;
    Diameter: number;
    Width: number;
    Offset: number;
  },
  rearWheel: {
    LugCount: number;
    BoltCircle1: number;
    BoltCircle2: number;
    Bore: number | null;
    LoadRating: number | null;
    Diameter: number;
    Width: number;
    Offset: number;
  },
  vehicle: Vehicle
): StaggeredFitmentResult {
  const frontReasons: string[] = [];
  const rearReasons: string[] = [];

  // Check Rule A for both wheels (lug count, bolt circle, bore, load rating must be same for front and rear)

  // Front wheel Rule A checks
  if (!checkLugCount(frontWheel.LugCount, vehicle.LugCount)) {
    frontReasons.push(`Front: Lug count mismatch - wheel has ${frontWheel.LugCount}, vehicle requires ${vehicle.LugCount}`);
  }
  if (!checkBoltCircle(frontWheel.BoltCircle1, frontWheel.BoltCircle2, vehicle.BoltCircle)) {
    frontReasons.push(`Front: Bolt circle mismatch - wheel has ${frontWheel.BoltCircle1}${frontWheel.BoltCircle2 ? `/${frontWheel.BoltCircle2}` : ''}, vehicle requires ${vehicle.BoltCircle}`);
  }
  if (!checkBore(frontWheel.Bore, vehicle.Bore)) {
    frontReasons.push(`Front: Bore too small - wheel has ${frontWheel.Bore}mm, vehicle requires ${vehicle.Bore}mm (minimum)`);
  }
  if (!checkLoadRating(frontWheel.LoadRating, vehicle.MaxWheelLoad)) {
    frontReasons.push(`Front: Load rating insufficient - wheel rated for ${frontWheel.LoadRating}lbs, vehicle requires ${vehicle.MaxWheelLoad}lbs`);
  }

  // Rear wheel Rule A checks
  if (!checkLugCount(rearWheel.LugCount, vehicle.LugCount)) {
    rearReasons.push(`Rear: Lug count mismatch - wheel has ${rearWheel.LugCount}, vehicle requires ${vehicle.LugCount}`);
  }
  if (!checkBoltCircle(rearWheel.BoltCircle1, rearWheel.BoltCircle2, vehicle.BoltCircle)) {
    rearReasons.push(`Rear: Bolt circle mismatch - wheel has ${rearWheel.BoltCircle1}${rearWheel.BoltCircle2 ? `/${rearWheel.BoltCircle2}` : ''}, vehicle requires ${vehicle.BoltCircle}`);
  }
  if (!checkBore(rearWheel.Bore, vehicle.Bore)) {
    rearReasons.push(`Rear: Bore too small - wheel has ${rearWheel.Bore}mm, vehicle requires ${vehicle.Bore}mm (minimum)`);
  }
  if (!checkLoadRating(rearWheel.LoadRating, vehicle.MaxWheelLoad)) {
    rearReasons.push(`Rear: Load rating insufficient - wheel rated for ${rearWheel.LoadRating}lbs, vehicle requires ${vehicle.MaxWheelLoad}lbs`);
  }

  // If Rule A fails for either wheel, return failure
  if (frontReasons.length > 0 || rearReasons.length > 0) {
    return {
      frontFits: frontReasons.length === 0,
      rearFits: rearReasons.length === 0,
      frontReasons,
      rearReasons,
    };
  }

  // Check Rule B: Size compatibility for front and rear separately
  let frontMatched = false;
  let rearMatched = false;
  let frontMatchedFitment: VehicleFitment | undefined;
  let rearMatchedFitment: VehicleFitment | undefined;

  // Try standard fitments
  const frontStandard = vehicle.Fitments.filter(f => f.Position === 'Front');
  const rearStandard = vehicle.Fitments.filter(f => f.Position === 'Rear');

  for (const fitment of frontStandard) {
    if (checkFitmentSize(frontWheel.Diameter, frontWheel.Width, frontWheel.Offset, fitment)) {
      frontMatched = true;
      frontMatchedFitment = fitment;
      break;
    }
  }

  for (const fitment of rearStandard) {
    if (checkFitmentSize(rearWheel.Diameter, rearWheel.Width, rearWheel.Offset, fitment)) {
      rearMatched = true;
      rearMatchedFitment = fitment;
      break;
    }
  }

  if (frontMatched && rearMatched) {
    frontReasons.push('Front: Matches standard fitment');
    rearReasons.push('Rear: Matches standard fitment');
    return {
      frontFits: true,
      rearFits: true,
      frontReasons,
      rearReasons,
      frontMatchedFitment,
      rearMatchedFitment,
      fitmentType: 'standard',
    };
  }

  // Try optional fitments
  const frontOptional = vehicle.OptionalFitments.filter(f => f.Position === 'Front');
  const rearOptional = vehicle.OptionalFitments.filter(f => f.Position === 'Rear');

  if (!frontMatched) {
    for (const fitment of frontOptional) {
      if (checkFitmentSize(frontWheel.Diameter, frontWheel.Width, frontWheel.Offset, fitment)) {
        frontMatched = true;
        frontMatchedFitment = fitment;
        break;
      }
    }
  }

  if (!rearMatched) {
    for (const fitment of rearOptional) {
      if (checkFitmentSize(rearWheel.Diameter, rearWheel.Width, rearWheel.Offset, fitment)) {
        rearMatched = true;
        rearMatchedFitment = fitment;
        break;
      }
    }
  }

  if (frontMatched && rearMatched) {
    frontReasons.push('Front: Matches optional fitment');
    rearReasons.push('Rear: Matches optional fitment');
    return {
      frontFits: true,
      rearFits: true,
      frontReasons,
      rearReasons,
      frontMatchedFitment,
      rearMatchedFitment,
      fitmentType: 'optional',
    };
  }

  // Try plus sizes (use Type field: 'F' for Front, 'R' for Rear)
  const frontPlus = vehicle.PlusSizes.filter(f => f.Type === 'F');
  const rearPlus = vehicle.PlusSizes.filter(f => f.Type === 'R');

  if (!frontMatched) {
    for (const fitment of frontPlus) {
      if (checkFitmentSize(frontWheel.Diameter, frontWheel.Width, frontWheel.Offset, fitment)) {
        frontMatched = true;
        frontMatchedFitment = fitment;
        break;
      }
    }
  }

  if (!rearMatched) {
    for (const fitment of rearPlus) {
      if (checkFitmentSize(rearWheel.Diameter, rearWheel.Width, rearWheel.Offset, fitment)) {
        rearMatched = true;
        rearMatchedFitment = fitment;
        break;
      }
    }
  }

  if (frontMatched && rearMatched) {
    frontReasons.push('Front: Matches plus size fitment');
    rearReasons.push('Rear: Matches plus size fitment');
    return {
      frontFits: true,
      rearFits: true,
      frontReasons,
      rearReasons,
      frontMatchedFitment,
      rearMatchedFitment,
      fitmentType: 'plus',
    };
  }

  // No match found
  if (!frontMatched) {
    frontReasons.push(`Front: Size incompatible - ${frontWheel.Diameter}" x ${frontWheel.Width}" with ${frontWheel.Offset > 0 ? '+' : ''}${frontWheel.Offset}mm offset does not match any fitment`);
  }
  if (!rearMatched) {
    rearReasons.push(`Rear: Size incompatible - ${rearWheel.Diameter}" x ${rearWheel.Width}" with ${rearWheel.Offset > 0 ? '+' : ''}${rearWheel.Offset}mm offset does not match any fitment`);
  }

  return {
    frontFits: frontMatched,
    rearFits: rearMatched,
    frontReasons,
    rearReasons,
    frontMatchedFitment,
    rearMatchedFitment,
  };
}

/**
 * Filter wheels array to only those that fit the vehicle
 */
export function filterWheelsByVehicle<T extends {
  LugCount: number;
  BoltCircle1: number;
  BoltCircle2: number;
  Bore: number | null;
  LoadRating: number | null;
  Diameter: number;
  Width: number;
  Offset: number;
}>(wheels: T[], vehicle: Vehicle): T[] {
  return wheels.filter(wheel => {
    const result = checkWheelFitment(wheel, vehicle);
    return result.fits;
  });
}
