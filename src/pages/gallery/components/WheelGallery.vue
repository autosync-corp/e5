<script setup lang="ts">
import { ref } from 'vue';
import WheelCard from './WheelCard.vue';
import WheelDetailedCard from './WheelDetailedCard.vue';
import GalleryPageStyleSelector from './GalleryPageStyleSelector.vue';
import {
  WHEEL_GALLERY_BANNER,
  E5_FORGED_GALLERY_BANNER,
  SPEEDWAY_LOGO,
  GALLERY_LOGO,
  FORM_FORGED_SERIES_LOGO,
  wheelGalleryItems
} from '../constants/WheelGallery';

const detailedGallery = ref<boolean>(false);
</script>

<template>
  <div class="w-full">
    <!-- Hero Section -->
    <div class="relative w-full h-[400px] md:h-[600px]">
      <img
        :src="WHEEL_GALLERY_BANNER"
        alt="Wheel Gallery Banner"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
        <img
          :src="SPEEDWAY_LOGO"
          alt="Speedway Logo"
          class="w-[200px] md:w-[300px] h-auto"
        />
      </div>
    </div>

    <!-- Gallery Introduction Section -->
    <section class="container-e5 pt-16 pb-8">
      <div class="flex justify-between items-start mb-8">
        <div class="h-[85px] w-auto max-w-[805px]">
          <img :src="GALLERY_LOGO" alt="Gallery" class="h-full w-auto object-contain" />
        </div>
        <div class="h-[70px] w-auto max-w-[234px]">
          <img :src="FORM_FORGED_SERIES_LOGO" alt="Form Forged Series" class="h-full w-auto object-contain" />
        </div>
      </div>
      <p class="text-[24px] font-excon-light leading-[30px] text-black opacity-70 max-w-[1252px]">
        Indulge yourself in our large collection of wheel galleries featuring our Form Forged Series wheels in all kinds of environments.
      </p>
    </section>

    <!-- View Toggle -->
    <GalleryPageStyleSelector :detailedView="detailedGallery" @detailed-view="detailedGallery = $event" />

    <!-- Gallery Grid - Simple Card View -->
    <section v-if="!detailedGallery" class="container-e5 pb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 justify-items-center">
        <WheelCard
          v-for="item in wheelGalleryItems"
          :key="item.id"
          :image="item.image"
          :name="item.name"
          :series="item.series"
          :finish="item.finish"
          :link="item.link"
          :featured="item.featured"
        />
      </div>
    </section>

    <!-- Gallery Grid - Detailed Card View -->
    <section v-else class="container-e5 pb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 justify-items-center">
        <WheelDetailedCard
          v-for="item in wheelGalleryItems"
          :key="item.id"
          :image="item.detailedImage || item.image"
          :name="item.name"
          :series="item.series"
          :finishes="item.finishes"
          :sizes="item.sizes"
          :madeFor="item.madeFor"
          :logo="item.logo"
          :link="item.link"
        />
      </div>
    </section>

    <!-- E5 Forged Banner Section -->
    <div class="w-full">
      <img
        :src="E5_FORGED_GALLERY_BANNER"
        alt="E5 Forged Gallery Banner"
        class="w-full h-auto object-cover"
      />
    </div>
  </div>
</template>
