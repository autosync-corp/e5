<script setup lang="ts">
const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  }
})
</script>

<template>
  <div class="flex flex-col items-center">
    <img
        :src="props.image"
        :alt="props.alt"
        class="w-full h-auto object-contain mb-3"
    />
    <slot />
  </div>
</template>
