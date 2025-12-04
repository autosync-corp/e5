<script setup lang="ts">
const props = defineProps({
  link: String,
})
</script>

<template>
  <div class="flex mx-auto cursor-pointer">
    <a :href="props.link" class="text-[12px] tracking-[3.96px] uppercase border-b border-e5-red pb-2">
      <div class="hover:-translate-y-0.5">
        <slot />
      </div>
    </a>
  </div>
</template>

<style scoped>

</style>