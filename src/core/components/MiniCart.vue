<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CartManager, formatPrice, getWheelImageUrl, type CartItem } from '@/core/services/ProductService.ts';
import { CART_ROUTE, CHECKOUT_ROUTE } from '@/core/constants/Routes.ts';
import { buildWheelUrl } from '@/core/utils/wheelUrl';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const cartItems = ref<CartItem[]>([]);

onMounted(() => {
  loadCart();
  // Listen for cart updates
  window.addEventListener('storage', loadCart);
  window.addEventListener('cart-updated', loadCart);
});

const loadCart = () => {
  cartItems.value = CartManager.getCart();
};

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    const isStaggeredItem = (item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0);
    if (isStaggeredItem) {
      return sum + (item.product.Price * item.quantity);
    } else {
      const totalWheels = item.frontWheels + item.rearWheels;
      return sum + (item.product.Price * totalWheels * item.quantity);
    }
  }, 0);
});

const handleRemoveItem = (productId: number) => {
  CartManager.removeItem(productId);
  loadCart();
  window.dispatchEvent(new Event('cart-updated'));
};

const handleViewItem = (item: CartItem) => {
  // Build finish name from Finish + Color + Accent
  const finishParts = [];
  if (item.product.Finish) finishParts.push(item.product.Finish);
  if (item.product.Color) finishParts.push(item.product.Color);
  if (item.product.Accent) finishParts.push(item.product.Accent);
  const finish = finishParts.join(' ') || 'Standard';

  // Build the new wheel URL
  const url = buildWheelUrl(item.product.Model, finish);
  window.location.href = url;
};

const handleViewCart = () => {
  emit('close');
  window.location.href = CART_ROUTE;
};

const handleCheckout = () => {
  emit('close');
  window.location.href = CHECKOUT_ROUTE;
};

const getWheelSize = (item: CartItem) => {
  const front = item.frontWheels > 0 ? `${item.product.Diameter}"` : '';
  const rear = item.rearWheels > 0 ? `${item.product.Diameter}"` : '';
  const totalWheels = item.frontWheels + item.rearWheels;

  if (front && rear && item.frontWheels !== item.rearWheels) {
    return `${front}/${rear} Set of ${totalWheels}`;
  }
  return `${item.product.Diameter}" Set of ${totalWheels}`;
};

const getItemPrice = (item: CartItem) => {
  const isStaggeredItem = (item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0);
  if (isStaggeredItem) {
    return item.product.Price * item.quantity;
  } else {
    const totalWheels = item.frontWheels + item.rearWheels;
    return item.product.Price * totalWheels * item.quantity;
  }
};
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-[10px] z-[100]"
      @click="emit('close')"
    ></div>
  </Transition>

  <!-- Mini Cart Panel -->
  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed top-1/2 -translate-y-1/2 right-8 max-h-[85vh] w-[480px] shadow-2xl z-[101] flex flex-col"
      @click.stop
    >
      <!-- Cart Icon - Positioned Above -->
      <div class="flex justify-center mb-[-50px] relative z-20">
        <div class="w-[100px] h-[100px] rounded-full bg-e5-red flex items-center justify-center shadow-lg">
          <img
            src="/assets/images/mini-cart/556a6d30f7a2b7b09444155207ee5da1a4c1ae86.webp"
            alt="Cart"
            class="w-[80px] h-[80px]"
          />
        </div>
      </div>

      <!-- Cart Content Container -->
      <div class="bg-white rounded-[20px] overflow-hidden flex flex-col relative z-10">
        <!-- Header -->
        <div class="relative bg-e5-black h-[110px] rounded-tl-[20px] rounded-tr-[20px] flex items-end justify-center pb-4 pt-[50px]">
          <h2 class="font-franklin-medium text-[28px] text-white tracking-[9.8px] uppercase">
            CART
          </h2>
        </div>

        <!-- Cart Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center h-full">
            <p class="font-excon text-[14px] text-black/70 text-center">
              Your cart is empty
            </p>
          </div>

          <div v-else class="space-y-4">
            <!-- Cart Items -->
            <div v-for="item in cartItems" :key="item.product.Id" class="border-b border-black/6 pb-4">
              <div class="flex gap-3">
                <!-- Product Image -->
                <div class="w-[120px] h-[120px] flex-shrink-0">
                  <img
                    :src="getWheelImageUrl(item.imgUrlBase || '', item.product.Img0001)"
                    :alt="item.product.Model"
                    class="w-full h-full object-contain"
                  />
                </div>

                <!-- Product Details -->
                <div class="flex-1">
                  <h3 class="font-excon text-[14px] text-black/70 mb-1">
                    {{ item.product.Model }}
                  </h3>
                  <p class="font-excon text-[13px] text-black/70 mb-1">
                    {{ getWheelSize(item) }}
                    <span v-if="item.vehicleModel"> ({{ item.vehicleModel }})</span>
                  </p>
                  <p class="font-excon text-[13px] text-black/70 mb-2">
                    {{ item.product.ShortFinish || item.product.Finish }}
                  </p>
                  <p class="font-excon text-[14px] text-black/78 font-normal">
                    {{ formatPrice(getItemPrice(item)) }}
                  </p>

                  <!-- Action Links -->
                  <div class="flex items-center gap-3 mt-2">
                    <button
                      @click="handleRemoveItem(item.product.Id)"
                      class="font-excon text-[9px] text-[#d31d25]/60 hover:text-[#d31d25] tracking-[1.35px] uppercase transition-colors"
                    >
                      REMOVE ITEM
                    </button>
                    <span class="text-black/20">|</span>
                    <button
                      @click="handleViewItem(item)"
                      class="font-excon text-[9px] text-black/70 hover:text-black tracking-[1.35px] uppercase transition-colors"
                    >
                      VIEW ITEM
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subtotal -->
            <div class="py-3">
              <p class="font-excon text-[18px] text-black/70 text-center leading-[24px]">
                SUBTOTAL: {{ formatPrice(subtotal) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div v-if="cartItems.length > 0" class="px-6 pb-6 space-y-3 border-t border-black/6 pt-4">
          <!-- View Cart / Checkout Buttons -->
          <div class="flex gap-3">
            <button
              @click="handleViewCart"
              class="flex-1 h-[34px] border border-e5-red text-e5-red font-excon text-[14px] tracking-[1.26px] uppercase hover:bg-e5-red hover:text-white transition-colors"
            >
              VIEW CART
            </button>
            <button
              @click="handleCheckout"
              class="flex-1 h-[34px] bg-e5-red border border-e5-red text-white font-excon text-[14px] tracking-[1.26px] uppercase hover:bg-e5-red/90 transition-colors"
            >
              CHECKOUT
            </button>
          </div>

          <!-- Free Shipping Message -->
          <p class="font-excon text-[13px] text-black/70 text-center leading-[20px]">
            FREE SHIPPING ON ALL COMPLETE SETS
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Fade Transition for Backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Transition for Panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Custom scrollbar for cart content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
  }
}
</style>
