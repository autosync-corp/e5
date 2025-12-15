<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import {CART_ICON, E5_LOGO_WHITE} from "@/core/constants/App.ts";
import {
  CONTACT_ROUTE,
  GALLERY_ROUTE,
  GALLERY_VEHICLES_ROUTE,
  GALLERY_WHEELS_ROUTE,
  GENERATIONS_ROUTE,
  HOME_ROUTE, PROCESS_ROUTE, SHOP_ROUTE, VISUALIZE_ROUTE,
  WHEELS_ROUTE
} from "@/core/constants/Routes.ts";

const currentPath = ref('');
const isMobileMenuOpen = ref(false);
const isGalleryDropdownOpen = ref(false);

onMounted(() => {
  currentPath.value = window.location.pathname;
});

const isWheelsRoute = computed(() => currentPath.value.startsWith(WHEELS_ROUTE))
const isGalleryRoute = computed(() => currentPath.value.startsWith(GALLERY_ROUTE))
const isShopRoute = computed(() => currentPath.value.startsWith(SHOP_ROUTE))
const isProcessRoute = computed(() => currentPath.value.startsWith(PROCESS_ROUTE))
const isVisualizeRoute = computed(() => currentPath.value.startsWith(VISUALIZE_ROUTE))
const isGenerationRoute = computed(() => currentPath.value.startsWith(GENERATIONS_ROUTE))
const isContactRoute = computed(() => currentPath.value.startsWith(CONTACT_ROUTE))

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
}

const toggleGalleryDropdown = () => {
  isGalleryDropdownOpen.value = !isGalleryDropdownOpen.value;
}

const closeGalleryDropdown = () => {
  isGalleryDropdownOpen.value = false;
}
</script>

<template>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-10 flex justify-center">
    <!-- Desktop Navigation -->
    <div class="desktop-nav inline-grid h-full grid-cols-[1fr_auto_1fr] items-center gap-16 px-4">
      <div class="flex justify-start gap-6">
        <a :href="WHEELS_ROUTE" class="nav-link" :class="{'selected': isWheelsRoute}">WHEELS</a>

        <!-- Gallery Dropdown -->
        <div class="gallery-dropdown-wrapper" @mouseenter="isGalleryDropdownOpen = true" @mouseleave="closeGalleryDropdown">
          <button class="nav-link" :class="{'selected': isGalleryRoute}">
            GALLERY
            <svg class="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isGalleryDropdownOpen" class="dropdown-menu">
            <a :href="GALLERY_VEHICLES_ROUTE" class="dropdown-item">VEHICLES</a>
            <a :href="GALLERY_WHEELS_ROUTE" class="dropdown-item">WHEELS</a>
          </div>
        </div>

        <a :href="PROCESS_ROUTE" class="nav-link" :class="{'selected': isProcessRoute}">PROCESS</a>
      </div>

      <div class="flex justify-center">
        <a :href="HOME_ROUTE">
          <img :src="E5_LOGO_WHITE" alt="E5 Wheels" class="max-h-[24px] w-auto" style="aspect-ratio: 35/3" />
        </a>
      </div>

      <div class="flex justify-end items-center gap-6">
        <a :href="GENERATIONS_ROUTE" class="nav-link whitespace-nowrap" :class="{'selected': isGenerationRoute}">GENERATIONS</a>
        <a :href="VISUALIZE_ROUTE" class="nav-link whitespace-nowrap" :class="{'selected': isVisualizeRoute}">VISUALIZE</a>
        <a :href="CONTACT_ROUTE" class="nav-link" :class="{'selected': isContactRoute}">CONTACT</a>
        <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav w-full h-full flex items-center justify-between px-6">
      <!-- Mobile Logo -->
      <a :href="HOME_ROUTE">
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
        <a :href="WHEELS_ROUTE" class="mobile-nav-link" :class="{'selected': isWheelsRoute}" @click="closeMobileMenu">WHEELS</a>

        <!-- Gallery Submenu for Mobile -->
        <div class="mobile-submenu">
          <button @click="toggleGalleryDropdown" class="mobile-nav-link" :class="{'selected': isGalleryRoute}">
            GALLERY
            <svg class="inline-block w-3 h-3 ml-1" :class="{'rotate-180': isGalleryDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="isGalleryDropdownOpen" class="mobile-submenu-items">
            <a :href="GALLERY_VEHICLES_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">VEHICLES</a>
            <a :href="GALLERY_WHEELS_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">WHEELS</a>
          </div>
        </div>

        <a :href="PROCESS_ROUTE" class="mobile-nav-link" :class="{'selected': isProcessRoute}" @click="closeMobileMenu">PROCESS</a>
        <a :href="GENERATIONS_ROUTE" class="mobile-nav-link" :class="{'selected': isGenerationRoute}" @click="closeMobileMenu">GENERATIONS</a>
        <a :href="VISUALIZE_ROUTE" class="mobile-nav-link" :class="{'selected': isVisualizeRoute}" @click="closeMobileMenu">VISUALIZE</a>
        <a :href="CONTACT_ROUTE" class="mobile-nav-link" :class="{'selected': isContactRoute}" @click="closeMobileMenu">CONTACT</a>
        <div class="flex justify-center mt-8">
          <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply font-franklin-medium text-14 text-white no-underline whitespace-nowrap transition-opacity hover:opacity-70 text-center ps-1;
  border-bottom: #141414 2px solid;
  background: transparent;
  cursor: pointer;
}

.nav-link.selected {
  border-bottom: red 2px solid;
}

/* Gallery Dropdown */
.gallery-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 180px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 50;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.dropdown-menu::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 10px;
  background: transparent;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1.5rem;
  color: white;
  text-decoration: none;
  font-size: 14px;
  font-family: 'Franklin Gothic Medium', sans-serif;
  transition: background-color 0.2s, color 0.2s;
  letter-spacing: 3.5px;
}

.dropdown-item:hover {
  background-color: rgba(211, 29, 37, 0.1);
  color: #d31d25;
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

/* Mobile Submenu */
.mobile-submenu {
  @apply flex flex-col items-center gap-4;
}

.mobile-submenu-items {
  @apply flex flex-col items-center gap-3 mt-2;
}

.mobile-submenu-link {
  @apply font-franklin-book text-16 text-white/80 no-underline transition-opacity hover:opacity-70 hover:text-e5-red;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s;
}

/* Tablet adjustments */
@media (max-width: 768px) {
  .nav-link {
    font-size: 12px;
    letter-spacing: 2px;
  }
}
</style>