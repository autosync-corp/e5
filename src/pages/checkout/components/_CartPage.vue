<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CartManager, calculateCartTotals, getWheelImageUrl, formatPrice, type CartItem } from '@/core/services/ProductService';
import { CHECKOUT_ROUTE, SHOP_ROUTE } from '@/core/constants/Routes';

// State
const cartItems = ref<CartItem[]>([]);
const couponCode = ref('');
const couponError = ref('');
const couponSuccess = ref('');
const appliedCoupon = ref<string | null>(null);
const appliedDiscount = ref<number>(0);
const appliedCouponInfo = ref<{ type: string; discount: number } | null>(null);
const isValidatingCoupon = ref(false);

// Computed
const cartTotals = computed(() => {
  const base = calculateCartTotals(cartItems.value);
  return {
    ...base,
    discount: appliedDiscount.value,
    discountedSubtotal: base.subtotal - appliedDiscount.value,
    total: base.subtotal - appliedDiscount.value + base.tax,
    appliedCoupon: appliedCouponInfo.value,
  };
});

const isEmpty = computed(() => cartItems.value.length === 0);

// Methods
async function loadCart() {
  cartItems.value = CartManager.getCart();
  // Re-validate saved coupon
  const savedCoupon = CartManager.getAppliedCoupon();
  if (savedCoupon) {
    const base = calculateCartTotals(cartItems.value);
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: savedCoupon, subtotal: base.subtotal }),
    });
    const data = await res.json();
    if (data.valid) {
      appliedCoupon.value = savedCoupon;
      appliedDiscount.value = data.discountAmount;
      appliedCouponInfo.value = data.coupon;
      couponCode.value = savedCoupon;
      couponSuccess.value = 'Coupon applied!';
    } else {
      CartManager.removeCoupon();
    }
  }
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

async function applyCoupon() {
  couponError.value = '';
  couponSuccess.value = '';

  if (!couponCode.value.trim()) {
    couponError.value = 'Please enter a coupon code';
    return;
  }

  isValidatingCoupon.value = true;
  try {
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.value, subtotal: cartTotals.value.subtotal }),
    });
    const data = await res.json();

    if (!data.valid) {
      couponError.value = data.error || 'Invalid coupon';
      return;
    }

    appliedCoupon.value = couponCode.value.toUpperCase();
    appliedDiscount.value = data.discountAmount;
    appliedCouponInfo.value = data.coupon;
    CartManager.saveCoupon(appliedCoupon.value);
    couponSuccess.value = `Coupon "${appliedCoupon.value}" applied successfully!`;
  } catch {
    couponError.value = 'Could not validate coupon. Please try again.';
  } finally {
    isValidatingCoupon.value = false;
  }
}

