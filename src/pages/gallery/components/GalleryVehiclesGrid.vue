<script setup lang="ts">
import { corvetteGalleryData } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import type { CorvetteGalleryItem } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import VehicleCard from "@/pages/gallery/components/VehicleCard.vue";
import VehicleDetailedCard from "@/pages/gallery/components/VehicleDetailedCard.vue";
import YearMakeModelSelector from "@/pages/gallery/components/YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/pages/gallery/components/GalleryPageStyleSelector.vue";
import { ref, computed } from "vue";
import { GALLERY_DETAIL_ROUTE } from "@/core/constants/Routes.ts";
import BannerFullWidthWithLegend from "@/core/components/BannerFullWidthWithLegend.vue";
import { VETTER_GALLERY_BANNER } from "@/pages/gallery/constants/Images.ts";

const detailedGallery = ref<boolean>(false);
const filters = ref<{ model: string; trim: string; year: string }>({
  model: "",
  trim: "",
  year: "",
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

  return filtered.map(mapVehicleData);
});
</script>
<template>
  <BannerFullWidthWithLegend alt="Gallery" :image="VETTER_GALLERY_BANNER" />

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