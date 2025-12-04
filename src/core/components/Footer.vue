<script setup lang="ts">
import Button from "@/core/components/Button.vue";
import {
  E5_LOGO_BLACK,
  FACEBOOK_MEDIA_ICON,
  INSTAGRAM_MEDIA_ICON,
  PHONE_BLACK_ICON,
  PIN_BLACK_ICON, TIKTOK_MEDIA_ICON, YOUTUBE_MEDIA_ICON
} from "@/core/constants/App.ts";
import {
  CONTACT_ROUTE,
  INSTALLATION_ROUTE, MEDIA_ROUTE,
  PROCESS_ROUTE,
  REFUND_ROUTE, REGISTRATION_ROUTE,
  WARRANTY_ROUTE
} from "@/core/constants/Routes.ts";
</script>

<template>
  <footer class="container-e5 bg-e5-red font-medium text-black w-full py-10 md:py-20 px-6">
    <div class="flex justify-center mb-10 md:mb-20">
      <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="footer-logo w-1/4 h-auto" />
    </div>

    <div class="footer-grid grid grid-cols-[1fr_auto_1fr] items-start justify-between gap-2 md:gap-8">
      <div class="footer-section footer-links flex flex-col">
        <a :href="PROCESS_ROUTE" class="footer-link">PROCESS</a>
        <a :href="CONTACT_ROUTE" class="footer-link">CONTACT</a>
        <a :href="REFUND_ROUTE" class="footer-link">REFUND & RETURN POLICY</a>
        <a :href="WARRANTY_ROUTE" class="footer-link">WARRANTY</a>
        <a :href="INSTALLATION_ROUTE" class="footer-link">INSTALLATION</a>
        <a :href="MEDIA_ROUTE" class="footer-link">MEDIA</a>
        <a :href="REGISTRATION_ROUTE" class="footer-link">REGISTRATION</a>
      </div>

      <div class="footer-section footer-social h-full flex items-center justify-center">
        <a href="https://www.instagram.com/e5wheels/" target="_blank" class="cursor-pointer">
          <img :src="INSTAGRAM_MEDIA_ICON" alt="Instagram" class="inline-block max-w-[70px] h-auto px-1" />
        </a>
        <a href="https://www.facebook.com/e5wheels/" target="_blank" class="cursor-pointer">
          <img :src="FACEBOOK_MEDIA_ICON" alt="Facebook" class="inline-block max-w-[70px] h-auto px-1" />
        </a>
        <a href="www.youtube.com/@E5Wheels" target="_blank" class="cursor-pointer">
          <img :src="YOUTUBE_MEDIA_ICON" alt="Youtube" class="inline-block max-w-[70px] h-auto px-1" />
        </a>
        <a href="https://www.tiktok.com/@e5wheels" target="_blank" class="cursor-pointer">
          <img :src="TIKTOK_MEDIA_ICON" alt="Tiktok" class="inline-block max-w-[70px] h-auto px-1" />
        </a>
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
        <Button :link="CONTACT_ROUTE">GET IN TOUCH</Button>
      </div>
    </div>

    <p class="footer-link text-16 text-center m-0 mt-12">
      © {{ new Date().getFullYear() }} COPYRIGHT E5 WHEELS, LLC
    </p>
  </footer>
</template>

<style scoped>
.footer-link {
  @apply font-sans text-16 leading-10 md:leading-[48px] text-black no-underline transition-opacity hover:opacity-70;
}

/* Tablet and Mobile Responsive Styles */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr;
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
}
</style>