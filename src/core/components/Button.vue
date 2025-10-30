<script setup lang="ts">
const props = defineProps({
  primary: {
    type: Boolean,
    default: false
  },
  secondary: {
    type: Boolean,
    default: false
  }
});
</script>
<template>
  <button
    :class="{
      'bg-e5-red text-white font-franklin-demi border-0 px-8 py-5 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.primary,
      'bg-white text-e5-red font-sans border-2 border-e5-red px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.secondary,
      'bg-black text-white font-sans border-0 px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': !props.primary && !props.secondary,
    }"
  >
    <slot></slot>
  </button>
</template>