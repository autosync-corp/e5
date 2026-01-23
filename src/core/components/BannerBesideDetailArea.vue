<script setup lang="ts">
interface Props {
  image: string;
  alt: string;
  class?: string;
  height?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <section
    class="w-full grid grid-cols-2 relative overflow-hidden"
    :class="[
      props.class,
      props.height && `h-[${props.height}px]`
    ]"
  >
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