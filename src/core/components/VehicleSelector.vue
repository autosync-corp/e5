<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Vehicle } from '@/core/services/VehicleService';

const emit = defineEmits<{
  vehicleSelected: [vehicle: Vehicle | null];
}>();

// Storage key for localStorage
const VEHICLE_STORAGE_KEY = 'e5-selected-vehicle';
const VEHICLE_DISPLAY_KEY = 'e5-selected-vehicle-display';

// Generation-based vehicle selection mapping
interface VehicleOption {
  label: string;
  yearRange: { start: number; end: number };
  preferredYear: number;
  make: string;
  model: string;
  submodel: string;
}

interface Generation {
  label: string;
  options: VehicleOption[];
}

const GENERATION_MAP: Generation[] = [
  {
    label: 'C8',
    options: [
      { label: 'Stingray', yearRange: { start: 2020, end: 2025 }, preferredYear: 2023, make: 'Chevrolet', model: 'Corvette', submodel: 'Stingray' },
      { label: 'Z06', yearRange: { start: 2023, end: 2025 }, preferredYear: 2023, make: 'Chevrolet', model: 'Corvette', submodel: 'Z06' },
      { label: 'ZR1', yearRange: { start: 2025, end: 2025 }, preferredYear: 2025, make: 'Chevrolet', model: 'Corvette', submodel: 'ZR1' },
      { label: 'E-Ray', yearRange: { start: 2024, end: 2025 }, preferredYear: 2024, make: 'Chevrolet', model: 'Corvette', submodel: 'eray' },
    ]
  },
  {
    label: 'C7',
    options: [
      { label: 'Stingray', yearRange: { start: 2014, end: 2019 }, preferredYear: 2018, make: 'Chevrolet', model: 'Corvette', submodel: 'Stingray' },
      { label: 'Grand Sport', yearRange: { start: 2017, end: 2019 }, preferredYear: 2018, make: 'Chevrolet', model: 'Corvette', submodel: 'Grand Sport' },
      { label: 'Z06', yearRange: { start: 2015, end: 2019 }, preferredYear: 2018, make: 'Chevrolet', model: 'Corvette', submodel: 'Z06' },
      { label: 'ZR1', yearRange: { start: 2019, end: 2019 }, preferredYear: 2019, make: 'Chevrolet', model: 'Corvette', submodel: 'ZR1' },
    ]
  },
  {
    label: 'C6',
    options: [
      { label: 'Base Model', yearRange: { start: 2005, end: 2013 }, preferredYear: 2009, make: 'Chevrolet', model: 'Corvette', submodel: 'Coupe' },
      { label: 'Grand Sport', yearRange: { start: 2010, end: 2013 }, preferredYear: 2011, make: 'Chevrolet', model: 'Corvette', submodel: 'Grand Sport' },
      { label: 'Z06', yearRange: { start: 2006, end: 2013 }, preferredYear: 2009, make: 'Chevrolet', model: 'Corvette', submodel: 'Z06' },
      { label: 'ZR1', yearRange: { start: 2009, end: 2013 }, preferredYear: 2011, make: 'Chevrolet', model: 'Corvette', submodel: 'ZR1' },
    ]
  },
  {
    label: 'C5',
    options: [
      { label: 'Base Model', yearRange: { start: 1997, end: 2004 }, preferredYear: 2001, make: 'Chevrolet', model: 'Corvette', submodel: 'Coupe' },
      { label: 'Z06', yearRange: { start: 2001, end: 2004 }, preferredYear: 2002, make: 'Chevrolet', model: 'Corvette', submodel: 'Z06' },
    ]
  }
];

// Reactive state
const selectedOption = ref<string>('');
const selectedVehicle = ref<Vehicle | null>(null);
const isLoadingVehicle = ref(false);

const API_BASE_URL = 'https://api.autosyncstudio.com/vehicles';
const API_KEY = 'efive';

// Load saved vehicle from localStorage on mount
onMounted(async () => {
  const savedVehicle = localStorage.getItem(VEHICLE_STORAGE_KEY);
  if (savedVehicle) {
    try {
      const vehicle: Vehicle = JSON.parse(savedVehicle);
      selectedVehicle.value = vehicle;

      // Try to find matching option in generation map
      for (const gen of GENERATION_MAP) {
        const option = gen.options.find(opt =>
          vehicle.Year >= opt.yearRange.start &&
          vehicle.Year <= opt.yearRange.end &&
          opt.make === vehicle.Make &&
          opt.model === vehicle.Model &&
          opt.submodel === vehicle.Submodel
        );
        if (option) {
          selectedOption.value = `${gen.label}-${option.label}`;

          // Save the display format to localStorage
          localStorage.setItem(VEHICLE_DISPLAY_KEY, `${gen.label} ${option.label}`);
          break;
        }
      }

      emit('vehicleSelected', vehicle);
    } catch (error) {
      console.error('Error loading saved vehicle:', error);
      localStorage.removeItem(VEHICLE_STORAGE_KEY);
    }
  }
});

