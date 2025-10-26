<script setup lang="ts">
const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  trim: {
    type: String,
    required: true,
  },
  wheelModel: {
    type: String,
    required: true,
  },
  wheelFinish: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="flex flex-col">
    <img :src="props.image" alt="Corvette Build" class="w-full h-[330px] object-cover"/>
    <div class="bg-gray-50 px-4 py-3 text-center">
      <p class="text-18 font-bold text-black/35 tracking-[1px]">{{props.year}}</p>
      <p class="font-franklin-demi text-xl text-black tracking-[1px]">{{props.trim}}</p>
      <div class="text-black tracking-[0.8px]">{{ props.wheelModel }}</div>
      <div class="text-black tracking-[0.8px]">{{props.wheelFinish}}</div>
    </div>
  </div>
</template>
