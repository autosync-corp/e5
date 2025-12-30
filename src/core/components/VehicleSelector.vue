<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Vehicle } from '@/core/services/VehicleService';

const emit = defineEmits<{
  vehicleSelected: [vehicle: Vehicle | null];
}>();

// Storage key for localStorage
const VEHICLE_STORAGE_KEY = 'e5-selected-vehicle';

// Reactive state
const selectedYear = ref<number | null>(null);
const selectedMake = ref<string | null>(null);
const selectedModel = ref<string | null>(null);
const selectedSubmodel = ref<string | null>(null);
const selectedVehicle = ref<Vehicle | null>(null);

const availableYears = ref<number[]>([]);
const availableMakes = ref<string[]>([]);
const availableModels = ref<string[]>([]);
const availableSubmodels = ref<string[]>([]);

const isLoadingYears = ref(false);
const isLoadingMakes = ref(false);
const isLoadingModels = ref(false);
const isLoadingSubmodels = ref(false);
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
      selectedYear.value = vehicle.Year;
      selectedMake.value = vehicle.Make;
      selectedModel.value = vehicle.Model;
      selectedSubmodel.value = vehicle.Submodel;
      emit('vehicleSelected', vehicle);
    } catch (error) {
      console.error('Error loading saved vehicle:', error);
      localStorage.removeItem(VEHICLE_STORAGE_KEY);
    }
  }

  // Load initial years
  await fetchYears();
});

// Fetch available years
async function fetchYears() {
  isLoadingYears.value = true;
  try {
    const params = new URLSearchParams({
      key: API_KEY,
      'i-tags': 'true',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch years');

    const data = await response.json();
    const years = new Set<number>();
    data.Vehicles?.forEach((v: Vehicle) => years.add(v.Year));
    availableYears.value = Array.from(years).sort((a, b) => b - a); // Descending
  } catch (error) {
    console.error('Error fetching years:', error);
  } finally {
    isLoadingYears.value = false;
  }
}

// Fetch available makes for selected year
async function fetchMakes(year: number) {
  isLoadingMakes.value = true;
  availableMakes.value = [];
  selectedMake.value = null;
  selectedModel.value = null;
  selectedSubmodel.value = null;

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      'f-year': year.toString(),
      'i-tags': 'true',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch makes');

    const data = await response.json();
    const makes = new Set<string>();
    data.Vehicles?.forEach((v: Vehicle) => makes.add(v.Make));
    availableMakes.value = Array.from(makes).sort();
  } catch (error) {
    console.error('Error fetching makes:', error);
  } finally {
    isLoadingMakes.value = false;
  }
}

// Fetch available models for selected year and make
async function fetchModels(year: number, make: string) {
  isLoadingModels.value = true;
  availableModels.value = [];
  selectedModel.value = null;
  selectedSubmodel.value = null;

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      'f-year': year.toString(),
      'f-make': make,
      'i-tags': 'true',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch models');

    const data = await response.json();
    const models = new Set<string>();
    data.Vehicles?.forEach((v: Vehicle) => models.add(v.Model));
    availableModels.value = Array.from(models).sort();
  } catch (error) {
    console.error('Error fetching models:', error);
  } finally {
    isLoadingModels.value = false;
  }
}

// Fetch available submodels for selected year, make, and model
async function fetchSubmodels(year: number, make: string, model: string) {
  isLoadingSubmodels.value = true;
  availableSubmodels.value = [];
  selectedSubmodel.value = null;

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      'f-year': year.toString(),
      'f-make': make,
      'f-model': model,
      'i-tags': 'true',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch submodels');

    const data = await response.json();
    const submodels = new Set<string>();
    data.Vehicles?.forEach((v: Vehicle) => {
      if (v.Submodel) submodels.add(v.Submodel);
    });
    availableSubmodels.value = Array.from(submodels).sort();
  } catch (error) {
    console.error('Error fetching submodels:', error);
  } finally {
    isLoadingSubmodels.value = false;
  }
}

// Fetch full vehicle data with fitments
async function fetchVehicle(year: number, make: string, model: string, submodel: string) {
  isLoadingVehicle.value = true;

  try {
    const query = `${year} ${make} ${model} ${submodel}`;
    const params = new URLSearchParams({
      key: API_KEY,
      'f-query': query,
      'i-fitments': 'true',
      'i-optionalFitments': 'true',
      'i-plusSizes': 'true',
      'i-tags': 'true',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch vehicle');

    const data = await response.json();
    if (data.Vehicles && data.Vehicles.length > 0) {
      const vehicle = data.Vehicles[0];
      selectedVehicle.value = vehicle;

      // Save to localStorage
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicle));

      // Emit to parent
      emit('vehicleSelected', vehicle);
    }
  } catch (error) {
    console.error('Error fetching vehicle:', error);
  } finally {
    isLoadingVehicle.value = false;
  }
}

// Watch for year changes
watch(selectedYear, async (newYear) => {
  if (newYear) {
    await fetchMakes(newYear);
  } else {
    availableMakes.value = [];
    availableModels.value = [];
    availableSubmodels.value = [];
  }
});

