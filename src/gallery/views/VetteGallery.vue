<script setup lang="ts">
import VetteGallery from "@/gallery/constants/VetteGallery.ts";
import VehicleCard from "@/gallery/components/VehicleCard.vue";
import GalleryTitleSection from "@/gallery/components/GalleryTitleSection.vue";
import YearMakeModelSelector from "@/gallery/components/YearMakeModelSelector.vue";
import GalleryPageStyleSelector from "@/gallery/components/GalleryPageStyleSelector.vue";
</script>
<template>
  <main class="w-full h-full">
    <GalleryTitleSection />

    <YearMakeModelSelector />

    <GalleryPageStyleSelector />

    <!-- Gallery Grid -->
    <section class="container-e5 py-16 px-24">
      <div class="grid grid-cols-3 gap-6">
        <VehicleCard
            v-for="vehicle in VetteGallery"
            :image="vehicle.image"
            :year="vehicle.year"
            :trim="vehicle.trim"
            :wheel-model="vehicle.wheelModel"
            :wheel-finish="vehicle.wheelFinish"
        />
      </div>
    </section>
  </main>
</template>