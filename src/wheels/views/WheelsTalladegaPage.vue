<script setup lang="ts">
import {
  TALLADEGA_LOGO,
  TALLADEGA_PODIUM_GOLD,
  TALLADEGA_GLOSS_BLACK,
  TALLADEGA_SMOKED_POLISHED,
  TALLADEGA_VIDEO, TALLADEGA_LOGO_WHITE, WHEEL_GALLERY_STUDIO_BANNER, TALLADEGA_BRAND_NAME, TALLADEGA_SHOT_2,
  TALLADEGA_SHOT_1, TALLADEGA_SHOT_3
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import Hero from "@/core/components/Hero.vue";
import BannerFullWidthWithLegend from "@/core/components/BannerFullWidthWithLegend.vue";
import DividerLine from "@/core/components/DividerLine.vue";
import {VETTE_GALLERY_IMAGE_1} from "@/gallery/constants/Images.ts";
import {useRouter} from "vue-router";
import {Orientations} from "@/core/types/App.ts";

const router = useRouter();
</script>

<template>
  <main class="w-full h-full bg-white">
    <Hero class="relative">
      <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover">
        <source :src="TALLADEGA_VIDEO" type="video/mp4" />
      </video>

      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white tracking-[3.2px]" style="text-shadow: 0 25px 90.6px rgba(0,0,0,0.96)">
          <p class="text-[24px] uppercase mb-4">INTRODUCING THE ALL-NEW</p>
          <img :src="TALLADEGA_LOGO_WHITE" alt="TALLADEGA" class="mx-auto w-[660px] mb-6" />
          <p class="text-[28px]">
            <span class="text-white">EXCLUSIVELY FORGED</span>
            <span class="text-e5-red font-medium"> FOR C8 Z06, ZR1, E_RAY</span>
          </p>
          <p class="text-[28px]">
            <span class="text-white">MADE IN THE</span>
            <span class="text-e5-red font-medium"> USA</span>
          </p>
          <Button primary class="mt-4">
            SHOP FORGED
          </Button>
        </div>
      </div>
    </Hero>

    <DividerLine />

    <BannerFullWidthWithLegend
        class="h-[582px]"
        :alt="`${TALLADEGA_BRAND_NAME} SHOTS`"
        :image="TALLADEGA_SHOT_1"
        bg-color="bg-black/10"
    >
      <article class="flex flex-col justify-center text-white text-center">
        <h2 class="text-[48px] font-franklin-heavy uppercase leading-[37px] mb-3">
          CUT TO <span class="text-e5-red">PERFORM</span>
        </h2>
        <p class="max-w-[700px] text-[20px] tracking-[-0.48px] leading-[23px] mb-6 uppercase">
          We carve away excess to optimize strength-to-weight, reduce inertia, and turn every ounce into performance.
        </p>
      </article>
    </BannerFullWidthWithLegend>

    <BannerFullWidthWithLegend
        :alt="`${TALLADEGA_BRAND_NAME} SHOTS`"
        :image="TALLADEGA_SHOT_2"
        class="h-[582px]"
        bg-color="bg-black/10"
    >
      <article class="flex flex-col justify-center text-white text-center">
        <h2 class="text-[48px] font-franklin-heavy uppercase leading-[37px] mb-3">
          Engineered <span class="text-e5-red">Depth</span>
        </h2>
        <p class="max-w-[700px] text-[20px] tracking-[-0.48px] leading-[23px] mb-6 uppercase">
          engineered for performance. wider tire setups, greater grip, sharper handling, and improved brake clearance
        </p>
      </article>
    </BannerFullWidthWithLegend>

    <BannerFullWidthWithLegend
        :alt="`${TALLADEGA_BRAND_NAME} SHOTS`"
        :image="TALLADEGA_SHOT_3"
        class="h-[582px]"
        bg-color="bg-black/10"
    >
      <article class="flex flex-col justify-center text-white text-center">
        <h2 class="text-[48px] font-franklin-heavy uppercase leading-[37px] mb-3">
          Our Foundation,
          <br/>
          Your <span class="text-e5-red">Vision</span>
        </h2>
        <p class="max-w-[700px] text-[20px] tracking-[-0.48px] leading-[23px] mb-6 uppercase">
          every E5 Forged wheel begins as a foundation of strength and precision. FINISHING IS YOURS TO DEFINE.
        </p>
      </article>
    </BannerFullWidthWithLegend>

    <section class="container-e5">
      <img :src="TALLADEGA_LOGO" alt="TALLADEGA" class="my-20 mx-auto max-w-[700px]" />

      <div class="grid grid-cols-3 gap-12 mb-12 mx-20">
        <!-- Podium Gold Brushed -->
        <div class="text-center">
          <img :src="TALLADEGA_PODIUM_GOLD" alt="Podium Gold Brushed" class="w-full h-auto mb-6" />
          <h3 class="text-[16px] tracking-[4px] mb-2">PODIUM GOLD BRUSHED</h3>
          <p class="text-e5-red text-[16px] tracking-[4px] mb-1">20 X 10</p>
          <p class="text-e5-red text-[16px] tracking-[4px] mb-2">21 X 13</p>
          <p class="text-[12px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>

        <!-- Gloss Black -->
        <div class="text-center">
          <img :src="TALLADEGA_GLOSS_BLACK" alt="Gloss Black" class="w-full h-auto mb-6" />
            <h3 class="text-[16px] tracking-[4px] mb-2">GLOSS BLACK</h3>
            <p class="text-e5-red text-[16px] tracking-[4px] mb-1">20 X 10</p>
            <p class="text-e5-red text-[16px] tracking-[4px] mb-2">21 X 13</p>
            <p class="text-[12px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>

        <!-- Smoked Titanium Brushed -->
        <div class="text-center">
          <img :src="TALLADEGA_SMOKED_POLISHED" alt="Smoked Titanium Brushed" class="w-full h-auto mb-6" />
          <h3 class="text-[16px] tracking-[4px] mb-2">SMOKED TITANIUM BRUSHED</h3>
          <p class="text-e5-red text-[16px] tracking-[4px] mb-1">20 X 10</p>
          <p class="text-e5-red text-[16px] tracking-[4px] mb-2">21 X 13</p>
          <p class="text-[12px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>
      </div>

      <div class="w-full text-center mb-6">
        <h3 class="text-[30px] tracking-[3.2px]"><span class="text-e5-red">CUSTOM</span> <span class="opacity-50">FINISHES AVAILABLE</span></h3>
      </div>

      <div class="text-center mb-20">
        <Button primary>
          SHOP FORGED
        </Button>
      </div>
    </section>

    <BannerFullWidthWithLegend
        :orientation="Orientations.LEFT"
        bg-color="bg-black/10"
        alt="Vette Gallery"
        class="h-[582px]"
        :image="VETTE_GALLERY_IMAGE_1"
    >
      <article class="flex flex-col justify-center text-white text-center">
        <h2 class="text-[48px] font-franklin-heavy tracking-[-0.96px] uppercase leading-[37px] mb-3">
          WHEEL GALLERY
        </h2>
        <p class="text-[20px] tracking-[-0.48px] leading-[23px] mb-6">
          A collection of builds fitted with our Talladega.
        </p>
        <div class="flex mx-auto cursor-pointer" @click="router.push('/gallery')">
          <div class="text-[12px] tracking-[3.96px] uppercase border-b border-e5-red pb-2">
            <div class="hover:-translate-y-0.5">
              VIEW GALLERY
            </div>
          </div>
        </div>
      </article>
    </BannerFullWidthWithLegend>

    <BannerFullWidthWithLegend
        alt="Wheel Gallery"
        class="h-[582px]"
        bg-color="bg-[rgba(211,29,37,0.16)]"
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