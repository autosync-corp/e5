<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VetteGallery from "@/gallery/constants/VetteGallery.ts";
import VehicleCard from "@/gallery/components/VehicleCard.vue";
import VehicleImagesGallery from "@/gallery/components/VehicleImagesGallery.vue";
import Button from "@/core/components/Button.vue";

const route = useRoute();
const router = useRouter();

const vehicleId = ref<number>(0);

const vehicle = computed(() => {
  return VetteGallery[vehicleId.value] || null;
});

// Gallery images for the C7 Corvette Gallery section (using different vehicles)
const corvetteGalleryImages = computed(() => {
  return VetteGallery.slice(0, 3);
});

// Wheel gallery images
const wheelGalleryImages = ref([
  "/src/assets/images/560ac3f8b1099b2daae4a94ca20ee27ccfd3e19c.png",
  "/src/assets/images/1c2da75e73ddd418dd5781f30e936d44508e695a.png",
  "/src/assets/images/f64453e3ffa137fa97c81ca409e6d07b0e2a2f8d.png"
]);

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

      <div class="flex gap-16">
        <!-- Wheel Image -->
        <div class="flex items-center justify-center">
          <img :src="vehicle.wheelImage" :alt="vehicle.wheelModel" class="w-full max-w-[480px] h-auto" />
        </div>

        <!-- Wheel Details -->
        <div class="flex align-middle flex-col justify-center">
          <div class="mb-8">
            <p class="text-lg text-black/50 opacity-70 tracking-wide leading-[30px] mb-4">
              WHEEL MODEL
            </p>
            <img :src="vehicle.wheelLogo" :alt="`${vehicle.brand} Logo`" class="h-[36px] w-auto" />
          </div>

          <div class="grid grid-cols-2 gap-8 mb-12">
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
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-6">
            <Button primary class="w-full">SHOP {{ vehicle.wheelModel }}</Button>
            <Button secondary class="w-full uppercase">EXPLORE {{ vehicle.brand }}</Button>
          </div>
        </div>
      </div>
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
        />
      </div>

      <div class="w-full flex justify-center">
        <Button primary class="mt-12" @click="goToGallery">
          VIEW FULL GALLERY
        </Button>
      </div>
    </section>

    <!-- Daytona Wheel Gallery Section -->
    <section class="container-e5 py-24 px-24">
      <h2 class="text-3xl text-black opacity-70 tracking-wide leading-[34px] mb-8">
        {{ vehicle.wheelModel }} WHEEL GALLERY
      </h2>

      <div class="grid grid-cols-3 gap-12">
        <div
          v-for="(wheelImg, index) in wheelGalleryImages"
          :key="index"
          class="w-full h-auto overflow-hidden flex items-center justify-center"
        >
          <img :src="wheelImg" :alt="`${vehicle.wheelModel} Wheel ${index + 1}`" class="w-full object-cover" />
        </div>
      </div>
    </section>
  </main>
</template>
