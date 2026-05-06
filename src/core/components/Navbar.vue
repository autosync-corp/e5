<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import {CART_ICON, E5_LOGO_WHITE} from "@/core/constants/App.ts";
import {
  ABOUT_ROUTE,
  CART_ROUTE,
  CONTACT_ROUTE,
  GALLERY_ROUTE,
  GALLERY_VEHICLES_ROUTE,
  GALLERY_WHEELS_ROUTE,
  GENERATIONS_ROUTE,
  GENERATIONS_C5_Z06_ROUTE,
  GENERATIONS_C6_ROUTE,
  GENERATIONS_C6_GRAND_SPORT_ROUTE,
  GENERATIONS_C7_STINGRAY_ROUTE,
  GENERATIONS_C7_GRAND_SPORT_ROUTE,
  GENERATIONS_C7_Z06_ROUTE,
  GENERATIONS_C8_STINGRAY_ROUTE,
  GENERATIONS_C8_Z06_ROUTE,
  GENERATIONS_C8_ZR1_ROUTE,
  HOME_ROUTE, PROCESS_ROUTE, PROCESS_FORGED_ROUTE, PROCESS_FORM_FORGED_ROUTE, SHOP_ROUTE, VISUALIZE_ROUTE,
  WHEELS_ROUTE,
  WHEELS_DAYTONA_ROUTE,
  WHEELS_TALLADEGA_ROUTE,
  WHEELS_SEBRING_ROUTE,
  WHEELS_SEBRING_2P_ROUTE,
  WHEELS_SPEEDWAY_ROUTE,
  WHEELS_SONOMA_ROUTE
} from "@/core/constants/Routes.ts";
import { CartManager } from "@/core/services/ProductService.ts";
import MiniCart from "@/core/components/MiniCart.vue";

const currentPath = ref('');
const isMobileMenuOpen = ref(false);
const isWheelsDropdownOpen = ref(false);
const isGalleryDropdownOpen = ref(false);
const isProcessDropdownOpen = ref(false);
const isGenerationsDropdownOpen = ref(false);
const isMiniCartOpen = ref(false);
const cartItemCount = ref(0);

onMounted(() => {
  currentPath.value = window.location.pathname;
  updateCartCount();

  // Listen for cart updates
  window.addEventListener('storage', updateCartCount);
  window.addEventListener('cart-updated', updateCartCount);
});

const updateCartCount = () => {
  cartItemCount.value = CartManager.getItemCount();
};

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

const toggleGenerationsDropdown = () => {
  isGenerationsDropdownOpen.value = !isGenerationsDropdownOpen.value;
}

const closeGenerationsDropdown = () => {
  isGenerationsDropdownOpen.value = false;
}

const toggleWheelsDropdown = () => {
  isWheelsDropdownOpen.value = !isWheelsDropdownOpen.value;
}

const closeWheelsDropdown = () => {
  isWheelsDropdownOpen.value = false;
}

const toggleProcessDropdown = () => {
  isProcessDropdownOpen.value = !isProcessDropdownOpen.value;
}

const closeProcessDropdown = () => {
  isProcessDropdownOpen.value = false;
}

const toggleMiniCart = () => {
  isMiniCartOpen.value = !isMiniCartOpen.value;
}

const closeMiniCart = () => {
  isMiniCartOpen.value = false;
}
</script>

