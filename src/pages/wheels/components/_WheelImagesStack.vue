<script setup lang="ts">
import ImageWithLegend from "@/core/components/ImageWithLegend.vue";

const props = defineProps({
  wheels: {
    type: Array<{ image: string; finish: string}>,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  }
})
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-12 mt-12">
    <ImageWithLegend
        v-for="wheel in props.wheels"
        :alt="`Talladega ${wheel.finish}`"
        :image="wheel.image"
    >
      <p class="text-[10px] tracking-[2.8px] opacity-65 text-center mb-2 uppercase">{{ wheel.finish }}</p>
      <img
          :src="props.logo"
          :alt="`${props.brand} Logo`"
          class="w-full h-auto object-contain mb-2"
      />
    </ImageWithLegend>
  </div>
</template>

<style scoped>

</style>