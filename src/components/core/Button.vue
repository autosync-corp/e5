<script setup lang="ts">
const props = defineProps({
  primary: {
    type: Boolean,
    default: false
  }
});
</script>
<template>
  <button v-if="props.primary" class="bg-e5-red text-white font-franklin-demi border-0 px-8 py-5 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
    <slot></slot>
  </button>
  <button v-else class="bg-black text-white font-sans border-0 px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
    <slot></slot>
  </button>
</template>