<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fetchWheels, getWheelImageUrl, formatPrice, CartManager, type WheelProduct, type WheelsApiResponse } from '@/core/services/ProductService';
import { CART_ROUTE, SHOP_ROUTE, PROCESS_FORM_FORGED_ROUTE, PROCESS_FORGED_ROUTE } from '@/core/constants/Routes';
import { checkWheelFitment, checkStaggeredFitment, hasStaggeredFitment, getFrontFitments, getRearFitments, type Vehicle } from '@/core/services/VehicleService';
import VehicleSelector from '@/core/components/VehicleSelector.vue';
import { getCuratedFitment, hasCuratedFitment, formatFitmentSpec, isWheelExcludedForVehicle, type VehicleFitment } from '@/core/constants/CuratedFitments';

// Props
const props = defineProps<{
  productId?: number;
  modelParam?: string;
  seriesParam?: string;
  finishParam?: string;
  generationParam?: string;
  trimParam?: string;
  frontSizeParam?: string;
  rearSizeParam?: string;
}>();

// Get product ID from URL if not provided as prop
const getProductIdFromUrl = (): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id ? parseInt(id, 10) : undefined;
};

const getUrlParams = () => {
  // First, try to use props (from new URL structure)
  if (props.seriesParam || props.finishParam) {
    return {
      series: props.seriesParam || null,
      finish: props.finishParam || null,
      generation: props.generationParam || null,
      trim: props.trimParam || null,
      frontSize: props.frontSizeParam || null,
      rearSize: props.rearSizeParam || null
    };
  }

  // Fall back to query parameters (old URL structure for backwards compatibility)
  if (typeof window === 'undefined') return { series: null, finish: null, generation: null, trim: null, frontSize: null, rearSize: null };
  const params = new URLSearchParams(window.location.search);
  return {
    series: params.get('series'),
    finish: params.get('finish'),
    generation: params.get('generation'),
    trim: params.get('trim'),
    frontSize: params.get('frontSize'),
    rearSize: params.get('rearSize')
  };
};

const actualProductId = computed(() => props.productId || getProductIdFromUrl());

// State
const apiResponse = ref<WheelsApiResponse | null>(null);
const selectedProduct = ref<WheelProduct | null>(null);
const selectedFrontProduct = ref<WheelProduct | null>(null);
const selectedRearProduct = ref<WheelProduct | null>(null);
const selectedModel = ref('');
const selectedSize = ref('');
const selectedFinish = ref('');
const selectedOffset = ref('');
const selectedSizeOffset = ref(''); // Combined size+offset for non-staggered
const selectedFrontSizeOffset = ref(''); // Combined size+offset for front
const selectedRearSizeOffset = ref(''); // Combined size+offset for rear
const currentImageIndex = ref(0);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedVehicle = ref<Vehicle | null>(null);
const vehicleDisplayFormat = ref<string | null>(null);

// Extract URL params for generation, trim, and sizes
const urlParams = getUrlParams();
const initialGeneration = ref(urlParams.generation);
const initialTrim = ref(urlParams.trim);
const initialFrontSize = ref(urlParams.frontSize);
const initialRearSize = ref(urlParams.rearSize);

// Helper function to check if a size matches with width and offset tolerance
// Width: Allows up to 0.5" narrower than target, but not wider
// Offset: Allows ±3mm tolerance
const matchesSizeWithTolerance = (targetSize: string, availableSize: string): boolean => {
  // Parse target size (e.g., "19\" x 9\" +35mm")
  const targetMatch = targetSize.match(/(\d+\.?\d*)"\s*x\s*(\d+\.?\d*)"\s*([-+]\d+)mm/);
  const availableMatch = availableSize.match(/(\d+\.?\d*)"\s*x\s*(\d+\.?\d*)"\s*([-+]\d+)mm/);

  if (!targetMatch || !availableMatch) return false;

  const targetDiameter = parseFloat(targetMatch[1]);
  const targetWidth = parseFloat(targetMatch[2]);
  const targetOffset = parseInt(targetMatch[3]);

  const availableDiameter = parseFloat(availableMatch[1]);
  const availableWidth = parseFloat(availableMatch[2]);
  const availableOffset = parseInt(availableMatch[3]);

  // Diameter must match exactly
  if (targetDiameter !== availableDiameter) {
    return false;
  }

  // Width can differ by up to 0.5" in either direction,
  // but must stay within the same whole number (e.g., 9.x cannot become 10.x or 8.x)
  // Examples: 9" matches 9" and 9.5", 9.5" matches 9" and 9.5", but not 10" or 8.5"
  const widthDiff = Math.abs(availableWidth - targetWidth);
  const targetWholeNumber = Math.floor(targetWidth);
  const availableWholeNumber = Math.floor(availableWidth);

  if (widthDiff > 0.5 || targetWholeNumber !== availableWholeNumber) {
    return false;
  }

  // Offset can be ±3mm
  const offsetDiff = Math.abs(targetOffset - availableOffset);
  return offsetDiff <= 3;
};

// Storage key for localStorage
const VEHICLE_STORAGE_KEY = 'e5-selected-vehicle';
const VEHICLE_DISPLAY_KEY = 'e5-selected-vehicle-display';

// Helper function to build complete finish name in order: Finish → Color → Accent
const getFinishName = (product: WheelProduct): string => {
  const parts: string[] = [];

  // 1. Use Finish
  if (product.Finish) {
    parts.push(product.Finish);
  }

  // 2. Then add Color
  if (product.Color) {
    parts.push(product.Color);
  }

  // 3. Finally add Accent if available
  if (product.Accent) {
    parts.push(product.Accent);
  }

  // If no parts, return 'Standard'
  return parts.length > 0 ? parts.join(' ') : 'Standard';
};

// Get all products for the current series
const seriesProducts = computed(() => {
  if (!apiResponse.value || !selectedProduct.value) return [];
  return apiResponse.value.Wheels.filter(w => w.Model === selectedProduct.value!.Model);
});

// Computed - Available vehicle models from NicheTag
const availableModels = computed(() => {
  if (!seriesProducts.value.length) return [];
  const models = new Set<string>();
  seriesProducts.value.forEach(wheel => {
    if (wheel.NicheTag) models.add(wheel.NicheTag);
  });
  return Array.from(models).sort();
});

// Available finishes for the current series
const availableFinishes = computed(() => {
  if (!seriesProducts.value.length) return [];
  const finishes = new Set<string>();
  seriesProducts.value.forEach(wheel => {
    finishes.add(getFinishName(wheel));
  });
  return Array.from(finishes).sort();
});

// Check if vehicle has staggered fitment
const isStaggered = computed(() => {
  return selectedVehicle.value ? hasStaggeredFitment(selectedVehicle.value) : false;
});

// Available size+offset combinations for non-staggered
const availableSizeOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value) return [];

  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);

  // If no vehicle selected, show all sizes
  if (!selectedVehicle.value) {
    const sizeOffsets = new Set<string>();
    finishProducts.forEach(wheel => {
      const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
      sizeOffsets.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
    });
    return Array.from(sizeOffsets).sort();
  }

  // Filter by vehicle fitment for non-staggered
  const sizeOffsets = new Set<string>();
  finishProducts.forEach(wheel => {
    // Check if this wheel fits the vehicle
    const fitment = checkWheelFitment({
      LugCount: wheel.LugCount,
      BoltCircle1: wheel.BoltCircle1,
      BoltCircle2: wheel.BoltCircle2,
      Bore: wheel.Bore,
      LoadRating: wheel.LoadRating,
      Diameter: wheel.Diameter,
      Width: wheel.Width,
      Offset: wheel.Offset,
    }, selectedVehicle.value);

    if (fitment.fits) {
      const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
      sizeOffsets.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
    }
  });

  return Array.from(sizeOffsets).sort();
});

// Helper function to validate fitment - returns true if fitment is valid
function isValidFitment(fitment: any): boolean {
  const frontDiameter = fitment.RimDiameter;
  const rearDiameter = fitment.RimDiameterRear;

  // Check if both exist and rear is smaller than front (invalid)
  if (frontDiameter && rearDiameter && rearDiameter < frontDiameter) {
    console.warn(`⚠️ Invalid fitment detected and filtered out: Front ${frontDiameter}" > Rear ${rearDiameter}"`);
    return false; // Filter out this invalid fitment
  }
  return true; // Valid fitment
}

// Check if current vehicle has curated fitments (E5 Recommended)
const curatedVehicleFitments = computed((): VehicleFitment[] | null => {
  if (!selectedVehicle.value) return null;

  // Extract generation from year and trim from submodel
  const year = selectedVehicle.value.Year;
  const trim = selectedVehicle.value.Submodel; // "Stingray", "Z06", "Grand Sport", etc.

  // Map year to generation
  let generation = '';
  if (year >= 2020) generation = 'C8';
  else if (year >= 2014) generation = 'C7';
  else if (year >= 2005) generation = 'C6';
  else if (year >= 1997) generation = 'C5';

  console.log(`✅ Vehicle: ${year} ${trim} → Generation: ${generation}`);

  if (!generation || !trim) {
    console.warn('⚠️ Could not determine generation or trim');
    return null;
  }

  // Check explicit exclusions before running fitment logic
  if (isWheelExcludedForVehicle(props.seriesParam ?? '', generation, trim)) {
    console.log(`🚫 ${props.seriesParam} is excluded for ${generation} ${trim}`);
    return null;
  }

  const curated = getCuratedFitment(generation, trim);

  if (curated) {
    console.log(`✨ Using E5 CURATED fitments for ${generation} ${trim}:`, curated);
  } else {
    console.log(`🔄 No curated fitments for ${generation} ${trim}, falling back to API`);
  }

  return curated;
});

