<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchWheels, getWheelImageUrl, formatPrice, type WheelProduct, type WheelsApiResponse } from '@/core/services/ProductService';
import { SINGLE_PRODUCT_ROUTE } from '@/core/constants/Routes';
import VehicleSelector from '@/core/components/VehicleSelector.vue';
import { filterWheelsByVehicle, hasStaggeredFitment, getFrontFitments, getRearFitments, type Vehicle } from '@/core/services/VehicleService';

// State
const apiResponse = ref<WheelsApiResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedSeries = ref<string>('All Series');
const searchQuery = ref('');
const selectedVehicle = ref<Vehicle | null>(null);

// Computed - Check if selected vehicle has staggered fitment
const isStaggered = computed(() => {
  return selectedVehicle.value ? hasStaggeredFitment(selectedVehicle.value) : false;
});

// Computed - Get available series (unique Model names)
const availableSeries = computed(() => {
  if (!apiResponse.value) return [];
  const series = new Set<string>();
  apiResponse.value.Wheels.forEach(wheel => {
    series.add(wheel.Model);
  });
  return ['All Series', ...Array.from(series).sort()];
});

// Filter products by series, search, and vehicle fitment
const filteredProducts = computed(() => {
  if (!apiResponse.value) return [];
  let products = apiResponse.value.Wheels;

  // Filter by vehicle fitment first (most restrictive)
  if (selectedVehicle.value) {
    products = filterWheelsByVehicle(products, selectedVehicle.value);
  }

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
      // Store one representative product for each unique finish combination
      const finishMap = new Map<string, WheelProduct>();
      products.forEach(p => {
        const finishKey = getFinishName(p);

        if (!finishMap.has(finishKey)) {
          // First product with this finish combination - store it
          finishMap.set(finishKey, p);
        } else {
          // We already have a product for this finish combination
          // Select the best representative product based on multiple criteria
          const existing = finishMap.get(finishKey)!;
          let shouldReplace = false;

          // For staggered fitment, prefer smaller wheels (more likely to be front wheels)
          // This ensures when user clicks, they land on a product that fits the front
          if (isStaggered.value && selectedVehicle.value) {
            const frontFitments = getFrontFitments(selectedVehicle.value);
            const pMatchesFront = frontFitments.some(f =>
              f.RimDiameter === p.Diameter &&
              (f.RimWidth === p.Width || (f.RimWidthMin && f.RimWidthMax && p.Width >= f.RimWidthMin && p.Width <= f.RimWidthMax))
            );
            const existingMatchesFront = frontFitments.some(f =>
              f.RimDiameter === existing.Diameter &&
              (f.RimWidth === existing.Width || (f.RimWidthMin && f.RimWidthMax && existing.Width >= f.RimWidthMin && existing.Width <= f.RimWidthMax))
            );

            // Strongly prefer front-fitting products
            if (pMatchesFront && !existingMatchesFront) {
              shouldReplace = true;
            } else if (pMatchesFront && existingMatchesFront) {
              // Both fit front, prefer one with image and in stock
              if (p.Img0001 && !existing.Img0001) {
                shouldReplace = true;
              } else if (p.Img0001 && existing.Img0001 && p.InStock && !existing.InStock) {
                shouldReplace = true;
              }
            }
          } else {
            // Non-staggered: just prefer products with images and in stock
            if (p.Img0001 && !existing.Img0001) {
              shouldReplace = true;
            } else if (p.Img0001 && existing.Img0001 && p.InStock && !existing.InStock) {
              shouldReplace = true;
            }
          }

          if (shouldReplace) {
            finishMap.set(finishKey, p);
          }
        }
      });

      // Get unique sizes for this series
      const allSizes = Array.from(new Set(products.map(p => `${p.Diameter}" x ${p.Width}"`))).sort();

      // For staggered fitment, separate front and rear sizes
      let frontSizes: string[] = [];
      let rearSizes: string[] = [];
      if (isStaggered.value && selectedVehicle.value) {
        const frontFitments = getFrontFitments(selectedVehicle.value);
        const rearFitments = getRearFitments(selectedVehicle.value);

        // Get front sizes
        const frontSizeSet = new Set<string>();
        products.forEach(wheel => {
          const matchesFront = frontFitments.some(f =>
            f.RimDiameter === wheel.Diameter &&
            (f.RimWidth === wheel.Width || (f.RimWidthMin && f.RimWidthMax && wheel.Width >= f.RimWidthMin && wheel.Width <= f.RimWidthMax))
          );
          if (matchesFront) {
            const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
            frontSizeSet.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
          }
        });
        frontSizes = Array.from(frontSizeSet).sort();

        // Get rear sizes
        const rearSizeSet = new Set<string>();
        products.forEach(wheel => {
          const matchesRear = rearFitments.some(f =>
            f.RimDiameter === wheel.Diameter &&
            (f.RimWidth === wheel.Width || (f.RimWidthMin && f.RimWidthMax && wheel.Width >= f.RimWidthMin && wheel.Width <= f.RimWidthMax))
          );
          if (matchesRear) {
            const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
            rearSizeSet.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
          }
        });
        rearSizes = Array.from(rearSizeSet).sort();
      }

      return {
        seriesName,
        totalVariants: products.length,
        // Array of finish variations with their representative product
        finishVariations: Array.from(finishMap.entries()).map(([finish, product]) => {
          // Get all products for this specific finish combination
          const finishProducts = products.filter(p => getFinishName(p) === finish);

          // For staggered fitment, calculate front and rear sizes for this finish
          let finishFrontSizes: string[] = [];
          let finishRearSizes: string[] = [];
          if (isStaggered.value && selectedVehicle.value) {
            const frontFitments = getFrontFitments(selectedVehicle.value);
            const rearFitments = getRearFitments(selectedVehicle.value);

            // Get front sizes for this finish
            const frontSizeSet = new Set<string>();
            finishProducts.forEach(wheel => {
              const matchesFront = frontFitments.some(f =>
                f.RimDiameter === wheel.Diameter &&
                (f.RimWidth === wheel.Width || (f.RimWidthMin && f.RimWidthMax && wheel.Width >= f.RimWidthMin && wheel.Width <= f.RimWidthMax))
              );
              if (matchesFront) {
                const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
                frontSizeSet.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
              }
            });
            finishFrontSizes = Array.from(frontSizeSet).sort();

            // Get rear sizes for this finish
            const rearSizeSet = new Set<string>();
            finishProducts.forEach(wheel => {
              const matchesRear = rearFitments.some(f =>
                f.RimDiameter === wheel.Diameter &&
                (f.RimWidth === wheel.Width || (f.RimWidthMin && f.RimWidthMax && wheel.Width >= f.RimWidthMin && wheel.Width <= f.RimWidthMax))
              );
              if (matchesRear) {
                const offset = wheel.Offset > 0 ? `+${wheel.Offset}` : `${wheel.Offset}`;
                rearSizeSet.add(`${wheel.Diameter}" x ${wheel.Width}" ${offset}mm`);
              }
            });
            finishRearSizes = Array.from(rearSizeSet).sort();
          }

          return {
            finish,
            product,
            variantCount: finishProducts.length,
            sizes: Array.from(new Set(finishProducts.map(p => `${p.Diameter}" x ${p.Width}"`))).sort(),
            frontSizes: finishFrontSizes,
            rearSizes: finishRearSizes,
            priceRange: {
              min: Math.min(...finishProducts.map(p => p.Price)),
              max: Math.max(...finishProducts.map(p => p.Price))
            }
          };
        }).filter(variation => {
          // For staggered fitment, only show finishes that have BOTH front AND rear sizes available
          // Customers want complete sets, not just front-only or rear-only
          if (isStaggered.value && selectedVehicle.value) {
            return variation.frontSizes.length > 0 && variation.rearSizes.length > 0;
          }
          // For non-staggered, show all variations
          return true;
        }),
        allSizes,
        frontSizes,
        rearSizes,
        // Get overall price range for series
        priceRange: {
          min: Math.min(...products.map(p => p.Price)),
          max: Math.max(...products.map(p => p.Price))
        }
      };
    }).filter(series => {
      // Hide series that have no finish variations after filtering
      // This happens when all finishes in a series only have front OR rear (not both) for staggered vehicles
      return series.finishVariations.length > 0;
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

function handleVehicleSelected(vehicle: Vehicle | null) {
  selectedVehicle.value = vehicle;
}

onMounted(() => {
  loadProducts();

  // Check for series query parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const seriesParam = urlParams.get('series');
  if (seriesParam) {
    selectedSeries.value = seriesParam;
  }
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
      <!-- Vehicle Selector -->
      <VehicleSelector @vehicle-selected="handleVehicleSelected" />

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
            <span v-if="selectedVehicle" class="text-e5-red font-['Franklin_Gothic_Demi']">
              • Filtered for your vehicle
            </span>
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
                  <!-- Non-staggered: Show regular sizes -->
                  <template v-if="!isStaggered">
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
                  </template>

                  <!-- Staggered: Show front and rear sizes separately -->
                  <template v-else>
                    <p class="text-xs font-['Franklin_Gothic_Demi'] text-e5-red/80 mb-1">
                      STAGGERED FITMENT
                    </p>

                    <!-- Front Sizes -->
                    <div v-if="variation.frontSizes.length > 0" class="mb-2">
                      <p class="text-xs font-['Franklin_Gothic_Medium'] text-black/70 mb-1">
                        FRONT:
                      </p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="size in variation.frontSizes"
                          :key="'front-' + size"
                          class="text-xs font-['Franklin_Gothic_Book'] text-black/70 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          {{ size }}
                        </span>
                      </div>
                    </div>

                    <!-- Rear Sizes -->
                    <div v-if="variation.rearSizes.length > 0">
                      <p class="text-xs font-['Franklin_Gothic_Medium'] text-black/70 mb-1">
                        REAR:
                      </p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="size in variation.rearSizes"
                          :key="'rear-' + size"
                          class="text-xs font-['Franklin_Gothic_Book'] text-black/70 bg-green-50 px-2 py-0.5 rounded border border-green-200"
                        >
                          {{ size }}
                        </span>
                      </div>
                    </div>

                    <!-- No staggered sizes available -->
                    <p v-if="variation.frontSizes.length === 0 && variation.rearSizes.length === 0" class="text-xs font-['Franklin_Gothic_Book'] text-black/50 italic">
                      No staggered fitment sizes available for this finish
                    </p>
                  </template>
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
        <p v-if="selectedVehicle" class="text-lg font-['Franklin_Gothic_Book'] text-black/40 mt-4">
          No wheels fit your selected vehicle with the current filters.
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
