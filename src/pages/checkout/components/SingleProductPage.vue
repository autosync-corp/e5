<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fetchWheels, getWheelImageUrl, formatPrice, CartManager, type WheelProduct, type WheelsApiResponse } from '@/core/services/ProductService';
import { CART_ROUTE } from '@/core/constants/Routes';

// Props
const props = defineProps<{
  productId?: number;
  modelParam?: string;
}>();

// State
const apiResponse = ref<WheelsApiResponse | null>(null);
const selectedProduct = ref<WheelProduct | null>(null);
const selectedModel = ref('');
const selectedSize = ref('');
const selectedFinish = ref('');
const selectedOffset = ref('');
const currentImageIndex = ref(0);
const isLoading = ref(true);
const error = ref<string | null>(null);

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

// Available sizes for the selected finish
const availableSizes = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value) return [];

  const finishProducts = seriesProducts.value.filter(p => getFinishName(p) === selectedFinish.value);
  const sizes = new Set<string>();

  finishProducts.forEach(wheel => {
    sizes.add(`${wheel.Diameter}" x ${wheel.Width}"`);
  });

  return Array.from(sizes).sort();
});

// Available offsets for the selected finish and size
const availableOffsets = computed(() => {
  if (!seriesProducts.value.length || !selectedFinish.value || !selectedSize.value) return [];

  const [diameter, width] = selectedSize.value.match(/(\d+\.?\d*)/g) || [];

  const matchingProducts = seriesProducts.value.filter(p => {
    const matchesFinish = getFinishName(p) === selectedFinish.value;
    const matchesSize = p.Diameter === parseFloat(diameter) && p.Width === parseFloat(width);
    return matchesFinish && matchesSize;
  });

  const offsets = matchingProducts.map(p => p.Offset);
  return Array.from(new Set(offsets)).sort((a, b) => a - b);
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

// Methods
async function loadProducts() {
  try {
    isLoading.value = true;
    error.value = null;
    const response = await fetchWheels({ inStockOnly: false });
    apiResponse.value = response;

    if (response.Wheels.length > 0) {
      // Select product based on productId
      if (props.productId) {
        selectedProduct.value = response.Wheels.find(w => w.Id === props.productId) || response.Wheels[0];
      } else {
        selectedProduct.value = response.Wheels[0];
      }

      // Initialize selections based on the selected product
      if (selectedProduct.value) {
        selectedFinish.value = getFinishName(selectedProduct.value);
        selectedSize.value = `${selectedProduct.value.Diameter}" x ${selectedProduct.value.Width}"`;
        selectedOffset.value = selectedProduct.value.Offset.toString();
        selectedModel.value = selectedProduct.value.NicheTag || availableModels.value[0] || '';
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
  if (!apiResponse.value || !selectedFinish.value || !selectedSize.value || !selectedOffset.value) return;

  // Parse the size string
  const [diameter, width] = selectedSize.value.match(/(\d+\.?\d*)/g) || [];
  if (!diameter || !width) return;

  // Find matching product based on finish, size, and offset
  const matchingProduct = seriesProducts.value.find(wheel => {
    const matchesFinish = getFinishName(wheel) === selectedFinish.value;
    const matchesSize = wheel.Diameter === parseFloat(diameter) && wheel.Width === parseFloat(width);
    const matchesOffset = wheel.Offset === parseFloat(selectedOffset.value);
    return matchesFinish && matchesSize && matchesOffset;
  });

  if (matchingProduct) {
    selectedProduct.value = matchingProduct;
    currentImageIndex.value = 0; // Reset to first image
  }
}

// Watch for changes in selections
watch([selectedFinish, selectedSize, selectedOffset], () => {
  updateProductBasedOnSelections();
});

// Reset dependent selections when finish changes
watch(selectedFinish, () => {
  if (availableSizes.value.length > 0 && !availableSizes.value.includes(selectedSize.value)) {
    selectedSize.value = availableSizes.value[0] || '';
  }
});

// Reset offset when size changes
watch(selectedSize, () => {
  if (availableOffsets.value.length > 0 && !availableOffsets.value.includes(parseFloat(selectedOffset.value))) {
    selectedOffset.value = availableOffsets.value[0]?.toString() || '';
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

function addToCart() {
  if (!selectedProduct.value) return;

  CartManager.addItem({
    product: selectedProduct.value,
    quantity: 1,
    frontWheels: 2,
    rearWheels: 2,
    vehicleModel: selectedModel.value
  });

  // Redirect to cart
  window.location.href = CART_ROUTE;
}

onMounted(() => {
  loadProducts();
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

    <!-- Main Content Container -->
    <div v-else-if="selectedProduct" class="max-w-[1728px] mx-auto px-16 py-12">
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
            <!-- Model & Trim -->
            <div v-if="availableModels.length > 0">
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                MODEL & TRIM:
              </label>
              <div class="relative">
                <select
                  v-model="selectedModel"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white"
                >
                  <option v-for="model in availableModels" :key="model" :value="model">
                    CORVETTE {{ model.toUpperCase() }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

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

            <!-- Size -->
            <div>
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                SIZE:
              </label>
              <div class="relative">
                <select
                  v-model="selectedSize"
                  :disabled="availableSizes.length === 0"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option v-for="size in availableSizes" :key="size" :value="size">
                    {{ size }}
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                    <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Offset -->
            <div>
              <label class="block text-base font-['Excon_Variable'] font-light text-black/70 mb-2">
                OFFSET:
              </label>
              <div class="relative">
                <select
                  v-model="selectedOffset"
                  :disabled="availableOffsets.length === 0"
                  class="w-full h-10 border border-[#ccc] rounded-lg px-4 text-base font-['Excon_Variable'] font-light text-black/80 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option v-for="offset in availableOffsets" :key="offset" :value="offset.toString()">
                    {{ offset > 0 ? '+' : '' }}{{ offset }}mm
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
            class="w-full h-10 bg-e5-red rounded-lg text-white text-base font-['Excon_Variable'] font-light tracking-[0.32em] hover:bg-e5-red/90 transition-colors"
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
          <div class="space-y-2 pt-4 text-sm text-black/60">
            <p><strong>Part Number:</strong> {{ selectedProduct.Pn }}</p>
            <p><strong>Material:</strong> {{ selectedProduct.Material }}</p>
            <p><strong>Load Rating:</strong> {{ selectedProduct.LoadRating }} lbs</p>
            <p v-if="selectedProduct.InStock" class="text-green-600"><strong>✓ In Stock</strong></p>
            <p v-else class="text-red-600"><strong>Out of Stock</strong></p>
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
