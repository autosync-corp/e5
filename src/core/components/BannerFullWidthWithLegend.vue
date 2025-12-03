<script setup lang="ts">
import {Orientations} from "@/core/types/App.ts";

const props = defineProps({
  image: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  customClassContainer: String,
  bgColor: String,
  orientation: {
    type: String as () => Orientations,
    default: Orientations.RIGHT,
  },
  height: {
    type: String,
  },
})
</script>

<template>
  <section class="w-full relative overflow-hidden" :class="props.height && `h-[${props.height}px]`">
    <img
        :src="props.image"
        :alt="props.alt"
        class="w-full h-full object-cover ml-auto"
    />
    <div class="absolute inset-0" :class="props.bgColor"></div>

    <div
        class="absolute inset-0 flex items-center"
        :class="[
          customClassContainer,
          !customClassContainer && orientation === Orientations.CENTER && 'justify-center',
          !customClassContainer && orientation === Orientations.RIGHT && 'justify-end pr-24',
          !customClassContainer && orientation === Orientations.LEFT && 'justify-start pl-24',
        ]"
    >
      <slot />
    </div>
  </section>
</template>
