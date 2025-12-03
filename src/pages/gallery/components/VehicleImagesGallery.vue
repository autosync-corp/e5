<script setup lang="ts">
import {type Ref, ref} from "vue";

const props = defineProps({
  images: {
    type: Array<string>,
    required: true
  },
  trim: {
    type: String,
    required: true
  },
});

const currentImageIndex: Ref<number> = ref(0);

const setCurrentImage = (index: number) => {
  currentImageIndex.value = index;
};
</script>

<template>
  <!-- Hero Image Section -->
  <section class="w-full">
    <div class="w-full h-[840px] overflow-hidden">
      <img
          :src="props.images[currentImageIndex]"
          :alt="`${props.trim} ${currentImageIndex + 1}`"
          class="w-full h-full object-cover"
      />
    </div>

    <!-- Thumbnail Gallery -->
    <div class="container-e5 py-8">
      <div class="flex items-center justify-center gap-4">
        <!-- Left Arrow -->
        <button
            @click="currentImageIndex = Math.max(0, currentImageIndex - 1)"
            :disabled="currentImageIndex === 0"
        >
          <div class="h-[11px] rounded-full transition-all w-[11px]" :class="currentImageIndex === 0 ? 'bg-gray-100' : 'bg-gray-300'"></div>
        </button>

        <!-- Thumbnails -->
        <div class="flex gap-4">
          <button
              v-for="(img, index) in props.images"
              :key="index"
              @click="setCurrentImage(index)"
              :class="[
                'w-[235px] h-[157px] overflow-hidden cursor-pointer transition-all',
                currentImageIndex === index ? 'ring-4 ring-e5-red' : 'opacity-60 hover:opacity-100'
              ]"
          >
            <img :src="img" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" />
          </button>
        </div>

        <!-- Right Arrow -->
        <button
            @click="currentImageIndex = Math.min(props.images.length - 1, currentImageIndex + 1)"
            :disabled="currentImageIndex === props.images.length - 1"
        >
          <div class="h-[11px] rounded-full transition-all w-[11px]" :class="currentImageIndex === props.images.length - 1 ? 'bg-gray-100' : 'bg-gray-300'"></div>
        </button>
      </div>

      <div class="flex justify-center mt-4 gap-2">
        <div
            v-for="(_, index) in props.images"
            :key="index"
            :class="[
              'h-[11px] rounded-full transition-all w-[11px]',
              currentImageIndex === index ? 'bg-e5-red' : 'bg-gray-300'
            ]"
        />
      </div>
    </div>
  </section>
</template>
