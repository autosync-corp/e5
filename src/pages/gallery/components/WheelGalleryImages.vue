<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWheelApi } from '@/core/composables/useWheelApi';

const props = defineProps<{
  partF?: string | null;
  wheelPartR?: string | null;
  wheelStyle?: string | null;
  wheelsRoute: string;
}>();

const { loading, wheelData, imgUrlBase, fetchWheelData } = useWheelApi();

// Fetch data on mount
onMounted(async () => {
  const partNumbers = [];
  if (props.partF) partNumbers.push(props.partF);
  if (props.wheelPartR) partNumbers.push(props.wheelPartR);

  if (partNumbers.length > 0) {
    await fetchWheelData(partNumbers);
  }
});

// Get all wheel images from the first wheel in the response
const wheelGalleryImages = computed(() => {
  if (wheelData.value.length === 0 || !imgUrlBase.value) {
    return [];
  }

  const wheel = wheelData.value[0];
  const images = [];

  // Collect all available images
  if (wheel.Img0001) images.push({ image: imgUrlBase.value + wheel.Img0001, finish: 'View 1' });
  if (wheel.Img0002) images.push({ image: imgUrlBase.value + wheel.Img0002, finish: 'View 2' });
  if (wheel.Img0003) images.push({ image: imgUrlBase.value + wheel.Img0003, finish: 'View 3' });

  return images;
});

const hasImages = computed(() => wheelGalleryImages.value.length > 0);
</script>

<template>
  <section v-if="hasImages" class="container-e5 py-24 px-24">
    <h2 class="text-4xl text-black font-medium opacity-70 tracking-wide leading-[34px] mb-8 uppercase">
      {{ wheelStyle || 'WHEEL' }} GALLERY
    </h2>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-lg text-black/50">Loading gallery images...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div
        v-for="(wheel, index) in wheelGalleryImages"
        :key="index"
        class="w-full h-auto overflow-hidden flex items-center justify-center"
      >
        <a :href="`${wheelsRoute}/${wheelStyle}`">
          <img
            :src="wheel.image"
            :alt="wheel.finish"
            class="w-full object-cover cursor-pointer"
          />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
