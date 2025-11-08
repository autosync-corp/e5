<script setup lang="ts">
import {
  FORM_FORGED_LOGO,
  FORM_FORGED_STUDIO_IMAGES,
  SHOP_FINISHES,
  SEBRING_LOGO,
  DAYTONA_LOGO,
  SPEEDWAY_LOGO,
  VPS_FORGED_VIDEO, SEBRING_TITANIUM_BRUSHED,
  SEBRING_BRAND_NAME, DAYTONA_BRAND_NAME, DAYTONA_TITANIUM_BRUSHED_TINT_FACE,
  SPEEDWAY_TITANIUM_BRUSHED_TINT_BEAUTY_LEFT, SPEEDWAY_BRAND_NAME, PROCESS_DIAGRAM,
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import ImageWithLegend from "@/core/components/ImageWithLegend.vue";
const finishingImages = FORM_FORGED_STUDIO_IMAGES.slice(0, 4);
</script>

<template>
  <main class="w-full h-full bg-white">
    <section>
      <video autoplay loop muted playsinline class="w-full h-[545px] object-cover">
        <source :src="VPS_FORGED_VIDEO" type="video/mp4" />
      </video>

      <div class="flex align-middle justify-center my-12 gap-12">
        <img
            :src="FORM_FORGED_LOGO"
            alt="E5 Forged"
            class="h-[110px] object-contain"
        />
        <div class="max-w-[700px] text-center text-xl font-medium opacity-70">
          <span>
            Engineered with forged DNA and crafted with care through flow forming, our Form Forged Series
              delivers you the right balance of strength and agility-without compromising daily drivability.
          </span>
        </div>
      </div>
    </section>

    <section class="py-12 bg-gray-50">
      <div class="container-e5 grid grid-cols-3">
        <ImageWithLegend
            :alt="SEBRING_BRAND_NAME"
            :image="SEBRING_TITANIUM_BRUSHED"
        >
          <div class="flex flex-col items-center text-center">
            <img class="w-2/4 mb-4" :src="SEBRING_LOGO" :alt="SEBRING_BRAND_NAME"/>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">TITANIUM BRUSHED TINT</span>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">EXCLUSIVELY FORGED FOR C6_C7_C8</span>
            <span class="text-center tracking-[3px] text-[14px] text-black">3 PREMIUM FINISHES</span>
            <span class="text-center tracking-[3px] text-[14px] text-e5-red mt-4">IN STOCK</span>

            <Button primary class="mt-6 uppercase" link="/wheels/sebring">EXPLORE {{SEBRING_BRAND_NAME}}</Button>
          </div>
        </ImageWithLegend>
        <ImageWithLegend
            :alt="DAYTONA_BRAND_NAME"
            :image="DAYTONA_TITANIUM_BRUSHED_TINT_FACE"
        >
          <div class="flex flex-col items-center text-center">
            <img class="w-2/4 mb-4" :src="DAYTONA_LOGO" :alt="DAYTONA_BRAND_NAME"/>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">TITANIUM BRUSHED TINT</span>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">EXCLUSIVELY FORGED FOR C6_C7_C8</span>
            <span class="text-center tracking-[3px] text-[14px] text-black">3 PREMIUM FINISHES</span>
            <span class="text-center tracking-[3px] text-[14px] text-e5-red mt-4">IN STOCK</span>

            <Button primary class="mt-6 uppercase" link="/wheels/sebring">EXPLORE {{DAYTONA_BRAND_NAME}}</Button>
          </div>
        </ImageWithLegend>
        <ImageWithLegend
            :alt="SPEEDWAY_BRAND_NAME"
            :image="SPEEDWAY_TITANIUM_BRUSHED_TINT_BEAUTY_LEFT"
        >
          <div class="flex flex-col items-center text-center">
            <img class="w-2/4 mb-4" :src="SPEEDWAY_LOGO" :alt="SPEEDWAY_BRAND_NAME"/>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">TITANIUM BRUSHED TINT</span>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">EXCLUSIVELY FORGED FOR C6_C7_C8</span>
            <span class="text-center tracking-[3px] text-[14px] text-black">3 PREMIUM FINISHES</span>
            <span class="text-center tracking-[3px] text-[14px] text-e5-red mt-4">IN STOCK</span>

            <Button primary class="mt-6 uppercase" link="/wheels/sebring">EXPLORE {{SPEEDWAY_BRAND_NAME}}</Button>
          </div>
        </ImageWithLegend>
      </div>
    </section>

    <section class="py-20">
      <div class="container-e5">
        <div class="text-center mb-12">
          <h2 class="text-5xl tracking-[5.6px] text-e5-red mb-4">
            OUR PROCESS
          </h2>
          <p class="text-lg mx-auto opacity-60 uppercase tracking-[3px]">
            Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and agility—without compromising daily drivability.
          </p>
        </div>

        <img :src="PROCESS_DIAGRAM" alt="Our Process" class="w-full h-auto object-contain" />
      </div>
    </section>

    <section class="container-e5 py-20">
      <div class="text-center mb-12">
        <h2 class="text-5xl tracking-[5.6px] text-e5-red mb-4">
          FINISHING
        </h2>
        <p class="text-lg mx-auto opacity-60 uppercase tracking-[3px]">
          Our Form Forged Series is available in Gloss Black, Titanium Brushed Tint, Bronze Brushed Tint,
          AND DARK BRONZE— finishes that embody the essence of timeless, modern, and bold design.
          Each surface is crafted to elevate the wheel’s form while enduring the demands of the road, all
          <span class="text-e5-red">backed by our 5-year finishing warranty.</span>
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="(image, index) in finishingImages"
          :key="index"
        >
          <img
            :src="image"
            :alt="`Finishing ${index + 1}`"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </section>

    <section class="container-e5">
      <div class="mt-20 mb-12">
        <h2 class="text-5xl tracking-[5.6px] text-e5-red mb-4">
          EXPLORE FORM FORGED GALLERY
        </h2>
        <p class="text-lg mx-auto opacity-60 uppercase tracking-[3px]">
          OUR FORM FORGED SERIES IN ACTION.
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] gap-6">
        <img
            :src="FORM_FORGED_STUDIO_IMAGES[4]"
            alt="Gallery TITANIUM"
            class="w-full h-full object-cover cursor-pointer aspect-square py-4"
        />
        <div class="w-0.5 h-full bg-gray-300 lg:block"></div>
        <img
            :src="FORM_FORGED_STUDIO_IMAGES[5]"
            alt="Gallery C7"
            class="w-full h-full object-cover cursor-pointer aspect-square py-4"
        />
      </div>
    </section>

    <section class="container-e5">
      <h2 class="text-center text-lg mx-auto font-medium opacity-40 uppercase tracking-[3px] mt-20">
        EXCLUSIVELY ENGINEERED FOR CORVETTES
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8 mb-20">
        <ImageWithLegend
            v-for="finish in SHOP_FINISHES"
            :alt="finish.finish"
            :image="finish.image"
        >
          <div class="flex flex-col items-center text-center">
            <span class="text-center tracking-[3px] text-[14px] opacity-50">{{ finish.finish }}</span>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">{{ finish.availability }}</span>
            <span class="text-center tracking-[3px] text-[14px] text-black">{{ finish.price }}</span>
            <span class="text-center tracking-[3px] text-[14px] text-e5-red mt-4">{{ finish.stock }}</span>

            <Button primary class="mt-6 uppercase" link="/pending">LEARN MORE</Button>
          </div>
        </ImageWithLegend>
      </div>
    </section>
  </main>
</template>

<style scoped>
.container-e5 {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
</style>