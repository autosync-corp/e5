<script setup lang="ts">
import {
  FORM_FORGED_LOGO,
  GALLERY_IMAGES,
  SHOP_FINISHES,
  SEBRING_LOGO,
  SEBRING_WHEELS,
  DAYTONA_LOGO,
  DAYTONA_WHEELS,
  SPEEDWAY_LOGO,
  SPEEDWAY_WHEELS, VPS_FORGED_LOGO, WHEEL_PAGE_BANNER, VPS_FORGED_VIDEO, E5_FORGED_LOGO, SEBRING_TITANIUM_BRUSHED,
  SEBRING_BRAND_NAME, DAYTONA_BRAND_NAME, DAYTONA_TITANIUM_BRUSHED_TINT, DAYTONA_TITANIUM_BRUSHED_TINT_FACE,
  SPEEDWAY_TITANIUM_BRUSHED, SPEEDWAY_TITANIUM_BRUSHED_TINT_BEAUTY_LEFT, SPEEDWAY_BRAND_NAME,
} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
import { useRouter } from "vue-router";
import Hero from "@/core/components/Hero.vue";
import ImageWithLegend from "@/core/components/ImageWithLegend.vue";

const router = useRouter();

// Process steps
const processSteps = [
  {
    icon: "/src/assets/figma/1abc452de788cc1e9d2bdd3af5dc0296990e10f4.png",
    title: "STEP 1",
    subtitle: "CONSULTATION",
    description: "We'll work with you to understand your needs and vision for your wheels."
  },
  {
    icon: "/src/assets/figma/1abc452de788cc1e9d2bdd3af5dc0296990e10f4.png",
    title: "STEP 2",
    subtitle: "DESIGN",
    description: "Our team creates a custom design tailored to your vehicle."
  },
  {
    icon: "/src/assets/figma/1abc452de788cc1e9d2bdd3af5dc0296990e10f4.png",
    title: "STEP 3",
    subtitle: "FABRICATION",
    description: "We forge and form your wheels using cutting-edge technology."
  },
  {
    icon: "/src/assets/figma/1abc452de788cc1e9d2bdd3af5dc0296990e10f4.png",
    title: "STEP 4",
    subtitle: "DELIVERY",
    description: "Your wheels are delivered ready to install on your Corvette."
  }
];

// Finishing images (using first 4 from gallery)
const finishingImages = GALLERY_IMAGES.slice(0, 4);

// Gallery section images
const galleryImages = [
  GALLERY_IMAGES[4],
  GALLERY_IMAGES[5]
];
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
            <img class="w-2/4 mb-4" :src="SEBRING_LOGO"/>
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
            <img class="w-2/4 mb-4" :src="DAYTONA_LOGO"/>
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
            <img class="w-2/4 mb-4" :src="SPEEDWAY_LOGO"/>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">TITANIUM BRUSHED TINT</span>
            <span class="text-center tracking-[3px] text-[14px] opacity-50">EXCLUSIVELY FORGED FOR C6_C7_C8</span>
            <span class="text-center tracking-[3px] text-[14px] text-black">3 PREMIUM FINISHES</span>
            <span class="text-center tracking-[3px] text-[14px] text-e5-red mt-4">IN STOCK</span>

            <Button primary class="mt-6 uppercase" link="/wheels/sebring">EXPLORE {{SPEEDWAY_BRAND_NAME}}</Button>
          </div>
        </ImageWithLegend>
      </div>
    </section>

    <!-- Our Process Section -->
    <section class="py-20">
      <div class="container-e5">
        <div class="text-center mb-12">
          <h2 class="text-[14px] tracking-[5.6px] text-e5-red font-franklin-demi mb-4">
            OUR PROCESS
          </h2>
          <p class="text-base max-w-[800px] mx-auto opacity-70">
            From consultation to delivery, we guide you through every step of creating your perfect wheels.
            Our process ensures precision, quality, and satisfaction at each stage.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
          <div
            v-for="(step, index) in processSteps"
            :key="index"
            class="flex flex-col items-center text-center"
          >
            <div class="relative mb-6">
              <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md">
                <div class="text-[60px] text-e5-red opacity-80">♥</div>
              </div>
            </div>
            <h3 class="text-xs tracking-[3.2px] font-franklin-demi mb-2 opacity-50">
              {{ step.title }}
            </h3>
            <h4 class="text-sm tracking-[2.8px] font-franklin-demi mb-3 text-e5-red">
              {{ step.subtitle }}
            </h4>
            <p class="text-xs leading-relaxed opacity-70 max-w-[200px]">
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Finishing Section -->
    <section class="container-e5 py-20">
      <div class="text-center mb-12">
        <h2 class="text-[14px] tracking-[5.6px] text-e5-red font-franklin-demi mb-4">
          FINISHING
        </h2>
        <p class="text-base max-w-[800px] mx-auto opacity-70">
          Choose from a variety of premium finishes to match your style.
          From classic gloss black to custom brushed tints, we offer the perfect finish for your wheels.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-[900px] mx-auto">
        <div
          v-for="(image, index) in finishingImages"
          :key="index"
          class="overflow-hidden rounded-lg aspect-square"
        >
          <img
            :src="image"
            :alt="`Finishing ${index + 1}`"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </section>

    <!-- Explore Form Forged Gallery -->
    <section class="bg-gray-50 py-20">
      <div class="container-e5">
        <div class="text-center mb-12">
          <h2 class="text-[14px] tracking-[5.6px] text-e5-red font-franklin-demi mb-4">
            EXPLORE FORM FORGED GALLERY
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(image, index) in galleryImages"
            :key="index"
            class="overflow-hidden rounded-lg aspect-[4/3]"
          >
            <img
              :src="image"
              :alt="`Gallery ${index + 1}`"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Shop Finishes Section -->
    <section class="container-e5 py-20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div
          v-for="(finish, index) in SHOP_FINISHES"
          :key="index"
          class="flex flex-col items-center text-center"
        >
          <div class="mb-6 max-w-[280px]">
            <img
              :src="finish.image"
              :alt="finish.finish"
              class="w-full object-contain"
            />
          </div>
          <h3 class="text-sm tracking-[2.8px] font-franklin-demi mb-2">
            {{ finish.finish }}
          </h3>
          <p class="text-xs opacity-50 mb-1">
            {{ finish.availability }}
          </p>
          <p class="text-xs opacity-50 mb-2">
            {{ finish.price }}
          </p>
          <p class="text-xs text-e5-red tracking-[2.4px] mb-6">
            {{ finish.stock }}
          </p>
          <Button primary>
            LEARN MORE
          </Button>
        </div>
      </div>
    </section>

    <!-- Footer Section -->
    <footer class="bg-e5-red text-white py-16">
      <div class="container-e5">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="text-center md:text-left mb-8 md:mb-0">
            <h3 class="text-2xl font-franklin-heavy tracking-[2px] mb-4">
              E5 WHEELS
            </h3>
            <p class="text-sm opacity-80">
              Engineered for Performance. Built for Corvettes.
            </p>
          </div>
          <div class="flex flex-col items-center md:items-end">
            <p class="text-sm opacity-80 mb-2">
              CONTACT US
            </p>
            <p class="text-lg font-franklin-demi tracking-[3.6px]">
              800-0-E5
            </p>
          </div>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.container-e5 {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
</style>