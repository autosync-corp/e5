<script setup lang="ts">
import Button from "@/core/components/Button.vue";

const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  logo: {
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
  tires: {
    type: String,
    required: true,
  },
  sizing: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  }
})

const onClick = () => {
  window.location.href = props.link;
};
</script>

<template>
  <div class="flex flex-col bg-gray-100">
    <div class="w-full h-[330px] bg-gray-100 flex align-middle justify-end">
      <img :src="props.image" :alt="props.image" class="w-full object-cover"/>
    </div>
    <div class="grid grid-cols-2 gap-2 text-start mt-4 px-6">
      <div class="text-start color flex flex-col">
        <div class="font-medium text-14 text-black/30 tracking-[1px]"><small>{{props.title}}</small></div>
        <div class="font-franklin-medium text-lg uppercase tracking-[1px]"> {{ props.style}} </div>
      </div>

      <div class="flex justify-end mt-3 px-3"><img :src="props.logo" :alt="`${props.style} Logo`" class="h-[32px] w-auto" /></div>

      <p>
        <small class="text-black/35">WHEEL STYLE:</small>
        <br />
        <small>{{props.style}}</small>
      </p>
      <p>
        <small class="text-black/35">WHEEL FINISH:</small>
        <br />
        <small>{{props.finish}}</small>
      </p>
      <p>
        <small class="text-black/35">SIZING:</small>
        <br />
        <small>{{props.sizing}}</small>
      </p>
      <p>
        <small class="text-black/35">TIRES:</small>
        <br />
        <small>{{props.tires}}</small>
      </p>
    </div>

    <Button primary class="mx-auto mt-8 mb-3" style="max-width: 230px" @click="onClick">VIEW GALLERY</Button>
  </div>
</template>
