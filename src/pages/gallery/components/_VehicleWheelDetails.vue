<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useWheelApi } from '@/core/composables/useWheelApi';
import VehicleWheelSizeFit from './_VehicleWheelSizeFit.vue';
import Button from '@/core/components/Button.vue';
import { E5_LOGO_BLACK } from "@/core/constants/App.ts";
import { buildWheelUrl } from '@/core/utils/wheelUrl';
import { parseVehicleGenerationAndTrim } from '@/pages/gallery/utils/vehicleParser';
import { WHEELS_COMING_SOON } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

const props = defineProps<{
  partF?: string | null;
  wheelPartR?: string | null;
  vehicleWheelStyle?: string | null;
  vehicleWheelFinish?: string | null;
  vehicleWheelSizeF?: string | null;
  vehicleOffesetF?: string | null;
  vehicleWheelSizeRear?: string | null;
  vehicleOffsetR?: string | null;
  wheelStyleLogo: string;
  vehicleSubmodel?: string | null;
  vehicleTitle?: string | null;
  vehicleTrim?: string | null;
}>();

const { loading, error, wheelData, fetchWheelData, getWheelImageUrl } = useWheelApi();

// Fetch data on mount
onMounted(async () => {
  const partNumbers = [];
  if (props.partF) partNumbers.push(props.partF);
  if (props.wheelPartR) partNumbers.push(props.wheelPartR);

  if (partNumbers.length > 0) {
    await fetchWheelData(partNumbers);
  }
});

// Get wheel specifications from API if available
const frontWheel = computed(() =>
  wheelData.value.find(wheel => wheel.Pn === props.partF)
);

const rearWheel = computed(() =>
  wheelData.value.find(wheel => wheel.Pn === props.wheelPartR)
);

// Build sizing details from API data or fallback to vehicle data
const sizingDetails = computed(() => {
  const details = [];

  if (frontWheel.value || props.vehicleWheelSizeF) {
    const frontSize = frontWheel.value?.Diameter && frontWheel.value?.Width
      ? `${frontWheel.value.Diameter}" x ${frontWheel.value.Width}"`
      : props.vehicleWheelSizeF;
    const frontOffset = frontWheel.value?.Offset !== undefined && frontWheel.value?.Offset !== null
      ? `${frontWheel.value.Offset}mm`
      : props.vehicleOffesetF;
    if (frontSize && frontOffset) {
      details.push(`Front: ${frontSize} / Offset ${frontOffset}`);
    }
  }

  if (rearWheel.value || props.vehicleWheelSizeRear) {
    const rearSize = rearWheel.value?.Diameter && rearWheel.value?.Width
      ? `${rearWheel.value.Diameter}" x ${rearWheel.value.Width}"`
      : props.vehicleWheelSizeRear;
    const rearOffset = rearWheel.value?.Offset !== undefined && rearWheel.value?.Offset !== null
      ? `${rearWheel.value.Offset}mm`
      : props.vehicleOffsetR;
    if (rearSize && rearOffset) {
      details.push(`Rear: ${rearSize} / Offset ${rearOffset}`);
    }
  }

  // Add bolt pattern from API or default
  const boltPattern = frontWheel.value?.LugCount && frontWheel.value?.BoltCircle1
    ? `${frontWheel.value.LugCount}x${frontWheel.value.BoltCircle1}`
    : rearWheel.value?.LugCount && rearWheel.value?.BoltCircle1
      ? `${rearWheel.value.LugCount}x${rearWheel.value.BoltCircle1}`
      : '5x120';
  details.push(`Bolt Pattern: ${boltPattern}`);

  return details;
});

// Get wheel image from API data (use first wheel image if available)
const wheelImageUrl = computed(() => {
  if (wheelData.value.length > 0) {
    return getWheelImageUrl(wheelData.value[0]);
  }
  return E5_LOGO_BLACK;
});

const isPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const v = value.toLowerCase();
  return v === 'n/a' || v === WHEELS_COMING_SOON.toLowerCase();
};

// An entry can carry part numbers before its wheels exist in the catalog — the
// API answers 200 with an empty list until they launch. Once it starts
// returning them, style and finish resolve from the API with no data edit.
const apiWheel = computed(() => frontWheel.value || rearWheel.value);

const wheelStyle = computed(() => {
  if (!isPlaceholder(props.vehicleWheelStyle)) return props.vehicleWheelStyle as string;
  return apiWheel.value?.Model || WHEELS_COMING_SOON;
});

const wheelFinish = computed(() => {
  if (!isPlaceholder(props.vehicleWheelFinish)) return props.vehicleWheelFinish as string;
  return getApiFinishName(apiWheel.value) || WHEELS_COMING_SOON;
});

// True once a real wheel is known, from either source — drives the logo, the
// Explore button label and the wheel/shop links.
const hasWheelInfo = computed(() => !isPlaceholder(wheelStyle.value));

// The logo prop is built from gallery data, so it's empty when the style came
// from the API instead — derive it from the resolved style in that case.
const resolvedLogo = computed(() => {
  if (props.wheelStyleLogo) return props.wheelStyleLogo;
  if (!hasWheelInfo.value) return '';
  return `/assets/images/logos/e5-${wheelStyle.value.toLowerCase().replace(/\s+/g, '-')}.webp`;
});

