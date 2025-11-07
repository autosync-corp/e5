<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VetteGallery from "@/gallery/constants/VetteGallery.ts";
import VehicleCard from "@/gallery/components/VehicleCard.vue";
import VehicleImagesGallery from "@/gallery/components/VehicleImagesGallery.vue";
import Button from "@/core/components/Button.vue";
import VehicleWheelSizeFit from "@/gallery/components/VehicleWheelSizeFit.vue";
import {WHEEL_GALLERY_BANNERS_BY_BRAND} from "@/wheels/constants/Wheels.ts";

const route = useRoute();
const router = useRouter();

const vehicleId = ref<number>(0);

const vehicle = computed(() => {
  return VetteGallery.find(v => v.id === vehicleId.value) || null;
});

// Gallery images for the C7 Corvette Gallery section (using different vehicles)
const corvetteGalleryImages = computed(() => {
  return VetteGallery.filter(v => v.model === vehicle.value?.model).slice(0, 3) ?? [];
});

onMounted(() => {
  const id = parseInt(route.params.id as string);
  if (!isNaN(id) && id >= 0 && id < VetteGallery.length) {
    vehicleId.value = id;
  } else {
    router.push('/gallery');
  }
});

const goToGallery = () => {
  router.push('/gallery/detailed');
};
</script>

<template>
  <main class="w-full h-full" v-if="vehicle">
    <!-- Secondary Navigation -->
    <section class="w-full bg-white border-b border-gray-200 py-6">
      <div class="container-e5 flex items-center justify-between">
        <button
          @click="goToGallery"
          class="font-franklin-book text-xs text-black/40 tracking-[3.2px] uppercase hover:text-black transition-colors"
        > BACK TO GALLERY </button>

        <nav class="flex gap-8">
          <a href="#" class="font-franklin-book text-xs text-black tracking-[3.2px] uppercase hover:text-e5-red transition-colors">SHOP</a>
          <a href="#" class="font-franklin-book text-xs text-black tracking-[3.2px] uppercase hover:text-e5-red transition-colors">SIZES</a>
          <a href="#" class="font-franklin-book text-xs text-black tracking-[3.2px] uppercase hover:text-e5-red transition-colors">FINISHES</a>
          <a href="#" class="font-franklin-book text-xs text-black tracking-[3.2px] uppercase hover:text-e5-red transition-colors">WARRANTY</a>
        </nav>
      </div>
    </section>

    <VehicleImagesGallery :trim="vehicle.trim" :images="vehicle.galleryImages" />

    <!-- Vehicle & Wheel Details Section -->
    <section class="container-e5 pt-4 px-24">
      <div class="flex items-start justify-between mb-8">
        <div></div>
        <div class="text-right">
          <p class="text-lg text-black/50 opacity-70 tracking-wide leading-[30px]">
            VEHICLE MODEL
          </p>
          <p class="text-2xl text-black opacity-70 tracking-wide leading-[30px] mt-1">
            {{ vehicle.year }} {{ vehicle.trim }}
          </p>
        </div>
      </div>

      <VehicleWheelSizeFit
        :image="vehicle.wheelImage"
        :alt="vehicle.wheelModel"
        :logo="vehicle.wheelLogo"
        :title="vehicle.wheelModel"
      >
        <template #details>
          <div>
            <p class="text-lg text-black/50 opacity-70 tracking-wide leading-[30px]">
              SIZES
            </p>
            <ul class="list-disc pl-8">
              <li
                  v-for="(size, index) in vehicle.sizingDetails"
                  :key="index"
                  class="text-lg text-black opacity-70 tracking-wide leading-[30px]"
              >
                {{ size }}
              </li>
            </ul>
          </div>
          <div class="ml-auto">
            <p class="text-black/50 opacity-70 tracking-wide leading-[30px]">
              FINISH
            </p>
            <ul class="list-disc pl-8">
              <li class="text-black opacity-70 tracking-wide leading-[30px]">
                {{ vehicle.wheelFinish }}
              </li>
            </ul>
          </div>
        </template>
        <template #actions>
          <div class="flex gap-6">
            <Button primary class="w-full" link="pending">SHOP {{ vehicle.wheelModel }}</Button>
            <Button secondary class="w-full uppercase" link="pending">EXPLORE {{ vehicle.wheelBrand }}</Button>
          </div>
        </template>
      </VehicleWheelSizeFit>
    </section>

    <!-- C7 Corvette Gallery Section -->
    <section class="container-e5 pt-24">
      <h2 class="text-2xl text-black opacity-70 tracking-wide leading-[34px] mb-4">
        C7 CORVETTE GALLERY
      </h2>

      <div class="grid grid-cols-3 gap-6">
        <VehicleCard
          v-for="(item, index) in corvetteGalleryImages"
          :key="index"
          :image="item.image"
          :year="item.year"
          :trim="item.trim"
          :wheel-model="item.wheelModel"
          :wheel-finish="item.wheelFinish"
          :link="`/gallery/detail/${item.id}`"
        />
      </div>

      <div class="w-full flex justify-center">
        <Button primary class="mt-12" @click="goToGallery">
          VIEW FULL GALLERY
        </Button>
      </div>
    </section>

    <section class="container-e5 py-24 px-24">
      <h2 class="text-4xl text-black font-medium opacity-70 tracking-wide leading-[34px] mb-8">
        {{ vehicle.wheelModel }} WHEEL GALLERY
      </h2>

      <div class="grid grid-cols-3 gap-12">
        <div
          v-for="wheel in WHEEL_GALLERY_BANNERS_BY_BRAND[vehicle.wheelBrand]"
          class="w-full h-auto overflow-hidden flex items-center justify-center"
        >
          <img :src="wheel.image" :alt="wheel.finish" class="w-full object-cover cursor-pointer" @click="router.push(`/wheels/${vehicle.wheelBrand}/${vehicle.wheelModel}`)"/>
        </div>
      </div>
    </section>
  </main>
</template>
