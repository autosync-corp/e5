<template>
  <Navbar />
  <div style="min-height: calc(100dvh - 107px);">
    <router-view id="router-view" class="mt-107"/>
  </div>
  <Footer />
</template>

<script setup lang="ts">
import Navbar from "@/core/components/Navbar.vue";
import Footer from "@/core/components/Footer.vue";
</script>

<style>
body {
  margin: auto;
  padding: 0;
  width: 100dvw;
  min-width: 100dvw;
  max-width: 1920px;
  min-height: 100dvh;
  overflow-x: hidden;
}
</style>
