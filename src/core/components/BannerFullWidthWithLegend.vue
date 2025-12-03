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
        :class="{
          'justify-center': orientation === Orientations.CENTER,
          'justify-end pr-24' : orientation === Orientations.RIGHT,
          'justify-start pl-24' : orientation === Orientations.LEFT,
        }"
    >
      <slot />
    </div>
  </section>
</template>
