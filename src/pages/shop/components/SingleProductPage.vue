<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fetchWheels, getWheelImageUrl, formatPrice, CartManager, type WheelProduct, type WheelsApiResponse } from '@/core/services/ProductService';
import { CART_ROUTE, SHOP_ROUTE } from '@/core/constants/Routes';
import { checkWheelFitment, checkStaggeredFitment, hasStaggeredFitment, getFrontFitments, getRearFitments, type Vehicle } from '@/core/services/VehicleService';
import VehicleSelector from '@/core/components/VehicleSelector.vue';

// Props
const props = defineProps<{
  productId?: number;
  modelParam?: string;
}>();

// Get product ID from URL if not provided as prop
const getProductIdFromUrl = (): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id ? parseInt(id, 10) : undefined;
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

// Storage key for localStorage
const VEHICLE_STORAGE_KEY = 'e5-selected-vehicle';

// Helper function to build complete finish name in order: Finish → Color → Accent
const getFinishName = (product: WheelProduct): string => {
  const parts: string[] = [];

  // 1. Use ShortFinish or Finish first
  if (product.ShortFinish) {
    parts.push(product.ShortFinish);
  } else if (product.Finish) {
    parts.push(product.Finish);
  }

  // 2. Then add ShortColor or Color
  if (product.ShortColor) {
    parts.push(product.ShortColor);
  } else if (product.Color) {
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

// Available front size+offset combinations for staggered fitment
const availableFrontSizeOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value || !selectedVehicle.value) return [];

  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);
  const sizeOffsets = new Set<string>();

  // Get front fitments and separate them by type
  const frontFitments = getFrontFitments(selectedVehicle.value);

  // Separate front fitments - use RimDiameter (not Position which doesn't exist)
  // For Fitments/OptionalFitments: Has RimDiameter (front) and RimDiameterRear (rear) fields
  // Create synthetic fitments for front from Fitments array
  const frontStandard = selectedVehicle.value.Fitments
    .filter(f => f.RimDiameter !== null)
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
    .filter(f => f.RimDiameter !== null)
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
      sizeOffsets.add(sizeStr);
    }
  });

  return Array.from(sizeOffsets).sort();
});

// Available rear size+offset combinations for staggered fitment
const availableRearSizeOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value || !selectedVehicle.value) return [];

  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);
  const sizeOffsets = new Set<string>();

  // Get rear fitments and separate them by type
  const rearFitments = getRearFitments(selectedVehicle.value);

  // Separate rear fitments - use RimDiameterRear (not Position which doesn't exist)
  // For Fitments/OptionalFitments: Has RimDiameter (front) and RimDiameterRear (rear) fields
  // Create synthetic fitments for rear from Fitments array
  const rearStandard = selectedVehicle.value.Fitments
    .filter(f => (f as any).RimDiameterRear !== null && (f as any).RimDiameterRear !== undefined)
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
    .filter(f => (f as any).RimDiameterRear !== null && (f as any).RimDiameterRear !== undefined)
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

  return Array.from(sizeOffsets).sort();
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

// Check fitment for selected vehicle
const vehicleFitment = computed(() => {
  if (!selectedProduct.value || !selectedVehicle.value) return null;

  // For non-staggered vehicles or when not both front/rear products selected
  if (!isStaggered.value || !selectedFrontProduct.value || !selectedRearProduct.value) {
    return checkWheelFitment({
      LugCount: selectedProduct.value.LugCount,
      BoltCircle1: selectedProduct.value.BoltCircle1,
      BoltCircle2: selectedProduct.value.BoltCircle2,
      Bore: selectedProduct.value.Bore,
      LoadRating: selectedProduct.value.LoadRating,
      Diameter: selectedProduct.value.Diameter,
      Width: selectedProduct.value.Width,
      Offset: selectedProduct.value.Offset,
    }, selectedVehicle.value);
  }

  // For staggered vehicles, check both front and rear
  return null; // Will use staggeredFitment instead
});

// Check staggered fitment
const staggeredFitment = computed(() => {
  if (!selectedVehicle.value || !isStaggered.value || !selectedFrontProduct.value || !selectedRearProduct.value) return null;

  return checkStaggeredFitment(
    {
      LugCount: selectedFrontProduct.value.LugCount,
      BoltCircle1: selectedFrontProduct.value.BoltCircle1,
      BoltCircle2: selectedFrontProduct.value.BoltCircle2,
      Bore: selectedFrontProduct.value.Bore,
      LoadRating: selectedFrontProduct.value.LoadRating,
      Diameter: selectedFrontProduct.value.Diameter,
      Width: selectedFrontProduct.value.Width,
      Offset: selectedFrontProduct.value.Offset,
    },
    {
      LugCount: selectedRearProduct.value.LugCount,
      BoltCircle1: selectedRearProduct.value.BoltCircle1,
      BoltCircle2: selectedRearProduct.value.BoltCircle2,
      Bore: selectedRearProduct.value.Bore,
      LoadRating: selectedRearProduct.value.LoadRating,
      Diameter: selectedRearProduct.value.Diameter,
      Width: selectedRearProduct.value.Width,
      Offset: selectedRearProduct.value.Offset,
    },
    selectedVehicle.value
  );
});

