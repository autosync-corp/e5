<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CartManager, calculateCartTotals, getWheelImageUrl, formatPrice, type CartItem } from '@/core/services/ProductService';
import { CHECKOUT_ROUTE, SHOP_ROUTE } from '@/core/constants/Routes';

// State
const cartItems = ref<CartItem[]>([]);
const couponCode = ref('');

// Computed
const cartTotals = computed(() => calculateCartTotals(cartItems.value));

const isEmpty = computed(() => cartItems.value.length === 0);

// Methods
function loadCart() {
  cartItems.value = CartManager.getCart();
}

function updateQuantity(productId: number, quantity: number) {
  const newQty = Math.max(1, quantity);
  CartManager.updateQuantity(productId, newQty);
  loadCart();
}

function removeItem(productId: number) {
  if (confirm('Are you sure you want to remove this item from your cart?')) {
    CartManager.removeItem(productId);
    loadCart();
  }
}

function applyCoupon() {
  if (couponCode.value.trim()) {
    // TODO: Implement coupon validation
    alert('Coupon functionality coming soon!');
  }
}

function proceedToCheckout() {
  window.location.href = CHECKOUT_ROUTE;
}

function continueShopping() {
  window.location.href = SHOP_ROUTE;
}

function getItemSubtotal(item: CartItem): number {
  // For staggered fitment items, quantity already represents the number of wheels
  // For non-staggered items, quantity represents sets, so multiply by total wheels
  const isStaggeredItem = (item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0);

  if (isStaggeredItem) {
    // Staggered: quantity = number of wheels, just multiply price × quantity
    return item.product.Price * item.quantity;
  } else {
    // Non-staggered: quantity = number of sets, multiply by total wheels
    const totalWheels = item.frontWheels + item.rearWheels;
    return item.product.Price * totalWheels * item.quantity;
  }
}

onMounted(() => {
  loadCart();
});
</script>

