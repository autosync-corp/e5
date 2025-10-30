<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
const router = useRouter();
const route = useRoute();
</script>
<template>
  <section class="container-e5 flex gap-4 justify-center mt-8">
    <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center cursor-pointer" @click="router.push('/gallery')">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" :fill="route.name === 'gallery' ? '#d31d25' : '#999'"/>
      </svg>
    </div>
    <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center cursor-pointer" @click="router.push('/gallery/detailed')">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" :fill="route.name === 'gallery-detailed' ? '#d31d25' : '#999'"/>
      </svg>
    </div>
  </section>
</template>
