<script setup lang="ts">
import VetteGallery from "@/gallery/constants/VetteGallery.ts";
import Button from "@/core/components/Button.vue";
import VehicleCard from "@/gallery/components/VehicleCard.vue";
</script>
<template>
  <main class="w-full h-full">
    <!-- Title Section -->
    <section class="container-e5 text-center py-32">
      <h1 class="font-franklin-heavy text-6xl text-black mb-4 font-black tracking-[6.4px] uppercase">
        GALLERY
      </h1>
      <p class="font-sans text-24 text-black/70 mx-auto">
        View our collection of wheels and builds out in the wild.
      </p>
    </section>

    <!-- Choose Your Corvette Filter Section -->
    <section class="w-full bg-[rgba(233,233,233,0.61)] py-10">
      <div
          class="bg-e5-red h-[39px] shadow-[0px_18px_14px_-14px_rgba(0,0,0,0.25)] flex items-center justify-center mb-8">
        <p class="font-sans text-xl text-white tracking-[20px] uppercase">
          CHOOSE YOUR CORVETTE
        </p>
      </div>

      <div class="container-e5 flex gap-6 items-center px-[164px]">
        <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
          <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
            <option>MODEL</option>
          </select>
        </div>
        <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
          <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
            <option>TRIM</option>
          </select>
        </div>
        <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
          <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
            <option>YEAR</option>
          </select>
        </div>
        <Button>
          SEARCH
        </Button>
      </div>
    </section>

    <section class="container-e5 flex gap-4 justify-center mt-8">
      <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" fill="#d31d25"/>
        </svg>
      </div>
      <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" fill="#999"/>
        </svg>
      </div>
    </section>

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