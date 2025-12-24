<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchWheels, getWheelImageUrl, formatPrice, type WheelProduct, type WheelsApiResponse } from '@/core/services/ProductService';
import { SINGLE_PRODUCT_ROUTE } from '@/core/constants/Routes';

// State
const apiResponse = ref<WheelsApiResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedSeries = ref<string>('');
const searchQuery = ref('');

// Computed - Get available series (unique Model names)
const availableSeries = computed(() => {
  if (!apiResponse.value) return [];
  const series = new Set<string>();
  apiResponse.value.Wheels.forEach(wheel => {
    series.add(wheel.Model);
  });
  return ['All Series', ...Array.from(series).sort()];
});

// Filter products by series and search
const filteredProducts = computed(() => {
  if (!apiResponse.value) return [];
  let products = apiResponse.value.Wheels;

  // Filter by series (Model)
  if (selectedSeries.value && selectedSeries.value !== 'All Series') {
    products = products.filter(p => p.Model === selectedSeries.value);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    products = products.filter(p =>
      p.Model.toLowerCase().includes(query) ||
      p.Pn.toLowerCase().includes(query) ||
      (p.Color && p.Color.toLowerCase().includes(query)) ||
      (p.Finish && p.Finish.toLowerCase().includes(query))
    );
  }

  return products;
});

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

// Group products by series (Model) and then by finish combination
const productsBySeries = computed(() => {
  const seriesMap = new Map<string, WheelProduct[]>();

  filteredProducts.value.forEach(product => {
    const seriesName = product.Model;
    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, []);
    }
    seriesMap.get(seriesName)!.push(product);
  });

  // Convert to array and sort by series name
  return Array.from(seriesMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([seriesName, products]) => {
      // Group by complete finish name (Color + Finish + Accent)
      const finishMap = new Map<string, WheelProduct>();
      products.forEach(p => {
        const finishKey = getFinishName(p);
        if (!finishMap.has(finishKey)) {
          finishMap.set(finishKey, p);
        }
      });

      // Get unique sizes for this series
      const allSizes = Array.from(new Set(products.map(p => `${p.Diameter}" x ${p.Width}"`))).sort();

      return {
        seriesName,
        totalVariants: products.length,
        // Array of finish variations with their representative product
        finishVariations: Array.from(finishMap.entries()).map(([finish, product]) => {
          // Get all products for this specific finish combination
          const finishProducts = products.filter(p => getFinishName(p) === finish);
          return {
            finish,
            product,
            variantCount: finishProducts.length,
            sizes: Array.from(new Set(finishProducts.map(p => `${p.Diameter}" x ${p.Width}"`))).sort(),
            priceRange: {
              min: Math.min(...finishProducts.map(p => p.Price)),
              max: Math.max(...finishProducts.map(p => p.Price))
            }
          };
        }),
        allSizes,
        // Get overall price range for series
        priceRange: {
          min: Math.min(...products.map(p => p.Price)),
          max: Math.max(...products.map(p => p.Price))
        }
      };
    });
});

// Methods
async function loadProducts() {
  try {
    isLoading.value = true;
    error.value = null;
    const response = await fetchWheels({ inStockOnly: false });
    apiResponse.value = response;
  } catch (err) {
    error.value = 'Failed to load products. Please try again.';
    console.error('Error loading products:', err);
  } finally {
    isLoading.value = false;
  }
}

function goToProduct(productId: number) {
  window.location.href = `${SINGLE_PRODUCT_ROUTE}?id=${productId}`;
}

function getProductDisplayName(product: WheelProduct): string {
  const finish = product.ShortFinish || product.Finish || '';
  const color = product.ShortColor || product.Color || '';
  return `${product.Model} - ${color} ${finish}`.trim();
}

