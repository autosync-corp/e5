<script setup lang="ts">
import { computed } from 'vue';
import {
  E5_LOGO_BLACK,
  FACEBOOK_MEDIA_ICON,
  INSTAGRAM_MEDIA_ICON,
  PHONE_BLACK_ICON,
  PIN_BLACK_ICON,
  TIKTOK_MEDIA_ICON,
  YOUTUBE_MEDIA_ICON,
} from '@/core/constants/App.ts';
import {
  ABOUT_ROUTE,
  CATALOG_ROUTE,
  CONTACT_ROUTE,
  INSTALLATION_ROUTE,
  MEDIA_ROUTE,
  PRIVACY_ROUTE,
  PROCESS_ROUTE,
  REFUND_ROUTE,
  REGISTRATION_ROUTE,
  TERMS_ROUTE,
  VENDOR_REGISTRATION_ROUTE,
  WARRANTY_ROUTE,
} from '@/core/constants/Routes.ts';

const props = defineProps<{ variant?: string }>();

const variant = computed(() => {
  const v = (props.variant || 'a').toLowerCase();
  return v === 'b' || v === 'c' ? v : 'a';
});

const year = new Date().getFullYear();

const navLinks = [
  { href: PROCESS_ROUTE, label: 'OUR PROCESS' },
  { href: CONTACT_ROUTE, label: 'CONTACT US' },
  { href: '/events/upcoming', label: 'EVENTS' },
  { href: CATALOG_ROUTE, label: 'CATALOG' },
  { href: REFUND_ROUTE, label: 'RETURN POLICY' },
  { href: WARRANTY_ROUTE, label: 'WARRANTY' },
  { href: INSTALLATION_ROUTE, label: 'INSTALLATION GUIDELINES' },
  { href: REGISTRATION_ROUTE, label: 'WHEEL REGISTRATION' },
  { href: VENDOR_REGISTRATION_ROUTE, label: 'VENDOR REGISTRATION' },
  { href: MEDIA_ROUTE, label: 'MEDIA' },
  { href: ABOUT_ROUTE, label: 'ABOUT US' },
  { href: '/blog', label: 'BLOG' },
];

const exploreLinks = navLinks.slice(0, 4);
const supportLinks = navLinks.slice(4, 8);
const companyLinks = navLinks.slice(8, 12);

const socials = [
  { href: 'https://www.instagram.com/e5wheels/', label: 'E5 Wheels on Instagram', src: INSTAGRAM_MEDIA_ICON, alt: 'Instagram' },
  { href: 'https://www.facebook.com/e5wheels/', label: 'E5 Wheels on Facebook', src: FACEBOOK_MEDIA_ICON, alt: 'Facebook' },
  { href: 'https://www.youtube.com/@E5Wheels', label: 'E5 Wheels on YouTube', src: YOUTUBE_MEDIA_ICON, alt: 'YouTube' },
  { href: 'https://www.tiktok.com/@e5wheels', label: 'E5 Wheels on TikTok', src: TIKTOK_MEDIA_ICON, alt: 'TikTok' },
];
</script>

