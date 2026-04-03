<script setup lang="ts">
import VehicleImagesGallery from './_VehicleImagesGallery.vue';

interface MediaItem {
  type: 'image' | 'video';
  url?: string;
}

defineProps<{
  media: MediaItem[];
  trim: string;
}>();
</script>

<template>
  <VehicleImagesGallery :media="media" :trim="trim" />
</template>
