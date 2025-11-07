<script setup lang="ts">
const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  title: String,
  logo: String,
})
</script>

<template>
  <div class="flex gap-16">
    <!-- Wheel Image -->
    <div class="flex items-center justify-center">
      <img :src="props.image" :alt="props.alt" class="w-full max-w-[480px] h-auto" />
    </div>

    <!-- Wheel Details -->
    <div class="flex align-middle flex-col justify-center">
      <div class="mb-8">
        <p class="text-lg text-black/50 opacity-70 tracking-wide leading-[30px] mb-4">
          {{props.title}}
        </p>
        <img :src="props.logo" alt="Logo" class="h-[36px] w-auto" />
      </div>

      <div class="grid grid-cols-2 gap-8 mb-12">
        <slot name="details" />
      </div>

      <slot name="actions"/>
    </div>
  </div>
</template>

<style scoped>

</style>