function removeCoupon() {
  appliedCoupon.value = null;
  appliedDiscount.value = 0;
  appliedCouponInfo.value = null;
  couponCode.value = '';
  couponError.value = '';
  couponSuccess.value = '';
  CartManager.removeCoupon();
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
      <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-7">
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
    <section class="w-full bg-[#f5f5f5] px-4 md:px-8 py-10 md:py-[60px] pb-16 md:pb-20">
      <div class="max-w-[1200px] mx-auto flex flex-col gap-10">

        <!-- Empty Cart State -->
        <div v-if="isEmpty" class="bg-white rounded-2xl p-8 md:p-16 text-center">
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
          <div class="bg-white rounded-2xl p-4 md:p-8">

            <!-- Table Header — desktop only -->
            <div class="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-6 p-4 border-b border-gray-200 mb-8">
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black">Product</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Price</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Quantity</div>
              <div class="text-sm font-['Franklin_Gothic_Book'] text-black text-center">Subtotal</div>
            </div>

            <!-- Product Rows -->
            <div v-for="item in cartItems" :key="item.product.Id">

              <!-- Mobile Card Layout -->
              <div class="md:hidden py-5 border-b border-gray-200">
                <div class="flex gap-3 mb-4">
                  <img
                    :src="item.product.Img0001 && item.imgUrlBase ? `${item.imgUrlBase}${item.product.Img0001}` : '/assets/images/placeholder-wheel.png'"
                    :alt="item.product.Model"
                    class="w-20 h-20 object-contain flex-shrink-0"
                    @error="($event.target as HTMLImageElement).src = '/assets/images/placeholder-wheel.png'"
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-['Franklin_Gothic_Demi'] text-e5-red tracking-wide mb-1">
                      {{ item.product.Model.toUpperCase() }}
                    </h3>
                    <p v-if="item.frontWheels > 0" class="text-[11px] font-['Franklin_Gothic_Book'] text-black leading-snug">
                      {{ item.frontWheels }} x FRONT {{ item.product.Diameter }}"x{{ item.product.Width }}"
                    </p>
                    <p v-if="item.rearWheels > 0" class="text-[11px] font-['Franklin_Gothic_Book'] text-black leading-snug">
                      {{ item.rearWheels }} x REAR {{ item.product.Diameter }}"x{{ item.product.Width }}"
                    </p>
                    <p class="text-[11px] font-['Franklin_Gothic_Book'] text-black leading-snug">
                      FINISH: {{ [item.product.Finish, item.product.Color, item.product.Accent].filter(Boolean).join(' ') || 'Standard' }}
                    </p>
                    <p v-if="item.vehicleModel" class="text-[11px] font-['Franklin_Gothic_Book'] text-black leading-snug">
                      MODEL: {{ item.vehicleModel }}
                    </p>
                    <button
                      @click="removeItem(item.product.Id)"
                      class="mt-2 text-[11px] font-['Franklin_Gothic_Book'] text-e5-red hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <!-- Price / Qty / Subtotal row -->
                <div class="flex items-center justify-between gap-2">
                  <div class="text-center">
                    <p class="text-[10px] text-black/50 uppercase mb-1 tracking-wide">Price</p>
                    <p class="text-sm font-['Franklin_Gothic_Book'] text-black">{{ formatPrice(item.product.Price) }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[10px] text-black/50 uppercase mb-1 tracking-wide">Qty</p>
                    <div class="flex items-center border border-gray-300 rounded">
                      <button
                        @click="updateQuantity(item.product.Id, item.quantity - 1)"
                        class="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 text-xl leading-none select-none"
                      >−</button>
                      <span class="w-8 text-center text-sm font-['Franklin_Gothic_Book'] text-black">{{ item.quantity }}</span>
                      <button
                        @click="updateQuantity(item.product.Id, item.quantity + 1)"
                        class="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 text-xl leading-none select-none"
                      >+</button>
                    </div>
                  </div>
                  <div class="text-center">
                    <p class="text-[10px] text-black/50 uppercase mb-1 tracking-wide">Subtotal</p>
                    <p class="text-sm font-['Franklin_Gothic_Book'] text-black">{{ formatPrice(getItemSubtotal(item)) }}</p>
                  </div>
                </div>
              </div>

              <!-- Desktop Table Row -->
              <div class="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-center py-6 border-b border-gray-200">
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

                <!-- Quantity — +/− buttons -->
                <div class="flex justify-center">
                  <div class="flex items-center border border-gray-300 rounded">
                    <button
                      @click="updateQuantity(item.product.Id, item.quantity - 1)"
                      class="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 text-xl leading-none select-none"
                    >−</button>
                    <span class="w-9 text-center text-sm font-['Franklin_Gothic_Book'] text-black">{{ item.quantity }}</span>
                    <button
                      @click="updateQuantity(item.product.Id, item.quantity + 1)"
                      class="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 text-xl leading-none select-none"
                    >+</button>
                  </div>
                </div>

                <!-- Subtotal -->
                <div class="text-center text-base font-['Franklin_Gothic_Book'] text-black">
                  {{ formatPrice(getItemSubtotal(item)) }}
                </div>
              </div>
            </div>

            <!-- Coupon Section -->
            <div class="mt-8 pt-8">
              <div class="flex flex-col sm:flex-row sm:justify-end gap-3">
                <input
                  v-model="couponCode"
                  type="text"
                  placeholder="COUPON CODE"
                  :disabled="!!appliedCoupon"
                  class="w-full sm:w-60 h-11 px-4 border border-gray-300 rounded font-['Franklin_Gothic_Book'] text-[13px] text-black bg-white placeholder:text-gray-400 placeholder:tracking-wide disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  v-if="!appliedCoupon"
                  @click="applyCoupon"
                  :disabled="isValidatingCoupon"
                  class="w-full sm:w-auto bg-e5-red text-white font-['Franklin_Gothic_Medium'] text-xs font-semibold tracking-[1.5px] uppercase px-8 border-none rounded cursor-pointer hover:bg-[#a33a3a] transition-colors h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isValidatingCoupon ? 'Checking...' : 'Apply' }}
                </button>
                <button
                  v-else
                  @click="removeCoupon"
                  class="w-full sm:w-auto bg-gray-600 text-white font-['Franklin_Gothic_Medium'] text-xs font-semibold tracking-[1.5px] uppercase px-8 border-none rounded cursor-pointer hover:bg-gray-700 transition-colors h-11"
                >
                  Remove
                </button>
              </div>
              <!-- Error/Success Messages -->
              <div v-if="couponError" class="flex justify-end mt-2">
                <p class="text-xs text-e5-red">{{ couponError }}</p>
              </div>
              <div v-if="couponSuccess" class="flex justify-end mt-2">
                <p class="text-xs text-green-600">{{ couponSuccess }}</p>
              </div>
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

              <!-- Discount (if applied) -->
              <div v-if="cartTotals.discount > 0" class="flex justify-between items-start py-3">
                <span class="font-['Franklin_Gothic_Book'] text-sm text-green-600">
                  Discount ({{ appliedCoupon }})
                  <span v-if="cartTotals.appliedCoupon" class="text-xs">
                    - {{ cartTotals.appliedCoupon.type === 'percentage' ? `${cartTotals.appliedCoupon.discount}% off` : `$${cartTotals.appliedCoupon.discount} off` }}
                  </span>
                </span>
                <span class="font-['Franklin_Gothic_Book'] text-sm text-green-600">-{{ formatPrice(cartTotals.discount) }}</span>
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
                <span class="font-['Franklin_Gothic_Medium'] text-base font-semibold text-black">Total</span>
                <span class="font-['Franklin_Gothic_Medium'] text-base font-semibold text-black">{{ formatPrice(cartTotals.discountedSubtotal || cartTotals.subtotal) }}</span>
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