// Generate wheel style route
const wheelStyleRoute = computed(() => {
  if (!hasWheelInfo.value) {
    return '/wheels';
  }
  const style = wheelStyle.value.toLowerCase().replace(/\s+/g, '-');
  return `/wheels/${style}`;
});

// Parse generation and trim from vehicle data
const vehicleInfo = computed(() => {
  return parseVehicleGenerationAndTrim(
    props.vehicleSubmodel,
    props.vehicleTitle,
    props.vehicleTrim
  );
});

// Build finish name from API wheel data (Finish + Color + Accent)
const getApiFinishName = (wheel: typeof frontWheel.value): string => {
  if (!wheel) return '';
  const parts: string[] = [];
  if (wheel.Finish) parts.push(wheel.Finish);
  if (wheel.Color) parts.push(wheel.Color);
  if (wheel.Accent) parts.push(wheel.Accent);
  return parts.join(' ');
};

// Build size+offset string from API wheel data
const getApiSizeOffset = (wheel: typeof frontWheel.value): string | null => {
  if (!wheel || wheel.Diameter === undefined || wheel.Width === undefined || wheel.Offset === undefined) return null;
  const offset = wheel.Offset >= 0 ? `+${wheel.Offset}mm` : `${wheel.Offset}mm`;
  return `${wheel.Diameter}" x ${wheel.Width}" ${offset}`;
};

// Format size and offset from gallery data (fallback when API data not available)
const formatSizeOffset = (size: string | null | undefined, offset: string | null | undefined): string | null => {
  if (!size || !offset) return null;
  const cleanSize = size.replace(/['"]/g, '"').trim();
  const cleanOffset = offset.replace('mm', '').trim();
  const offsetNum = parseInt(cleanOffset);
  const formattedOffset = offsetNum >= 0 ? `+${offsetNum}mm` : `${offsetNum}mm`;
  return `${cleanSize} ${formattedOffset}`;
};

function onShopFitmentClick() {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: 'shop_fitment',
    fitment: {
      vehicle: props.vehicleTitle,
      generation: vehicleInfo.value.generation,
      trim: vehicleInfo.value.trim,
      wheel_style: props.vehicleWheelStyle,
      wheel_finish: wheelFinish.value,
      front_size: props.vehicleWheelSizeF,
      rear_size: props.vehicleWheelSizeRear,
    }
  });
}

// Generate shop link with series, finish, generation, trim, and sizes
const shopRoute = computed(() => {
  if (!hasWheelInfo.value) {
    return '/shop';
  }

  // Use API finish name if available — avoids any mismatch between gallery data naming and API naming
  let finishForUrl: string | null = apiWheel.value ? (getApiFinishName(apiWheel.value) || null) : null;

  // Fall back to props finish name if API data not loaded
  if (!finishForUrl) {
    if (isPlaceholder(props.vehicleWheelFinish)) {
      return '/shop';
    }
    finishForUrl = props.vehicleWheelFinish as string;
  }

  // Use API sizes/offsets if available, fall back to gallery data props
  const frontSize = frontWheel.value
    ? getApiSizeOffset(frontWheel.value)
    : formatSizeOffset(props.vehicleWheelSizeF, props.vehicleOffesetF);
  const rearSize = rearWheel.value
    ? getApiSizeOffset(rearWheel.value)
    : formatSizeOffset(props.vehicleWheelSizeRear, props.vehicleOffsetR);

  return buildWheelUrl(
    wheelStyle.value,
    finishForUrl,
    vehicleInfo.value.generation || undefined,
    vehicleInfo.value.trim || undefined,
    frontSize || undefined,
    rearSize || undefined
  );
});
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <p class="text-lg text-black/50">Loading wheel details...</p>
  </div>

  <div v-else-if="error" class="flex items-center justify-center py-12">
    <p class="text-lg text-red-500">Error loading wheel data: {{ error }}</p>
  </div>

  <VehicleWheelSizeFit
    v-else
    :image="wheelImageUrl"
    :alt="wheelStyle"
    :logo="resolvedLogo"
  >
    <template #details>
      <div>
        <p class="text-lg text-black/50 opacity-70 tracking-wide leading-[30px]">
          SIZES
        </p>
        <ul class="list-disc pl-8">
          <li
            v-for="(size, index) in sizingDetails"
            :key="index"
            class="text-lg text-black opacity-70 tracking-wide leading-[30px]"
          >
            {{ size }}
          </li>
        </ul>
      </div>
      <div>
        <p class="text-black/50 opacity-70 tracking-wide leading-[30px]">
          FINISH
        </p>
        <ul class="list-disc pl-8">
          <li class="text-black opacity-70 tracking-wide leading-[30px]">
            {{ wheelFinish }}
          </li>
        </ul>
      </div>
    </template>

    <template #actions>
      <div class="flex justify-between gap-6 w-full">
        <div @click.capture="onShopFitmentClick">
          <Button primary :link="shopRoute" data-gtm-event="shop_fitment" :data-gtm-label="`${vehicleInfo.generation} ${vehicleInfo.trim} - ${wheelStyle} ${wheelFinish}`">
            SHOP FITMENT
          </Button>
        </div>
        <Button secondary :link="wheelStyleRoute" data-gtm-event="explore_wheel" :data-gtm-label="`Explore ${wheelStyle}`">
          EXPLORE {{ hasWheelInfo ? wheelStyle : 'WHEELS' }}
        </Button>
      </div>
    </template>
  </VehicleWheelSizeFit>
</template>

<style scoped>
</style>
