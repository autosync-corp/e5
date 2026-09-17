<script setup lang="ts">
import { corvetteGalleryData, WHEELS_COMING_SOON } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import type { CorvetteGalleryItem } from "@/pages/gallery/constants/CorvetteGalleryData.ts";
import VehicleCard from "@/pages/gallery/components/_VehicleCard.vue";
import VehicleDetailedCard from "@/pages/gallery/components/_VehicleDetailedCard.vue";
import YearMakeModelSelector from "@/pages/gallery/components/_YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/pages/gallery/components/_GalleryPageStyleSelector.vue";
import { ref, computed, onMounted } from "vue";
import { GALLERY_DETAIL_ROUTE } from "@/core/constants/Routes.ts";
import { useWheelApi } from "@/core/composables/useWheelApi";

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

  resolvePendingWheels();
});

/*
 * Entries can be published before their wheels reach the catalog: they carry
 * part numbers but no style/finish, and read "Coming Soon". The API answers
 * 200 with an empty list until those wheels launch, at which point this one
 * batched lookup fills the cards in with no data edit. Skipped entirely when
 * nothing is pending, which is the normal case.
 */
const { wheelData, fetchWheelData } = useWheelApi();

const pendingWheelEntries = computed(() =>
  corvetteGalleryData.filter(item => !item.wheelStyle && (item.partF || item.wheelPartR))
);

async function resolvePendingWheels() {
  const partNumbers = pendingWheelEntries.value
    .flatMap(item => [item.partF, item.wheelPartR])
    .filter((pn): pn is string => !!pn);

  if (partNumbers.length > 0) {
    await fetchWheelData(Array.from(new Set(partNumbers)));
  }
}

// Style/finish resolved from the API for an entry whose gallery data has none
const resolvedWheel = (item: CorvetteGalleryItem) => {
  if (item.wheelStyle || wheelData.value.length === 0) return null;
  const wheel = wheelData.value.find(w => w.Pn === item.partF || w.Pn === item.wheelPartR);
  if (!wheel) return null;
  const finish = [wheel.Finish, wheel.Color, wheel.Accent].filter(Boolean).join(' ');
  return { style: wheel.Model || null, finish: finish || null };
};

// Handle filter changes from YearMakeModelSelector
const handleFilter = (newFilters: { model: string; trim: string; year: string }) => {
  filters.value = newFilters;
};

// Dynamic H1 based on active filters
const pageHeading = computed(() => {
  const parts = [];

  if (filters.value.model) {
    parts.push(filters.value.model);
  }

  if (filters.value.trim) {
    parts.push(filters.value.trim.toUpperCase());
  }

  if (parts.length > 0) {
    return `${parts.join(' ')} CORVETTE GALLERY`;
  }

  return 'VEHICLE GALLERY';
});

// Map CSV data to component format
const mapVehicleData = (item: CorvetteGalleryItem, index: number) => {
  const resolved = resolvedWheel(item);
  const sizing = item.wheelSizeF && item.wheelSizeRear
    ? `${item.wheelSizeF} / ${item.wheelSizeRear}`
    : item.wheelSizeF || item.wheelSizeRear || WHEELS_COMING_SOON;

  return {
    id: item.galleryId || `vehicle-${index}`,
    vehicleId: item.galleryId || `vehicle-${index}`,
    image: `/assets/images/gallery/corvette/${item.galleryId}/0.webp`,
    logo: '/assets/images/form-forged-logo-black.png',
    year: item.year || 'N/A',
    model: item.submodel || 'N/A',
    trim: item.trim || 'N/A',
    title: item.vehicleTitle || item.trim || 'N/A',
    style: item.wheelStyle || resolved?.style || WHEELS_COMING_SOON,
    finish: item.wheelFinish || resolved?.finish || WHEELS_COMING_SOON,
    // Blank, not "coming soon" — half the gallery has no tire model recorded
    // and those tires aren't pending, the data just was never captured.
    tires: item.tireModel || '',
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

  // Sort: pinned first, then recently added (by dateAdded desc),
  // then by generation (C8 → C7 → C6 → C5), then by year (newest first)
  const generationOrder: Record<string, number> = { 'C8': 1, 'C7': 2, 'C6': 3, 'C5': 4 };
  filtered = [...filtered].sort((a, b) => {
    // Pinned entries always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // Then entries with dateAdded come before entries without (most recent first)
    if (a.dateAdded && !b.dateAdded) return -1;
    if (!a.dateAdded && b.dateAdded) return 1;
    if (a.dateAdded && b.dateAdded) {
      return b.dateAdded.localeCompare(a.dateAdded);
    }

    // Then sort by generation
    const genA = generationOrder[a.submodel || ''] || 999;
    const genB = generationOrder[b.submodel || ''] || 999;
    if (genA !== genB) return genA - genB;

    // Within same generation, sort by year (newest first)
    const yearA = parseInt(a.year || '0');
    const yearB = parseInt(b.year || '0');
    return yearB - yearA;
  });

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
      <h1 class="text-3xl md:text-4xl lg:text-5xl font-franklin-heavy text-black mb-6">
        {{ pageHeading }}
      </h1>
      <p class="text-[18px] md:text-[20px] font-excon-light text-black/70 leading-[30px] max-w-[800px]">
        Our builds are in the wild. See them for yourself, envision yours.
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