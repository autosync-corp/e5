<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import {CART_ICON, E5_LOGO_WHITE} from "@/core/constants/App.ts";
import {GALLERY_ROUTE, WHEELS_ROUTE} from "@/core/constants/Routes.ts";

const currentPath = ref('');

onMounted(() => {
  currentPath.value = window.location.pathname;
});

const isWheelsRoute = computed(() => currentPath.value.startsWith(WHEELS_ROUTE))
const isGalleryRoute = computed(() => currentPath.value.startsWith(GALLERY_ROUTE))
</script>

<template>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-10 flex justify-center">
    <div class="inline-grid h-full grid-cols-[1fr_auto_1fr] items-center gap-16">
      <div class="flex justify-start gap-6">
        <a href="/wheels" class="nav-link" :class="{'selected': isWheelsRoute}">WHEELS</a>
        <a href="/gallery" class="nav-link" :class="{'selected': isGalleryRoute}">GALLERY</a>
        <a href="/general/process" class="nav-link">PROCESS</a>
      </div>

      <div class="flex justify-center">
        <a :href="`/?${Math.random()}`">
          <img :src="E5_LOGO_WHITE" alt="E5 Wheels" class="max-h-[24px] w-auto" style="aspect-ratio: 35/3" />
        </a>
      </div>

      <div class="flex justify-end items-center gap-6">
        <a href="/corvette/generations" class="nav-link whitespace-nowrap">GENERATIONS</a>
        <a href="/configure" class="nav-link whitespace-nowrap">CONFIGURE</a>
        <a href="/general/contact" class="nav-link">CONTACT</a>
        <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply font-franklin-medium text-14 text-white no-underline whitespace-nowrap transition-opacity hover:opacity-70;
}

.nav-link.selected {
  @apply text-e5-red;
}

@media (max-width: 480px) {
  .nav-link {
    font-size: 12px;
    letter-spacing: 3px;
  }
}
</style>