// Available front size+offset combinations for staggered fitment
const availableFrontSizeOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value || !selectedVehicle.value) return [];

  // ✨ E5 CURATED FITMENTS - Use curated list exclusively for this site
  // (API fitment code preserved below for future use on other sites)
  if (curatedVehicleFitments.value) {
    console.log('✨ Using E5 CURATED fitments');
    const sizeOffsets = new Set<string>();

    curatedVehicleFitments.value.forEach(fitment => {
      const formattedSize = formatFitmentSpec(fitment.front);
      sizeOffsets.add(formattedSize);
    });

    return Array.from(sizeOffsets).sort();
  }

  // If no curated fitment available, return empty (don't fall back to API for this site)
  console.warn('⚠️ No curated fitments available for this vehicle');
  return [];

  // 🔄 API FITMENT CODE PRESERVED BELOW (not used on this site, kept for future projects)
  // Uncomment the code below to re-enable API-based fitments:
  /*

  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);
  const sizeOffsets = new Set<string>();

  // Get front fitments and separate them by type
  const frontFitments = getFrontFitments(selectedVehicle.value);

  // Separate front fitments - use RimDiameter (not Position which doesn't exist)
  // For Fitments/OptionalFitments: Has RimDiameter (front) and RimDiameterRear (rear) fields
  // Create synthetic fitments for front from Fitments array
  // STRICT FILTER: Only include fitments with valid front width values to prevent rear widths from leaking in
  const frontStandard = selectedVehicle.value.Fitments
    .filter(f => {
      // Must have front diameter
      if (f.RimDiameter === null) return false;
      // Must have either exact front width OR front width range
      const hasExactWidth = f.RimWidth !== null && f.RimWidth !== undefined;
      const hasWidthRange = (f.RimWidthMin !== null && f.RimWidthMin !== undefined) ||
                            (f.RimWidthMax !== null && f.RimWidthMax !== undefined);
      if (!hasExactWidth && !hasWidthRange) {
        console.warn('⚠️ Filtering out front fitment with no valid width:', f);
        return false;
      }
      return isValidFitment(f);
    })
    .map(f => ({
      ...f,
      RimDiameter: f.RimDiameter,
      RimWidth: f.RimWidth,
      RimWidthMin: f.RimWidthMin,
      RimWidthMax: f.RimWidthMax,
      MinOffset: f.MinOffset,
      MaxOffset: f.MaxOffset,
      Position: 'Front' as const,
      Type: null
    }));

  const frontOptional = selectedVehicle.value.OptionalFitments
    .filter(f => {
      // Must have front diameter
      if (f.RimDiameter === null) return false;
      // Must have either exact front width OR front width range
      const hasExactWidth = f.RimWidth !== null && f.RimWidth !== undefined;
      const hasWidthRange = (f.RimWidthMin !== null && f.RimWidthMin !== undefined) ||
                            (f.RimWidthMax !== null && f.RimWidthMax !== undefined);
      if (!hasExactWidth && !hasWidthRange) {
        console.warn('⚠️ Filtering out front optional fitment with no valid width:', f);
        return false;
      }
      return isValidFitment(f);
    })
    .map(f => ({
      ...f,
      RimDiameter: f.RimDiameter,
      RimWidth: f.RimWidth,
      RimWidthMin: f.RimWidthMin,
      RimWidthMax: f.RimWidthMax,
      MinOffset: f.MinOffset,
      MaxOffset: f.MaxOffset,
      Position: 'Front' as const,
      Type: null
    }));

  // For PlusSizes: Use Type='F' for front
  const frontPlus = selectedVehicle.value.PlusSizes.filter(f => f.Type === 'F');

  // Create a vehicle object with ONLY front fitments
  const frontOnlyVehicle = {
    ...selectedVehicle.value,
    Fitments: frontStandard,
    OptionalFitments: frontOptional,
    PlusSizes: frontPlus
  };

  finishProducts.forEach(wheel => {
    // Use full fitment validation (checks all specs including bore, load rating, etc.)
    // Offset is already excluded from validation in VehicleService
    const fitmentCheck = checkWheelFitment({
      LugCount: wheel.LugCount,
      BoltCircle1: wheel.BoltCircle1,
      BoltCircle2: wheel.BoltCircle2,
      Bore: wheel.Bore,
      LoadRating: wheel.LoadRating,
      Diameter: wheel.Diameter,
      Width: wheel.Width,
      Offset: wheel.Offset,
    }, frontOnlyVehicle);

    const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
    const sizeStr = `${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`;

    if (fitmentCheck.fits) {
      // Debug logging for unusual widths in front
      if (wheel.Width >= 11) {
        console.warn(`⚠️ FRONT: Adding unusual width ${wheel.Width}" - Fitment: ${fitmentCheck.fitmentType}, Reasons:`, fitmentCheck.reasons);
      }
      sizeOffsets.add(sizeStr);
    }
  });

  return Array.from(sizeOffsets).sort();
  */
  // End of preserved API fitment code
});

// Available rear size+offset combinations for staggered fitment
const availableRearSizeOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value || !selectedVehicle.value) return [];

  // ✨ E5 CURATED FITMENTS - Use curated list exclusively for this site
  // (API fitment code preserved below for future use on other sites)
  if (curatedVehicleFitments.value) {
    console.log('✨ Using E5 CURATED fitments');
    const sizeOffsets = new Set<string>();

    curatedVehicleFitments.value.forEach(fitment => {
      const formattedSize = formatFitmentSpec(fitment.rear);
      sizeOffsets.add(formattedSize);
    });

    return Array.from(sizeOffsets).sort();
  }

  // If no curated fitment available, return empty (don't fall back to API for this site)
  console.warn('⚠️ No curated fitments available for this vehicle');
  return [];

  // 🔄 API FITMENT CODE PRESERVED BELOW (not used on this site, kept for future projects)
  // Uncomment the code below to re-enable API-based fitments:
  /*
  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);
  const sizeOffsets = new Set<string>();

  // Get rear fitments and separate them by type
  const rearFitments = getRearFitments(selectedVehicle.value);

  // Separate rear fitments - use RimDiameterRear (not Position which doesn't exist)
  // For Fitments/OptionalFitments: Has RimDiameter (front) and RimDiameterRear (rear) fields
  // Create synthetic fitments for rear from Fitments array
  // STRICT FILTER: Only include fitments with valid rear width values
  const rearStandard = selectedVehicle.value.Fitments
    .filter(f => {
      // Must have rear diameter
      if ((f as any).RimDiameterRear === null || (f as any).RimDiameterRear === undefined) return false;
      // Must have either exact rear width OR rear width range
      const hasExactWidth = (f as any).RimWidthRear !== null && (f as any).RimWidthRear !== undefined;
      const hasWidthRange = ((f as any).RimWidthMinRear !== null && (f as any).RimWidthMinRear !== undefined) ||
                            ((f as any).RimWidthMaxRear !== null && (f as any).RimWidthMaxRear !== undefined);
      if (!hasExactWidth && !hasWidthRange) {
        console.warn('⚠️ Filtering out rear fitment with no valid width:', f);
        return false;
      }
      return isValidFitment(f);
    })
    .map(f => ({
      ...f,
      RimDiameter: (f as any).RimDiameterRear,
      RimWidth: (f as any).RimWidthRear,
      RimWidthMin: (f as any).RimWidthMinRear,
      RimWidthMax: (f as any).RimWidthMaxRear,
      MinOffset: (f as any).MinOffsetRear,
      MaxOffset: (f as any).MaxOffsetRear,
      Position: 'Rear' as const,
      Type: null
    }));

  const rearOptional = selectedVehicle.value.OptionalFitments
    .filter(f => {
      // Must have rear diameter
      if ((f as any).RimDiameterRear === null || (f as any).RimDiameterRear === undefined) return false;
      // Must have either exact rear width OR rear width range
      const hasExactWidth = (f as any).RimWidthRear !== null && (f as any).RimWidthRear !== undefined;
      const hasWidthRange = ((f as any).RimWidthMinRear !== null && (f as any).RimWidthMinRear !== undefined) ||
                            ((f as any).RimWidthMaxRear !== null && (f as any).RimWidthMaxRear !== undefined);
      if (!hasExactWidth && !hasWidthRange) {
        console.warn('⚠️ Filtering out rear optional fitment with no valid width:', f);
        return false;
      }
      return isValidFitment(f);
    })
    .map(f => ({
      ...f,
      RimDiameter: (f as any).RimDiameterRear,
      RimWidth: (f as any).RimWidthRear,
      RimWidthMin: (f as any).RimWidthMinRear,
      RimWidthMax: (f as any).RimWidthMaxRear,
      MinOffset: (f as any).MinOffsetRear,
      MaxOffset: (f as any).MaxOffsetRear,
      Position: 'Rear' as const,
      Type: null
    }));

  // For PlusSizes: Use Type='R' for rear
  const rearPlus = selectedVehicle.value.PlusSizes.filter(f => f.Type === 'R');

  // Create a vehicle object with ONLY rear fitments
  const rearOnlyVehicle = {
    ...selectedVehicle.value,
    Fitments: rearStandard,
    OptionalFitments: rearOptional,
    PlusSizes: rearPlus
  };

  finishProducts.forEach(wheel => {
    // Use full fitment validation (checks all specs including bore, load rating, etc.)
    // Offset is already excluded from validation in VehicleService
    const fitmentCheck = checkWheelFitment({
      LugCount: wheel.LugCount,
      BoltCircle1: wheel.BoltCircle1,
      BoltCircle2: wheel.BoltCircle2,
      Bore: wheel.Bore,
      LoadRating: wheel.LoadRating,
      Diameter: wheel.Diameter,
      Width: wheel.Width,
      Offset: wheel.Offset,
    }, rearOnlyVehicle);

    const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
    const sizeStr = `${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`;

    if (fitmentCheck.fits) {
      sizeOffsets.add(sizeStr);
    }
  });

  // Find the MINIMUM diameter from ALL available front options (not just selected)
  let minFrontDiameter = 0;
  if (availableFrontSizeOffsets.value.length > 0) {
    const frontDiameters = availableFrontSizeOffsets.value.map(size => {
      const match = size.match(/(\d+\.?\d*)"/);
      return match ? parseFloat(match[1]) : 0;
    }).filter(d => d > 0);

    if (frontDiameters.length > 0) {
      minFrontDiameter = Math.min(...frontDiameters);
      console.log(`📏 Minimum front diameter: ${minFrontDiameter}"`);
    }
  }

  // Filter out rear sizes with diameter <= minimum front diameter
  // This ensures rear is always at least 1 size larger than the smallest front option
  const filteredSizes = Array.from(sizeOffsets).filter(rearSize => {
    const match = rearSize.match(/(\d+\.?\d*)"/);
    if (!match) return true; // Keep if we can't parse

    const rearDiameter = parseFloat(match[1]);

    // Exclude the minimum front diameter from rear options
    if (minFrontDiameter > 0 && rearDiameter <= minFrontDiameter) {
      console.warn(`⚠️ Filtered out rear option: ${rearSize} (diameter ${rearDiameter}" <= min front ${minFrontDiameter}")`);
      return false;
    }

    return true;
  });

  return filteredSizes.sort();
  */
  // End of preserved API fitment code
});

