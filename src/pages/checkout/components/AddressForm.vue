<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Country and state data
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
];

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const canadianProvinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico City',
  'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
  'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatán', 'Zacatecas'
];

// Form state
const selectedCountry = ref('US');
const selectedState = ref('');
const firstName = ref('');
const lastName = ref('');
const companyName = ref('');
const streetAddress1 = ref('');
const streetAddress2 = ref('');
const city = ref('');
const zipCode = ref('');
const phoneNumber = ref('');
const emailAddress = ref('');
const shipToDifferent = ref(false);
const orderNotes = ref('');

// Shipping address fields
const shippingFirstName = ref('');
const shippingLastName = ref('');
const shippingCompanyName = ref('');
const shippingCountry = ref('US');
const shippingState = ref('');
const shippingStreetAddress1 = ref('');
const shippingStreetAddress2 = ref('');
const shippingCity = ref('');
const shippingZipCode = ref('');

// Computed
const stateLabel = computed(() => {
  if (selectedCountry.value === 'US') return 'STATE';
  if (selectedCountry.value === 'CA') return 'PROVINCE';
  if (selectedCountry.value === 'MX') return 'STATE';
  return 'STATE / PROVINCE / REGION';
});

const zipLabel = computed(() => {
  if (selectedCountry.value === 'US') return 'ZIP CODE';
  if (selectedCountry.value === 'CA') return 'POSTAL CODE';
  if (selectedCountry.value === 'GB') return 'POSTCODE';
  if (selectedCountry.value === 'AU') return 'POSTCODE';
  return 'ZIP / POSTAL CODE';
});

const availableStates = computed(() => {
  if (selectedCountry.value === 'US') return usStates;
  if (selectedCountry.value === 'CA') return canadianProvinces;
  if (selectedCountry.value === 'MX') return mexicanStates;
  return [];
});

const showStateDropdown = computed(() => {
  return ['US', 'CA', 'MX'].includes(selectedCountry.value);
});

const shippingStateLabel = computed(() => {
  if (shippingCountry.value === 'US') return 'STATE';
  if (shippingCountry.value === 'CA') return 'PROVINCE';
  if (shippingCountry.value === 'MX') return 'STATE';
  return 'STATE / PROVINCE / REGION';
});

const shippingZipLabel = computed(() => {
  if (shippingCountry.value === 'US') return 'ZIP CODE';
  if (shippingCountry.value === 'CA') return 'POSTAL CODE';
  if (shippingCountry.value === 'GB') return 'POSTCODE';
  if (shippingCountry.value === 'AU') return 'POSTCODE';
  return 'ZIP / POSTAL CODE';
});

const shippingAvailableStates = computed(() => {
  if (shippingCountry.value === 'US') return usStates;
  if (shippingCountry.value === 'CA') return canadianProvinces;
  if (shippingCountry.value === 'MX') return mexicanStates;
  return [];
});

const showShippingStateDropdown = computed(() => {
  return ['US', 'CA', 'MX'].includes(shippingCountry.value);
});

// Watch for state changes and emit event for tax calculation
watch(selectedState, (newState) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('billing-state-changed', {
      detail: { state: newState }
    }));
  }
});

// Methods
function handleCountryChange() {
  selectedState.value = '';
}

function handleShippingCountryChange() {
  shippingState.value = '';
}

// Expose form data to parent component
function getFormData() {
  return {
    billing: {
      firstName: firstName.value,
      lastName: lastName.value,
      companyName: companyName.value,
      country: selectedCountry.value,
      state: selectedState.value,
      streetAddress1: streetAddress1.value,
      streetAddress2: streetAddress2.value,
      city: city.value,
      zipCode: zipCode.value,
      phoneNumber: phoneNumber.value,
      emailAddress: emailAddress.value,
    },
    shipping: shipToDifferent.value ? {
      firstName: shippingFirstName.value,
      lastName: shippingLastName.value,
      companyName: shippingCompanyName.value,
      country: shippingCountry.value,
      state: shippingState.value,
      streetAddress1: shippingStreetAddress1.value,
      streetAddress2: shippingStreetAddress2.value,
      city: shippingCity.value,
      zipCode: shippingZipCode.value,
    } : null,
    orderNotes: orderNotes.value,
  };
}

// Make getFormData available globally
if (typeof window !== 'undefined') {
  (window as any).getCheckoutFormData = getFormData;
}
</script>

