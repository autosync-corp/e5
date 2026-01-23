<script setup lang="ts">
import {Orientations} from "@/core/types/App.ts";

interface Props {
  image: string;
  alt: string;
  class?: string;
  customClassContainer?: string;
  bgColor?: string;
  orientation?: Orientations;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  orientation: Orientations.RIGHT,
})
</script>

<template>
  <section
    class="w-full relative overflow-hidden"
    :class="[
      props.class,
      props.height && `h-[${props.height}px]`
    ]"
  >
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