const currentImages = computed(() => {
  if (!selectedProduct.value || !apiResponse.value) return [];
  return [
    selectedProduct.value.Img0001,
    selectedProduct.value.Img0002,
    selectedProduct.value.Img0003
  ].filter(Boolean).map(img => getWheelImageUrl(apiResponse.value!.ImgUrlBase, img));
});

const currentImageUrl = computed(() => {
  return currentImages.value[currentImageIndex.value] || '';
});

const totalPrice = computed(() => {
  if (isStaggered.value) {
    const frontPrice = selectedFrontProduct.value?.Price ?? 0;
    const rearPrice = selectedRearProduct.value?.Price ?? 0;
    return (frontPrice * 2) + (rearPrice * 2);
  }
  if (!selectedProduct.value) return 0;
  return selectedProduct.value.Price * 4; // Complete set of 4 wheels
});

const affirmMonthly = computed(() => {
  return Math.ceil(totalPrice.value / 18); // 18 months financing
});

const productDisplayName = computed(() => {
  if (!selectedProduct.value) return '';
  return selectedProduct.value.Model.toUpperCase();
});

const finishDisplayName = computed(() => {
  if (!selectedProduct.value) return '';
  return getFinishName(selectedProduct.value).toUpperCase();
});

// Determine which logo to use based on SegmentTags
const brandLogo = computed(() => {
  if (!selectedProduct.value) return {
    src: '/assets/images/logos/e5-forged.webp',
    alt: 'E5 Forged'
  };

  // Form Forged wheels: Daytona, Sebring, Speedway
  // Forged wheels: Sonoma, Talladega
  const model = selectedProduct.value.Model?.toLowerCase() || '';
  const formForgedModels = ['daytona', 'sebring', 'speedway'];

  const isFormForged = formForgedModels.some(modelName => model.includes(modelName));

  console.log('🎨 Brand Logo Check:', {
    model: selectedProduct.value.Model,
    isFormForged,
    logoPath: isFormForged ? 'e5-form-forged.webp' : 'e5-forged.webp'
  });

  if (isFormForged) {
    return {
      src: '/assets/images/logos/e5-form-forged.webp',
      alt: 'E5 Form Forged',
      href: PROCESS_FORM_FORGED_ROUTE
    };
  }

  // Default to Forged logo (Sonoma, Talladega)
  return {
    src: '/assets/images/logos/e5-forged.webp',
    alt: 'E5 Forged',
    href: PROCESS_FORGED_ROUTE
  };
});

// Check fitment for selected vehicle (CURATED LIST ONLY - API validation disabled)
const vehicleFitment = computed(() => {
  if (!selectedProduct.value || !selectedVehicle.value) return null;

  // ✨ Use ONLY curated fitments for validation
  if (!curatedVehicleFitments.value) {
    return {
      fits: false,
      reasons: ['No E5 curated fitments available for this vehicle'],
      fitmentType: null
    };
  }

  // For non-staggered vehicles, check if selected product matches curated fitment
  if (!isStaggered.value) {
    const productDiameter = selectedProduct.value.Diameter;
    const productWidth = selectedProduct.value.Width;
    const productOffset = selectedProduct.value.Offset;

    // Check if this size matches any curated fitment (front or rear)
    const matches = curatedVehicleFitments.value.some(fitment => {
      const frontMatches =
        fitment.front.diameter === productDiameter &&
        fitment.front.width === productWidth &&
        fitment.front.offset === productOffset;

      const rearMatches =
        fitment.rear.diameter === productDiameter &&
        fitment.rear.width === productWidth &&
        fitment.rear.offset === productOffset;

      return frontMatches || rearMatches;
    });

    return {
      fits: matches,
      reasons: matches
        ? [`E5 Recommended: ${productDiameter}" x ${productWidth}" ${productOffset >= 0 ? '+' : ''}${productOffset}mm`]
        : [`Size ${productDiameter}" x ${productWidth}" ${productOffset >= 0 ? '+' : ''}${productOffset}mm not in E5 curated fitments`],
      fitmentType: matches ? 'curated' : null
    };
  }

  // For staggered vehicles, check both front and rear
  return null; // Will use staggeredFitment instead
});

// Check staggered fitment (CURATED LIST ONLY - API validation disabled)
const staggeredFitment = computed(() => {
  if (!selectedVehicle.value || !isStaggered.value || !selectedProduct.value) return null;

  // ✨ Use ONLY curated fitments for validation
  if (!curatedVehicleFitments.value) {
    return {
      frontFits: false,
      rearFits: false,
      frontReasons: ['No E5 curated fitments available'],
      rearReasons: ['No E5 curated fitments available'],
      fitmentType: null
    };
  }

  // Use selected front/rear products if available
  const frontProduct = selectedFrontProduct.value || selectedProduct.value;
  const rearProduct = selectedRearProduct.value || selectedProduct.value;

  // Check if selected sizes match curated fitments
  const frontMatches = curatedVehicleFitments.value.some(fitment =>
    fitment.front.diameter === frontProduct.Diameter &&
    fitment.front.width === frontProduct.Width &&
    fitment.front.offset === frontProduct.Offset
  );

  const rearMatches = curatedVehicleFitments.value.some(fitment =>
    fitment.rear.diameter === rearProduct.Diameter &&
    fitment.rear.width === rearProduct.Width &&
    fitment.rear.offset === rearProduct.Offset
  );

  return {
    frontFits: frontMatches,
    rearFits: rearMatches,
    frontReasons: frontMatches
      ? [`Front: Matches E5 size fitment`]
      : [`Front: Size incompatible - ${frontProduct.Diameter}" x ${frontProduct.Width}" ${frontProduct.Offset >= 0 ? '+' : ''}${frontProduct.Offset}mm offset does not match any fitment`],
    rearReasons: rearMatches
      ? [`Rear: Matches E5 size fitment`]
      : [`Rear: Size incompatible - ${rearProduct.Diameter}" x ${rearProduct.Width}" ${rearProduct.Offset >= 0 ? '+' : ''}${rearProduct.Offset}mm offset does not match any fitment`],
    fitmentType: (frontMatches && rearMatches) ? 'curated' : null
  };
});

const vehicleDisplay = computed(() => {
  if (!selectedVehicle.value) return null;
  // Use the generation format if available (e.g., "C8 E-Ray")
  if (vehicleDisplayFormat.value) {
    return vehicleDisplayFormat.value;
  }
  // Fallback to full details
  const v = selectedVehicle.value;
  return `${v.Year} ${v.Make} ${v.Model} ${v.Submodel}`;
});