<template>
  <div>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-50 flex justify-center">
    <!-- Desktop Navigation -->
    <div class="desktop-nav w-full max-w-[1600px] h-full flex items-center justify-center px-4 xl:px-8 2xl:px-12">
      <div class="flex items-center gap-2 xl:gap-4 2xl:gap-8">
        <!-- Left Menu Items -->
        <div class="flex items-center gap-2 xl:gap-3 2xl:gap-4">
          <!-- Wheels Dropdown -->
          <div class="gallery-dropdown-wrapper" @mouseenter="isWheelsDropdownOpen = true" @mouseleave="closeWheelsDropdown">
            <a :href="WHEELS_ROUTE" class="nav-link" :class="{'selected': isWheelsRoute}">
              WHEELS
              <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </a>

            <!-- Dropdown Menu -->
            <div v-if="isWheelsDropdownOpen" class="dropdown-menu wheels-dropdown">
              <div class="wheel-group">
                <div class="wheel-group-title">FORM FORGED</div>
                <a :href="WHEELS_DAYTONA_ROUTE" class="dropdown-item">DAYTONA</a>
                <a :href="WHEELS_SEBRING_ROUTE" class="dropdown-item">SEBRING</a>
                <a :href="WHEELS_SEBRING_2P_ROUTE" class="dropdown-item">SEBRING 2P</a>
                <a :href="WHEELS_SPEEDWAY_ROUTE" class="dropdown-item">SPEEDWAY</a>
              </div>
              <div class="wheel-group">
                <div class="wheel-group-title">FORGED</div>
                <a :href="WHEELS_SONOMA_ROUTE" class="dropdown-item">SONOMA</a>
                <a :href="WHEELS_TALLADEGA_ROUTE" class="dropdown-item">TALLADEGA</a>
              </div>
            </div>
          </div>

          <!-- Gallery Dropdown -->
          <div class="gallery-dropdown-wrapper" @mouseenter="isGalleryDropdownOpen = true" @mouseleave="closeGalleryDropdown">
            <a :href="GALLERY_ROUTE" class="nav-link" :class="{'selected': isGalleryRoute}" aria-label="Gallery">
              GALLERY
              <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </a>

            <!-- Dropdown Menu -->
            <div v-if="isGalleryDropdownOpen" class="dropdown-menu">
              <a :href="GALLERY_VEHICLES_ROUTE" class="dropdown-item">VEHICLES</a>
              <a :href="GALLERY_WHEELS_ROUTE" class="dropdown-item">WHEELS</a>
            </div>
          </div>

          <!-- Process Dropdown -->
          <div class="gallery-dropdown-wrapper" @mouseenter="isProcessDropdownOpen = true" @mouseleave="closeProcessDropdown">
            <a :href="PROCESS_ROUTE" class="nav-link" :class="{'selected': isProcessRoute}" aria-label="Process">
              PROCESS
              <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </a>

            <!-- Dropdown Menu -->
            <div v-if="isProcessDropdownOpen" class="dropdown-menu">
              <a :href="PROCESS_FORGED_ROUTE" class="dropdown-item">FORGED</a>
              <a :href="PROCESS_FORM_FORGED_ROUTE" class="dropdown-item">FORM FORGED</a>
            </div>
          </div>
        </div>

        <!-- Center Logo -->
        <div class="flex justify-center items-center px-2 xl:px-4 2xl:px-6">
          <a :href="HOME_ROUTE" aria-label="E5 Wheels - Home">
            <img :src="E5_LOGO_WHITE" alt="E5 Wheels" class="max-h-[18px] xl:max-h-[20px] 2xl:max-h-[24px] w-auto" style="aspect-ratio: 35/3" />
          </a>
        </div>

        <!-- Right Menu Items -->
        <div class="flex items-center gap-2 xl:gap-3 2xl:gap-4">
        <!-- Generations Dropdown -->
        <div class="gallery-dropdown-wrapper" @mouseenter="isGenerationsDropdownOpen = true" @mouseleave="closeGenerationsDropdown">
          <a :href="GENERATIONS_ROUTE" class="nav-link whitespace-nowrap" :class="{'selected': isGenerationRoute}">
            GENERATIONS
            <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <!-- Dropdown Menu -->
          <div v-if="isGenerationsDropdownOpen" class="dropdown-menu generations-dropdown">
            <div class="generation-group">
              <div class="generation-title">C8 2020-2026</div>
              <a :href="GENERATIONS_C8_STINGRAY_ROUTE" class="dropdown-item">Stingray</a>
              <a :href="GENERATIONS_C8_Z06_ROUTE" class="dropdown-item">Z06</a>
              <a :href="GENERATIONS_C8_ZR1_ROUTE" class="dropdown-item">ZR1</a>
            </div>
            <div class="generation-group">
              <div class="generation-title">C7 2014-2019</div>
              <a :href="GENERATIONS_C7_STINGRAY_ROUTE" class="dropdown-item">Stingray</a>
              <a :href="GENERATIONS_C7_GRAND_SPORT_ROUTE" class="dropdown-item">Grand Sport</a>
              <a :href="GENERATIONS_C7_Z06_ROUTE" class="dropdown-item">Z06</a>
            </div>
            <div class="generation-group">
              <div class="generation-title">C6 2005-2013</div>
              <a :href="GENERATIONS_C6_ROUTE" class="dropdown-item">Base Model</a>
              <a :href="GENERATIONS_C6_GRAND_SPORT_ROUTE" class="dropdown-item">Grand Sport</a>
            </div>
            <div class="generation-group">
              <div class="generation-title">C5 1997-2004</div>
              <a :href="GENERATIONS_C5_Z06_ROUTE" class="dropdown-item">Z06</a>
            </div>
          </div>
        </div>

          <a :href="VISUALIZE_ROUTE" class="nav-link whitespace-nowrap" :class="{'selected': isVisualizeRoute}">VISUALIZE</a>
          <a :href="CONTACT_ROUTE" class="nav-link" :class="{'selected': isContactRoute}">CONTACT</a>
          <button @click="toggleMiniCart" class="relative">
            <img :src="CART_ICON" alt="Cart" class="w-[26px] xl:w-[28px] 2xl:w-[32px] h-auto cursor-pointer hover:opacity-80 transition-opacity" />
            <span v-if="cartItemCount > 0" class="absolute -top-2 -right-2 bg-e5-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {{ cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav w-full h-full flex items-center justify-between px-6">
      <!-- Mobile Logo -->
      <a :href="HOME_ROUTE" aria-label="E5 Wheels - Home">
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
        <!-- Wheels Submenu for Mobile -->
        <div class="mobile-submenu">
          <div class="flex items-center gap-2">
            <a :href="WHEELS_ROUTE" class="mobile-nav-link" :class="{'selected': isWheelsRoute}" @click="closeMobileMenu">
              WHEELS
            </a>
            <button @click="toggleWheelsDropdown" class="text-white p-1">
              <svg class="inline-block w-5 h-5" :class="{'rotate-180': isWheelsDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div v-if="isWheelsDropdownOpen" class="mobile-submenu-items">
            <div class="mobile-wheel-group">
              <div class="mobile-wheel-title">FORM FORGED</div>
              <a :href="WHEELS_DAYTONA_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">DAYTONA</a>
              <a :href="WHEELS_SEBRING_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">SEBRING</a>
              <a :href="WHEELS_SEBRING_2P_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">SEBRING 2P</a>
              <a :href="WHEELS_SPEEDWAY_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">SPEEDWAY</a>
            </div>
            <div class="mobile-wheel-group">
              <div class="mobile-wheel-title">FORGED</div>
              <a :href="WHEELS_SONOMA_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">SONOMA</a>
              <a :href="WHEELS_TALLADEGA_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">TALLADEGA</a>
            </div>
          </div>
        </div>

        <!-- Gallery Submenu for Mobile -->
        <div class="mobile-submenu">
          <div class="flex items-center gap-2">
            <a :href="GALLERY_ROUTE" class="mobile-nav-link" :class="{'selected': isGalleryRoute}" @click="closeMobileMenu">
              GALLERY
            </a>
            <button @click="toggleGalleryDropdown" class="text-white p-1" aria-label="Toggle Gallery submenu">
              <svg class="inline-block w-5 h-5" :class="{'rotate-180': isGalleryDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div v-if="isGalleryDropdownOpen" class="mobile-submenu-items">
            <a :href="GALLERY_VEHICLES_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">VEHICLES</a>
            <a :href="GALLERY_WHEELS_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">WHEELS</a>
          </div>
        </div>

        <!-- Process Submenu for Mobile -->
        <div class="mobile-submenu">
          <div class="flex items-center gap-2">
            <a :href="PROCESS_ROUTE" class="mobile-nav-link" :class="{'selected': isProcessRoute}" @click="closeMobileMenu">
              PROCESS
            </a>
            <button @click="toggleProcessDropdown" class="text-white p-1" aria-label="Toggle Process submenu">
              <svg class="inline-block w-5 h-5" :class="{'rotate-180': isProcessDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div v-if="isProcessDropdownOpen" class="mobile-submenu-items">
            <a :href="PROCESS_FORGED_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">FORGED</a>
            <a :href="PROCESS_FORM_FORGED_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">FORM FORGED</a>
          </div>
        </div>

        <!-- Generations Submenu for Mobile -->
        <div class="mobile-submenu">
          <div class="flex items-center gap-2">
            <a :href="GENERATIONS_ROUTE" class="mobile-nav-link" :class="{'selected': isGenerationRoute}" @click="closeMobileMenu">
              GENERATIONS
            </a>
            <button @click="toggleGenerationsDropdown" class="text-white p-1">
              <svg class="inline-block w-5 h-5" :class="{'rotate-180': isGenerationsDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div v-if="isGenerationsDropdownOpen" class="mobile-submenu-items">
            <div class="mobile-generation-group">
              <div class="mobile-generation-title">C8 2020-2026</div>
              <a :href="GENERATIONS_C8_STINGRAY_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Stingray</a>
              <a :href="GENERATIONS_C8_Z06_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Z06</a>
              <a :href="GENERATIONS_C8_ZR1_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">ZR1</a>
            </div>
            <div class="mobile-generation-group">
              <div class="mobile-generation-title">C7 2014-2019</div>
              <a :href="GENERATIONS_C7_STINGRAY_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Stingray</a>
              <a :href="GENERATIONS_C7_GRAND_SPORT_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Grand Sport</a>
              <a :href="GENERATIONS_C7_Z06_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Z06</a>
            </div>
            <div class="mobile-generation-group">
              <div class="mobile-generation-title">C6 2005-2013</div>
              <a :href="GENERATIONS_C6_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Base Model</a>
              <a :href="GENERATIONS_C6_GRAND_SPORT_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Grand Sport</a>
            </div>
            <div class="mobile-generation-group">
              <div class="mobile-generation-title">C5 1997-2004</div>
              <a :href="GENERATIONS_C5_Z06_ROUTE" class="mobile-submenu-link" @click="closeMobileMenu">Z06</a>
            </div>
          </div>
        </div>

        <a :href="VISUALIZE_ROUTE" class="mobile-nav-link" :class="{'selected': isVisualizeRoute}" @click="closeMobileMenu">VISUALIZE</a>
        <a :href="CONTACT_ROUTE" class="mobile-nav-link" :class="{'selected': isContactRoute}" @click="closeMobileMenu">CONTACT</a>
        <div class="flex justify-center mt-8">
          <button @click="toggleMiniCart(); closeMobileMenu();" class="relative">
            <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
            <span v-if="cartItemCount > 0" class="absolute -top-2 -right-2 bg-e5-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {{ cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Mini Cart Component -->
  <MiniCart client:visible :isOpen="isMiniCartOpen" @close="closeMiniCart" />
  </div>