const vehicleDisplay = computed(() => {
  if (!selectedVehicle.value) return null;
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

    if (response.Wheels.length > 0) {
      // Select product based on productId
      if (productIdToLoad) {
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
          // For staggered, try to auto-select first available front and rear sizes
          // We'll let the watchers handle setting the actual products
          if (availableFrontSizeOffsets.value.length > 0) {
            // Check if the current product's size is in the available list
            if (availableFrontSizeOffsets.value.includes(sizeOffsetStr)) {
              selectedFrontSizeOffset.value = sizeOffsetStr;
            } else {
              selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
            }
          }
          if (availableRearSizeOffsets.value.length > 0) {
            // Check if the current product's size is in the available list
            if (availableRearSizeOffsets.value.includes(sizeOffsetStr)) {
              selectedRearSizeOffset.value = sizeOffsetStr;
            } else {
              selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
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
      selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0] || '';
    }
    if (availableRearSizeOffsets.value.length > 0 && !availableRearSizeOffsets.value.includes(selectedRearSizeOffset.value)) {
      selectedRearSizeOffset.value = availableRearSizeOffsets.value[0] || '';
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

  // Reset size selections when vehicle changes to trigger refitment validation
  if (vehicle) {
    if (hasStaggeredFitment(vehicle)) {
      // For staggered, reset to first available options
      if (availableFrontSizeOffsets.value.length > 0) {
        selectedFrontSizeOffset.value = availableFrontSizeOffsets.value[0];
      }
      if (availableRearSizeOffsets.value.length > 0) {
        selectedRearSizeOffset.value = availableRearSizeOffsets.value[0];
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
      vehicleModel: selectedModel.value,
      imgUrlBase: apiResponse.value?.ImgUrlBase
    });

    // Add rear wheels (quantity = number of wheels)
    CartManager.addItem({
      product: selectedRearProduct.value,
      quantity: 2,
      frontWheels: 0,
      rearWheels: 2,
      vehicleModel: selectedModel.value,
      imgUrlBase: apiResponse.value?.ImgUrlBase
    });
  } else {
    // Non-staggered: add complete set of 4
    CartManager.addItem({
      product: selectedProduct.value,
      quantity: 1,
      frontWheels: 2,
      rearWheels: 2,
      vehicleModel: selectedModel.value,
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
    } catch (error) {
      console.error('Error loading saved vehicle:', error);
    }
  }
});
</script>

<template>
  <div class="w-full bg-white">
    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-[1728px] mx-auto px-16 py-12 text-center">
      <p class="text-xl text-black/70">Loading product...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-[1728px] mx-auto px-16 py-12 text-center">
      <p class="text-xl text-red-600">{{ error }}</p>
    </div>

    <!-- Vehicle Selector -->
    <div v-else>
      <VehicleSelector @vehicle-selected="handleVehicleSelected" />
    </div>

    <!-- Main Content Container -->
    <div v-if="!isLoading && !error && selectedProduct" class="max-w-[1728px] mx-auto px-16 py-12">
      <div class="grid grid-cols-2 gap-16">
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
          <div class="flex items-center justify-center gap-4">
            <!-- Left Arrow -->
            <button
              @click="prevImage"
              :disabled="currentImageIndex === 0"
              class="p-2 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Thumbnails -->
            <div class="flex gap-4">
              <div
                v-for="(image, index) in currentImages"
                :key="index"
                @click="selectImage(index)"
                class="w-28 h-28 border-2 transition-colors cursor-pointer"
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
              class="p-2 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right Column - Product Details -->
        <div class="space-y-6">
          <!-- Brand Logo -->
          <div class="flex justify-end">
            <img
              src="/assets/images/02d80e5501d4b44b3e61daf67192b4fe23242b09.png"
              alt="E5 Forged"
              class="h-5 object-contain"
            />
          </div>

          <!-- Product Title -->
          <div>
            <h1 class="text-4xl font-['Franklin_Gothic_Demi'] text-black tracking-wider">
              {{ productDisplayName }}
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
                src="/assets/images/578fa0d18bbca3760015bb5ca95a185ccb50b0f2.png"
                alt="Affirm"
                class="inline h-6 w-auto mx-1"
              />
              at checkout
            </p>
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

          <!-- Express Checkout -->
          <div class="space-y-3">
            <p class="text-sm font-['Excon_Variable'] font-light text-black/70 tracking-[0.08em] text-center">
              EXPRESS CHECKOUT
            </p>
            <button class="w-full h-10 bg-black rounded-lg flex items-center justify-center hover:bg-black/90 transition-colors">
              <img
                src="/assets/images/53ac0b7c91c2611f93c3336f0652d00efd216192.png"
                alt="Apple Pay"
                class="h-6"
              />
            </button>
          </div>

          <!-- More Purchase Options -->
          <div class="space-y-3">
            <p class="text-sm font-['Excon_Variable'] font-normal text-black/70 tracking-[0.08em] text-center">
              MORE PURCHASE OPTIONS
            </p>
            <button class="w-full h-10 bg-white border border-black rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <img
                src="/assets/images/578fa0d18bbca3760015bb5ca95a185ccb50b0f2.png"
                alt="Affirm"
                class="h-6"
              />
            </button>
          </div>

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
