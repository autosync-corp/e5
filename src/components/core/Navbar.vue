<script setup lang="ts">

</script>

<template>
  <nav class="bg-e5-black font-franklin-heavy fixed top-0 left-0 w-full h-107 z-10 flex justify-center">
    <div class="inline-grid h-full grid-cols-[1fr_auto_1fr] items-center gap-16">
      <div class="flex justify-start gap-6">
        <a href="#" class="nav-link">WHEELS</a>
        <a href="#" class="nav-link">GALLERY</a>
        <a href="#" class="nav-link">OUR PROCESS</a>
      </div>

      <div class="flex justify-center">
        <img src="/assets/images/e5-wheels-logo-white.png" alt="E5 Wheels" class="h-[24px] w-auto" />
      </div>

      <div class="flex justify-end items-center gap-6">
        <a href="#" class="nav-link whitespace-nowrap">CHOOSE YOUR CORVETTE</a>
        <a href="#" class="nav-link">CONTACT US</a>
        <img src="/assets/images/asset-18.png" alt="Cart" class="h-[26.503px] w-[32.109px] cursor-pointer hover:opacity-80 transition-opacity" />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply font-franklin-medium text-14 text-white no-underline whitespace-nowrap transition-opacity hover:opacity-70;
}

@media (max-width: 480px) {
  .nav-link {
    font-size: 12px;
    letter-spacing: 3px;
  }
}
</style>