<template>
  <footer class="site-footer" :data-footer-variant="variant">
    <!-- A: compact single row — logo left, link columns center, contact/social right -->
    <div v-if="variant === 'a'" class="ft ft-a">
      <div class="ft-a-row">
        <div class="ft-brand">
          <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo" width="1191" height="101" />
        </div>
        <nav class="ft-cols" aria-label="Footer">
          <div class="ft-col">
            <a v-for="link in exploreLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
          <div class="ft-col">
            <a v-for="link in supportLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
          <div class="ft-col">
            <a v-for="link in companyLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
        </nav>
        <div class="ft-aside">
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
            <img :src="PIN_BLACK_ICON" alt="" class="ft-pin" width="22" height="22" />
            <span>
              E5 WHEELS, LLC<br />
              3500 NW 77 CT<br />
              DORAL, FL 33122
            </span>
          </a>
          <a href="tel:+13059647429" class="ft-link ft-inline">
            <img :src="PHONE_BLACK_ICON" alt="" width="22" height="22" />
            (305) 964-7429
          </a>
          <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
          <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
          <div class="ft-socials">
            <a v-for="s in socials" :key="s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
              <img :src="s.src" :alt="s.alt" width="48" height="48" />
            </a>
          </div>
        </div>
      </div>
      <div class="ft-legal">
        <a :href="TERMS_ROUTE" class="ft-link ft-legal-link">TERMS &amp; CONDITIONS</a>
        <span class="ft-sep" aria-hidden="true">|</span>
        <a :href="PRIVACY_ROUTE" class="ft-link ft-legal-link">PRIVACY POLICY</a>
        <span class="ft-copy">© {{ year }} COPYRIGHT E5 WHEELS, LLC</span>
      </div>
    </div>

    <!-- B: centered stacked minimal -->
    <div v-else-if="variant === 'b'" class="ft ft-b">
      <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo" width="1191" height="101" />
      <div class="ft-socials ft-socials-center">
        <a v-for="s in socials" :key="s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
          <img :src="s.src" :alt="s.alt" width="48" height="48" />
        </a>
      </div>
      <nav class="ft-wrap" aria-label="Footer">
        <a v-for="link in navLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
      </nav>
      <div class="ft-b-contact">
        <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact ft-contact-center">
          <img :src="PIN_BLACK_ICON" alt="" class="ft-pin" width="22" height="22" />
          <span>E5 WHEELS, LLC · 3500 NW 77 CT · DORAL, FL 33122</span>
        </a>
        <a href="tel:+13059647429" class="ft-link ft-inline">
          <img :src="PHONE_BLACK_ICON" alt="" width="22" height="22" />
          (305) 964-7429
        </a>
        <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
      </div>
      <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
      <div class="ft-legal ft-legal-center">
        <a :href="TERMS_ROUTE" class="ft-link ft-legal-link">TERMS &amp; CONDITIONS</a>
        <span class="ft-sep" aria-hidden="true">|</span>
        <a :href="PRIVACY_ROUTE" class="ft-link ft-legal-link">PRIVACY POLICY</a>
      </div>
      <p class="ft-copy">© {{ year }} COPYRIGHT E5 WHEELS, LLC</p>
    </div>

    <!-- C: two-tier dense grid + thin bottom bar -->
    <div v-else class="ft ft-c">
      <div class="ft-c-grid">
        <nav class="ft-c-links" aria-label="Footer">
          <div class="ft-col">
            <p class="ft-heading">EXPLORE</p>
            <a v-for="link in exploreLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
          <div class="ft-col">
            <p class="ft-heading">SUPPORT</p>
            <a v-for="link in supportLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
          <div class="ft-col">
            <p class="ft-heading">COMPANY</p>
            <a v-for="link in companyLinks" :key="link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
          </div>
          <div class="ft-col ft-c-contact">
            <p class="ft-heading">CONTACT</p>
            <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
              <img :src="PIN_BLACK_ICON" alt="" class="ft-pin" width="22" height="22" />
              <span>
                E5 WHEELS, LLC<br />
                3500 NW 77 CT<br />
                DORAL, FL 33122
              </span>
            </a>
            <a href="tel:+13059647429" class="ft-link ft-inline">
              <img :src="PHONE_BLACK_ICON" alt="" width="22" height="22" />
              (305) 964-7429
            </a>
            <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
            <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
          </div>
        </nav>
      </div>
      <div class="ft-c-bar">
        <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo ft-logo-sm" width="1191" height="101" />
        <div class="ft-legal">
          <a :href="TERMS_ROUTE" class="ft-link ft-legal-link">TERMS &amp; CONDITIONS</a>
          <span class="ft-sep" aria-hidden="true">|</span>
          <a :href="PRIVACY_ROUTE" class="ft-link ft-legal-link">PRIVACY POLICY</a>
          <span class="ft-copy">© {{ year }} COPYRIGHT E5 WHEELS, LLC</span>
        </div>
        <div class="ft-socials">
          <a v-for="s in socials" :key="s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
            <img :src="s.src" :alt="s.alt" width="48" height="48" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #ffffff;
  color: #141414;
  width: 100%;
  border-top: 4px solid var(--color-e5-red);
  font-family: 'Barlow Condensed', 'Franklin Gothic Demi', sans-serif;
  font-weight: 600;
}

