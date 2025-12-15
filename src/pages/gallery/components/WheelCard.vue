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

const onClick = () => {
  window.location.href = props.link;
};
</script>

<template>
  <div class="relative group cursor-pointer" @click="onClick">
    <!-- Wheel Image -->
    <div class="relative w-full h-[329px] overflow-hidden">
      <img
        :src="props.image"
        :alt="`${props.name} ${props.finish}`"
        class="w-full h-full object-cover"
      />
      <div v-if="props.featured" class="absolute inset-0 bg-black/35 flex items-center justify-center">
        <span class="text-white text-2xl font-franklin-demi tracking-[5.04px] underline decoration-solid">
          VIEW {{ props.name.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Wheel Info -->
    <div class="border border-black/18 p-6 text-center h-[94px] flex flex-col justify-center">
      <p class="text-[20px] text-black/35 font-franklin-book tracking-[1px] mb-2 leading-[20px]">
        {{ props.series }}
      </p>
      <h3 class="text-[20px] text-black font-franklin-demi tracking-[1px] mb-1 leading-[20px]">
        {{ props.name }}
      </h3>
      <p class="text-[16px] text-black font-franklin-book tracking-[0.8px] leading-[20px]">
        {{ props.finish }}
      </p>
    </div>
  </div>
</template>