// Check if wheels fit the selected vehicle
const doesWheelsFit = computed(() => {
  if (!selectedVehicle.value) return true; // Allow purchase if no vehicle selected

  if (isStaggered.value) {
    // For staggered, check if there are ANY available sizes
    // If no sizes available at all, it doesn't fit
    if (availableFrontSizeOffsets.value.length === 0 || availableRearSizeOffsets.value.length === 0) {
      return false;
    }
    // If sizes are available and selected, check fitment
    return staggeredFitment.value?.frontFits && staggeredFitment.value?.rearFits;
  } else {
    // For non-staggered, check if there are ANY available sizes
    if (availableSizeOffsets.value.length === 0) {
      return false;
    }
    // If sizes are available and selected, check fitment
    return vehicleFitment.value?.fits || false;
  }
});

// Check if fitment-specific content should be shown
const hasFitmentParams = computed(() => {
  return !!(props.generationParam || props.trimParam);
});

// Generation-specific data for dynamic content
const generationData: Record<string, {
  years: string;
  horsepower?: string;
  engine?: string;
  highlights: string[];
}> = {
  'c5': {
    years: '1997-2004',
    horsepower: '345-385hp',
    engine: 'LS1/LS6',
    highlights: [
      'First generation with fixed headlights and modern design',
      'Hub-centric design for optimal balance and stability',
      'Engineered to handle the C5\'s performance capabilities'
    ]
  },
  'c5-z06': {
    years: '2001-2004',
    horsepower: '385hp',
    engine: 'LS6',
    highlights: [
      'Fixed-roof performance variant with track-ready suspension',
      'Built to handle increased lateral loads and track duty',
      'Optimized for the Z06\'s lightweight, performance-focused design'
    ]
  },
  'c6': {
    years: '2005-2013',
    horsepower: '400-430hp',
    engine: 'LS2/LS3',
    highlights: [
      'Refined design with increased performance and capability',
      'Hub-centric fitment for precision handling',
      'Engineered for the C6\'s improved chassis dynamics'
    ]
  },
  'c6-grand-sport': {
    years: '2010-2013',
    horsepower: '430hp',
    engine: 'LS3',
    highlights: [
      'Wide-body design with enhanced aerodynamics',
      'Engineered for the Grand Sport\'s wider track and aggressive stance',
      'Built to complement the Grand Sport\'s racing heritage'
    ]
  },
  'c6-base': {
    years: '2005-2013',
    horsepower: '400-430hp',
    engine: 'LS2/LS3',
    highlights: [
      'Perfect balance of performance and daily drivability',
      'Hub-centric design for smooth, vibration-free driving',
      'Optimized for the base C6\'s handling characteristics'
    ]
  },
  'c7-stingray': {
    years: '2014-2019',
    horsepower: '455-460hp',
    engine: 'LT1',
    highlights: [
      'Modern performance with aggressive styling and advanced technology',
      'Engineered for Magnetic Ride Control compatibility',
      'Built to handle the Stingray\'s refined performance capability'
    ]
  },
  'c7-grand-sport': {
    years: '2017-2019',
    horsepower: '460hp',
    engine: 'LT1',
    highlights: [
      'Wide-body design combining Z06 aerodynamics with Stingray power',
      'Engineered for the Grand Sport\'s enhanced cooling and wider stance',
      'Built to complement the track-focused suspension setup'
    ]
  },
  'c7-z06': {
    years: '2015-2019',
    horsepower: '650hp',
    engine: 'Supercharged LT4',
    highlights: [
      'Supercharged track weapon with race-proven aerodynamics',
      'Built to handle the Z06\'s massive power and track capability',
      'Specifically designed to clear Brembo 6-piston front calipers',
      'Engineered for Magnetic Ride Control and aggressive driving'
    ]
  },
  'c8-stingray': {
    years: '2020-2024',
    horsepower: '490-495hp',
    engine: 'LT2',
    highlights: [
      'Revolutionary mid-engine design with exotic car performance',
      'Engineered for the C8\'s unique mid-engine weight distribution',
      'Built to complement the aggressive, modern styling'
    ]
  },
  'c8-z06': {
    years: '2023-2024',
    horsepower: '670hp',
    engine: 'Flat-plane LT6',
    highlights: [
      'Naturally-aspirated flat-plane V8 with 8,600 RPM redline',
      'Wider body with enhanced aerodynamics and cooling',
      'Engineered for extreme track capability and carbon ceramic brakes',
      'Built to handle the Z06\'s race-derived suspension'
    ]
  },
  'c8-zr1': {
    years: '2025+',
    horsepower: '1,064hp',
    engine: 'Twin-Turbo LT7',
    highlights: [
      'Most powerful production Corvette ever with hybrid twin-turbo power',
      'Extreme aerodynamics and track-focused engineering',
      'Precision-engineered for the ZR1\'s incredible performance envelope',
      'Built to handle massive lateral loads and braking forces'
    ]
  },
  'c8-e-ray': {
    years: '2024+',
    horsepower: '655hp',
    engine: 'LT2 + Electric Motor',
    highlights: [
      'First all-wheel-drive Corvette with hybrid electric power',
      'Electric front motor provides instant torque and improved traction',
      'Engineered for the E-Ray\'s unique AWD weight distribution',
      'Built to complement the hybrid\'s performance-focused design'
    ]
  }
};

// Get fitment-specific content
const fitmentContent = computed(() => {
  if (!hasFitmentParams.value || !props.seriesParam || !props.finishParam) return null;

  // Build generation key (e.g., "c7-z06", "c8-stingray")
  let generationKey = '';
  if (props.generationParam && props.trimParam) {
    generationKey = `${props.generationParam.toLowerCase()}-${props.trimParam.toLowerCase().replace(/\s+/g, '-')}`;
  } else if (props.generationParam) {
    generationKey = props.generationParam.toLowerCase();
  }

  const data = generationData[generationKey];
  if (!data) return null;

  // Build display name (e.g., "C7 Z06", "C8 Stingray")
  let displayName = '';
  if (props.generationParam && props.trimParam) {
    displayName = `${props.generationParam.toUpperCase()} ${props.trimParam}`;
  } else if (props.generationParam) {
    displayName = props.generationParam.toUpperCase();
  }

  return {
    displayName,
    years: data.years,
    horsepower: data.horsepower,
    engine: data.engine,
    highlights: data.highlights
  };
});

// Check if we should show incompatibility message
const showIncompatibilityMessage = computed(() => {
  if (!selectedVehicle.value) return false;

  if (isStaggered.value) {
    // Show message if no sizes are available OR if selected sizes don't fit
    const noSizesAvailable = availableFrontSizeOffsets.value.length === 0 || availableRearSizeOffsets.value.length === 0;
    const selectedDoesntFit = staggeredFitment.value && (!staggeredFitment.value.frontFits || !staggeredFitment.value.rearFits);
    return noSizesAvailable || selectedDoesntFit;
  } else {
    // Show message if no sizes are available OR if selected size doesn't fit
    const noSizesAvailable = availableSizeOffsets.value.length === 0;
    const selectedDoesntFit = vehicleFitment.value && !vehicleFitment.value.fits;
    return noSizesAvailable || selectedDoesntFit;
  }
});