// Watch for make changes
watch(selectedMake, async (newMake) => {
  if (newMake && selectedYear.value) {
    await fetchModels(selectedYear.value, newMake);
  } else {
    availableModels.value = [];
    availableSubmodels.value = [];
  }
});

// Watch for model changes
watch(selectedModel, async (newModel) => {
  if (newModel && selectedYear.value && selectedMake.value) {
    await fetchSubmodels(selectedYear.value, selectedMake.value, newModel);
  } else {
    availableSubmodels.value = [];
  }
});

// Watch for submodel changes
watch(selectedSubmodel, async (newSubmodel) => {
  if (newSubmodel && selectedYear.value && selectedMake.value && selectedModel.value) {
    await fetchVehicle(selectedYear.value, selectedMake.value, selectedModel.value, newSubmodel);
  }
});

// Clear selection
function clearVehicle() {
  selectedYear.value = null;
  selectedMake.value = null;
  selectedModel.value = null;
  selectedSubmodel.value = null;
  selectedVehicle.value = null;
  availableMakes.value = [];
  availableModels.value = [];
  availableSubmodels.value = [];
  localStorage.removeItem(VEHICLE_STORAGE_KEY);
  emit('vehicleSelected', null);
}

const vehicleDisplay = computed(() => {
  if (!selectedVehicle.value) return null;
  const v = selectedVehicle.value;
  return `${v.Year} ${v.Make} ${v.Model} ${v.Submodel}`;
});
</script>

<template>
  <div class="vehicle-selector">
    <div class="selector-header">
      <h2 class="selector-title">SELECT YOUR VEHICLE</h2>
      <p class="selector-subtitle">Find wheels that fit your Corvette perfectly</p>
    </div>

    <div v-if="!selectedVehicle" class="dropdowns-container">
      <!-- Year Dropdown -->
      <div class="dropdown-wrapper">
        <label class="dropdown-label">YEAR</label>
        <select
          v-model="selectedYear"
          class="dropdown-select"
          :disabled="isLoadingYears"
        >
          <option :value="null">Select Year</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <!-- Make Dropdown -->
      <div class="dropdown-wrapper">
        <label class="dropdown-label">MAKE</label>
        <select
          v-model="selectedMake"
          class="dropdown-select"
          :disabled="!selectedYear || isLoadingMakes"
        >
          <option :value="null">Select Make</option>
          <option v-for="make in availableMakes" :key="make" :value="make">
            {{ make }}
          </option>
        </select>
      </div>

      <!-- Model Dropdown -->
      <div class="dropdown-wrapper">
        <label class="dropdown-label">MODEL</label>
        <select
          v-model="selectedModel"
          class="dropdown-select"
          :disabled="!selectedMake || isLoadingModels"
        >
          <option :value="null">Select Model</option>
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <!-- Submodel Dropdown -->
      <div class="dropdown-wrapper">
        <label class="dropdown-label">SUBMODEL</label>
        <select
          v-model="selectedSubmodel"
          class="dropdown-select"
          :disabled="!selectedModel || isLoadingSubmodels"
        >
          <option :value="null">Select Submodel</option>
          <option v-for="submodel in availableSubmodels" :key="submodel" :value="submodel">
            {{ submodel }}
          </option>
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
  @apply w-full bg-gray-900 py-8 px-6 mb-8;
}

.selector-header {
  @apply text-center mb-6;
}

.selector-title {
  @apply font-franklin-heavy text-xl text-white tracking-[3px] mb-2;
}

.selector-subtitle {
  @apply font-franklin-book text-14 text-gray-400;
}

.dropdowns-container {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto;
}

.dropdown-wrapper {
  @apply flex flex-col;
}

.dropdown-label {
  @apply font-franklin-demi text-xs text-gray-400 tracking-[2px] mb-2;
}

.dropdown-select {
  @apply w-full bg-gray-800 text-white font-franklin-book text-14 px-4 py-3 border border-gray-700
         focus:border-e5-red focus:outline-none transition-colors cursor-pointer;
}

.dropdown-select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.loading-indicator {
  @apply col-span-full text-center text-gray-400 font-franklin-book text-14 py-4;
}

.selected-vehicle {
  @apply flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto
         bg-gray-800 px-6 py-4 border border-e5-red;
}

.vehicle-info {
  @apply flex flex-col md:flex-row items-center gap-2;
}

.vehicle-label {
  @apply font-franklin-demi text-xs text-gray-400 tracking-[2px];
}

.vehicle-text {
  @apply font-franklin-heavy text-16 text-white tracking-[1px];
}

.clear-button {
  @apply font-franklin-demi text-xs text-white tracking-[2px] px-6 py-2
         border border-white hover:bg-white hover:text-black transition-colors;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .vehicle-selector {
    @apply py-6 px-4;
  }

  .selector-title {
    @apply text-16;
  }

  .selector-subtitle {
    @apply text-xs;
  }

  .dropdowns-container {
    @apply gap-3;
  }
}
</style>