.ft {
  max-width: 1518px;
  margin: 0 auto;
  padding: 28px 24px 16px;
}

.ft-logo {
  height: 33px;
  width: auto;
  display: block;
}

.ft-logo-sm {
  height: 28px;
}

.ft-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: #141414;
  text-decoration: none;
  font-size: 15px;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
  transition: color 150ms ease;
}

.ft-link:hover,
.ft-link:focus-visible {
  color: var(--color-e5-red);
}

.ft-legal-link {
  min-height: 44px;
}

.ft-inline {
  gap: 10px;
}

.ft-inline img {
  width: 22px;
  height: 22px;
}

.ft-contact {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #141414;
  text-decoration: none;
  font-size: 15px;
  letter-spacing: 0.08em;
  line-height: 1.35;
  text-transform: uppercase;
  min-height: 44px;
}

.ft-contact:hover,
.ft-contact:focus-visible {
  color: var(--color-e5-red);
}

.ft-pin {
  width: 22px;
  height: auto;
  margin-top: 2px;
  transform: rotate(180deg) scaleY(-1);
}

.ft-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 22px;
  background: var(--color-e5-red);
  color: #ffffff;
  font-size: 14px;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
  transition: background 150ms ease;
}

.ft-cta:hover,
.ft-cta:focus-visible {
  background: #b3181f;
}

.ft-socials {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ft-socials-center {
  justify-content: center;
}

.ft-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.ft-social img {
  width: 36px;
  height: 36px;
}

.ft-social:hover,
.ft-social:focus-visible {
  opacity: 0.7;
}

.ft-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-e5-separator);
}

.ft-legal-center {
  justify-content: center;
}

.ft-sep {
  color: #333333;
}

.ft-copy {
  margin: 0 0 0 auto;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #141414;
}

.ft-heading {
  margin: 0 0 4px;
  color: var(--color-e5-red);
  font-size: 13px;
  letter-spacing: 0.18em;
  min-height: 24px;
}

.ft-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* A */
.ft-a-row {
  display: grid;
  grid-template-columns: 180px 1fr 260px;
  gap: 32px 40px;
  align-items: start;
}

.ft-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 24px;
}

.ft-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

/* B */
.ft-b {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.ft-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 8px;
  max-width: 920px;
}

.ft-wrap .ft-link {
  padding: 0 12px;
}

.ft-b-contact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.ft-contact-center {
  justify-content: center;
  text-align: center;
}

.ft-b .ft-copy {
  margin: 8px 0 0;
}

/* C */
.ft-c {
  padding-bottom: 0;
}

.ft-c-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 32px;
}

.ft-c-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0 14px;
  border-top: 3px solid var(--color-e5-red);
}

.ft-c-bar .ft-legal {
  margin: 0;
  padding: 0;
  border: 0;
  justify-content: center;
}

.ft-c-bar .ft-copy {
  margin-left: 16px;
}

@media (max-width: 1024px) {
  .ft-a-row,
  .ft-c-links,
  .ft-c-bar {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .ft-cols {
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }

  .ft-a .ft-cols .ft-col {
    display: contents;
  }

  .ft-col,
  .ft-aside,
  .ft-brand {
    align-items: center;
  }

  .ft-contact {
    justify-content: center;
    text-align: center;
  }

  .ft-copy {
    margin: 0;
    width: 100%;
    text-align: center;
  }

  .ft-legal {
    justify-content: center;
  }

  .ft-c-bar .ft-copy {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .ft {
    padding: 20px 16px 12px;
  }

  .ft-cols {
    gap: 0 12px;
  }

  .ft-link,
  .ft-contact {
    font-size: 14px;
  }

  .ft-c-links {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
