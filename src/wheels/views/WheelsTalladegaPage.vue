<script setup lang="ts">
import {
  TALLADEGA_LOGO,
  TALLADEGA_PODIUM_GOLD,
  TALLADEGA_GLOSS_BLACK,
  TALLADEGA_SMOKED_POLISHED,
  TALLADEGA_VIDEO, TALLADEGA_LOGO_WHITE
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import Hero from "@/core/components/Hero.vue";

const E5_FORGED_WHITE_LOGO = "/src/assets/figma/662aa69ac9582f417e1affdd901a97fee9a4b3cd.png";
const FEATURE_IMAGE_1 = "/src/assets/figma/ac4f9bca958678b8de35e44893e3d5a5f294ec8b.png";
const FEATURE_IMAGE_2 = "/src/assets/figma/81b6e7a67f0ff714d31b243e6080853c26608bba.png";
const FEATURE_IMAGE_3 = "/src/assets/figma/6a649ab233804998e9706b78af02bf981a2fa348.png";
const GALLERY_IMAGE_1 = "/src/assets/figma/89c9ed81f102db68b783d5f4160542c56cda8b23.png";
const GALLERY_IMAGE_2 = "/src/assets/figma/80496ef76dbfffdc9aec2b05ddb00a9c06a7debc.png";
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

    <!-- Divider Line -->
    <div class="w-full h-[6px] bg-gray-200"></div>

    <!-- E5 FORGED Section with Background Image -->
    <section class="relative w-full h-[582px]">
      <div class="absolute inset-0 overflow-hidden">
        <img :src="FEATURE_IMAGE_1" alt="" class="absolute w-full h-[226%] object-cover" style="left: -14.17%; top: -125.26%" />
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative container-e5 h-full flex items-center justify-between gap-12 px-24">
        <img :src="E5_FORGED_WHITE_LOGO" alt="E5 FORGED" class="h-[46px] object-contain" />
        <div class="h-[138px] w-[1px] bg-white"></div>
        <p class="text-white text-[24px] leading-[30px] opacity-70 max-w-[656px] font-light">
          Exclusively Forged in the USA for C8 Z06, ZR1, and E_Ray. Engineered for extreme performance, reduced weight, and maximum strength.
        </p>
      </div>
    </section>

    <!-- Feature Section 1: CUT TO PERFORM -->
    <section class="relative w-full h-[582px]">
      <div class="absolute inset-0 overflow-hidden">
        <img :src="FEATURE_IMAGE_2" alt="" class="absolute w-full h-[198%] object-cover" style="top: -48.29%" />
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative h-full flex items-center justify-end px-24">
        <div class="text-white text-right max-w-[787px]">
          <h2 class="text-[48px] leading-[37px] tracking-[-0.96px] font-black uppercase mb-6">
            <span>CUT TO </span>
            <span class="text-e5-red">PERFORM</span>
          </h2>
          <p class="text-[28px] leading-[23px] tracking-[-0.56px] uppercase">
            We carve away excess to optimize strength-to-weight, reduce inertia, and turn every ounce into performance.
          </p>
        </div>
      </div>
    </section>

    <!-- Feature Section 2: Engineered Depth -->
    <section class="relative w-full h-[582px]">
      <div class="absolute inset-0 overflow-hidden">
        <img :src="FEATURE_IMAGE_3" alt="" class="absolute h-[247%] object-cover" style="left: -18.98%; top: -76.13%; width: 124.65%" />
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative h-full flex items-center justify-end px-24">
        <div class="text-white text-right max-w-[787px]">
          <h2 class="text-[48px] leading-[37px] tracking-[-0.96px] font-black uppercase mb-6">
            <span>Engineered </span>
            <span class="text-e5-red">Depth</span>
          </h2>
          <p class="text-[28px] leading-[23px] tracking-[-0.56px] uppercase">
            engineered for performance. wider tire setups, greater grip, sharper handling, and improved brake clearance
          </p>
        </div>
      </div>
    </section>

    <!-- Feature Section 3: Our Foundation, Your Vision -->
    <section class="relative w-full h-[582px]">
      <div class="absolute inset-0 overflow-hidden">
        <img :src="FEATURE_IMAGE_2" alt="" class="absolute w-full h-[198%] object-cover" style="top: -48.29%" />
        <div class="absolute inset-0 bg-black/20"></div>
      </div>

      <div class="relative h-full flex items-center justify-end px-24">
        <div class="text-white text-right max-w-[787px]">
          <h2 class="text-[48px] leading-[37px] tracking-[-0.96px] font-black uppercase mb-6">
            <span>Our Foundation, Your </span>
            <span class="text-e5-red">Vision</span>
          </h2>
          <p class="text-[28px] leading-[23px] tracking-[-0.56px] uppercase">
            Every E5 Forged wheel begins as a foundation of strength and precision. FINISHING IS YOURS TO DEFINE.
          </p>
        </div>
      </div>
    </section>

    <!-- Divider Line -->
    <div class="w-full h-[6px] bg-gray-200"></div>

    <!-- Product Showcase Section -->
    <section class="container-e5 py-20">
      <div class="text-center mb-12">
        <img :src="TALLADEGA_LOGO" alt="TALLADEGA" class="mx-auto w-[868px] mb-8" />
        <p class="text-[28px] tracking-[5.6px] leading-[17px] opacity-60">
          <span class="text-e5-red">CUSTOM</span>
          <span> FINISHES AVAILABLE</span>
        </p>
      </div>

      <!-- Wheel Renders Grid -->
      <div class="grid grid-cols-3 gap-12 mb-12">
        <!-- Podium Gold Brushed -->
        <div class="text-center">
          <img :src="TALLADEGA_PODIUM_GOLD" alt="Podium Gold Brushed" class="w-full h-auto mb-6" />
          <h3 class="text-[20px] tracking-[4px] mb-4">PODIUM GOLD BRUSHED</h3>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-1">20 X 10</p>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-2">21 X 13</p>
          <p class="text-[16px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>

        <!-- Gloss Black -->
        <div class="text-center">
          <img :src="TALLADEGA_GLOSS_BLACK" alt="Gloss Black" class="w-full h-auto mb-6" />
          <h3 class="text-[20px] tracking-[4px] mb-4">GLOSS BLACK</h3>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-1">20 X 10</p>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-2">21 X 13</p>
          <p class="text-[16px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>

        <!-- Smoked Titanium Brushed -->
        <div class="text-center">
          <img :src="TALLADEGA_SMOKED_POLISHED" alt="Smoked Titanium Brushed" class="w-full h-auto mb-6" />
          <h3 class="text-[20px] tracking-[4px] mb-4">SMOKED TITANIUM BRUSHED</h3>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-1">20 X 10</p>
          <p class="text-e5-red text-[20px] tracking-[4px] mb-2">21 X 13</p>
          <p class="text-[16px] tracking-[3.2px] opacity-50">ONLY FOR Z06, ZR1, E_RAY</p>
        </div>
      </div>

      <div class="text-center">
        <Button primary class="bg-e5-red text-[20px] tracking-[4px] px-16 py-4 rounded-[11px]">
          SHOP FORGED
        </Button>
      </div>
    </section>

    <!-- Gallery Sections -->
    <section class="relative">
      <!-- Vette Gallery -->
      <div class="relative w-full h-[379px]">
        <img :src="GALLERY_IMAGE_1" alt="Gallery" class="absolute w-full h-[291%] object-cover" style="top: -109.09%" />
        <div class="absolute inset-0 bg-black/20"></div>

        <div class="relative h-full flex items-center px-24">
          <div class="text-white max-w-[535px]">
            <h2 class="text-[48px] leading-[37px] tracking-[-0.96px] font-black uppercase mb-4">
              <span class="tracking-[0.48px]">VETTE</span>
              <span> gallery</span>
            </h2>
            <p class="text-[24px] leading-[30px] text-white/80 mb-6">
              A collection of builds fitted with our Talladega.
            </p>
            <div class="inline-block cursor-pointer">
              <p class="text-[12px] tracking-[3.96px] uppercase mb-1">VIEW GALLERY</p>
              <div class="w-[118px] h-[1px] bg-e5-red"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wheel Gallery -->
      <div class="relative w-full h-[380px]">
        <img :src="GALLERY_IMAGE_2" alt="Gallery" class="absolute w-full h-[290%] object-cover" style="top: -85.41%" />
        <div class="absolute inset-0" style="background-color: rgba(211, 29, 37, 0.16)"></div>

        <div class="relative h-full flex items-center justify-end px-24">
          <div class="text-white text-right max-w-[495px]">
            <h2 class="text-[48px] leading-[37px] tracking-[-0.96px] font-black uppercase mb-4">wheel gallery</h2>
            <p class="text-[24px] leading-[23px] tracking-[-0.48px] mb-6">
              Our wheels, up close & personal.
            </p>
            <div class="inline-block cursor-pointer">
              <p class="text-[12px] tracking-[3.96px] uppercase mb-1">VIEW GALLERY</p>
              <div class="w-[118px] h-[1px] bg-e5-red ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.container-e5 {
  max-width: 1728px;
  margin: 0 auto;
  padding: 0 2rem;
}

.text-e5-red {
  color: #d31d25;
}

.bg-e5-red {
  background-color: #d31d25;
}

.font-black {
  font-family: 'Franklin Gothic Heavy', sans-serif;
  font-weight: 900;
}

.font-light {
  font-family: 'Excon Variable', sans-serif;
  font-weight: 300;
}
</style>
