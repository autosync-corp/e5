<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from "@/core/components/Button.vue";

const router = useRouter();

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
  },
  link: {
    type: String,
    required: true,
  }
})

const onClick = () => {
  router.push(props.link);
};
</script>

<template>
  <div class="flex flex-col bg-gray-100">
    <div class="w-full h-[330px] bg-gray-100 flex align-middle justify-center">
      <img :src="props.image" alt="Corvette Build" class="w-full object-cover"/>
    </div>
    <div class="grid grid-cols-2 gap-2 text-start mt-4 px-6">
      <div class="text-start color flex flex-col">
        <div class="font-medium text-black/35 tracking-[1px]">{{props.year}}</div>
        <div class="font-franklin-heavy text-xl"> {{ props.trim}} </div>
      </div>

      <div class="flex justify-end mt-3 px-3"><img :src="props.logo" :alt="`${props.brand} Logo`" class="h-[60px] w-auto" /></div>

      <p>
        <small class="text-black/35">WHEEL MODEL:</small>
        <br />
        <small>{{props.wheelModel}}</small>
      </p>
      <p>
        <small class="text-black/35">WHEEL FINISH:</small>
        <br />
        <small>{{props.wheelFinish}}</small>
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
