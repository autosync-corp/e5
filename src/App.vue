<template>
  <div id="app">
    <Navbar />
    <router-view class="mt-107"/>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/core/components/Navbar.vue";
import Footer from "@/core/components/Footer.vue";
</script>

<style>
#app, body {
  margin: auto;
  padding: 0;
  width: 100dvw;
  min-width: 100dvw;
  max-width: 1920px;
  min-height: 100dvh;
  overflow-x: hidden;
}
</style>
