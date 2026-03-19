<script setup lang="ts">
import {type Ref, ref, computed, onMounted, onUnmounted} from "vue";

defineOptions({
  name: 'VehicleImagesGallery'
});

interface MediaItem {
  type: 'image' | 'video';
  url?: string;
  youtubeId?: string;
  thumbnail?: string;
}

const props = defineProps({
  media: {
    type: Array as () => MediaItem[],
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

// Computed properties for current media item
const currentMediaItem = computed(() => props.media[currentImageIndex.value]);
const isCurrentVideo = computed(() => currentMediaItem.value?.type === 'video');
const currentYoutubeUrl = computed(() => {
  if (!isCurrentVideo.value || !currentMediaItem.value?.youtubeId) return '';
  // Add autoplay and other parameters similar to forged page - no controls
  return `https://www.youtube-nocookie.com/embed/${currentMediaItem.value.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${currentMediaItem.value.youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&playsinline=1&enablejsapi=0&vq=hd1080`;
});

const goToPreviousImage = () => {
  // Circular navigation: if at first image, go to last
  if (currentImageIndex.value > 0) {
    setCurrentImage(currentImageIndex.value - 1);
  } else {
    setCurrentImage(props.media.length - 1);
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
  // Circular navigation: if at last image, go to first
  if (currentImageIndex.value < props.media.length - 1) {
    setCurrentImage(currentImageIndex.value + 1);
  } else {
    setCurrentImage(0);
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
  <!-- Hero Image/Video Section -->
  <section class="w-full">
    <div class="relative w-full overflow-hidden group">
      <!-- Display Image -->
      <img
          v-if="!isCurrentVideo"
          :src="currentMediaItem.url"
          :alt="`${props.trim} ${currentImageIndex + 1}`"
          class="w-full max-h-[740px] object-cover"
          width="1920"
          height="740"
          :fetchpriority="currentImageIndex === 0 ? 'high' : 'auto'"
      />

      <!-- Display YouTube Video -->
      <div v-else class="relative w-full" style="padding-bottom: 56.25%; background: #000;">
        <iframe
            :src="currentYoutubeUrl"
            allowtransparency="true"
            class="absolute top-0 left-0 w-full h-full"
            style="pointer-events: none; border: 0;"
            allow="autoplay; encrypted-media"
            loading="eager"
            :title="`${props.trim} video`"
        ></iframe>
        <!-- Overlay to block all interactions and hide title -->
        <div class="absolute top-0 left-0 w-full h-full" style="pointer-events: none;"></div>
      </div>

      <!-- Navigation Controls on Main Image/Video -->
      <div class="absolute inset-0 flex items-center justify-between px-4 md:px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <!-- Previous Button -->
        <button
            @click="goToPreviousImage"
            class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm pointer-events-auto"
            aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-7 md:w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Next Button -->
        <button
            @click="goToNextImage"
            class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm pointer-events-auto"
            aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-7 md:w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Image Counter -->
      <div class="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-sm backdrop-blur-sm">
        {{ currentImageIndex + 1 }} / {{ props.media.length }}
      </div>
    </div>

    <!-- Thumbnail Gallery -->
    <div class="container-e5 py-8">
      <div class="relative flex items-center gap-3 md:gap-6">
        <!-- Left Arrow Button -->
        <button
            @click="goToPreviousImage"
            class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
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
                v-for="(item, index) in props.media"
                :key="index"
                @click="setCurrentImage(index)"
                :class="[
                  'relative flex-shrink-0 overflow-hidden cursor-pointer transition-all rounded-md',
                  'w-[160px] h-[107px] sm:w-[200px] sm:h-[133px] md:w-[235px] md:h-[157px]',
                  currentImageIndex === index
                    ? 'scale-[1.02] ring-2 ring-e5-red'
                    : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'
                ]"
                :aria-label="item.type === 'video' ? `View video ${index + 1}` : `View image ${index + 1}`"
            >
              <img
                  :src="item.type === 'video' ? item.thumbnail : item.url"
                  :alt="`Thumbnail ${index + 1}`"
                  class="w-full h-full object-cover"
                  width="235"
                  height="157"
                  loading="lazy"
              />

              <!-- Play Icon Overlay for Videos -->
              <div v-if="item.type === 'video'" class="absolute inset-0 flex items-center justify-center bg-black/20">
                <div class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8 text-e5-red ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Right Arrow Button -->
        <button
            @click="goToNextImage"
            class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
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
