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
  name: {
    type: String,
    required: true,
  },
  series: {
    type: String,
    required: true,
  },
  finishes: {
    type: Array as () => string[],
    required: true,
  },
  sizes: {
    type: Array as () => string[],
    required: true,
  },
  madeFor: {
    type: Array as () => string[],
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
    <!-- Wheel Image -->
    <div class="w-full h-[330px] bg-gray-100 flex align-middle justify-end">
      <img :src="props.image" :alt="props.name" class="w-full object-cover"/>
    </div>

    <!-- Wheel Details Section -->
    <div class="grid grid-cols-2 gap-2 text-start mt-4 px-6">
      <!-- Header with Name and Logo -->
      <div class="text-start flex flex-col">
        <div class="font-medium text-14 text-black/30 tracking-[1px]"><small>{{ props.series }}</small></div>
        <div class="font-franklin-medium text-lg uppercase tracking-[1px]">{{ props.name }}</div>
      </div>

      <div class="flex justify-end mt-3 px-3">
        <img :src="props.logo" :alt="`${props.name} Logo`" class="h-[32px] w-auto" />
      </div>

      <!-- Finishes -->
      <p>
        <small class="text-black/35">FINISHES:</small>
        <br />
        <small v-for="(finish, index) in props.finishes" :key="index">
          {{ finish }}<span v-if="index < props.finishes.length - 1">, </span>
        </small>
      </p>

      <!-- Made For -->
      <p>
        <small class="text-black/35">MADE FOR:</small>
        <br />
        <small v-for="(model, index) in props.madeFor" :key="index">
          {{ model }}<span v-if="index < props.madeFor.length - 1">, </span>
        </small>
      </p>

      <!-- Sizes -->
      <p class="col-span-2">
        <small class="text-black/35">SIZES:</small>
        <br />
        <small v-for="(size, index) in props.sizes" :key="index">
          {{ size }}<span v-if="index < props.sizes.length - 1"> / </span>
        </small>
      </p>
    </div>

    <!-- View Gallery Button -->
    <Button primary class="mx-auto mt-8 mb-3" style="max-width: 230px" @click="onClick">VIEW GALLERY</Button>
  </div>
</template>
