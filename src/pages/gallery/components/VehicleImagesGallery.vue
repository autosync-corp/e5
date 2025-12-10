<script setup lang="ts">
import {type Ref, ref, onMounted, onUnmounted} from "vue";

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
const scrollContainer: Ref<HTMLElement | null> = ref(null);
const scrollPosition: Ref<number> = ref(0);
const canScrollLeft: Ref<boolean> = ref(false);
const canScrollRight: Ref<boolean> = ref(false);
const hasOverflow: Ref<boolean> = ref(false);

const setCurrentImage = (index: number) => {
  currentImageIndex.value = index;

  // Scroll the thumbnail into view only if there's overflow
  if (scrollContainer.value && hasOverflow.value) {
    const thumbnails = scrollContainer.value.children;
    if (thumbnails[index]) {
      (thumbnails[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }
};

const updateScrollState = () => {
  if (!scrollContainer.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  scrollPosition.value = scrollLeft;
  hasOverflow.value = scrollWidth > clientWidth;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
};

const goToPreviousImage = () => {
  if (currentImageIndex.value > 0) {
    setCurrentImage(currentImageIndex.value - 1);
  }

  // Also scroll the thumbnail container
  if (scrollContainer.value) {
    const scrollAmount = scrollContainer.value.clientWidth * 0.8;
    scrollContainer.value.scrollTo({
      left: scrollContainer.value.scrollLeft - scrollAmount,
      behavior: 'smooth'
    });
  }
};

const goToNextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    setCurrentImage(currentImageIndex.value + 1);
  }

  // Also scroll the thumbnail container
  if (scrollContainer.value) {
    const scrollAmount = scrollContainer.value.clientWidth * 0.8;
    scrollContainer.value.scrollTo({
      left: scrollContainer.value.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  }
};

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', updateScrollState);
    updateScrollState();

    // Initial check after images load
    setTimeout(updateScrollState, 100);
  }

  // Update on window resize
  window.addEventListener('resize', updateScrollState);
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', updateScrollState);
  }
  window.removeEventListener('resize', updateScrollState);
});
</script>

<template>
  <!-- Hero Image Section -->
  <section class="w-full">
    <div class="w-full overflow-hidden">
      <img
          :src="props.images[currentImageIndex]"
          :alt="`${props.trim} ${currentImageIndex + 1}`"
          class="w-full max-h-[740px] object-cover"
      />
    </div>

    <!-- Thumbnail Gallery -->
    <div class="container-e5 py-8">
      <div class="relative flex items-center gap-3 md:gap-6">
        <!-- Left Arrow Button -->
        <button
            @click="goToPreviousImage"
            :disabled="currentImageIndex === 0"
            class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Scrollable Thumbnails Container -->
        <div
            ref="scrollContainer"
            :class="[
              'flex-1 scroll-smooth scrollbar-hide',
              hasOverflow ? 'overflow-x-auto' : 'overflow-x-hidden'
            ]"
            style="scrollbar-width: none; -ms-overflow-style: none;"
        >
          <div :class="['flex gap-3 md:gap-4', !hasOverflow && 'justify-center']">
            <button
                v-for="(img, index) in props.images"
                :key="index"
                @click="setCurrentImage(index)"
                :class="[
                  'flex-shrink-0 overflow-hidden cursor-pointer transition-all rounded-md',
                  'w-[160px] h-[107px] sm:w-[200px] sm:h-[133px] md:w-[235px] md:h-[157px]',
                  currentImageIndex === index
                    ? 'scale-[1.02]'
                    : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'
                ]"
                :aria-label="`View image ${index + 1}`"
            >
              <img
                  :src="img"
                  :alt="`Thumbnail ${index + 1}`"
                  class="w-full h-full object-cover"
                  loading="lazy"
              />
            </button>
          </div>
        </div>

        <!-- Right Arrow Button -->
        <button
            @click="goToNextImage"
            :disabled="currentImageIndex === props.images.length - 1"
            class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
