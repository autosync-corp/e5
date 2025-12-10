<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useWheelApi } from '@/core/composables/useWheelApi';
import VehicleWheelSizeFit from './VehicleWheelSizeFit.vue';
import Button from '@/core/components/Button.vue';
import {E5_LOGO_BLACK} from "@/core/constants/App.ts";

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
    const frontOffset = frontWheel.value?.Offset?.toString() + 'mm' || props.vehicleOffesetF;
    if (frontSize && frontOffset) {
      details.push(`Front: ${frontSize} / Offset ${frontOffset}`);
    }
  }

  if (rearWheel.value || props.vehicleWheelSizeRear) {
    const rearSize = rearWheel.value?.Diameter && rearWheel.value?.Width
      ? `${rearWheel.value.Diameter}" x ${rearWheel.value.Width}"`
      : props.vehicleWheelSizeRear;
    const rearOffset = rearWheel.value?.Offset?.toString() + 'mm' || props.vehicleOffsetR;
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

const wheelFinish = computed(() => props.vehicleWheelFinish || 'N/A');
const wheelStyle = computed(() => props.vehicleWheelStyle || 'N/A');
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
    :logo="wheelStyleLogo"
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
        <Button primary link="pending">
          SHOP {{ wheelStyle }}
        </Button>
        <Button secondary link="/wheels">
          EXPLORE WHEELS
        </Button>
      </div>
    </template>
  </VehicleWheelSizeFit>
</template>

<style scoped>
</style>
