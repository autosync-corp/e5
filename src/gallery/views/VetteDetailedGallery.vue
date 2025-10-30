<script setup lang="ts">
  import GalleryTitleSection from "@/gallery/components/GalleryTitleSection.vue";
  import YearMakeModelSelector from "@/gallery/components/YearMakeModelSelector.vue";
  import VetteGallery from "@/gallery/constants/VetteGallery.ts";
  import GalleryPageStyleSelector from "@/gallery/components/GalleryPageStyleSelector.vue";
  import VehicleDetailedCard from "@/gallery/components/VehicleDetailedCard.vue";
</script>

<template>
  <main class="w-full h-full">
    <GalleryTitleSection />

    <YearMakeModelSelector />

    <GalleryPageStyleSelector />

    <!-- Gallery Grid -->
    <section class="container-e5 py-16 px-24">
      <div class="grid grid-cols-3 gap-6">
        <VehicleDetailedCard
            v-for="(vehicle, index) in VetteGallery"
            :key="index"
            :vehicle-id="index"
            :image="vehicle.image"
            :logo="vehicle.logo"
            :brand="vehicle.brand"
            :year="vehicle.year"
            :trim="vehicle.trim"
            :wheel-model="vehicle.wheelModel"
            :wheel-finish="vehicle.wheelFinish"
            :tires="vehicle.tires"
            :sizing="vehicle.sizing"
        />
      </div>
    </section>
  </main>
</template>
