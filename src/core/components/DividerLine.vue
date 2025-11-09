<script setup lang="ts">
const props = defineProps({
  height: {
    type: String,
    default: '6px',
  },
  bgColor: {
    type: String,
    default: 'bg-e5-red',
  },
})
</script>

<template>
  <div class="w-full" :class="[`h-[${props.height}]`, props.bgColor]"></div>
</template>