// Methods
async function loadProducts() {
  try {
    isLoading.value = true;
    error.value = null;
    const response = await fetchWheels({ inStockOnly: false });
    apiResponse.value = response;

    const productIdToLoad = actualProductId.value;
    const urlParams = getUrlParams();

    if (response.Wheels.length > 0) {
      // Select product based on URL parameters (series + finish) or productId
      if (urlParams.series && urlParams.finish) {
        // Normalize finish name from URL (map generation page names to API names)
        let normalizedFinish = urlParams.finish;
        if (normalizedFinish.toLowerCase().includes('titanium brushed tint')) {
          normalizedFinish = 'Titanium Brushed';
        }

        // Find product matching the series (Model) and finish
        const finishParam = (normalizedFinish || '').toLowerCase();
        const foundProduct = response.Wheels.find(w => {
          const matchesSeries = w.Model && w.Model.toLowerCase() === urlParams.series?.toLowerCase();
          const finishName = getFinishName(w).toLowerCase();

          // Try multiple matching strategies for better compatibility
          const directMatch = finishName.includes(finishParam);
          // Handle Titanium <-> Gray Brushed variations
          const titaniumGrayMatch = (finishParam.includes('titanium') && finishName.includes('gray') && finishName.includes('brushed')) ||
                                    (finishParam.includes('gray') && finishName.includes('titanium') && finishName.includes('brushed'));

          return matchesSeries && (directMatch || titaniumGrayMatch);
        });
        selectedProduct.value = foundProduct || response.Wheels[0];
      } else if (productIdToLoad) {
        const foundProduct = response.Wheels.find(w => w.Id === productIdToLoad);
        selectedProduct.value = foundProduct || response.Wheels[0];
      } else {
        selectedProduct.value = response.Wheels[0];
      }

      // Initialize selections based on the selected product
      if (selectedProduct.value) {
        selectedFinish.value = getFinishName(selectedProduct.value);
        selectedModel.value = selectedProduct.value.NicheTag || availableModels.value[0] || '';

        // For non-staggered or when no vehicle selected, set the size+offset
        const offset = selectedProduct.value.Offset > 0 ? `+${selectedProduct.value.Offset}` : `${selectedProduct.value.Offset}`;
        const sizeOffsetStr = `${selectedProduct.value.Diameter}" x ${selectedProduct.value.Width}" ${offset}mm`;

        // Check if this is staggered fitment
        if (selectedVehicle.value && hasStaggeredFitment(selectedVehicle.value)) {
          // For staggered, try to auto-select sizes from URL params or use smart defaults
          if (availableFrontSizeOffsets.value.length > 0) {
            // Priority 1: Check if initialFrontSize is provided (from gallery page)
            if (initialFrontSize.value) {
              const matchedSize = availableFrontSizeOffsets.value.find(size =>
                matchesSizeWithTolerance(initialFrontSize.value!, size)
              );
              if (matchedSize) {
                console.log('✅ Auto-selected front size from URL:', matchedSize);
                selectedFrontSizeOffset.value = matchedSize;
              } else {
                console.log('⚠️ No matching front size found for:', initialFrontSize.value);
                selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
              }
            }
            // Priority 2: Smart default - pick smallest width for front
            else {
              // Parse all available front sizes to find the one with smallest width
              const frontSizesWithParsed = availableFrontSizeOffsets.value.map(size => {
                const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
                if (!match) return null;
                return {
                  size,
                  diameter: parseFloat(match[1]),
                  width: parseFloat(match[2]),
                  offset: parseInt(match[3])
                };
              }).filter(Boolean);

              if (frontSizesWithParsed.length > 0) {
                // Find the size with smallest width
                const smallestWidth = frontSizesWithParsed.reduce((min, current) =>
                  current!.width < min!.width ? current : min
                );
                selectedFrontSizeOffset.value = smallestWidth!.size;
                console.log('🎯 Smart default for front (smallest width):', smallestWidth!.size);
              } else {
                selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
              }
            }
          }
          if (availableRearSizeOffsets.value.length > 0) {
            // Priority 1: Check if initialRearSize is provided (from gallery page)
            if (initialRearSize.value) {
              const matchedSize = availableRearSizeOffsets.value.find(size =>
                matchesSizeWithTolerance(initialRearSize.value!, size)
              );
              if (matchedSize) {
                console.log('✅ Auto-selected rear size from URL:', matchedSize);
                selectedRearSizeOffset.value = matchedSize;
              } else {
                console.log('⚠️ No matching rear size found for:', initialRearSize.value);
                selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
              }
            }
            // Priority 2: Smart default - pick diameter at least 1 inch larger than front
            else {
              // Get front diameter
              let frontDiameter = 0;
              if (selectedFrontSizeOffset.value) {
                const frontMatch = selectedFrontSizeOffset.value.match(/(\d+\.?\d*)"/);
                if (frontMatch) {
                  frontDiameter = parseFloat(frontMatch[1]);
                }
              }

              // Parse all available rear sizes
              const rearSizesWithParsed = availableRearSizeOffsets.value.map(size => {
                const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
                if (!match) return null;
                return {
                  size,
                  diameter: parseFloat(match[1]),
                  width: parseFloat(match[2]),
                  offset: parseInt(match[3])
                };
              }).filter(Boolean);

              if (rearSizesWithParsed.length > 0 && frontDiameter > 0) {
                // Find sizes with diameter at least 1 inch larger than front
                const suitableRearSizes = rearSizesWithParsed.filter(rear =>
                  rear!.diameter >= frontDiameter + 1
                );

                if (suitableRearSizes.length > 0) {
                  // Pick the first suitable rear size (smallest diameter >= front + 1)
                  const bestRear = suitableRearSizes.reduce((min, current) =>
                    current!.diameter < min!.diameter ? current : min
                  );
                  selectedRearSizeOffset.value = bestRear!.size;
                  console.log('🎯 Smart default for rear (diameter >= front + 1"):', bestRear!.size);
                } else {
                  // No suitable size found, use first available
                  selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
                  console.log('⚠️ No rear size with diameter >= front + 1", using first available');
                }
              } else {
                selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
              }
            }
          }
        } else {
          // For non-staggered, check if size is available, otherwise pick first available
          if (selectedVehicle.value) {
            if (availableSizeOffsets.value.length > 0) {
              if (availableSizeOffsets.value.includes(sizeOffsetStr)) {
                selectedSizeOffset.value = sizeOffsetStr;
              } else {
                selectedSizeOffset.value = availableSizeOffsets.value[0] || '';
              }
            }
          } else {
            // No vehicle selected, use the product's size
            selectedSizeOffset.value = sizeOffsetStr;
          }
        }
      }
    }
  } catch (err) {
    error.value = 'Failed to load products. Please try again.';
    console.error('Error loading products:', err);
  } finally {
    isLoading.value = false;
  }
}

function updateProductBasedOnSelections() {
  if (!apiResponse.value || !selectedFinish.value) return;

  // Non-staggered: Use single size+offset
  if (!isStaggered.value) {
    if (!selectedSizeOffset.value) return;

    // Parse: "19" x 9.5" +53mm" -> diameter=19, width=9.5, offset=53
    const match = selectedSizeOffset.value.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
    if (!match) return;

    const [, diameter, width, offset] = match;

    // Find matching product
    const matchingProduct = seriesProducts.value.find(wheel => {
      const matchesFinish = getFinishName(wheel) === selectedFinish.value;
      const matchesSize = wheel.Diameter === parseFloat(diameter) && wheel.Width === parseFloat(width);
      const matchesOffset = wheel.Offset === parseInt(offset);
      return matchesFinish && matchesSize && matchesOffset;
    });

    if (matchingProduct) {
      selectedProduct.value = matchingProduct;
      currentImageIndex.value = 0;
    }
  }
  // Staggered: Update front and rear products separately
  else {
    if (selectedFrontSizeOffset.value) {
      const match = selectedFrontSizeOffset.value.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
      if (match) {
        const [, diameter, width, offset] = match;

        const matchingFront = seriesProducts.value.find(wheel => {
          const matchesFinish = getFinishName(wheel) === selectedFinish.value;
          const matchesSize = wheel.Diameter === parseFloat(diameter) && wheel.Width === parseFloat(width);
          const matchesOffset = wheel.Offset === parseInt(offset);
          return matchesFinish && matchesSize && matchesOffset;
        });

        if (matchingFront) {
          selectedFrontProduct.value = matchingFront;
          selectedProduct.value = matchingFront; // For main image display
          currentImageIndex.value = 0;
        }
      }
    }

    if (selectedRearSizeOffset.value) {
      const match = selectedRearSizeOffset.value.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
      if (match) {
        const [, diameter, width, offset] = match;

        const matchingRear = seriesProducts.value.find(wheel => {
          const matchesFinish = getFinishName(wheel) === selectedFinish.value;
          const matchesSize = wheel.Diameter === parseFloat(diameter) && wheel.Width === parseFloat(width);
          const matchesOffset = wheel.Offset === parseInt(offset);
          return matchesFinish && matchesSize && matchesOffset;
        });

        if (matchingRear) {
          selectedRearProduct.value = matchingRear;
        }
      }
    }
  }
}

// Watch for changes in selections (non-staggered)
watch([selectedFinish, selectedSizeOffset], () => {
  if (!isStaggered.value) {
    updateProductBasedOnSelections();
  }
});

// Watch for changes in staggered selections
watch([selectedFinish, selectedFrontSizeOffset, selectedRearSizeOffset], () => {
  if (isStaggered.value) {
    updateProductBasedOnSelections();
  }
});

// Reset dependent selections when finish changes
watch(selectedFinish, () => {
  if (!isStaggered.value) {
    if (availableSizeOffsets.value.length > 0 && !availableSizeOffsets.value.includes(selectedSizeOffset.value)) {
      selectedSizeOffset.value = availableSizeOffsets.value[0] || '';
    }
  } else {
    // For staggered, reset front and rear size+offsets
    if (availableFrontSizeOffsets.value.length > 0 && !availableFrontSizeOffsets.value.includes(selectedFrontSizeOffset.value)) {
      // Check if URL param for front size exists and find matching size with tolerance
      if (initialFrontSize.value) {
        const matchingSize = availableFrontSizeOffsets.value.find(size =>
          matchesSizeWithTolerance(initialFrontSize.value!, size)
        );
        if (matchingSize) {
          selectedFrontSizeOffset.value = matchingSize;
          initialFrontSize.value = null; // Clear after using once
        } else {
          selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0] || '';
        }
      }
      // Smart default - pick smallest width for front
      else {
        const frontSizesWithParsed = availableFrontSizeOffsets.value.map(size => {
          const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
          if (!match) return null;
          return {
            size,
            diameter: parseFloat(match[1]),
            width: parseFloat(match[2]),
            offset: parseInt(match[3])
          };
        }).filter(Boolean);

        if (frontSizesWithParsed.length > 0) {
          const smallestWidth = frontSizesWithParsed.reduce((min, current) =>
            current!.width < min!.width ? current : min
          );
          selectedFrontSizeOffset.value = smallestWidth!.size || '';
        } else {
          selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0] || '';
        }
      }
    }
    if (availableRearSizeOffsets.value.length > 0 && !availableRearSizeOffsets.value.includes(selectedRearSizeOffset.value)) {
      // Check if URL param for rear size exists and find matching size with tolerance
      if (initialRearSize.value) {
        const matchingSize = availableRearSizeOffsets.value.find(size =>
          matchesSizeWithTolerance(initialRearSize.value!, size)
        );
        if (matchingSize) {
          selectedRearSizeOffset.value = matchingSize;
          initialRearSize.value = null; // Clear after using once
        } else {
          selectedRearSizeOffset.value = availableRearSizeOffsets.value[0] || '';
        }
      }
      // Smart default - pick diameter at least 1 inch larger than front
      else {
        let frontDiameter = 0;
        if (selectedFrontSizeOffset.value) {
          const frontMatch = selectedFrontSizeOffset.value.match(/(\d+\.?\d*)"/);
          if (frontMatch) {
            frontDiameter = parseFloat(frontMatch[1]);
          }
        }

        const rearSizesWithParsed = availableRearSizeOffsets.value.map(size => {
          const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
          if (!match) return null;
          return {
            size,
            diameter: parseFloat(match[1]),
            width: parseFloat(match[2]),
            offset: parseInt(match[3])
          };
        }).filter(Boolean);

        if (rearSizesWithParsed.length > 0 && frontDiameter > 0) {
          const suitableRearSizes = rearSizesWithParsed.filter(rear =>
            rear!.diameter >= frontDiameter + 1
          );

          if (suitableRearSizes.length > 0) {
            const bestRear = suitableRearSizes.reduce((min, current) =>
              current!.diameter < min!.diameter ? current : min
            );
            selectedRearSizeOffset.value = bestRear!.size || '';
          } else {
            selectedRearSizeOffset.value = availableRearSizeOffsets.value[0] || '';
          }
        } else {
          selectedRearSizeOffset.value = availableRearSizeOffsets.value[0] || '';
        }
      }
    }
  }
});

