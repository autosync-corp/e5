<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CartManager, calculateCartTotals, formatPrice, type CartItem } from '@/core/services/ProductService';

// State
const cartItems = ref<CartItem[]>([]);

// Computed
const cartTotals = computed(() => calculateCartTotals(cartItems.value));

const isEmpty = computed(() => cartItems.value.length === 0);

// Methods
function loadCart() {
  cartItems.value = CartManager.getCart();
}

onMounted(() => {
  loadCart();
});
</script>

<template>
  <div class="e5CheckoutOrderWrapper">
    <h2 class="e5CheckoutOrderTitle">YOUR ORDER</h2>

    <!-- Empty State -->
    <div v-if="isEmpty" class="e5CheckoutEmptyState">
      <p class="e5CheckoutEmptyText">Your cart is empty</p>
    </div>

    <!-- Product Info -->
    <div v-else>
      <div class="e5CheckoutOrderSection">
        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Product</span>
          <span class="e5CheckoutOrderLabel">Subtotal</span>
        </div>

        <!-- Cart Items -->
        <div v-for="item in cartItems" :key="`${item.product.Id}-${item.frontWheels}-${item.rearWheels}`" class="e5CheckoutProductItem">
          <div>
            <p class="e5CheckoutProductName">
              {{ item.product.Model.toUpperCase() }} × {{ item.quantity }}
            </p>
            <p class="e5CheckoutProductDetail">
              {{ item.frontWheels > 0 && item.rearWheels === 0 ? `${item.frontWheels} x FRONT` : item.frontWheels === 0 && item.rearWheels > 0 ? `${item.rearWheels} x REAR` : `${item.frontWheels} x FRONT + ${item.rearWheels} x REAR` }} {{ item.product.Diameter }}"x{{ item.product.Width }}"
            </p>
            <p class="e5CheckoutProductDetail">
              FINISH: {{ item.product.ShortFinish || item.product.Finish || 'Standard' }}
            </p>
            <p v-if="item.vehicleModel" class="e5CheckoutProductDetail">
              MODEL: {{ item.vehicleModel }}
            </p>
          </div>
          <span class="e5CheckoutProductPrice">
            {{ formatPrice(
              (item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0)
                ? item.product.Price * item.quantity
                : item.product.Price * (item.frontWheels + item.rearWheels) * item.quantity
            ) }}
          </span>
        </div>
      </div>

      <!-- Totals -->
      <div class="e5CheckoutOrderSection">
        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Subtotal</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.subtotal) }}</span>
        </div>

        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Free Shipping</span>
          <span class="e5CheckoutOrderValue">$0.00</span>
        </div>

        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">FL Sales Tax</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.tax) }}</span>
        </div>

        <div class="e5CheckoutOrderRow e5CheckoutOrderTotal">
          <span class="e5CheckoutOrderLabel">TOTAL</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.total) }}</span>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="e5CheckoutPaymentSection">
        <!-- Credit/Debit Cards -->
        <div class="e5CheckoutPaymentOption">
          <input type="radio" name="payment" id="card" checked class="e5CheckoutRadio" />
          <label for="card" class="e5CheckoutPaymentLabel">
            <span>Credit/Debit Cards</span>
            <div class="e5CheckoutCardIcons">
              <img src="/assets/images/checkout/cards.png" alt="Payment Cards" class="e5CheckoutCardImage" />
            </div>
          </label>
        </div>

        <!-- Card Details Form -->
        <div class="e5CheckoutCardForm">
          <div class="e5CheckoutFormGroup">
            <label class="e5CheckoutLabel">CARD NUMBER</label>
            <input type="text" placeholder="1234 1234 1234 1234" class="e5CheckoutInput" />
          </div>

          <div class="e5CheckoutFormRow">
            <div class="e5CheckoutFormGroup">
              <label class="e5CheckoutLabel">EXPIRATION DATE</label>
              <input type="text" placeholder="MM/YY" class="e5CheckoutInput" />
            </div>
            <div class="e5CheckoutFormGroup">
              <label class="e5CheckoutLabel">SECURITY CODE</label>
              <input type="text" placeholder="CVV" class="e5CheckoutInput" />
            </div>
          </div>

          <div class="e5CheckoutCheckboxGroup">
            <input type="checkbox" id="saveCard" class="e5CheckoutCheckbox" />
            <label for="saveCard" class="e5CheckoutCheckboxLabel">Save Card</label>
          </div>
        </div>

        <!-- Affirm Pay Over Time -->
        <div class="e5CheckoutPaymentOption">
          <input type="radio" name="payment" id="affirm" class="e5CheckoutRadio" />
          <label for="affirm" class="e5CheckoutPaymentLabel">
            <span>Affirm Pay Over Time</span>
            <img src="/assets/images/578fa0d18bbca3760015bb5ca95a185ccb50b0f2.png" alt="Affirm" class="e5CheckoutAffirmLogo" />
          </label>
        </div>

        <!-- Google Pay -->
        <div class="e5CheckoutPaymentOption">
          <input type="radio" name="payment" id="googlepay" class="e5CheckoutRadio" />
          <label for="googlepay" class="e5CheckoutPaymentLabel">
            <span>Google Pay</span>
            <img src="/assets/images/checkout/gpay.png" alt="Google Pay" class="e5CheckoutPaymentIcon" />
          </label>
        </div>

        <!-- Apple Pay -->
        <div class="e5CheckoutPaymentOption">
          <input type="radio" name="payment" id="applepay" class="e5CheckoutRadio" />
          <label for="applepay" class="e5CheckoutPaymentLabel">
            <span>Apple Pay</span>
            <img src="/assets/images/53ac0b7c91c2611f93c3336f0652d00efd216192.png" alt="Apple Pay" class="e5CheckoutPaymentIcon" />
          </label>
        </div>
      </div>

      <!-- Privacy Notice -->
      <p class="e5CheckoutPrivacyText">
        Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our <a href="#" class="e5CheckoutPrivacyLink">Terms and Conditions</a>.
      </p>

      <!-- Place Order Button -->
      <button class="e5CheckoutPlaceOrderBtn">PLACE ORDER</button>
    </div>
  </div>
</template>