<template>
  <div class="e5CheckoutBillingWrapper">
    <h2 class="e5CheckoutSectionTitle">Billing Details</h2>

    <form class="e5CheckoutForm">
      <!-- Name Fields -->
      <div class="e5CheckoutFormRow">
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">FIRST NAME</label>
          <input v-model="firstName" type="text" class="e5CheckoutInput" required />
        </div>
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">LAST NAME</label>
          <input v-model="lastName" type="text" class="e5CheckoutInput" required />
        </div>
      </div>

      <!-- Company Name -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">COMPANY NAME (OPTIONAL)</label>
        <input v-model="companyName" type="text" class="e5CheckoutInput" />
      </div>

      <!-- Country -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">COUNTRY / REGION</label>
        <select v-model="selectedCountry" @change="handleCountryChange" class="e5CheckoutSelect" required>
          <option v-for="country in countries" :key="country.code" :value="country.code">
            {{ country.name }} ({{ country.code }})
          </option>
        </select>
      </div>

      <!-- Street Address -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">STREET ADDRESS</label>
        <input v-model="streetAddress1" type="text" placeholder="House number and street name" class="e5CheckoutInput" required />
        <input v-model="streetAddress2" type="text" placeholder="Apartment, suite, unit, etc. (optional)" class="e5CheckoutInput e5CheckoutInputSecondary" />
      </div>

      <!-- Town / City -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">TOWN / CITY</label>
        <input v-model="city" type="text" class="e5CheckoutInput" required />
      </div>

      <!-- State (with dropdown or text input) -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">{{ stateLabel }}</label>
        <select v-if="showStateDropdown" v-model="selectedState" class="e5CheckoutSelect" required>
          <option value="">Select {{ stateLabel.toLowerCase() }}</option>
          <option v-for="state in availableStates" :key="state" :value="state">
            {{ state }}
          </option>
        </select>
        <input v-else v-model="selectedState" type="text" class="e5CheckoutInput" :placeholder="stateLabel" />
      </div>

      <!-- ZIP Code -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">{{ zipLabel }}</label>
        <input v-model="zipCode" type="text" class="e5CheckoutInput" required />
      </div>

      <!-- Phone Number -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">PHONE NUMBER</label>
        <input v-model="phoneNumber" type="tel" class="e5CheckoutInput" required />
      </div>

      <!-- Email Address -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">EMAIL ADDRESS</label>
        <input v-model="emailAddress" type="email" class="e5CheckoutInput" required />
      </div>

      <!-- Ship to different address -->
      <div class="e5CheckoutCheckboxGroup">
        <input v-model="shipToDifferent" type="checkbox" id="shipDifferent" class="e5CheckoutCheckbox" />
        <label for="shipDifferent" class="e5CheckoutCheckboxLabel">Ship to a different address?</label>
      </div>

      <!-- Shipping Address Section (Conditional) -->
      <div v-if="shipToDifferent" class="e5CheckoutShippingSection">
        <h3 class="e5CheckoutSubsectionTitle">Shipping Address</h3>

        <!-- Shipping Name Fields -->
        <div class="e5CheckoutFormRow">
          <div class="e5CheckoutFormGroup">
            <label class="e5CheckoutLabel">FIRST NAME</label>
            <input v-model="shippingFirstName" type="text" class="e5CheckoutInput" required />
          </div>
          <div class="e5CheckoutFormGroup">
            <label class="e5CheckoutLabel">LAST NAME</label>
            <input v-model="shippingLastName" type="text" class="e5CheckoutInput" required />
          </div>
        </div>

        <!-- Shipping Company Name -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">COMPANY NAME (OPTIONAL)</label>
          <input v-model="shippingCompanyName" type="text" class="e5CheckoutInput" />
        </div>

        <!-- Shipping Country -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">COUNTRY / REGION</label>
          <select v-model="shippingCountry" @change="handleShippingCountryChange" class="e5CheckoutSelect" required>
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.name }} ({{ country.code }})
            </option>
          </select>
        </div>

        <!-- Shipping Street Address -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">STREET ADDRESS</label>
          <input v-model="shippingStreetAddress1" type="text" placeholder="House number and street name" class="e5CheckoutInput" required />
          <input v-model="shippingStreetAddress2" type="text" placeholder="Apartment, suite, unit, etc. (optional)" class="e5CheckoutInput e5CheckoutInputSecondary" />
        </div>

        <!-- Shipping Town / City -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">TOWN / CITY</label>
          <input v-model="shippingCity" type="text" class="e5CheckoutInput" required />
        </div>

        <!-- Shipping State -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">{{ shippingStateLabel }}</label>
          <select v-if="showShippingStateDropdown" v-model="shippingState" class="e5CheckoutSelect" required>
            <option value="">Select {{ shippingStateLabel.toLowerCase() }}</option>
            <option v-for="state in shippingAvailableStates" :key="state" :value="state">
              {{ state }}
            </option>
          </select>
          <input v-else v-model="shippingState" type="text" class="e5CheckoutInput" :placeholder="shippingStateLabel" />
        </div>

        <!-- Shipping ZIP Code -->
        <div class="e5CheckoutFormGroup">
          <label class="e5CheckoutLabel">{{ shippingZipLabel }}</label>
          <input v-model="shippingZipCode" type="text" class="e5CheckoutInput" required />
        </div>
      </div>

      <!-- Order Notes -->
      <div class="e5CheckoutFormGroup">
        <label class="e5CheckoutLabel">ORDER NOTES (OPTIONAL)</label>
        <textarea v-model="orderNotes" class="e5CheckoutTextarea" placeholder="Notes about your order, e.g. special notes for delivery."></textarea>
      </div>
    </form>
  </div>
</template>
