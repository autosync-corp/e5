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
  brand: {
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
  tires: {
    type: String,
    required: true,
  },
  sizing: {
    type: String,
    required: true,
  }
})
</script>

<template>
  <div class="flex flex-col bg-gray-50 px-4 py-3">
    <div class="w-full h-[350px] bg-gray-50 flex align-middle justify-center">
      <img :src="props.image" alt="Corvette Build" class="w-full object-cover"/>
    </div>
    <div class="grid grid-cols-2 gap-8 text-start mt-4 px-4">
      <div class="text-start color flex flex-col">
        <div class="font-medium text-black/35 tracking-[1px]">{{props.year}}</div>
        <div class="font-franklin-heavy text-xl"> {{ props.trim}} </div>
      </div>

      <div class="flex justify-end mt-3"><img :src="props.logo" :alt="`${props.brand} Logo`" class="h-[60px] w-auto" /></div>

      <p>
        <small>WHEEL MODEL:</small>
      </p>
      <p>
        <small>FINISH:</small>
      </p>
      <p>
        <small>SIZING:</small>
      </p>
      <p>
        <small>TIRES:</small>
      </p>
    </div>

    <Button primary class="mx-auto mt-8" style="max-width: 230px">VIEW GALLERY</Button>
  </div>
</template>
