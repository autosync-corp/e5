<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { CART_ICON, E5_LOGO_WHITE_NAV, E5_LOGO_WHITE_NAV_SRCSET } from '@/core/constants/App.ts';
import { HOME_ROUTE } from '@/core/constants/Routes.ts';
import { CartManager } from '@/core/services/ProductService.ts';
import MiniCart from '@/core/components/MiniCart.vue';

type NavChild = {
  id: string;
  label: string;
  href: string;
  group: string;
  badge: string;
};

type HeaderItem = {
  id: string;
  label: string;
  href: string;
  align: 'left' | 'right';
  menu: 'plain' | 'wheels' | 'generations' | 'visualize';
  matches: string[];
  children: NavChild[];
};

type NavGroup = { label: string; items: NavChild[] };

const props = defineProps<{
  items: HeaderItem[];
  fingerprint: string;
}>();

const liveItems = ref<HeaderItem[]>(props.items || []);
watch(
  () => props.items,
  (next) => {
    liveItems.value = next || [];
  },
);

const currentPath = ref('');
const isMobileMenuOpen = ref(false);
const openMenus = ref<Record<string, boolean>>({});
const isMiniCartOpen = ref(false);
const cartItemCount = ref(0);

onMounted(() => {
  currentPath.value = window.location.pathname;
  updateCartCount();
  window.addEventListener('storage', updateCartCount);
  window.addEventListener('cart-updated', updateCartCount);
  hydrateLiveNav();
});

const updateCartCount = () => {
  cartItemCount.value = CartManager.getItemCount();
};

async function hydrateLiveNav() {
  try {
    const res = await fetch('/api/site-nav');
    const data = await res.json();
    if (data?.fingerprint && data.fingerprint !== props.fingerprint && Array.isArray(data.header)) {
      liveItems.value = data.header;
    }
  } catch {
    /* keep SSR items */
  }
}

const leftItems = computed(() => liveItems.value.filter((item) => item.align !== 'right'));
const rightItems = computed(() => liveItems.value.filter((item) => item.align === 'right'));

