<script setup lang="ts">
import { corvetteGalleryData } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import type { CorvetteGalleryItem } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import VehicleCard from "@/pages/gallery/components/VehicleCard.vue";
import VehicleDetailedCard from "@/pages/gallery/components/VehicleDetailedCard.vue";
import YearMakeModelSelector from "@/pages/gallery/components/YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/pages/gallery/components/GalleryPageStyleSelector.vue";
import { ref, computed, onMounted } from "vue";
import { GALLERY_DETAIL_ROUTE } from "@/core/constants/Routes.ts";

const detailedGallery = ref<boolean>(false);
const filters = ref<{ model: string; trim: string; year: string }>({
  model: "",
  trim: "",
  year: "",
});

// Read URL parameters and set initial filters
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const generation = urlParams.get('generation');
  const trim = urlParams.get('trim');
  const year = urlParams.get('year');

  if (generation) {
    filters.value.model = generation.toUpperCase();
  }
  if (trim) {
    filters.value.trim = trim;
  }
  if (year) {
    filters.value.year = year;
  }
});

// Handle filter changes from YearMakeModelSelector
const handleFilter = (newFilters: { model: string; trim: string; year: string }) => {
  filters.value = newFilters;
};

// Map CSV data to component format
const mapVehicleData = (item: CorvetteGalleryItem, index: number) => {
  const sizing = item.wheelSizeF && item.wheelSizeRear
    ? `${item.wheelSizeF} / ${item.wheelSizeRear}`
    : item.wheelSizeF || item.wheelSizeRear || 'N/A';

  return {
    id: item.galleryId || `vehicle-${index}`,
    vehicleId: item.galleryId || `vehicle-${index}`,
    image: `/assets/images/gallery/corvette/${item.galleryId}/0.webp`,
    logo: '/assets/images/form-forged-logo-black.png',
    year: item.year || 'N/A',
    model: item.submodel || 'N/A',
    trim: item.trim || 'N/A',
    title: item.vehicleTitle || item.trim || 'N/A',
    style: item.wheelStyle || 'N/A',
    finish: item.wheelFinish || 'N/A',
    tires: item.tireModel || 'N/A',
    sizing,
    link: `${GALLERY_DETAIL_ROUTE}/${item.galleryId || index}`,
  };
};

// Filtered vehicles based on selected filters
const filteredVehicles = computed(() => {
  let filtered = corvetteGalleryData;

  if (filters.value.model) {
    filtered = filtered.filter(item => item.submodel === filters.value.model);
  }

  if (filters.value.trim) {
    filtered = filtered.filter(item => item.trim === filters.value.trim);
  }

  if (filters.value.year) {
    filtered = filtered.filter(item => item.year === filters.value.year);
  }

  // Reverse array to show newest additions first (assumes new items are added to the end)
  filtered = [...filtered].reverse();

  return filtered.map(mapVehicleData);
});
</script>
<template>
  <!-- Gallery Header -->
  <section class="w-full bg-white pt-16 pb-8">
    <div class="container-e5">
      <img
        src="/assets/images/gallery-logo.png"
        alt="Gallery"
        class="h-[50px] md:h-[60px] lg:h-[70px] mb-4 object-contain"
      />
      <p class="text-[18px] md:text-[20px] font-excon-light text-black/70 leading-[30px] max-w-[800px]">
        Our builds our in the wild. See them for yourself, envision yours.
      </p>
    </div>
  </section>

  <YearMakeModelSelector @filter="handleFilter" />

  <GalleryPageStyleSelector :detailedView="detailedGallery" @detailed-view="detailedGallery = $event" />

  <!-- Gallery Grid -->
  <section class="container-e5 pt-8 pb-16">
    <div v-if="detailedGallery" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <VehicleDetailedCard
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          :vehicle-id="vehicle.vehicleId"
          :image="vehicle.image"
          :logo="vehicle.logo"
          :style="vehicle.style"
          :year="vehicle.year"
          :title="vehicle.title"
          :finish="vehicle.finish"
          :tires="vehicle.tires"
          :sizing="vehicle.sizing"
          :link="vehicle.link"
      />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <VehicleCard
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          class="cursor-pointer"
          :image="vehicle.image"
          :year="vehicle.year"
          :title="vehicle.title"
          :style="vehicle.style"
          :finish="vehicle.finish"
          :link="vehicle.link"
      />
    </div>
  </section>
</template>