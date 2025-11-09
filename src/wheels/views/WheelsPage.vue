<script setup lang="ts">
import {
  DAYTONA_BRAND_NAME,
  TALLADEGA_WHEELS,
  TALLADEGA_LOGO,
  DAYTONA_LOGO,
  SPEEDWAY_LOGO,
  SPEEDWAY_WHEELS,
  SPEEDWAY_BRAND_NAME,
  DAYTONA_WHEELS,
  FORM_FORGED_LOGO,
  SEBRING_BRAND_NAME,
  SEBRING_LOGO,
  SEBRING_WHEELS,
  WHEEL_GALLERY_STUDIO_BANNER,
  WHEEL_PAGE_BANNER,
  E5_FORGED_LOGO,
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import WheelImagesChain from "@/wheels/components/WheelImagesChain.vue";
import WheelImagesStack from "@/wheels/components/WheelImagesStack.vue";
import BannerFullWidthWithLegend from "@/core/components/BannerFullWidthWithLegend.vue";
import ImageWithLegend from "@/core/components/ImageWithLegend.vue";
import {useRouter} from "vue-router";
const router = useRouter();
</script>

<template>
  <main class="w-full h-full">
    <!-- Hero Banner Image -->
    <section class="w-full h-[371px] relative overflow-hidden">
      <img
          :src="WHEEL_PAGE_BANNER"
          alt="E5 Forged Wheels"
          class="w-full h-full object-cover"
      />
    </section>

    <!-- E5 Forged Series Section -->
    <section class="container-e5 my-16 h-[138px] grid grid-cols-[1fr_1px_1fr] align-middle">
      <div class="flex items-center justify-center">
        <img
            :src="E5_FORGED_LOGO"
            alt="E5 Forged"
            class="w-3/4 object-contain"
        />
      </div>
      <div class="w-px h-full bg-e5-red lg:block"></div>
      <div class="text-center px-20 my-auto text-xl opacity-70">
        <span>
          Exclusively Forged in the USA for C8 Z06, ZR1, and E_Ray.
          Engineered for extreme performance, reduced weight, and
          maximum strength.
        </span>
      </div>
    </section>

    <section class="container-e5 my-16">
      <div class="text-center px-20 my-auto text-lg opacity-50">
        EXCLUSIVELY FORGED FOR C8 Z06, ZR1, E_RAY
      </div>

      <WheelImagesStack :wheels="TALLADEGA_WHEELS" :logo="TALLADEGA_LOGO" :brand="DAYTONA_BRAND_NAME"/>

      <div class="flex flex-col justify-center mt-8">
        <!-- Forged In USA & Pricing -->
        <div class="text-center space-y-2">
          <p class="text-[16px] text-e5-red tracking-[3.2px]">
            FORGED IN THE USA
          </p>
          <p class="text-xs opacity-50 tracking-[3.2px]">
            STARTING AT $2,275 PER WHEEL
          </p>
        </div>

        <!-- Explore Button -->
        <Button primary class="max-w-[300px] mx-auto mt-6" link="/wheels/talladega">
          EXPLORE FORGED
        </Button>
      </div>
    </section>

    <section class="container-e5 py-32 grid grid-cols-2 gap-12">
      <ImageWithLegend :image="FORM_FORGED_LOGO" alt="Form Forged Series" class="max-w-[400px] mx-auto">
        <div class="mt-12 max-w-[480px] mx-auto text-center">
          Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and
          agility—without compromising daily drivability.
        </div>
        <div class="mt-12 max-w-[480px] mx-auto text-center tracking-[3px]">
          <p class="text-[16px] opacity-50">STARTING AT $600 PER WHEEL</p>
          <p class="text-[16px] opacity-50">EXCLUSIVELY ENGINEERED FOR CORVETTES</p>
          <p class="text-[16px] tracking-[3.2px]">
            <span class="text-e5-red">IN STOCK</span>
            <span class="text-[rgba(0,0,0,0.49)]"> FOR C6_C7_C8</span>
          </p>
        </div>
      </ImageWithLegend>

      <WheelImagesChain :logo="DAYTONA_LOGO" :brand="DAYTONA_BRAND_NAME" :images="DAYTONA_WHEELS" :btn-text="`EXPLORE ${DAYTONA_BRAND_NAME}`" btn-link="/wheels/daytona"/>
    </section>

    <section class="container-e5 py-12 grid grid-cols-2 gap-12">
      <WheelImagesChain :images="SPEEDWAY_WHEELS" :brand="SPEEDWAY_BRAND_NAME" :logo="SPEEDWAY_LOGO" :btn-text="`EXPLORE ${SPEEDWAY_BRAND_NAME}`" btn-link="/wheels/speedway"/>
      <WheelImagesChain :images="SEBRING_WHEELS" :brand="SEBRING_BRAND_NAME" :logo="SEBRING_LOGO" :btn-text="`EXPLORE ${SEBRING_BRAND_NAME}`" btn-link="/wheels/sebring"/>
    </section>

    <div class="container-e5 mb-12">
      <div class="w-full h-px bg-black opacity-20"></div>
    </div>

    <BannerFullWidthWithLegend
        class="mb-12"
        alt="Wheel Gallery"
        :image="WHEEL_GALLERY_STUDIO_BANNER"
    >
      <article class="flex flex-col justify-center text-white text-center">
        <h2 class="text-[48px] font-franklin-heavy tracking-[-0.96px] uppercase leading-[37px] mb-3">
          WHEEL GALLERY
        </h2>
        <p class="text-[20px] tracking-[-0.48px] leading-[23px] mb-6">
          Our wheels, up close & personal.
        </p>
        <div class="flex mx-auto cursor-pointer" @click="router.push('/wheels/gallery')">
          <div class="text-[12px] tracking-[3.96px] uppercase border-b border-e5-red pb-2">
            <div class="hover:-translate-y-0.5">
              VIEW GALLERY
            </div>
          </div>
        </div>
      </article>
    </BannerFullWidthWithLegend>
  </main>
</template>