function isSelected(item: HeaderItem) {
  const path = currentPath.value;
  const prefixes = item.matches.length ? item.matches : [item.href];
  return prefixes.some((prefix) => {
    if (prefix === '/') return path === '/' || path === '';
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

function grouped(children: NavChild[]): NavGroup[] {
  const groups: NavGroup[] = [];
  const index = new Map<string, number>();
  for (const row of children) {
    const label = row.group || '';
    if (!label) {
      groups.push({ label: '', items: [row] });
      continue;
    }
    const existing = index.get(label);
    if (existing === undefined) {
      index.set(label, groups.length);
      groups.push({ label, items: [row] });
    } else {
      groups[existing].items.push(row);
    }
  }
  return groups;
}

function usesGroups(item: HeaderItem) {
  return item.menu === 'wheels' || item.menu === 'generations';
}

function dropdownClass(item: HeaderItem) {
  if (item.menu === 'wheels') return 'wheels-dropdown';
  if (item.menu === 'generations') return 'generations-dropdown';
  if (item.menu === 'visualize') return 'visualize-dropdown';
  return '';
}

function groupClass(item: HeaderItem) {
  return item.menu === 'wheels' ? 'wheel-group' : 'generation-group';
}

function groupTitleClass(item: HeaderItem) {
  return item.menu === 'wheels' ? 'wheel-group-title' : 'generation-title';
}

function mobileGroupClass(item: HeaderItem) {
  return item.menu === 'wheels' ? 'mobile-wheel-group' : 'mobile-generation-group';
}

function mobileTitleClass(item: HeaderItem) {
  return item.menu === 'wheels' ? 'mobile-wheel-title' : 'mobile-generation-title';
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleMenu = (id: string) => {
  openMenus.value = { ...openMenus.value, [id]: !openMenus.value[id] };
};

const toggleMiniCart = () => {
  isMiniCartOpen.value = !isMiniCartOpen.value;
};

const closeMiniCart = () => {
  isMiniCartOpen.value = false;
};
</script>

<template>
  <div>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-50 flex justify-center">
    <!-- Desktop Navigation -->
    <div class="desktop-nav w-full max-w-[1600px] h-full flex items-center justify-center px-4 xl:px-8 2xl:px-12">
      <div class="flex items-center gap-2 xl:gap-4 2xl:gap-8">
        <div class="flex items-center gap-2 xl:gap-3 2xl:gap-4">
          <template v-for="item in leftItems" :key="item.id">
            <div v-if="item.children.length" class="gallery-dropdown-wrapper">
              <a :href="item.href" class="nav-link" :class="{'selected': isSelected(item)}" :aria-label="item.label">
                {{ item.label }}
                <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div class="dropdown-menu" :class="dropdownClass(item)">
                <template v-if="usesGroups(item)">
                  <div v-for="group in grouped(item.children)" :key="group.label" :class="groupClass(item)">
                    <div :class="groupTitleClass(item)">{{ group.label }}</div>
                    <a v-for="child in group.items" :key="child.id" :href="child.href" class="dropdown-item">
                      {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                    </a>
                  </div>
                </template>
                <template v-else>
                  <a v-for="child in item.children" :key="child.id" :href="child.href" class="dropdown-item whitespace-nowrap">
                    {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                  </a>
                </template>
              </div>
            </div>
            <a v-else :href="item.href" class="nav-link" :class="{'selected': isSelected(item)}">{{ item.label }}</a>
          </template>
        </div>

        <div class="flex justify-center items-center px-2 xl:px-4 2xl:px-6">
          <a :href="HOME_ROUTE" aria-label="E5 Wheels - Home">
            <img :src="E5_LOGO_WHITE_NAV" :srcset="E5_LOGO_WHITE_NAV_SRCSET" sizes="(max-width: 1279px) 210px, 280px" alt="E5 Wheels" class="max-h-[18px] xl:max-h-[20px] 2xl:max-h-[24px] w-auto" width="560" height="48" style="aspect-ratio: 35/3" decoding="async" />
          </a>
        </div>

        <div class="flex items-center gap-2 xl:gap-3 2xl:gap-4">
          <template v-for="item in rightItems" :key="item.id">
            <div v-if="item.children.length" class="gallery-dropdown-wrapper">
              <a :href="item.href" class="nav-link whitespace-nowrap" :class="{'selected': isSelected(item)}" :aria-label="item.label">
                {{ item.label }}
                <svg class="inline-block w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div class="dropdown-menu" :class="dropdownClass(item)">
                <template v-if="usesGroups(item)">
                  <div v-for="group in grouped(item.children)" :key="group.label" :class="groupClass(item)">
                    <div :class="groupTitleClass(item)">{{ group.label }}</div>
                    <a v-for="child in group.items" :key="child.id" :href="child.href" class="dropdown-item">
                      {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                    </a>
                  </div>
                </template>
                <template v-else>
                  <a v-for="child in item.children" :key="child.id" :href="child.href" class="dropdown-item whitespace-nowrap">
                    {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                  </a>
                </template>
              </div>
            </div>
            <a v-else :href="item.href" class="nav-link" :class="{'selected': isSelected(item)}">{{ item.label }}</a>
          </template>
          <button @click="toggleMiniCart" class="relative min-h-11 min-w-11" aria-label="Open cart">
            <img :src="CART_ICON" alt="Cart" class="w-[26px] xl:w-[28px] 2xl:w-[32px] h-auto cursor-pointer hover:opacity-80 transition-opacity" width="32" height="26" />
            <span v-if="cartItemCount > 0" class="absolute -top-2 -right-2 bg-e5-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {{ cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav w-full h-full flex items-center justify-between px-6">
      <a :href="HOME_ROUTE" aria-label="E5 Wheels - Home">
        <img :src="E5_LOGO_WHITE_NAV" :srcset="E5_LOGO_WHITE_NAV_SRCSET" sizes="233px" alt="E5 Wheels" class="max-h-[20px] w-auto" width="560" height="48" decoding="async" />
      </a>

      <button @click="toggleMobileMenu" class="hamburger-btn min-h-12 min-w-12" aria-label="Toggle menu" :aria-expanded="isMobileMenuOpen">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div v-if="isMobileMenuOpen" class="mobile-menu" @click="closeMobileMenu">
      <div class="mobile-menu-content" @click.stop>
        <template v-for="item in liveItems" :key="item.id">
          <div v-if="item.children.length" class="mobile-submenu">
            <div class="flex items-center gap-2">
              <a :href="item.href" class="mobile-nav-link" :class="{'selected': isSelected(item)}" @click="closeMobileMenu">
                {{ item.label }}
              </a>
              <button @click="toggleMenu(item.id)" class="text-white p-2 min-h-11 min-w-11" :aria-label="'Toggle ' + item.label + ' submenu'">
                <svg class="inline-block w-5 h-5" :class="{'rotate-180': openMenus[item.id]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div v-if="openMenus[item.id]" class="mobile-submenu-items">
              <template v-if="usesGroups(item)">
                <div v-for="group in grouped(item.children)" :key="group.label" :class="mobileGroupClass(item)">
                  <div :class="mobileTitleClass(item)">{{ group.label }}</div>
                  <a v-for="child in group.items" :key="child.id" :href="child.href" class="mobile-submenu-link" @click="closeMobileMenu">
                    {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                  </a>
                </div>
              </template>
              <template v-else>
                <a v-for="child in item.children" :key="child.id" :href="child.href" class="mobile-submenu-link" @click="closeMobileMenu">
                  {{ child.label }}<span v-if="child.badge" class="new-badge">{{ child.badge }}</span>
                </a>
              </template>
            </div>
          </div>
          <a v-else :href="item.href" class="mobile-nav-link" :class="{'selected': isSelected(item)}" @click="closeMobileMenu">{{ item.label }}</a>
        </template>
        <div class="flex justify-center mt-8">
          <button @click="toggleMiniCart(); closeMobileMenu();" class="relative min-h-11 min-w-11" aria-label="Open cart">
            <img :src="CART_ICON" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" width="32" height="27" />
            <span v-if="cartItemCount > 0" class="absolute -top-2 -right-2 bg-e5-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {{ cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>

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
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: 0.5rem 0;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 50;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.gallery-dropdown-wrapper:hover .dropdown-menu,
.gallery-dropdown-wrapper:focus-within .dropdown-menu {
  display: block;
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

/* "NEW" flag on the AI Gallery entry. Sets its own color so the parent
   link's red hover state can't recolor it against the red pill. */
.new-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 5px;
  background-color: #d31d25;
  color: #ffffff;
  font-family: 'Franklin Gothic Demi', sans-serif;
  font-size: 9px;
  letter-spacing: 1px;
  line-height: 1.3;
  border-radius: 2px;
  vertical-align: middle;
}

/* Visualize sits near the right edge of the nav, so its menu is anchored to
   the right — left-aligned it would run off-screen on narrower desktops. */
.visualize-dropdown {
  left: auto;
  right: 0;
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
