<script setup lang="ts">
import { corvetteGalleryData } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import { ref, computed, watch } from "vue";

const selectedModel = ref<string>("");
const selectedTrim = ref<string>("");
const selectedYear = ref<string>("");

const emit = defineEmits<{
  filter: [filters: { model: string; trim: string; year: string }];
}>();

// Get all unique models (submodels) from the data, sorted
const models = computed(() => {
  const uniqueModels = [...new Set(corvetteGalleryData.map(item => item.submodel).filter(Boolean))];
  return uniqueModels.sort();
});

// Get trims filtered by selected model
const trims = computed(() => {
  if (!selectedModel.value) {
    return [];
  }

  const filteredData = corvetteGalleryData.filter(item => item.submodel === selectedModel.value);
  const uniqueTrims = [...new Set(filteredData.map(item => item.trim).filter(Boolean))];
  return uniqueTrims.sort();
});

// Get years filtered by selected model and trim
const years = computed(() => {
  if (!selectedModel.value || !selectedTrim.value) {
    return [];
  }

  const filteredData = corvetteGalleryData.filter(
    item => item.submodel === selectedModel.value && item.trim === selectedTrim.value
  );
  const uniqueYears = [...new Set(filteredData.map(item => item.year).filter(Boolean))];
  return uniqueYears.sort((a, b) => {
    const yearA = parseInt(a || "0");
    const yearB = parseInt(b || "0");
    return yearB - yearA;
  });
});

// Watch for model changes and reset dependent dropdowns
watch(selectedModel, () => {
  selectedTrim.value = "";
  selectedYear.value = "";
  emitFilters();
});

// Watch for trim changes and reset dependent dropdowns
watch(selectedTrim, () => {
  selectedYear.value = "";
  emitFilters();
});

// Watch for year changes
watch(selectedYear, () => {
  emitFilters();
});

// Emit filter changes
const emitFilters = () => {
  emit("filter", {
    model: selectedModel.value,
    trim: selectedTrim.value,
    year: selectedYear.value,
  });
};
</script>

<template>
  <!-- Choose Your Corvette Filter Section -->
  <section class="w-full bg-[rgba(233,233,233,0.61)] pb-10">
    <div
        class="bg-e5-red shadow-[0px_18px_14px_-14px_rgba(0,0,0,0.25)] flex items-center justify-center text-center py-2 mb-8">
      <p class="font-sans text-xl text-white tracking-[20px] uppercase">
        CHOOSE YOUR CORVETTE
      </p>
    </div>

    <div class="container-e5 max-w-[1000px] grid grid-cols-1 md:grid-cols-3 gap-6 items-center mx-auto">
      <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
        <select
          v-model="selectedModel"
          class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none cursor-pointer"
        >
          <option value="">SELECT MODEL</option>
          <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
        </select>
      </div>
      <div class="flex-1 border-2 h-[40px] px-4 flex items-center"
           :class="selectedModel ? 'border-e5-red bg-white' : 'border-gray-300 bg-gray-100'">
        <select
          v-model="selectedTrim"
          :disabled="!selectedModel"
          class="w-full bg-transparent font-sans text-base tracking-[5.6px] uppercase outline-none"
          :class="selectedModel ? 'opacity-70 cursor-pointer' : 'opacity-40 cursor-not-allowed'"
        >
          <option value="">{{ selectedModel ? 'SELECT TRIM' : 'SELECT MODEL FIRST' }}</option>
          <option v-for="trim in trims" :key="trim" :value="trim">{{ trim }}</option>
        </select>
      </div>
      <div class="flex-1 border-2 h-[40px] px-4 flex items-center"
           :class="selectedModel && selectedTrim ? 'border-e5-red bg-white' : 'border-gray-300 bg-gray-100'">
        <select
          v-model="selectedYear"
          :disabled="!selectedModel || !selectedTrim"
          class="w-full bg-transparent font-sans text-base tracking-[5.6px] uppercase outline-none"
          :class="selectedModel && selectedTrim ? 'opacity-70 cursor-pointer' : 'opacity-40 cursor-not-allowed'"
        >
          <option value="">{{ selectedModel && selectedTrim ? 'SELECT YEAR' : 'SELECT TRIM FIRST' }}</option>
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
