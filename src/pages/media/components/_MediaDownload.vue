<script setup lang="ts">
import Button from "@/core/components/Button.vue";
const props = defineProps({
  alt: String,
  image: String,
  downloadLink: String,
});
</script>

<template>
  <div class="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
    <div class="w-full h-64 bg-white rounded-md mb-4 flex items-center justify-center">
      <img
          :src="props.image"
          :alt="props.alt"
          class="max-w-full max-h-full object-contain p-4"
      />
    </div>
    <a
        :href="props.downloadLink"
        download
    >
      <Button primary>DOWNLOAD</Button>
    </a>
  </div>
</template>