// Get vehicle option from generation map
function getVehicleOption(key: string): VehicleOption | null {
  // Split only on the first hyphen to handle labels like "E-Ray"
  const firstDashIndex = key.indexOf('-');
  if (firstDashIndex === -1) return null;

  const generation = key.substring(0, firstDashIndex);
  const trim = key.substring(firstDashIndex + 1);

  const gen = GENERATION_MAP.find(g => g.label === generation);
  if (!gen) return null;
  return gen.options.find(opt => opt.label === trim) || null;
}

// Get year range for a generation
function getYearRangeForGeneration(generation: Generation): string {
  if (!generation.options || generation.options.length === 0) return '';

  const minYear = Math.min(...generation.options.map(opt => opt.yearRange.start));
  const maxYear = Math.max(...generation.options.map(opt => opt.yearRange.end));

  return `${minYear}-${maxYear}`;
}

// Fetch full vehicle data with fitments
async function fetchVehicle(vehicleOpt: VehicleOption) {
  console.log('🚗 Starting fetchVehicle for:', vehicleOpt);
  isLoadingVehicle.value = true;

  try {
    // Try preferred year first, then try other years in the range
    const yearsToTry = [vehicleOpt.preferredYear];

    // Add other years in descending order
    for (let year = vehicleOpt.yearRange.end; year >= vehicleOpt.yearRange.start; year--) {
      if (year !== vehicleOpt.preferredYear) {
        yearsToTry.push(year);
      }
    }

    console.log('📅 Years to try:', yearsToTry);

    let foundVehicle = null;

    // Try each year until we find a match
    for (const year of yearsToTry) {
      // Query without submodel first to get all vehicles for that year/make/model
      const params = new URLSearchParams({
        key: API_KEY,
        'f-year': year.toString(),
        'f-make': vehicleOpt.make,
        'f-model': vehicleOpt.model,
        'p-number': '1',
        'p-size': '500',
        'i-fitments': 'true',
        'i-optionalFitments': 'true',
        'i-plusSizes': 'true',
        'i-tags': 'true',
      });

      const apiUrl = `${API_BASE_URL}?${params.toString()}`;
      console.log(`🌐 Fetching from API (year ${year}):`, apiUrl);

      const response = await fetch(apiUrl);
      console.log(`📡 Response status:`, response.status, response.ok);

      if (!response.ok) {
        console.warn(`❌ Response not OK for year ${year}`);
        continue;
      }

      const data = await response.json();
      console.log(`📦 API Response data:`, data);
      if (data.Vehicles && data.Vehicles.length > 0) {
        // Debug logging to see what vehicles we're getting
        console.log(`Fetching ${vehicleOpt.label} for year ${year}:`, {
          searchingFor: vehicleOpt.submodel,
          foundVehicles: data.Vehicles.map((v: Vehicle) => ({
            Year: v.Year,
            Make: v.Make,
            Model: v.Model,
            Submodel: v.Submodel
          }))
        });

        // Find a vehicle that matches the submodel (flexible matching)
        const targetSubmodel = vehicleOpt.submodel.toLowerCase().replace(/[-\s]/g, '');

        foundVehicle = data.Vehicles.find((v: Vehicle) => {
          if (!v.Submodel) return false;
          const vehicleSubmodel = v.Submodel.toLowerCase().replace(/[-\s]/g, '');
          const isMatch = vehicleSubmodel === targetSubmodel ||
                 vehicleSubmodel.includes(targetSubmodel) ||
                 targetSubmodel.includes(vehicleSubmodel);

          if (isMatch) {
            console.log(`✓ Match found:`, v.Submodel, 'matches', vehicleOpt.submodel);
          }

          return isMatch;
        });

        if (foundVehicle) break;
      }
    }

    if (foundVehicle) {
      selectedVehicle.value = foundVehicle;

      // Save to localStorage
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(foundVehicle));

      // Also save the display format (generation + trim)
      if (selectedOption.value) {
        const firstDashIndex = selectedOption.value.indexOf('-');
        if (firstDashIndex !== -1) {
          const generation = selectedOption.value.substring(0, firstDashIndex);
          const trim = selectedOption.value.substring(firstDashIndex + 1);
          localStorage.setItem(VEHICLE_DISPLAY_KEY, `${generation} ${trim}`);
        }
      }

      // Emit to parent
      emit('vehicleSelected', foundVehicle);
    } else {
      console.warn(`No vehicle found for ${vehicleOpt.label} in years ${vehicleOpt.yearRange.start}-${vehicleOpt.yearRange.end}`);
    }
  } catch (error) {
    console.error('Error fetching vehicle:', error);
  } finally {
    isLoadingVehicle.value = false;
  }
}

