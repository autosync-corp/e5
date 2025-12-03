<script setup lang="ts">
import VetteGallery from "@/pages/gallery/constants/VetteGallery.ts";
import VehicleCard from "@/pages/gallery/components/VehicleCard.vue";
import VehicleDetailedCard from "@/pages/gallery/components/VehicleDetailedCard.vue";
import YearMakeModelSelector from "@/pages/gallery/components/YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/pages/gallery/components/GalleryPageStyleSelector.vue";
import {ref} from "vue";
import {GALLERY_DETAIL_ROUTE} from "@/core/constants/Routes.ts";

const detailedGallery = ref<boolean>(false);
</script>
<template>
  <YearMakeModelSelector />

  <GalleryPageStyleSelector :detailedView="detailedGallery" @detailed-view="detailedGallery = $event" />

  <!-- Gallery Grid -->
  <section class="container-e5 pt-8 pb-16 px-24">
    <div v-if="detailedGallery" class="grid grid-cols-3 gap-6">
      <VehicleDetailedCard
          v-for="vehicle in VetteGallery"
          :vehicle-id="vehicle.id"
          :image="vehicle.image"
          :logo="vehicle.logo"
          :brand="vehicle.brand"
          :year="vehicle.year"
          :trim="vehicle.trim"
          :wheel-model="vehicle.wheelModel"
          :wheel-finish="vehicle.wheelFinish"
          :tires="vehicle.tires"
          :sizing="vehicle.sizing"
          :link="`${GALLERY_DETAIL_ROUTE}/${vehicle.id}`"
      />
    </div>
    <div v-else class="grid grid-cols-3 gap-6">
      <VehicleCard
          v-for="vehicle in VetteGallery"
          class="cursor-pointer"
          :image="vehicle.image"
          :year="vehicle.year"
          :trim="vehicle.trim"
          :wheel-model="vehicle.wheelModel"
          :wheel-finish="vehicle.wheelFinish"
          :link="`${GALLERY_DETAIL_ROUTE}/${vehicle.id}`"
      />
    </div>
  </section>
</template>