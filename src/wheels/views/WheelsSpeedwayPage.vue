<script setup lang="ts">
import {
  DAYTONA_BRAND_NAME,
  DAYTONA_GLOSS_BLACK,
  DAYTONA_LOGO,
  FORM_FORGED_LOGO_BLACK,
  PROCESS_DIAGRAM,
  SEBRING_BRAND_NAME,
  SEBRING_GLOSS_BLACK,
  SEBRING_LOGO,
  SPEEDWAY_BRAND_NAME,
  SPEEDWAY_BRONZE, SPEEDWAY_DETAIL_1, SPEEDWAY_DETAIL_2, SPEEDWAY_DETAIL_3, SPEEDWAY_DETAIL_4,
  SPEEDWAY_DETAILS_BANNER,
  SPEEDWAY_GLOSS_BLACK,
  SPEEDWAY_HERO_IMAGE,
  SPEEDWAY_LIGHTWEIGHT_DESIGN_BANNER,
  SPEEDWAY_LOGO,
  SPEEDWAY_MOTORSPORT_STYLING_BANNER,
  SPEEDWAY_PRECISION_FITMENT_BANNER,
  SPEEDWAY_TITANIUM_BRUSHED, SPEEDWAY_VETTE_GALLERY_1, SPEEDWAY_VETTE_GALLERY_2, SPEEDWAY_VETTE_GALLERY_3,
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import BannerFullWidthWithLegend from "@/core/components/BannerFullWidthWithLegend.vue";
import {Orientations} from "@/core/types/App.ts";
import ImageWithLegend from "@/core/components/ImageWithLegend.vue";
import BannerBesideDetailArea from "@/core/components/BannerBesideDetailArea.vue";
</script>

<template>
  <main class="w-full h-full bg-white">
    <BannerFullWidthWithLegend class="h-[636px]" :image="SPEEDWAY_HERO_IMAGE" :alt="SPEEDWAY_BRAND_NAME" :orientation="Orientations.CENTER" />

    <!-- Logo and Description -->
    <section class="container-e5 py-20">
      <div class="flex justify-between items-start mb-12">
        <img :src="SPEEDWAY_LOGO" :alt="`${SPEEDWAY_BRAND_NAME} Logo`" class="w-[684px] h-auto" />
        <img :src="FORM_FORGED_LOGO_BLACK" alt="Form Forged" class="w-[195px] h-auto" />
      </div>

      <p class="text-[24px] leading-[30px] text-black/50 mb-16 max-w-[1024px]">
        The Speedway is part of our Form Forged Series — a hybrid multi-spoke design that balances lightweight performance with structural strength. With its bold concave profile and Corvette-specific fitments, the Speedway delivers timeless styling and motorsport-inspired performance on both street and track.
      </p>

      <h2 class="text-center text-[20px] tracking-[4px] text-black/45 uppercase">
        EXCLUSIVELY ENGINEERED FOR CORVETTES
      </h2>

      <div class="grid grid-cols-3 gap-8">
        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_GLOSS_BLACK">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">GLOSS BLACK</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
          </div>
        </ImageWithLegend>

        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_TITANIUM_BRUSHED">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">TITANIUM BRUSHED TINT</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
          </div>
        </ImageWithLegend>

        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_BRONZE">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">BRONZE BRUSHED TINT</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
          </div>
        </ImageWithLegend>
      </div>

      <!-- Shop Daytona Button -->
      <div class="text-center mt-12">
        <Button primary class="uppercase px-16">
          <span>
            SHOP <br />
            {{SPEEDWAY_BRAND_NAME}}
          </span>
        </Button>
      </div>
    </section>

    <!-- Precision Fitment Banner -->
    <BannerFullWidthWithLegend
        :alt="`${SPEEDWAY_BRAND_NAME} Precision Fitment`"
        :image="SPEEDWAY_PRECISION_FITMENT_BANNER"
        :orientation="Orientations.LEFT"
        class="h-[874px] relative"
    >
      <article class="absolute top-0 left-0 max-w-[860px] px-20">
        <h2 class="text-[48px] uppercase tracking-[9.6px]">
          <span class="text-e5-red">Precision Fitment</span>
        </h2>
        <p class="text-[20px] text-black/60 uppercase tracking-[4.8px] leading-[30px]">
          Exclusively engineered for Corvettes, the {{SPEEDWAY_BRAND_NAME}} locks in perfect stance, hub-centric balance, and uncompromising stability.
        </p>

        <div class="mt-20">
          <Button secondary class="px-28" link="/pending">
            <span class="text-[20px] font-black tracking-[1.5px]">LEARN ABOUT<br/>OUR PROCESS</span>
          </Button>
        </div>
      </article>
    </BannerFullWidthWithLegend>

    <!-- Lightweight Design Banner -->
    <BannerFullWidthWithLegend
        :alt="`${SPEEDWAY_BRAND_NAME} Lightweight Design`"
        :image="SPEEDWAY_LIGHTWEIGHT_DESIGN_BANNER"
        :orientation="Orientations.RIGHT"
        class="h-[874px]"
    >
      <article class="max-w-[720px] h-[874px] flex flex-col justify-start mt-32">
        <h2 class="text-[48px] uppercase tracking-[9.6px] leading-[20px] mb-6">
          <span class="text-e5-red">LIGHTWEIGHT DESIGN</span>
        </h2>
        <p class="text-[20px] uppercase tracking-[4.8px] leading-[30px]">
          We carve away excess material with purpose. Every cut reduces weight, sharpens response, and delivers rotational performance you can feel.
        </p>
      </article>
    </BannerFullWidthWithLegend>

    <BannerBesideDetailArea
        :alt="`${SPEEDWAY_BRAND_NAME} Motorsport Styling`"
        :image="SPEEDWAY_MOTORSPORT_STYLING_BANNER"
        class="h-[874px] border border-e5-red"
    >
      <template #left>
        <article class="max-w-[720px] h-[874px] flex flex-col justify-center mb-24 px-20">
          <h2 class="text-[48px] uppercase tracking-[9.6px]">
            <span class="text-e5-red">MOTORSPORT STYLING</span>
          </h2>
          <p class="text-[20px] uppercase tracking-[4.8px]">
            A deep concave profile and aggressive spoke geometry bring race-bred character to the street without sacrificing refinement.
          </p>
        </article>
      </template>
    </BannerBesideDetailArea>

    <BannerFullWidthWithLegend
        :alt="`${SPEEDWAY_BRAND_NAME} Motorsport Styling`"
        :image="SPEEDWAY_DETAILS_BANNER"
        :orientation="Orientations.RIGHT"
        class="h-[874px] border border-e5-red"
    >
      <article class="max-w-[720px] h-[874px] flex flex-col justify-end mb-24 text-end">
        <h2 class="text-[48px] uppercase tracking-[9.6px]">
          <span class="text-e5-red">DETAILS MATTER</span>
        </h2>
        <p class="text-[20px] uppercase tracking-[4.8px]">
          A CLOSER LOOK INTO E5 ENGINEERING.
        </p>

        <div class="my-12 flex justify-end">
          <Button secondary class="px-16" link="/wheels/gallery">
            <span class="text-[20px] font-black tracking-[1.5px]">VIEW<br/>WHEEL GALLERY</span>
          </Button>
        </div>
      </article>
    </BannerFullWidthWithLegend>

    <!-- Stills Banner -->
    <section class="w-full h-[716px] relative overflow-hidden">
      <img :src="SPEEDWAY_VETTE_GALLERY_1" alt="Daytona Details" class="w-full h-full object-cover" />
    </section>

    <!-- Our Process Section -->
    <section class="container-e5 py-20 text-center">
      <h2 class="text-[48px] tracking-[9.6px] leading-[20px] text-e5-red uppercase mb-6">
        OUR PROCESS
      </h2>
      <p class="text-[24px] tracking-[4.8px] leading-[30px] text-black/50 uppercase max-w-[1485px] mx-auto my-16">
        Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and agility—without compromising daily drivability.
      </p>

      <img :src="PROCESS_DIAGRAM" alt="Process" class="w-full max-w-[1485px] mx-auto mb-16" />
    </section>

    <!-- Finishing Section -->
    <section class="container-e5 pb-8 text-center">
      <h2 class="text-[48px] tracking-[9.6px] leading-[20px] text-e5-red uppercase mb-6">
        FINISHING
      </h2>
      <p class="text-[24px] tracking-[4.8px] leading-[30px] text-black/50 uppercase max-w-[1485px] mx-auto my-16">
        Our Form Forged Series is available in Gloss Black, Titanium Brushed Tint, Bronze Brushed Tint, AND DARK BRONZE— finishes that embody the essence of timeless, modern, and bold design. Each surface is crafted to elevate the wheel's form while enduring the demands of the road, all <span class="text-[#d31d25]/65">backed by our 5-year finishing warranty</span>.
      </p>
    </section>

    <!-- Detail Images Grid -->
    <section class="w-full">
      <div class="grid grid-cols-2">
        <img :src="SPEEDWAY_DETAIL_1" alt="Detail 1" class="w-full h-auto" />
        <img :src="SPEEDWAY_DETAIL_3" alt="Detail 3" class="w-full h-auto" />
      </div>
      <div class="grid grid-cols-2">
        <img :src="SPEEDWAY_DETAIL_2" alt="Detail 2" class="w-full h-auto" />
        <img :src="SPEEDWAY_DETAIL_4" alt="Detail 4" class="w-full h-auto" />
      </div>
    </section>

    <!-- Gallery Banner 1 -->
    <section class="w-full h-[716px] relative overflow-hidden border border-e5-red">
      <img :src="SPEEDWAY_VETTE_GALLERY_2" alt="Daytona Gallery" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-black/5"></div>
    </section>

    <!-- Shop Section with Three Wheels -->
    <section class="container-e5 py-16">
      <h2 class="text-center text-[20px] tracking-[4px] text-black/45 uppercase">
        EXCLUSIVELY ENGINEERED FOR CORVETTES
      </h2>

      <div class="grid grid-cols-3 gap-8">
        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_GLOSS_BLACK">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">GLOSS BLACK</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C5_C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
            <Button primary class="mt-8" link="/pending">
              ADD TO CART
            </Button>
          </div>
        </ImageWithLegend>

        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_TITANIUM_BRUSHED">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">TITANIUM BRUSHED TINT</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C5_C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
            <Button primary class="mt-8" link="/pending">
              ADD TO CART
            </Button>
          </div>
        </ImageWithLegend>

        <ImageWithLegend :alt="SPEEDWAY_BRAND_NAME" :image="SPEEDWAY_BRONZE">
          <div class="text-center">
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">BRONZE BRUSHED TINT</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">AVAILABLE FOR C5_C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">STARTING AT $600 PER WHEEL</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
            <Button primary class="mt-8" link="/pending">
              ADD TO CART
            </Button>
          </div>
        </ImageWithLegend>
      </div>
    </section>

    <BannerFullWidthWithLegend
        :alt="`${SPEEDWAY_BRAND_NAME} GALLERY`"
        :image="SPEEDWAY_VETTE_GALLERY_3"
        :orientation="Orientations.RIGHT"
        class="h-[716px] border border-e5-red"
    >
      <article class="max-w-[720px] h-[716px] text-end pt-12">
        <h2 class="text-[48px] uppercase tracking-[9.6px]">
          <span class="text-e5-red">{{SPEEDWAY_BRAND_NAME}} GALLERY</span>
        </h2>
        <p class="text-white text-[20px] uppercase tracking-[4.8px]">
          A CLOSER LOOK INTO E5 ENGINEERING.
        </p>

        <div class="my-12">
          <Button secondary class="px-16 border-e5-red text-e5-red" link="/wheels/gallery">
            <span class="text-[20px] font-black tracking-[1.5px]">VIEW DAYTONA<br/>GALLERY</span>
          </Button>
        </div>
      </article>
    </BannerFullWidthWithLegend>

    <!-- Discover More Form Forged Series Wheels -->
    <section class="container-e5 pt-12">
      <h2 class="text-center text-[20px] tracking-[4px] text-black/50 uppercase">
        DISCOVER MORE FORM FORGED SERIES WHEELS
      </h2>

      <div class="grid grid-cols-2 gap-16 mb-12">
        <ImageWithLegend :alt="DAYTONA_BRAND_NAME" :image="DAYTONA_GLOSS_BLACK">
          <div class="text-center">
            <img :src="DAYTONA_LOGO" :alt="DAYTONA_BRAND_NAME" class="mx-auto mb-4 h-[28px]" />
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">GLOSS BLACK</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">EXCLUSIVELY FOR C5_C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">AVAILABLE IN OTHER FINISHES</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
            <Button primary class="mt-8 uppercase" :link="`/wheels/${DAYTONA_BRAND_NAME}`"> EXPLORE {{ DAYTONA_BRAND_NAME }} </Button>
          </div>
        </ImageWithLegend>

        <ImageWithLegend :alt="SEBRING_BRAND_NAME" :image="SEBRING_GLOSS_BLACK">
          <div class="text-center">
            <img :src="SEBRING_LOGO" :alt="SEBRING_BRAND_NAME" class="mx-auto mb-4 h-[28px]" />
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">GLOSS BLACK</p>
            <p class="text-[16px] tracking-[1.5px] text-black/40 uppercase mb-2">EXCLUSIVELY FOR C6_C7_C8</p>
            <p class="text-[16px] tracking-[1.5px] text-black/60 uppercase mb-2">AVAILABLE IN OTHER FINISHES</p>
            <p class="text-[16px] text-e5-red uppercase mt-4 font-medium">IN STOCK</p>
            <Button primary class="mt-8 uppercase" :link="`/wheels/${SEBRING_BRAND_NAME}`"> EXPLORE {{ SEBRING_BRAND_NAME }} </Button>
          </div>
        </ImageWithLegend>
      </div>
    </section>

    <div class="text-center hover:bg-black/5 transition-colors duration-300 py-6 text-[20px] text-black/50 font-medium tracking-[2px] uppercase]" >
      BACK TO TOP
    </div>
  </main>
</template>