// Watch for option changes
watch(selectedOption, async (newOption) => {
  console.log('👀 Selected option changed to:', newOption);
  if (newOption) {
    const vehicleOpt = getVehicleOption(newOption);
    console.log('🔍 Retrieved vehicle option:', vehicleOpt);
    if (vehicleOpt) {
      await fetchVehicle(vehicleOpt);
    } else {
      console.error('❌ Could not find vehicle option for:', newOption);
    }
  }
});

// Clear selection
function clearVehicle() {
  selectedOption.value = '';
  selectedVehicle.value = null;
  localStorage.removeItem(VEHICLE_STORAGE_KEY);
  localStorage.removeItem(VEHICLE_DISPLAY_KEY);
  emit('vehicleSelected', null);
}

const vehicleDisplay = computed(() => {
  if (!selectedVehicle.value || !selectedOption.value) return null;

  // Extract generation and trim from selectedOption (e.g., "C8-E-Ray")
  // Split only on the first hyphen to handle labels like "E-Ray"
  const firstDashIndex = selectedOption.value.indexOf('-');
  if (firstDashIndex === -1) return null;

  const generation = selectedOption.value.substring(0, firstDashIndex);
  const trim = selectedOption.value.substring(firstDashIndex + 1);

  return `${generation} ${trim}`;
});
</script>

<template>
  <div class="vehicle-selector">
    <div class="selector-header">
      <h2 class="selector-title">SELECT YOUR VEHICLE</h2>
      <p class="selector-subtitle">Find wheels that fit your Corvette perfectly</p>
    </div>

    <div v-if="!selectedVehicle" class="dropdowns-container">
      <!-- Single Generation-Based Dropdown -->
      <div class="dropdown-wrapper">
        <label class="dropdown-label">SELECT YOUR CORVETTE</label>
        <select
          v-model="selectedOption"
          class="dropdown-select"
          :disabled="isLoadingVehicle"
        >
          <option value="">Select Generation & Model</option>
          <optgroup
            v-for="generation in GENERATION_MAP"
            :key="generation.label"
            :label="`${generation.label} ${getYearRangeForGeneration(generation)}`"
          >
            <option
              v-for="option in generation.options"
              :key="`${generation.label}-${option.label}`"
              :value="`${generation.label}-${option.label}`"
            >
              {{ option.label }}
            </option>
          </optgroup>
        </select>
      </div>

      <div v-if="isLoadingVehicle" class="loading-indicator">
        Loading vehicle data...
      </div>
    </div>

    <!-- Selected Vehicle Display -->
    <div v-else class="selected-vehicle">
      <div class="vehicle-info">
        <span class="vehicle-label">SELECTED VEHICLE:</span>
        <span class="vehicle-text">{{ vehicleDisplay }}</span>
      </div>
      <button @click="clearVehicle" class="clear-button">
        CHANGE VEHICLE
      </button>
    </div>
  </div>
</template>

<style scoped>
.vehicle-selector {
  @apply w-full bg-white mb-6;
}

.selector-header {
  @apply hidden;
}

.selector-title {
  @apply hidden;
}

.selector-subtitle {
  @apply hidden;
}

.dropdowns-container {
  @apply flex flex-col gap-0 w-full;
}

.dropdown-wrapper {
  @apply w-full;
}

.dropdown-label {
  @apply hidden;
}

.dropdown-select {
  @apply w-full h-12 px-4 border-2 border-gray-300 rounded-lg text-base font-franklin-book bg-white cursor-pointer
         focus:border-e5-red focus:outline-none transition-colors;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='13' height='13' viewBox='0 0 13 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.5 9.75L1.625 3.25H11.375L6.5 9.75Z' fill='black' fill-opacity='0.7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 3rem;
}

.dropdown-select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.dropdown-select optgroup {
  @apply font-franklin-demi text-xs text-e5-red bg-white py-1;
  font-weight: 600;
  letter-spacing: 2px;
}

.dropdown-select option {
  @apply font-franklin-book text-base text-black bg-white py-2 pl-6;
}

.loading-indicator {
  @apply w-full text-center text-gray-600 font-franklin-book text-sm py-2;
}

.selected-vehicle {
  @apply flex flex-col md:flex-row items-center justify-between w-full h-12 px-4
         bg-white border-2 border-gray-300 rounded-lg;
}

.vehicle-info {
  @apply flex flex-row items-center gap-2;
}

.vehicle-label {
  @apply font-franklin-book text-base text-black/60;
}

.vehicle-text {
  @apply font-franklin-demi text-base text-black;
}

.clear-button {
  @apply font-franklin-book text-sm text-e5-red transition-colors;
  text-decoration: underline;
}

.clear-button:hover {
  opacity: 0.8;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .selected-vehicle {
    @apply h-auto py-3;
  }
}
</style>
