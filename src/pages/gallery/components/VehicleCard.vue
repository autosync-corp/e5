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
  title: {
    type: String,
    required: true,
  },
  style: {
    type: String,
    required: true,
  },
  finish: {
    type: String,
    required: true,
  },
  link: String,
})

const onClick = () => {
  if (props.link) {
    window.location.href = props.link;
  }
}
</script>

<template>
  <div class="flex flex-col " @click="onClick">
    <img :src="props.image" :alt="props.image" class="w-full h-[330px] object-cover bg-gray-50"/>
    <div class="bg-gray-100 px-4 py-3 text-center uppercase tracking-[1.5px] text-14">
      <p class="text-black/30">{{ props.style }}</p>
      <p class="font-franklin-medium text-lg text-black">{{props.title}}</p>
      <div class="text-black tracking-[0.8px]"></div>
      <div class="text-black tracking-[0.8px]">{{ props.style }} {{props.finish}}</div>
    </div>
  </div>
</template>