<template>
  <div class="w-full bg-white">
    <!-- Progress Bar -->
    <section class="w-full bg-[#0a0a0a]">
      <div class="max-w-[1200px] mx-auto px-8 py-7">
        <div class="relative flex items-start justify-between">
          <!-- Progress Line -->
          <div class="absolute left-0 right-0 top-[18px] h-[1px] bg-[#a33a3a] z-0"></div>

          <!-- Step 1: Wheels -->
          <div class="relative z-1 w-1/3 flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-[#c94343] flex items-center justify-center">
              <img
                src="/assets/images/cart/61cc55a16a871139a1cf4a95a7854be48b2d404d.webp"
                alt="Wheels"
                class="w-[18px] h-[18px] object-contain"
              />
            </div>
            <p class="mt-3 text-[10px] tracking-[0.45em] uppercase font-semibold text-white/70">WHEELS</p>
          </div>

          <!-- Step 2: Cart (Active) -->
          <div class="relative z-1 w-1/3 flex flex-col items-center">
            <div class="w-11 h-11 rounded-full bg-[#c94343] flex items-center justify-center">
              <img
                src="/assets/images/cart/40eb342b73462b1f996cdb7f9c9a92e0d95a45fc.webp"
                alt="Cart"
                class="w-[22px] h-[22px] object-contain"
              />
            </div>
            <p class="mt-3 text-[11px] tracking-[0.45em] uppercase font-semibold text-white">CART</p>
          </div>

          <!-- Step 3: Checkout -->
          <div class="relative z-1 w-1/3 flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-[#c94343] flex items-center justify-center">
              <img
                src="/assets/images/cart/556a6d30f7a2b7b09444155207ee5da1a4c1ae86.webp"
                alt="Checkout"
                class="w-[18px] h-[18px] object-contain"
              />
            </div>
            <p class="mt-3 text-[10px] tracking-[0.45em] uppercase font-semibold text-white/70">CHECKOUT</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cart Content -->
    <section class="w-full bg-[#f5f5f5] px-8 py-[60px] pb-20">
      <div class="max-w-[1200px] mx-auto flex flex-col gap-10">

        <!-- Empty Cart State -->
        <div v-if="isEmpty" class="bg-white rounded-2xl p-16 text-center">
          <h2 class="text-2xl md:text-3xl font-['Franklin_Gothic_Demi'] text-black mb-6">Your cart is empty</h2>
          <p class="text-lg font-['Franklin_Gothic_Book'] text-black/70 mb-8">
            Add some wheels to get started!
          </p>
          <button
            @click="continueShopping"
            class="px-12 py-4 bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-sm tracking-[2px] uppercase rounded-md hover:bg-[#a33a3a] transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        <!-- Cart Items -->
        <div v-else>
          <!-- Product Table -->
          <div class="bg-white rounded-2xl p-8">
            <!-- Table Header -->
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-6 p-4 border-b border-gray-200 mb-8">
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black">Product</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Price</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Quantity</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Subtotal</div>
            </div>

            <!-- Product Rows -->
            <div v-for="item in cartItems" :key="item.product.Id" class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-center py-6 border-b border-gray-200">
              <!-- Product Info -->
              <div class="flex gap-6 items-start">
                <img
                  :src="item.product.Img0001 && item.imgUrlBase ? `${item.imgUrlBase}${item.product.Img0001}` : '/assets/images/placeholder-wheel.png'"
                  :alt="item.product.Model"
                  class="w-[120px] h-[120px] object-contain"
                  @error="($event.target as HTMLImageElement).src = '/assets/images/placeholder-wheel.png'"
                />
                <div class="flex flex-col gap-1">
                  <h3 class="text-lg font-['Franklin_Gothic_Demi'] text-e5-red tracking-wide mb-2">
                    {{ item.product.Model.toUpperCase() }}
                  </h3>
                  <p v-if="item.frontWheels > 0" class="text-xs font-['Franklin_Gothic_Book'] text-black m-0 leading-snug">
                    {{ item.frontWheels }} x FRONT {{ item.product.Diameter }}"x{{ item.product.Width }}"
                  </p>
                  <p v-if="item.rearWheels > 0" class="text-xs font-['Franklin_Gothic_Book'] text-black m-0 leading-snug">
                    {{ item.rearWheels }} x REAR {{ item.product.Diameter }}"x{{ item.product.Width }}"
                  </p>
                  <p class="text-[11px] font-['Franklin_Gothic_Book'] text-black m-0 leading-snug">
                    FINISH: {{ [item.product.Finish, item.product.Color, item.product.Accent].filter(Boolean).join(' ') || 'Standard' }}
                  </p>
                  <p v-if="item.vehicleModel" class="text-[11px] font-['Franklin_Gothic_Book'] text-black m-0 leading-snug">
                    MODEL: {{ item.vehicleModel }}
                  </p>
                  <p v-if="(item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0)" class="text-[11px] font-['Franklin_Gothic_Book'] text-black/60 m-0 leading-snug">
                    ({{ item.quantity }} wheels × ${{ item.product.Price.toLocaleString() }} per wheel)
                  </p>
                  <p v-else class="text-[11px] font-['Franklin_Gothic_Book'] text-black/60 m-0 leading-snug">
                    ({{ item.frontWheels + item.rearWheels }} wheels × ${{ item.product.Price.toLocaleString() }} per wheel × {{ item.quantity }} set{{ item.quantity > 1 ? 's' : '' }})
                  </p>
                  <button
                    @click="removeItem(item.product.Id)"
                    class="mt-2 text-xs font-['Franklin_Gothic_Book'] text-e5-red hover:underline self-start"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <!-- Price -->
              <div class="text-center text-base font-['Franklin_Gothic_Book'] text-black">
                {{ formatPrice(item.product.Price) }}
              </div>

              <!-- Quantity -->
              <div class="flex justify-center">
                <input
                  type="number"
                  :value="item.quantity"
                  @input="updateQuantity(item.product.Id, Number(($event.target as HTMLInputElement).value))"
                  min="1"
                  class="w-[60px] h-9 text-center border border-gray-300 rounded font-['Franklin_Gothic_Book'] text-sm text-black bg-white"
                />
              </div>

              <!-- Subtotal -->
              <div class="text-center text-base font-['Franklin_Gothic_Book'] text-black">
                {{ formatPrice(getItemSubtotal(item)) }}
              </div>
            </div>

            <!-- Coupon Section -->
            <div class="flex justify-end gap-3 mt-8 pt-8">
              <input
                v-model="couponCode"
                type="text"
                placeholder="COUPON CODE"
                class="w-60 h-11 px-4 border border-gray-300 rounded font-['Franklin_Gothic_Book'] text-[13px] text-black bg-white placeholder:text-gray-400 placeholder:tracking-wide"
              />
              <button
                @click="applyCoupon"
                class="bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-xs font-semibold tracking-[1.5px] uppercase px-8 border-none rounded cursor-pointer hover:bg-[#a33a3a] transition-colors h-11"
              >
                Apply
              </button>
            </div>
          </div>

          <!-- Cart Totals -->
          <div class="max-w-[700px] mx-auto w-full">
            <h2 class="font-['Franklin_Gothic_Medium'] text-lg font-semibold text-black tracking-[2px] text-center mb-8 pb-4 border-b border-gray-300">
              CART TOTALS
            </h2>

            <div class="flex flex-col gap-5">
              <!-- Subtotal -->
              <div class="flex justify-between items-start py-3">
                <span class="font-['Franklin_Gothic_Book'] text-sm text-black">Subtotal</span>
                <span class="font-['Franklin_Gothic_Book'] text-sm text-black">{{ formatPrice(cartTotals.subtotal) }}</span>
              </div>

              <!-- Shipping -->
              <div class="flex justify-between items-start py-3">
                <div class="font-['Franklin_Gothic_Book'] text-sm text-black">
                  <div>Shipping</div>
                  <div class="flex flex-col gap-1 mt-2 text-xs">
                    <span class="font-['Franklin_Gothic_Medium'] text-black">FREE SHIPPING</span>
                    <span class="font-['Franklin_Gothic_Book'] text-gray-600">Shipping to FL.</span>
                    <a href="#" class="font-['Franklin_Gothic_Book'] text-e5-red underline text-[11px]">Change Address</a>
                  </div>
                </div>
                <span class="font-['Franklin_Gothic_Book'] text-sm text-black"></span>
              </div>

              <!-- Tax -->
              <div class="flex justify-between items-start py-3">
                <span class="font-['Franklin_Gothic_Book'] text-sm text-black">Sales Tax <span class="text-xs text-gray-500">(calculated at checkout)</span></span>
                <span class="font-['Franklin_Gothic_Book'] text-sm text-black">$0.00</span>
              </div>

              <!-- Total -->
              <div class="flex justify-between items-start py-3 pt-5 border-t border-gray-300 mt-3">
                <span class="font-['Franklin_Gothic_Medium'] text-base font-semibold text-black">Subtotal</span>
                <span class="font-['Franklin_Gothic_Medium'] text-base font-semibold text-black">{{ formatPrice(cartTotals.subtotal) }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">*Tax will be calculated at checkout based on your location</p>

              <!-- Checkout Button -->
              <button
                @click="proceedToCheckout"
                class="w-full bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-sm font-semibold tracking-[2px] uppercase py-4 px-8 border-none rounded-md cursor-pointer hover:bg-[#a33a3a] transition-colors mt-8"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
input:focus {
  outline: none;
  border-color: #d31d25;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
