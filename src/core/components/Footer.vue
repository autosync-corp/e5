<script setup lang="ts">
import Button from "@/core/components/Button.vue";
import {E5_LOGO_BLACK, PHONE_BLACK_ICON, PIN_BLACK_ICON, SOCIAL_MEDIA_ICONS} from "@/core/constants/App.ts";
</script>

<template>
  <footer class="container-e5 bg-e5-red font-medium text-black w-full py-20 px-6">
    <div class="flex justify-center mb-20">
      <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="footer-logo w-1/4 h-auto" />
    </div>

    <div class="footer-grid grid grid-cols-[1fr_auto_1fr] items-start justify-between gap-8">
      <div class="footer-section footer-links flex flex-col">
        <a href="/general/process" class="footer-link">OUR PROCESS</a>
        <a href="/general/contact" class="footer-link">CONTACT US</a>
        <a href="#" class="footer-link">REFUND & RETURN POLICY</a>
        <a href="#" class="footer-link">WARRANTY</a>
        <a href="#" class="footer-link">INSTALLATION GUIDELINES</a>
        <a href="#" class="footer-link">MEDIA</a>
        <a href="#" class="footer-link">COMMUNITY</a>
      </div>

      <div class="footer-section footer-social h-full flex items-center justify-center">
        <img :src="SOCIAL_MEDIA_ICONS" alt="Social Media" class="inline-block w-[207px] h-auto" />
      </div>

      <div class="footer-section footer-contact flex flex-col items-end text-end">
        <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank">
          <div class="footer-link flex items-start gap-4 text-16">
            <img :src="PIN_BLACK_ICON" alt="Location" class="w-6 h-auto mt-3 rotate-180 scale-y-[-1]" />
            <div>
              <p class="m-0">E5 WHEELS, LLC</p>
              <p class="m-0">3500 NW 77 CT</p>
              <p class="m-0">DORAL, FL 33122</p>
            </div>
          </div>
        </a>
        <div class="footer-link flex items-start gap-4 text-16">
          <img :src="PHONE_BLACK_ICON" alt="Phone" class="w-6 h-auto mt-3" />
          <p class="m-0">
            <a href="tel:(305)964-7429" target="_blank">(305)964-7429</a>
          </p>
        </div>
        <p class="text-16 m-0 footer-link">
          <a href="mailto:SALES@E5WHEELS.COM" target="_blank">SALES@E5WHEELS.COM</a>
        </p>
        <Button link="/general/contact">GET IN TOUCH</Button>
      </div>
    </div>

    <p class="footer-link text-16 text-center m-0 mt-12">
      © {{ new Date().getFullYear() }} COPYRIGHT E5 WHEELS, LLC
    </p>
  </footer>
</template>

<style scoped>
.footer-link {
  @apply font-sans text-16 text-black no-underline transition-opacity hover:opacity-70;
}

/* Tablet and Mobile Responsive Styles */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .footer-section {
    width: 100%;
  }

  .footer-links {
    order: 2;
    align-items: center;
    text-align: center;
  }

  .footer-social {
    order: 1;
    justify-content: center;
  }

  .footer-contact {
    order: 3;
    align-items: center;
    text-align: center;
  }

  .footer-contact > a,
  .footer-contact > div {
    align-items: center;
    justify-content: center;
  }

  .footer-logo {
    width: 50% !important;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .footer-logo {
    width: 60% !important;
  }

  .footer-social img {
    width: 160px !important;
  }

  .footer-link {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .footer-logo {
    width: 70% !important;
  }

  .footer-social img {
    width: 140px !important;
  }

  .footer-link {
    font-size: 13px;
  }

  .footer-grid {
    gap: 32px;
  }
}
</style>