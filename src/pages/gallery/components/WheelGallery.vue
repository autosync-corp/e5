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
    <div class="relative w-full h-[300px] md:h-[450px] lg:h-[600px] xl:h-[700px]">
      <img
        :src="WHEEL_GALLERY_BANNER"
        alt="Wheel Gallery Banner"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Gallery Introduction Section -->
    <section class="container-e5 pt-8 md:pt-12 lg:pt-16 pb-8">
      <div class="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-6 md:mb-8">
        <div class="h-[50px] md:h-[65px] lg:h-[85px] w-auto max-w-[400px] md:max-w-[600px] lg:max-w-[805px]">
          <img :src="GALLERY_LOGO" alt="Gallery" class="h-full w-auto object-contain" />
        </div>
        <div class="h-[40px] md:h-[55px] lg:h-[70px] w-auto max-w-[150px] md:max-w-[200px] lg:max-w-[234px]">
          <img :src="FORM_FORGED_SERIES_LOGO" alt="Form Forged Series" class="h-full w-auto object-contain" />
        </div>
      </div>
      <p class="text-[14px] md:text-[16px] lg:text-[18px] xl:text-[20px] font-excon-light leading-[22px] md:leading-[26px] lg:leading-[30px] text-black opacity-70 max-w-[1252px]">
        Indulge yourself in our large collection of wheel galleries featuring our Form Forged Series wheels in all kinds of environments.
      </p>
    </section>

    <!-- View Toggle -->
    <GalleryPageStyleSelector :detailedView="detailedGallery" @detailed-view="detailedGallery = $event" />

    <!-- Gallery Grid - Simple Card View -->
    <section v-if="!detailedGallery" class="container-e5 pt-8 pb-16">
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
    <section v-else class="container-e5 pt-8 pb-16">
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