// Dynamic rear adjustment: When user changes front selection, auto-adjust rear to be >= front + 1"
watch(selectedFrontSizeOffset, (newFrontSize) => {
  // Only apply for staggered fitments and when we have a valid front selection
  if (!isStaggered.value || !newFrontSize || !selectedVehicle.value) return;

  // Skip if this is from URL parameter initialization (let the initial logic handle it)
  if (initialRearSize.value) return;

  // Extract the newly selected front diameter
  const frontMatch = newFrontSize.match(/(\d+\.?\d*)"/);
  if (!frontMatch) return;

  const selectedFrontDiameter = parseFloat(frontMatch[1]);
  console.log(`🔄 Front changed to ${selectedFrontDiameter}" - Adjusting rear selection...`);

  // Parse all available rear sizes
  const rearSizesWithParsed = availableRearSizeOffsets.value.map(size => {
    const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
    if (!match) return null;
    return {
      size,
      diameter: parseFloat(match[1]),
      width: parseFloat(match[2]),
      offset: parseInt(match[3])
    };
  }).filter(Boolean);

  if (rearSizesWithParsed.length > 0) {
    // Find rear sizes with diameter at least 1 inch larger than selected front
    const suitableRearSizes = rearSizesWithParsed.filter(rear =>
      rear!.diameter >= selectedFrontDiameter + 1
    );

    if (suitableRearSizes.length > 0) {
      // Pick the smallest suitable rear diameter (closest to front + 1)
      const bestRear = suitableRearSizes.reduce((min, current) =>
        current!.diameter < min!.diameter ? current : min
      );
      selectedRearSizeOffset.value = bestRear!.size;
      console.log(`✅ Auto-selected rear: ${bestRear!.size} (>= ${selectedFrontDiameter}" + 1)`);
    } else {
      // No suitable size found (all rear < front + 1), keep current or use first available
      console.warn(`⚠️ No rear size >= ${selectedFrontDiameter}" + 1, keeping current selection`);
    }
  }
});

function nextImage() {
  if (currentImageIndex.value < currentImages.value.length - 1) {
    currentImageIndex.value++;
  }
}

function prevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
}

function selectImage(index: number) {
  currentImageIndex.value = index;
}

