<script setup lang="ts">
const props = defineProps({
  image: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  height: {
    type: String,
  },
})
</script>

<template>
  <section class="w-full grid grid-cols-2 relative overflow-hidden" :class="props.height && `h-[${props.height}px]`">
    <slot name="left" />

    <img
        :src="props.image"
        :alt="props.alt"
        class="w-full h-full object-cover ml-auto"
    />

    <slot name="right"/>
  </section>
</template>

<style scoped>

</style>