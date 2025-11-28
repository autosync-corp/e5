<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import {CART_ICON, E5_LOGO_WHITE} from "@/core/constants/App.ts";
import {GALLERY_ROUTE, WHEELS_ROUTE} from "@/core/constants/Routes.ts";

const currentPath = ref('');
const isMobileMenuOpen = ref(false);

onMounted(() => {
  currentPath.value = window.location.pathname;
});

const isWheelsRoute = computed(() => currentPath.value.startsWith(WHEELS_ROUTE))
const isGalleryRoute = computed(() => currentPath.value.startsWith(GALLERY_ROUTE))

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
}
</script>

<template>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-10 flex justify-center">
    <!-- Desktop Navigation -->
    <div class="desktop-nav inline-grid h-full grid-cols-[1fr_auto_1fr] items-center gap-16 px-4">
      <div class="flex justify-start gap-6">
        <a href="/buy" class="nav-link" :class="{'selected': isWheelsRoute}">BUY</a>
        <a href="/wheels" class="nav-link" :class="{'selected': isWheelsRoute}">WHEELS</a>
        <a href="/gallery" class="nav-link" :class="{'selected': isGalleryRoute}">GALLERY</a>
        <a href="/general/process" class="nav-link">PROCESS</a>
      </div>

      <div class="flex justify-center">
        <a href="/">
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

    <!-- Mobile Navigation -->
    <div class="mobile-nav w-full h-full flex items-center justify-between px-6">
      <!-- Mobile Logo -->
      <a href="/">
        <img :src="E5_LOGO_WHITE" alt="E5 Wheels" class="max-h-[20px] w-auto" />
      </a>

      <!-- Mobile Menu Toggle -->
      <button @click="toggleMobileMenu" class="hamburger-btn" aria-label="Toggle menu">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <div v-if="isMobileMenuOpen" class="mobile-menu" @click="closeMobileMenu">
      <div class="mobile-menu-content" @click.stop>
        <a href="/general/process" class="mobile-nav-link" @click="closeMobileMenu">PROCESS</a>
        <a href="/corvette/generations" class="mobile-nav-link" @click="closeMobileMenu">GENERATIONS</a>
        <a href="/general/contact" class="mobile-nav-link" @click="closeMobileMenu">CONTACT</a>
        <a href="/gallery" class="mobile-nav-link" :class="{'selected': isGalleryRoute}" @click="closeMobileMenu">GALLERY</a>
        <a href="/wheels" class="mobile-nav-link" :class="{'selected': isWheelsRoute}" @click="closeMobileMenu">WHEELS</a>
        <a href="/configure" class="mobile-nav-link" @click="closeMobileMenu">CONFIGURE</a>
        <a href="/buy" class="mobile-nav-link" @click="closeMobileMenu">BUY</a>
        <div class="flex justify-center mt-8">
          <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
        </div>
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

/* Desktop Navigation - Hidden on mobile */
.desktop-nav {
  display: inline-grid;
}

.mobile-nav {
  display: none;
}

/* Mobile Navigation */
@media (max-width: 1200px) {
  .desktop-nav {
    display: none;
  }

  .mobile-nav {
    display: flex;
  }
}

/* Hamburger Button */
.hamburger-btn {
  @apply flex items-center justify-center p-2 rounded-md hover:bg-gray-800 transition-colors;
}

/* Mobile Menu Overlay */
.mobile-menu {
  @apply fixed top-107 left-0 w-full h-[calc(100vh-107px)] bg-black bg-opacity-95 z-20;
}

.mobile-menu-content {
  @apply flex flex-col items-center justify-center gap-8 h-full px-6;
}

.mobile-nav-link {
  @apply font-franklin-medium text-18 text-white no-underline transition-opacity hover:opacity-70;
}

.mobile-nav-link.selected {
  @apply text-e5-red;
}

/* Tablet adjustments */
@media (max-width: 768px) {
  .nav-link {
    font-size: 12px;
    letter-spacing: 2px;
  }
}
</style>