function handleVehicleSelected(vehicle: Vehicle | null) {
  selectedVehicle.value = vehicle;

  // Load the display format from localStorage
  if (vehicle) {
    const savedDisplay = localStorage.getItem(VEHICLE_DISPLAY_KEY);
    vehicleDisplayFormat.value = savedDisplay;
  } else {
    vehicleDisplayFormat.value = null;
  }

  // Reset size selections when vehicle changes to trigger refitment validation
  if (vehicle) {
    if (hasStaggeredFitment(vehicle)) {
      // For staggered, check URL params first, then use smart defaults
      if (availableFrontSizeOffsets.value.length > 0) {
        // Priority 1: Check if initialFrontSize is provided (from gallery page)
        if (initialFrontSize.value) {
          const matchedSize = availableFrontSizeOffsets.value.find(size =>
            matchesSizeWithTolerance(initialFrontSize.value!, size)
          );
          if (matchedSize) {
            console.log('✅ Auto-selected front size from URL:', matchedSize);
            selectedFrontSizeOffset.value = matchedSize;
            // DON'T clear initialFrontSize here - the watcher needs it
          } else {
            console.log('⚠️ No matching front size found for:', initialFrontSize.value);
            selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
          }
        }
        // Priority 2: Smart default - pick smallest width for front
        else {
          const frontSizesWithParsed = availableFrontSizeOffsets.value.map(size => {
            const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
            if (!match) return null;
            return {
              size,
              diameter: parseFloat(match[1]),
              width: parseFloat(match[2]),
              offset: parseInt(match[3])
            };
          }).filter(Boolean);

          if (frontSizesWithParsed.length > 0) {
            const smallestWidth = frontSizesWithParsed.reduce((min, current) =>
              current!.width < min!.width ? current : min
            );
            selectedFrontSizeOffset.value = smallestWidth!.size;
            console.log('🎯 Smart default for front (smallest width):', smallestWidth!.size);
          } else {
            selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
          }
        }
      }
      if (availableRearSizeOffsets.value.length > 0) {
        // Priority 1: Check if initialRearSize is provided (from gallery page)
        if (initialRearSize.value) {
          const matchedSize = availableRearSizeOffsets.value.find(size =>
            matchesSizeWithTolerance(initialRearSize.value!, size)
          );
          if (matchedSize) {
            console.log('✅ Auto-selected rear size from URL:', matchedSize);
            selectedRearSizeOffset.value = matchedSize;
            // DON'T clear initialRearSize here - the watcher needs it
          } else {
            console.log('⚠️ No matching rear size found for:', initialRearSize.value);
            selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
          }
        }
        // Priority 2: Smart default - pick diameter at least 1 inch larger than front
        else {
          let frontDiameter = 0;
          if (selectedFrontSizeOffset.value) {
            const frontMatch = selectedFrontSizeOffset.value.match(/(\d+\.?\d*)"/);
            if (frontMatch) {
              frontDiameter = parseFloat(frontMatch[1]);
            }
          }

          const rearSizesWithParsed = availableRearSizeOffsets.value.map(size => {
            const match = size.match(/(\d+\.?\d*)" x (\d+\.?\d*)" ([+-]?\d+)mm/);
            if (!match) return null;
            return {
              size,
              diameter: parseFloat(match[1]),
              width: parseFloat(match[2]),
              offset: parseInt(match[3])
            };
          }).filter(Boolean);

          if (rearSizesWithParsed.length > 0 && frontDiameter > 0) {
            const suitableRearSizes = rearSizesWithParsed.filter(rear =>
              rear!.diameter >= frontDiameter + 1
            );

            if (suitableRearSizes.length > 0) {
              const bestRear = suitableRearSizes.reduce((min, current) =>
                current!.diameter < min!.diameter ? current : min
              );
              selectedRearSizeOffset.value = bestRear!.size;
              console.log('🎯 Smart default for rear (diameter >= front + 1"):', bestRear!.size);
            } else {
              selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
              console.log('⚠️ No rear size with diameter >= front + 1", using first available');
            }
          } else {
            selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
          }
        }
      }
    } else {
      // For non-staggered, reset to first available option
      if (availableSizeOffsets.value.length > 0) {
        selectedSizeOffset.value = availableSizeOffsets.value[0];
      }
    }
  }
}

function addToCart() {
  if (!selectedProduct.value) return;

  // For staggered fitment, need both front and rear products
  if (isStaggered.value) {
    if (!selectedFrontProduct.value || !selectedRearProduct.value) {
      alert('Please select both front and rear wheel configurations');
      return;
    }

    // Add front wheels (quantity = number of wheels)
    CartManager.addItem({
      product: selectedFrontProduct.value,
      quantity: 2,
      frontWheels: 2,
      rearWheels: 0,
      vehicleModel: vehicleDisplay.value || undefined,
      imgUrlBase: apiResponse.value?.ImgUrlBase
    });

    // Add rear wheels (quantity = number of wheels)
    CartManager.addItem({
      product: selectedRearProduct.value,
      quantity: 2,
      frontWheels: 0,
      rearWheels: 2,
      vehicleModel: vehicleDisplay.value || undefined,
      imgUrlBase: apiResponse.value?.ImgUrlBase
    });
  } else {
    // Non-staggered: add complete set of 4
    CartManager.addItem({
      product: selectedProduct.value,
      quantity: 1,
      frontWheels: 2,
      rearWheels: 2,
      vehicleModel: vehicleDisplay.value || undefined,
      imgUrlBase: apiResponse.value?.ImgUrlBase
    });
  }

  // Redirect to cart
  window.location.href = CART_ROUTE;
}

onMounted(() => {
  loadProducts();

  // Load saved vehicle from localStorage
  const savedVehicle = localStorage.getItem(VEHICLE_STORAGE_KEY);
  if (savedVehicle) {
    try {
      selectedVehicle.value = JSON.parse(savedVehicle);

      // Also load the display format
      const savedDisplay = localStorage.getItem(VEHICLE_DISPLAY_KEY);
      vehicleDisplayFormat.value = savedDisplay;
    } catch (error) {
      console.error('Error loading saved vehicle:', error);
    }
  }
});
</script>

<template>
  <div class="w-full bg-white">
    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-[1728px] mx-auto px-4 sm:px-8 md:px-16 py-6 md:py-12 text-center">
      <p class="text-xl text-black/70">Loading product...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-[1728px] mx-auto px-4 sm:px-8 md:px-16 py-6 md:py-12 text-center">
      <p class="text-xl text-red-600">{{ error }}</p>
    </div>

    <!-- Main Content Container -->
    <div v-if="!isLoading && !error && selectedProduct" class="max-w-[1728px] mx-auto px-4 sm:px-8 md:px-16 py-6 md:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16">
        <!-- Left Column - Product Images -->
        <div class="space-y-8">
          <!-- Main Product Image -->
          <div class="w-full aspect-square flex items-center justify-center bg-gray-50">
            <img
              :src="currentImageUrl"
              :alt="productDisplayName"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- Thumbnail Navigation -->
          <div class="flex items-center justify-center gap-2 md:gap-4">
            <!-- Left Arrow -->
            <button
              @click="prevImage"
              :disabled="currentImageIndex === 0"
              class="p-1 md:p-2 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="md:w-6 md:h-6">
                <path d="M15 18L9 12L15 6" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Thumbnails -->
            <div class="flex gap-2 md:gap-4">
              <div
                v-for="(image, index) in currentImages"
                :key="index"
                @click="selectImage(index)"
                class="w-16 h-16 md:w-24 lg:w-28 md:h-24 lg:h-28 border-2 transition-colors cursor-pointer"
                :class="currentImageIndex === index ? 'border-e5-red' : 'border-transparent hover:border-e5-red'"
              >
                <img
                  :src="image"
                  :alt="`${productDisplayName} view ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Right Arrow -->
            <button
              @click="nextImage"
              :disabled="currentImageIndex === currentImages.length - 1"
              class="p-1 md:p-2 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="md:w-6 md:h-6">
                <path d="M9 6L15 12L9 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right Column - Product Details -->
        <div class="space-y-6">
          <!-- Brand Logo - Left aligned on mobile, right aligned on desktop -->
          <div class="flex justify-start lg:justify-end">
            <a :href="brandLogo.href">
              <img
                :src="brandLogo.src"
                :alt="brandLogo.alt"
                class="h-8 lg:h-12 object-contain"
              />
            </a>
          </div>

          <!-- Product Title -->
          <div>
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-['Franklin_Gothic_Demi'] text-black tracking-wider">
              {{ productDisplayName }}
              <span class="sr-only"> {{ finishDisplayName }} WHEELS<template v-if="generationParam || trimParam"> - {{ generationParam ? generationParam.toUpperCase() : '' }}{{ generationParam && trimParam ? ' ' : '' }}{{ trimParam || '' }}</template></span>
            </h1>
          </div>

          <!-- Divider -->
          <div class="w-full h-[2px] bg-e5-red"></div>

          <!-- Vehicle Fitment Display - Non-Staggered -->
          <div v-if="selectedVehicle && !isStaggered && vehicleFitment" class="p-4 border-2 rounded-lg" :class="vehicleFitment?.fits ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'">
            <div class="flex items-center gap-2 mb-2">
              <svg v-if="vehicleFitment?.fits" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <h3 class="text-lg font-['Franklin_Gothic_Demi'] tracking-wide" :class="vehicleFitment?.fits ? 'text-green-700' : 'text-red-700'">
                {{ vehicleFitment?.fits ? 'FITS YOUR VEHICLE' : 'DOES NOT FIT YOUR VEHICLE' }}
              </h3>
            </div>
            <p class="text-sm font-['Franklin_Gothic_Book'] text-black/70 mb-2">
              {{ vehicleDisplay }}
            </p>
            <div v-if="vehicleFitment?.reasons.length" class="space-y-1">
              <p v-for="(reason, index) in vehicleFitment.reasons" :key="index" class="text-sm font-['Franklin_Gothic_Book']" :class="vehicleFitment?.fits ? 'text-green-700' : 'text-red-700'">
                {{ reason }}
              </p>
            </div>
            <div v-if="vehicleFitment?.fitmentType && vehicleFitment?.fits" class="mt-2">
              <span class="inline-block px-2 py-1 text-xs font-['Franklin_Gothic_Demi'] rounded" :class="{
                'bg-green-200 text-green-800': vehicleFitment.fitmentType === 'standard',
                'bg-blue-200 text-blue-800': vehicleFitment.fitmentType === 'optional',
                'bg-purple-200 text-purple-800': vehicleFitment.fitmentType === 'plus'
              }">
                {{ vehicleFitment.fitmentType.toUpperCase() }} FITMENT
              </span>
            </div>
          </div>

          <!-- Vehicle Fitment Display - Staggered -->
          <div v-if="selectedVehicle && isStaggered && staggeredFitment" class="p-4 border-2 rounded-lg" :class="(staggeredFitment.frontFits && staggeredFitment.rearFits) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'">
            <div class="flex items-center gap-2 mb-2">
              <svg v-if="staggeredFitment.frontFits && staggeredFitment.rearFits" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <h3 class="text-lg font-['Franklin_Gothic_Demi'] tracking-wide" :class="(staggeredFitment.frontFits && staggeredFitment.rearFits) ? 'text-green-700' : 'text-red-700'">
                {{ (staggeredFitment.frontFits && staggeredFitment.rearFits) ? 'FITS YOUR VEHICLE' : 'DOES NOT FIT YOUR VEHICLE' }}
              </h3>
            </div>
            <p class="text-sm font-['Franklin_Gothic_Book'] text-black/70 mb-3">
              {{ vehicleDisplay }} (Staggered Fitment)
            </p>

            <!-- Front Fitment Status -->
            <div class="mb-3 pb-3 border-b border-gray-300">
              <div class="flex items-center gap-2 mb-1">
                <svg v-if="staggeredFitment.frontFits" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <h4 class="text-sm font-['Franklin_Gothic_Demi']" :class="staggeredFitment.frontFits ? 'text-green-700' : 'text-red-700'">
                  FRONT WHEELS: {{ staggeredFitment.frontFits ? 'FIT' : 'DO NOT FIT' }}
                </h4>
              </div>
              <div v-if="staggeredFitment.frontReasons.length" class="ml-7 space-y-1">
                <p v-for="(reason, index) in staggeredFitment.frontReasons" :key="index" class="text-xs font-['Franklin_Gothic_Book']" :class="staggeredFitment.frontFits ? 'text-green-700' : 'text-red-700'">
                  {{ reason }}
                </p>
              </div>
            </div>

            <!-- Rear Fitment Status -->
            <div class="mb-2">
              <div class="flex items-center gap-2 mb-1">
                <svg v-if="staggeredFitment.rearFits" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <h4 class="text-sm font-['Franklin_Gothic_Demi']" :class="staggeredFitment.rearFits ? 'text-green-700' : 'text-red-700'">
                  REAR WHEELS: {{ staggeredFitment.rearFits ? 'FIT' : 'DO NOT FIT' }}
                </h4>
              </div>
              <div v-if="staggeredFitment.rearReasons.length" class="ml-7 space-y-1">
                <p v-for="(reason, index) in staggeredFitment.rearReasons" :key="index" class="text-xs font-['Franklin_Gothic_Book']" :class="staggeredFitment.rearFits ? 'text-green-700' : 'text-red-700'">
                  {{ reason }}
                </p>
              </div>
            </div>

            <div v-if="staggeredFitment?.fitmentType && staggeredFitment.frontFits && staggeredFitment.rearFits" class="mt-3">
              <span class="inline-block px-2 py-1 text-xs font-['Franklin_Gothic_Demi'] rounded" :class="{
                'bg-green-200 text-green-800': staggeredFitment.fitmentType === 'standard',
                'bg-blue-200 text-blue-800': staggeredFitment.fitmentType === 'optional',
                'bg-purple-200 text-purple-800': staggeredFitment.fitmentType === 'plus'
              }">
                {{ staggeredFitment.fitmentType.toUpperCase() }} FITMENT
              </span>
            </div>
          </div>

          <!-- Incompatible Vehicle Message -->
          <div v-if="showIncompatibilityMessage" class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm font-['Franklin_Gothic_Demi'] text-red-800 mb-2">
              This wheel configuration does not fit your selected vehicle.
            </p>
            <p class="text-sm font-['Franklin_Gothic_Book'] text-red-700 mb-3">
              Please review the fitment details above to see what doesn't match.
            </p>
            <a
              :href="SHOP_ROUTE"
              class="inline-block w-full text-center bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-sm tracking-[2px] uppercase px-6 py-2 rounded hover:bg-e5-red/90 transition-colors"
            >
              Find Compatible Wheels
            </a>
          </div>

          <!-- Price -->
          <div class="space-y-2">
            <p class="text-xl font-['Excon_Variable'] text-black/70">
              <span class="font-normal">{{ formatPrice(totalPrice) }}</span>
              <span class="font-thin">(Complete Set)</span>
            </p>
            <p class="text-xl font-['Excon_Variable'] font-thin text-black/70">
              From <span class="font-normal">{{ formatPrice(affirmMonthly) }}/mo</span> with
              <img
                src="/assets/images/578fa0d18bbca3760015bb5ca95a185ccb50b0f2.webp"
                alt="Affirm"
                class="inline h-6 w-auto mx-1"
              />
              at checkout
            </p>
          </div>

          <!-- Vehicle Selector -->
          <div class="mb-6">
            <VehicleSelector
              @vehicle-selected="handleVehicleSelected"
              :initial-generation="initialGeneration"
              :initial-trim="initialTrim"
            />
          </div>

          <!-- Configuration Options -->
          <div class="space-y-4">
            <!-- Finish -->
            <div>
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                FINISH:
              </label>
              <div class="relative">
                <select
                  v-model="selectedFinish"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white"
                >
                  <option v-for="finish in availableFinishes" :key="finish" :value="finish">
                    {{ finish.toUpperCase() }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Size - Non-Staggered -->
            <div v-if="!isStaggered">
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                SIZE:
              </label>
              <div class="relative">
                <select
                  v-model="selectedSizeOffset"
                  :disabled="availableSizeOffsets.length === 0"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option v-for="sizeOffset in availableSizeOffsets" :key="sizeOffset" :value="sizeOffset">
                    {{ sizeOffset }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Front Size - Staggered -->
            <div v-if="isStaggered">
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                FRONT:
              </label>
              <div class="relative">
                <select
                  v-model="selectedFrontSizeOffset"
                  :disabled="availableFrontSizeOffsets.length === 0"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Front</option>
                  <option v-for="sizeOffset in availableFrontSizeOffsets" :key="sizeOffset" :value="sizeOffset">
                    {{ sizeOffset }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Rear Size - Staggered -->
            <div v-if="isStaggered">
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                REAR:
              </label>
              <div class="relative">
                <select
                  v-model="selectedRearSizeOffset"
                  :disabled="availableRearSizeOffsets.length === 0"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Rear</option>
                  <option v-for="sizeOffset in availableRearSizeOffsets" :key="sizeOffset" :value="sizeOffset">
                    {{ sizeOffset }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Add to Cart Button -->
          <button
            @click="addToCart"
            :disabled="!doesWheelsFit"
            class="w-full h-10 bg-e5-red rounded-lg text-white text-base font-['Excon_Variable'] font-light tracking-[0.32em] hover:bg-e5-red/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ADD TO CART
          </button>

          <!-- Product Info -->
          <div v-if="!isStaggered" class="space-y-2 pt-4 text-sm text-black/60">
            <p><strong>Part Number:</strong> {{ selectedProduct.Pn }}</p>
            <p><strong>Material:</strong> {{ selectedProduct.Material }}</p>
            <p><strong>Bolt Pattern:</strong> {{ selectedProduct.LugCount }}x{{ selectedProduct.BoltCircle1 }}<span v-if="selectedProduct.BoltCircle2">/{{ selectedProduct.BoltCircle2 }}</span></p>
            <p><strong>Center Bore:</strong> {{ selectedProduct.Bore }}mm</p>
            <p><strong>Load Rating:</strong> {{ selectedProduct.LoadRating }} lbs</p>
            <p v-if="selectedProduct.InStock" class="text-green-600"><strong>✓ In Stock</strong></p>
            <p v-else class="text-red-600"><strong>Out of Stock</strong></p>
          </div>

          <!-- Product Info for Staggered Fitment -->
          <div v-else class="space-y-4 pt-4 text-sm text-black/60">
            <!-- Front Specs -->
            <div v-if="selectedFrontProduct" class="space-y-2">
              <p class="font-bold text-black">FRONT WHEELS:</p>
              <p><strong>Part Number:</strong> {{ selectedFrontProduct.Pn }}</p>
              <p><strong>Material:</strong> {{ selectedFrontProduct.Material }}</p>
              <p><strong>Bolt Pattern:</strong> {{ selectedFrontProduct.LugCount }}x{{ selectedFrontProduct.BoltCircle1 }}<span v-if="selectedFrontProduct.BoltCircle2">/{{ selectedFrontProduct.BoltCircle2 }}</span></p>
              <p><strong>Center Bore:</strong> {{ selectedFrontProduct.Bore }}mm</p>
              <p><strong>Load Rating:</strong> {{ selectedFrontProduct.LoadRating }} lbs</p>
              <p v-if="selectedFrontProduct.InStock" class="text-green-600"><strong>✓ In Stock</strong></p>
              <p v-else class="text-red-600"><strong>Out of Stock</strong></p>
            </div>

            <!-- Rear Specs -->
            <div v-if="selectedRearProduct" class="space-y-2 pt-2 border-t border-black/10">
              <p class="font-bold text-black pt-2">REAR WHEELS:</p>
              <p><strong>Part Number:</strong> {{ selectedRearProduct.Pn }}</p>
              <p><strong>Material:</strong> {{ selectedRearProduct.Material }}</p>
              <p><strong>Bolt Pattern:</strong> {{ selectedRearProduct.LugCount }}x{{ selectedRearProduct.BoltCircle1 }}<span v-if="selectedRearProduct.BoltCircle2">/{{ selectedRearProduct.BoltCircle2 }}</span></p>
              <p><strong>Center Bore:</strong> {{ selectedRearProduct.Bore }}mm</p>
              <p><strong>Load Rating:</strong> {{ selectedRearProduct.LoadRating }} lbs</p>
              <p v-if="selectedRearProduct.InStock" class="text-green-600"><strong>✓ In Stock</strong></p>
              <p v-else class="text-red-600"><strong>Out of Stock</strong></p>
            </div>
          </div>

          <!-- Free Shipping Notice -->
          <p class="text-xl font-['Excon_Variable'] text-black/70 pt-8">
            FREE SHIPPING ON ALL COMPLETE SETS
          </p>
        </div>
      </div>

      <!-- Fitment-Specific Content Section -->
      <div v-if="fitmentContent" class="mt-12 md:mt-16 max-w-[1200px] mx-auto">
        <div class="bg-gray-50 rounded-lg p-6 md:p-10 space-y-6">
          <!-- Title -->
          <h2 class="text-2xl md:text-3xl font-['Franklin_Gothic_Demi'] text-black tracking-wider">
            Engineered for Your {{ fitmentContent.displayName }} Corvette
          </h2>

          <!-- Divider -->
          <div class="w-16 h-[2px] bg-e5-red"></div>

          <!-- Intro Text -->
          <p class="text-base md:text-lg text-black/80 leading-relaxed">
            These {{ productDisplayName }} {{ finishDisplayName }} wheels are <strong>precision-engineered specifically for your {{ fitmentContent.displayName }}</strong>,
            combining E5's 40 years of wheel industry expertise with purpose-built design.
          </p>

          <!-- Generation Specs -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <div class="text-center md:text-left">
              <p class="text-sm text-black/60 font-medium mb-1">MODEL YEARS</p>
              <p class="text-lg font-bold text-black">{{ fitmentContent.years }}</p>
            </div>
            <div v-if="fitmentContent.horsepower" class="text-center md:text-left">
              <p class="text-sm text-black/60 font-medium mb-1">POWER OUTPUT</p>
              <p class="text-lg font-bold text-black">{{ fitmentContent.horsepower }}</p>
            </div>
            <div v-if="fitmentContent.engine" class="text-center md:text-left">
              <p class="text-sm text-black/60 font-medium mb-1">ENGINE</p>
              <p class="text-lg font-bold text-black">{{ fitmentContent.engine }}</p>
            </div>
          </div>

          <!-- Why Section -->
          <div class="space-y-3">
            <h3 class="text-xl font-['Franklin_Gothic_Demi'] text-black">
              Why Your {{ fitmentContent.displayName }} Deserves These Wheels
            </h3>
            <ul class="space-y-3">
              <li v-for="(highlight, index) in fitmentContent.highlights" :key="index" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-e5-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base text-black/80">{{ highlight }}</span>
              </li>
            </ul>
          </div>

          <!-- Closing Statement -->
          <div class="pt-4 border-t border-gray-300">
            <p class="text-base text-black/80 leading-relaxed">
              Each wheel is hub-centric for optimal stability and engineered to work seamlessly with your {{ fitmentContent.displayName }}'s
              systems, maintaining the precision and performance that defines your Corvette.
            </p>
            <p class="text-base text-black/80 font-medium mt-4">
              <strong>At E5, we don't just build wheels—we build for Corvette owners who demand the best.</strong>
              Every detail is considered, every measurement is precise, and every wheel is crafted to embody
              Earth, Water, Air, Fire—and Corvette, the fifth element.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
select {
  cursor: pointer;
}

select:focus {
  outline: 2px solid #d31d25;
  outline-offset: 2px;
}
</style>
