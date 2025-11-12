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
  bgColor: String,
  orientation: {
    type: String,
    default: 'right',
  },
  height: {
    type: String,
    default: '380',
  },
})
</script>

<template>
  <section class="w-full relative overflow-hidden" :class="props.height && `h-[${props.height}px]`">
    <img
        :src="props.image"
        :alt="props.alt"
        class="w-full h-full object-cover"
    />
    <div class="absolute inset-0" :class="props.bgColor ?? 'bg-[rgba(211,29,37,0.16)]'"></div>

    <div
        class="absolute inset-0 flex items-center"
        :class="{
          'justify-center': orientation === 'center',
          'justify-end pr-24' : orientation === 'right',
          'justify-start pl-24' : orientation === 'left',
        }"
    >
      <slot />
    </div>
  </section>
</template>

<style scoped>

</style>