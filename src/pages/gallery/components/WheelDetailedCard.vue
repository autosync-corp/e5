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
  <div class="flex flex-col bg-white border border-black/34">
    <!-- Wheel Image -->
    <div class="w-full h-[504px] bg-white flex items-center justify-center">
      <img :src="props.image" :alt="props.name" class="w-full h-full object-cover"/>
    </div>

    <!-- Wheel Details Section -->
    <div class="px-6 py-8 min-h-[431px] flex flex-col">
      <!-- Header with Name and Logo -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <p class="text-[20px] text-black/35 font-franklin-book tracking-[1px] mb-2">
            {{ props.series }}
          </p>
          <h3 class="text-[32px] text-black font-franklin-demi tracking-[1.6px]">
            {{ props.name }}
          </h3>
        </div>
        <img :src="props.logo" :alt="`${props.name} Logo`" class="h-[60px] w-auto" />
      </div>

      <!-- Specifications Grid -->
      <div class="grid grid-cols-2 gap-8 flex-grow">
        <!-- Finishes -->
        <div>
          <p class="text-[16px] text-black font-franklin-book tracking-[0.8px] mb-2">
            FINISHES:
          </p>
          <ul class="list-disc list-inside">
            <li v-for="(finish, index) in props.finishes" :key="index" class="text-[16px] text-black font-franklin-book tracking-[0.8px]">
              {{ finish }}
            </li>
          </ul>
        </div>

        <!-- Made For -->
        <div>
          <p class="text-[16px] text-black font-franklin-book tracking-[0.8px] mb-2">
            MADE FOR:
          </p>
          <ul class="list-disc list-inside">
            <li v-for="(model, index) in props.madeFor" :key="index" class="text-[16px] text-black font-franklin-book tracking-[0.8px]">
              {{ model }}
            </li>
          </ul>
        </div>

        <!-- Sizes -->
        <div class="col-span-2">
          <p class="text-[16px] text-black font-franklin-book tracking-[0.8px] mb-2">
            SIZES:
          </p>
          <ul class="list-disc list-inside">
            <li v-for="(size, index) in props.sizes" :key="index" class="text-[16px] text-black font-franklin-book tracking-[0.8px]">
              {{ size }}
            </li>
          </ul>
        </div>
      </div>

      <!-- View Gallery Button -->
      <div class="flex justify-center mt-8">
        <Button
          :primary="true"
          :secondary="false"
          :disabled="false"
          @click="onClick"
        >
          VIEW GALLERY
        </Button>
      </div>
    </div>
  </div>
</template>
