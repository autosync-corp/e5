<script setup lang="ts">
import { computed, ref } from 'vue';
import { WHEELS_COMING_SOON } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

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
})

const imageSrc = ref(props.image);
const fallbackImage = '/assets/images/placeholder-vehicle.jpg';

// With no wheel data the style already reads "Coming Soon" — repeating it on
// the second line would render "Coming Soon Coming Soon", so blank that line.
const hasWheelInfo = computed(() => props.style && props.style !== WHEELS_COMING_SOON);
const wheelLine = computed(() => hasWheelInfo.value ? `${props.style} ${props.finish}` : '');

const handleImageError = () => {
  imageSrc.value = fallbackImage;
}
</script>

<template>
  <a :href="props.link" class="flex flex-col hover:opacity-90 transition-opacity">
    <img :src="imageSrc" :alt="props.title" @error="handleImageError" class="w-full h-[330px] object-cover bg-gray-50" width="400" height="330" loading="lazy"/>
    <div class="bg-gray-100 px-4 py-3 text-center uppercase tracking-[1.5px] text-14">
      <p class="text-black/30">{{ props.style }}</p>
      <p class="font-franklin-medium text-lg text-black">{{props.title}}</p>
      <div class="text-black tracking-[0.8px]"></div>
      <div class="text-black tracking-[0.8px]">{{ wheelLine }}</div>
    </div>
  </a>
</template>