</template>

<style scoped>
.nav-link {
  @apply font-franklin-medium text-[10px] xl:text-xs 2xl:text-sm text-white no-underline whitespace-nowrap transition-opacity hover:opacity-70 text-center ps-1;
  border-bottom: #141414 2px solid;
  background: transparent;
  cursor: pointer;
  letter-spacing: 2px;
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

/* Generations Dropdown Specific Styles */
.generations-dropdown {
  min-width: 250px;
  padding: 0.5rem 0;
}

.generation-group {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.generation-group:last-child {
  border-bottom: none;
}

.generation-title {
  padding: 0.5rem 1.5rem 0.25rem;
  color: #d31d25;
  font-size: 12px;
  font-family: 'Franklin Gothic Demi', sans-serif;
  letter-spacing: 2px;
  font-weight: 600;
}

.generation-group .dropdown-item {
  padding: 0.5rem 1.5rem 0.5rem 2.5rem;
  font-size: 13px;
}

/* Wheels Dropdown Specific Styles */
.wheels-dropdown {
  min-width: 220px;
  padding: 0.5rem 0;
}

.wheel-group {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.wheel-group:last-child {
  border-bottom: none;
}

.wheel-group-title {
  padding: 0.5rem 1.5rem 0.25rem;
  color: #d31d25;
  font-size: 12px;
  font-family: 'Franklin Gothic Demi', sans-serif;
  letter-spacing: 2px;
  font-weight: 600;
}

.wheel-group .dropdown-item {
  padding: 0.5rem 1.5rem 0.5rem 2.5rem;
  font-size: 13px;
}

.dropdown-item.coming-soon {
  color: rgba(255, 255, 255, 0.4);
  cursor: default;
  pointer-events: none;
}

/* Desktop Navigation - Hidden on mobile */
.desktop-nav {
  display: inline-grid;
}

.mobile-nav {
  display: none;
}

/* Mobile Navigation */
@media (max-width: 1024px) {
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
  @apply flex flex-col items-center gap-8 h-full px-6 py-8 overflow-y-auto;
}

.mobile-nav-link {
  @apply font-franklin-medium text-18 text-white underline transition-opacity hover:opacity-70;
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

/* Mobile Generation Groups */
.mobile-generation-group {
  @apply flex flex-col items-center gap-2 mb-4;
}

.mobile-generation-group:last-child {
  @apply mb-0;
}

.mobile-generation-title {
  @apply font-franklin-demi text-14 text-e5-red uppercase tracking-[2px] mb-1;
}

/* Mobile Wheel Groups */
.mobile-wheel-group {
  @apply flex flex-col items-center gap-2 mb-4;
}

.mobile-wheel-group:last-child {
  @apply mb-0;
}

.mobile-wheel-title {
  @apply font-franklin-demi text-14 text-e5-red uppercase tracking-[2px] mb-1;
}

.mobile-submenu-link.coming-soon {
  @apply text-white/30 pointer-events-none;
}

/* Tablet adjustments */
@media (max-width: 768px) {
  .nav-link {
    font-size: 12px;
    letter-spacing: 2px;
  }
}
</style>