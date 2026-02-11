<script setup lang="ts">
import {
  E5_LOGO_BLACK,
  FACEBOOK_MEDIA_ICON,
  INSTAGRAM_MEDIA_ICON,
  PHONE_BLACK_ICON,
  PIN_BLACK_ICON, TIKTOK_MEDIA_ICON, YOUTUBE_MEDIA_ICON
} from "@/core/constants/App.ts";
import {
  ABOUT_ROUTE,
  CONTACT_ROUTE,
  INSTALLATION_ROUTE, MEDIA_ROUTE,
  PROCESS_ROUTE,
  REFUND_ROUTE, REGISTRATION_ROUTE, VENDOR_REGISTRATION_ROUTE,
  WARRANTY_ROUTE
} from "@/core/constants/Routes.ts";
</script>

<template>
  <footer class="bg-e5-red w-full py-6 px-6">
    <div class="max-w-[1518px] mx-auto">
      <!-- Main Footer Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-12 items-start mb-6">
        <!-- Left: Links -->
        <div class="footer-links flex flex-col space-y-2">
          <a :href="PROCESS_ROUTE" class="footer-link">OUR PROCESS</a>
          <a :href="CONTACT_ROUTE" class="footer-link">CONTACT US</a>
          <a :href="REFUND_ROUTE" class="footer-link">RETURN POLICY</a>
          <a :href="WARRANTY_ROUTE" class="footer-link">WARRANTY</a>
          <a :href="INSTALLATION_ROUTE" class="footer-link">INSTALLATION GUIDELINES</a>
          <a :href="REGISTRATION_ROUTE" class="footer-link">WHEEL REGISTRATION</a>
          <a :href="VENDOR_REGISTRATION_ROUTE" class="footer-link">VENDOR REGISTRATION</a>
          <a :href="MEDIA_ROUTE" class="footer-link">MEDIA</a>
          <a :href="ABOUT_ROUTE" class="footer-link">ABOUT US</a>
        </div>

        <!-- Center: Logo + Social -->
        <div class="footer-center flex flex-col items-center space-y-4">
          <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="h-[33px] w-auto" />

          <!-- Social Icons -->
          <div class="flex items-center justify-center gap-4">
            <a href="https://www.instagram.com/e5wheels/" target="_blank" class="cursor-pointer hover:opacity-70 transition-opacity">
              <img :src="INSTAGRAM_MEDIA_ICON" alt="Instagram" class="w-12 h-12" />
            </a>
            <a href="https://www.facebook.com/e5wheels/" target="_blank" class="cursor-pointer hover:opacity-70 transition-opacity">
              <img :src="FACEBOOK_MEDIA_ICON" alt="Facebook" class="w-12 h-12" />
            </a>
            <a href="https://www.youtube.com/@E5Wheels" target="_blank" class="cursor-pointer hover:opacity-70 transition-opacity">
              <img :src="YOUTUBE_MEDIA_ICON" alt="Youtube" class="w-12 h-12" />
            </a>
            <a href="https://www.tiktok.com/@e5wheels" target="_blank" class="cursor-pointer hover:opacity-70 transition-opacity">
              <img :src="TIKTOK_MEDIA_ICON" alt="Tiktok" class="w-12 h-12" />
            </a>
          </div>
        </div>

        <!-- Right: Contact Info -->
        <div class="footer-contact flex flex-col items-end text-right space-y-2">
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" class="footer-link flex items-start gap-3 justify-end">
            <img :src="PIN_BLACK_ICON" alt="Location" class="w-[22px] h-auto mt-1 rotate-180 scale-y-[-1]" />
            <div>
              <p class="m-0">E5 WHEELS, LLC</p>
              <p class="m-0">3500 NW 77 CT</p>
              <p class="m-0">DORAL, FL 33122</p>
            </div>
          </a>

          <a href="tel:(305)964-7429" target="_blank" class="footer-link flex items-center gap-3 justify-end">
            <img :src="PHONE_BLACK_ICON" alt="Phone" class="w-[27px] h-auto" />
            <span>(305)964-7429</span>
          </a>

          <a href="mailto:SALES@E5WHEELS.COM" target="_blank" class="footer-link">
            SALES@E5WHEELS.COM
          </a>

          <!-- Get In Touch Button -->
          <a :href="CONTACT_ROUTE" class="mt-2 bg-black text-white px-8 py-2 text-[14px] tracking-[5.6px] hover:bg-black/90 transition-colors inline-block">
            GET IN TOUCH
          </a>
        </div>
      </div>

      <!-- Copyright -->
      <p class="text-[16px] tracking-[6.4px] text-black text-center m-0">
        © {{ new Date().getFullYear() }} COPYRIGHT E5 WHEELS, LLC
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  @apply text-[16px] leading-[24px] tracking-[6.4px] text-black no-underline transition-opacity hover:opacity-70;
}

/* Tablet and Mobile Responsive Styles */
@media (max-width: 1024px) {
  .footer-links {
    align-items: center;
    text-align: center;
  }

  .footer-center {
    order: -1;
  }

  .footer-contact {
    align-items: center;
    text-align: center;
  }

  .footer-contact > a {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .footer-link {
    font-size: 14px;
    letter-spacing: 4px;
  }
}
</style>