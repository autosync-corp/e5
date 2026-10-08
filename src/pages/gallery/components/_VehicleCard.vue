<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { WHEELS_COMING_SOON } from '@/pages/gallery/constants/CorvetteGalleryData.ts';
import { useWheelApi } from '@/core/composables/useWheelApi';

const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  style: {
    type: String,
    required: true,
  },
  finish: {
    type: String,
    required: true,
  },
  link: String,
  // Optional: lets a card whose wheels hadn't launched yet resolve them later
  partF: String,
  partR: String,
})

const imageSrc = ref(props.image);
const fallbackImage = '/assets/images/placeholder-vehicle.jpg';

const isPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const v = value.toLowerCase();
  return v === 'n/a' || v === WHEELS_COMING_SOON.toLowerCase();
};

const { wheelData, fetchWheelData } = useWheelApi();

// An entry can carry part numbers before its wheels exist in the catalog. Only look
// them up when the card actually has no style yet, so this costs nothing for the
// cards that already know their wheel (the grid resolves those in one batched call).
onMounted(() => {
  if (!isPlaceholder(props.style)) return;
  const partNumbers = [props.partF, props.partR].filter(Boolean) as string[];
  if (partNumbers.length > 0) fetchWheelData(partNumbers);
});

const apiWheel = computed(() => wheelData.value[0] ?? null);

const resolvedStyle = computed(() => {
  if (!isPlaceholder(props.style)) return props.style;
  return apiWheel.value?.Model || props.style;
});

const resolvedFinish = computed(() => {
  if (!isPlaceholder(props.finish)) return props.finish;
  const w = apiWheel.value;
  const name = w ? [w.Finish, w.Color, w.Accent].filter(Boolean).join(' ') : '';
  return name || props.finish;
});

// With no wheel data the style already reads "Wheels coming soon" — repeating it on
// the second line would render it twice, so blank that line.
const hasWheelInfo = computed(() => !isPlaceholder(resolvedStyle.value));
const wheelLine = computed(() => hasWheelInfo.value ? `${resolvedStyle.value} ${resolvedFinish.value}` : '');

const handleImageError = () => {
  imageSrc.value = fallbackImage;
}
</script>

<template>
  <a :href="props.link" class="flex flex-col hover:opacity-90 transition-opacity">
    <img :src="imageSrc" :alt="props.title" @error="handleImageError" class="w-full h-[330px] object-cover bg-gray-50" width="400" height="330" loading="lazy"/>
    <div class="bg-gray-100 px-4 py-3 text-center uppercase tracking-[1.5px] text-14">
      <p class="text-black/30">{{ resolvedStyle }}</p>
      <p class="font-franklin-medium text-lg text-black">{{props.title}}</p>
      <div class="text-black tracking-[0.8px]"></div>
      <div class="text-black tracking-[0.8px]">{{ wheelLine }}</div>
    </div>
  </a>
</template>
