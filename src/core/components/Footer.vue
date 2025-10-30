<script setup lang="ts">

import Button from "@/core/components/Button.vue";
</script>

<template>
  <footer class="container-e5 bg-e5-red font-medium text-black w-full py-20">
    <div class="flex justify-center mb-20">
      <img src="/src/assets/images/e5-wheels-alt-logo-black.png" alt="E5 Wheels" class="w-1/4 h-auto" />
    </div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-start justify-between">
      <div class="flex flex-col">
        <a href="#" class="footer-link">OUR PROCESS</a>
        <a href="#" class="footer-link">CONTACT US</a>
        <a href="#" class="footer-link">REFUND & RETURN POLICY</a>
        <a href="#" class="footer-link">WARRANTY</a>
        <a href="#" class="footer-link">INSTALLATION GUIDELINES</a>
        <a href="#" class="footer-link">MEDIA</a>
        <a href="#" class="footer-link">COMMUNITY</a>
      </div>

      <div class="h-full flex items-center justify-center">
        <img src="/src/assets/images/media-icons.png" alt="Social Media" class="inline-block w-[207px] h-auto" />
      </div>

      <div class="flex flex-col items-end text-end">
        <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank">
          <div class="footer-link flex items-start gap-4 text-16">
            <img src="/src/assets/images/pin-icon-black.png" alt="Location" class="w-6 h-auto mt-3 rotate-180 scale-y-[-1]" />
            <div>
              <p class="m-0">E5 WHEELS, LLC</p>
              <p class="m-0">3500 NW 77 CT</p>
              <p class="m-0">DORAL, FL 33122</p>
            </div>
          </div>
        </a>
        <div class="footer-link  flex items-start gap-4 text-16">
          <img src="/src/assets/images/phone-icon-black.png" alt="Phone" class="w-6 h-auto mt-3" />
          <p class="m-0">
            <a href="tel:(305)964-7429" target="_blank">(305)964-7429</a>
          </p>
        </div>
        <p class="text-16 m-0 footer-link">
          <a href="mailto:SALES@E5WHEELS.COM" target="_blank">SALES@E5WHEELS.COM</a>
        </p>
        <Button>GET IN TOUCH</Button>
      </div>
    </div>

    <p class="footer-link text-16 text-center m-0">
      © {{ new Date().getFullYear() }} COPYRIGHT E5 WHEELS, LLC
    </p>
  </footer>
</template>

<style scoped>
.footer-link {
  @apply font-sans text-16 text-black no-underline transition-opacity hover:opacity-70;
}
</style>