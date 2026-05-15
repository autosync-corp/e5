<script setup lang="ts">
const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  series: {
    type: String,
    required: true,
  },
  finish: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  }
})
</script>

<template>
  <a :href="props.link" class="relative group block hover:opacity-90 transition-opacity">
    <!-- Wheel Image -->
    <div class="relative w-full h-[329px] overflow-hidden">
      <img
        :src="props.image"
        :alt="`${props.name} ${props.finish}`"
        class="w-full h-full object-cover"
      />
      <div v-if="props.featured" class="absolute inset-0 bg-black/35 flex items-center justify-center">
        <span class="text-white text-xl md:text-2xl font-franklin-demi tracking-[5.04px] underline decoration-solid">
          VIEW {{ props.name.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Wheel Info -->
    <div class="bg-gray-100 px-4 py-3 text-center uppercase tracking-[1.5px] text-14">
      <p class="text-black/30">{{ props.series }}</p>
      <p class="font-franklin-medium text-lg text-black">{{ props.name }}</p>
      <div class="text-black tracking-[0.8px]">{{ props.finish }}</div>
    </div>
  </a>
</template>
