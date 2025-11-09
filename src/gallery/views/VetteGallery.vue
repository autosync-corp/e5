<script setup lang="ts">
import VetteGallery from "@/gallery/constants/VetteGallery.ts";
import VehicleCard from "@/gallery/components/VehicleCard.vue";
import VehicleDetailedCard from "@/gallery/components/VehicleDetailedCard.vue";
import YearMakeModelSelector from "@/gallery/components/YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/gallery/components/GalleryPageStyleSelector.vue";
import {ref} from "vue";

const detailedGallery = ref<boolean>(false);
</script>
<template>
  <main class="w-full h-full">
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
            :link="`/gallery/detail/${vehicle.id}`"
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
            :link="`/gallery/detail/${vehicle.id}`"
        />
      </div>
    </section>
  </main>
</template>