function getProductImage(product: WheelProduct): string {
  if (!apiResponse.value) return '';
  return getWheelImageUrl(apiResponse.value.ImgUrlBase, product.Img0001);
}

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <div class="w-full bg-white min-h-screen">
    <!-- Hero Section -->
    <section class="relative w-full h-[400px] bg-gradient-to-r from-black to-gray-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-6xl font-['Franklin_Gothic_Demi'] text-white tracking-wider mb-4">
          E5 WHEELS SHOP
        </h1>
        <p class="text-xl font-['Franklin_Gothic_Book'] text-white/80">
          Exclusively Engineered for Corvettes
        </p>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-[1728px] mx-auto px-16 py-12 text-center">
      <p class="text-xl text-black/70">Loading products...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-[1728px] mx-auto px-16 py-12 text-center">
      <p class="text-xl text-red-600">{{ error }}</p>
    </div>

    <!-- Shop Content -->
    <div v-else class="max-w-[1728px] mx-auto px-16 py-12">
      <!-- Filters Section -->
      <div class="mb-12 space-y-6">
        <!-- Search Bar -->
        <div class="w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by model, part number, or color..."
            class="w-full h-12 px-6 border-2 border-gray-300 rounded-lg text-base font-['Franklin_Gothic_Book'] focus:border-e5-red focus:outline-none transition-colors"
          />
        </div>

        <!-- Series Filter Dropdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Series Filter -->
          <div class="relative">
            <select
              v-model="selectedSeries"
              class="w-full h-12 px-4 border-2 border-gray-300 rounded-lg text-base font-['Franklin_Gothic_Book'] appearance-none bg-white cursor-pointer focus:border-e5-red focus:outline-none transition-colors"
            >
              <option v-for="series in availableSeries" :key="series" :value="series">
                {{ series }}
              </option>
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="opacity-70">
                <path d="M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z" fill="black"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Results Count -->
        <div class="text-center">
          <p class="text-lg font-['Franklin_Gothic_Book'] text-black/70">
            Showing {{ productsBySeries.length }} series ({{ filteredProducts.length }} variants)
          </p>
        </div>
      </div>

      <!-- Products Grid by Series -->
      <div class="space-y-16">
        <div v-for="series in productsBySeries" :key="series.seriesName" class="space-y-6">
          <!-- Series Header -->
          <div class="border-b-2 border-e5-red pb-3">
            <h2 class="text-3xl font-['Franklin_Gothic_Demi'] text-black tracking-wider">
              {{ series.seriesName.toUpperCase() }}
            </h2>
            <div class="mt-2 flex flex-wrap gap-3 text-sm font-['Franklin_Gothic_Book'] text-black/70">
              <span>{{ series.totalVariants }} Variants</span>
              <span>•</span>
              <span>{{ series.finishVariations.length }} Finishes</span>
              <span>•</span>
              <span>{{ series.allSizes.length }} Sizes</span>
            </div>
          </div>

          <!-- Cards for Each Finish Variation -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div
              v-for="variation in series.finishVariations"
              :key="variation.product.Id"
              @click="goToProduct(variation.product.Id)"
              class="group cursor-pointer bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-e5-red hover:shadow-xl transition-all duration-300"
            >
              <!-- Product Image -->
              <div class="aspect-square bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                <img
                  :src="getProductImage(variation.product)"
                  :alt="`${series.seriesName} - ${variation.finish}`"
                  class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <!-- Product Info -->
              <div class="p-6 space-y-3">
                <h3 class="text-xl font-['Franklin_Gothic_Demi'] text-e5-red tracking-wide">
                  {{ series.seriesName.toUpperCase() }}
                </h3>

                <!-- Finish Name -->
                <div class="flex items-center gap-2">
                  <span class="text-sm font-['Franklin_Gothic_Medium'] text-black bg-gray-100 px-3 py-1 rounded">
                    {{ variation.finish }}
                  </span>
                  <span
                    v-if="variation.product.InStock"
                    class="text-xs font-['Franklin_Gothic_Book'] text-green-600 bg-green-50 px-2 py-1 rounded"
                  >
                    In Stock
                  </span>
                </div>

                <!-- Available Sizes for this Finish -->
                <div class="space-y-1">
                  <p class="text-xs font-['Franklin_Gothic_Book'] text-black/60">
                    {{ variation.variantCount }} size{{ variation.variantCount !== 1 ? 's' : '' }} available
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="size in variation.sizes"
                      :key="size"
                      class="text-xs font-['Franklin_Gothic_Book'] text-black/70 bg-gray-50 px-2 py-0.5 rounded"
                    >
                      {{ size }}
                    </span>
                  </div>
                </div>

                <!-- Price Range for this Finish -->
                <div class="pt-3 border-t border-gray-200">
                  <p class="text-lg font-['Franklin_Gothic_Demi'] text-black">
                    <span v-if="variation.priceRange.min === variation.priceRange.max">
                      {{ formatPrice(variation.priceRange.min) }}
                    </span>
                    <span v-else>
                      {{ formatPrice(variation.priceRange.min) }} - {{ formatPrice(variation.priceRange.max) }}
                    </span>
                  </p>
                </div>

                <!-- View Details Button -->
                <button class="w-full mt-4 h-10 bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-sm tracking-wider rounded-lg group-hover:bg-e5-red/90 transition-colors">
                  VIEW OPTIONS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="productsBySeries.length === 0" class="text-center py-20">
        <p class="text-2xl font-['Franklin_Gothic_Book'] text-black/50">
          No products found matching your filters.
        </p>
        <button
          @click="selectedSeries = ''; searchQuery = ''"
          class="mt-6 px-8 py-3 bg-e5-red text-white font-['Franklin_Gothic_Medium'] rounded-lg hover:bg-e5-red/90 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
select:focus,
input:focus {
  outline: none;
}
</style>
