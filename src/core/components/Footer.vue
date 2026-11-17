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

const exploreLinks = [
  { href: PROCESS_ROUTE, label: 'OUR PROCESS' },
  { href: CONTACT_ROUTE, label: 'CONTACT US' },
  { href: '/events/upcoming', label: 'EVENTS' },
  { href: CATALOG_ROUTE, label: 'CATALOG' },
];
const supportLinks = [
  { href: REFUND_ROUTE, label: 'RETURN POLICY' },
  { href: WARRANTY_ROUTE, label: 'WARRANTY' },
  { href: INSTALLATION_ROUTE, label: 'INSTALLATION GUIDELINES' },
  { href: REGISTRATION_ROUTE, label: 'WHEEL REGISTRATION' },
];
const companyLinks = [
  { href: VENDOR_REGISTRATION_ROUTE, label: 'VENDOR REGISTRATION' },
  { href: MEDIA_ROUTE, label: 'MEDIA' },
  { href: ABOUT_ROUTE, label: 'ABOUT US' },
  { href: '/blog', label: 'BLOG' },
];
const navLinks = [...exploreLinks, ...supportLinks, ...companyLinks];

const socials = [
  { href: 'https://www.instagram.com/e5wheels/', label: 'E5 Wheels on Instagram', src: INSTAGRAM_MEDIA_ICON, alt: 'Instagram' },
  { href: 'https://www.facebook.com/e5wheels/', label: 'E5 Wheels on Facebook', src: FACEBOOK_MEDIA_ICON, alt: 'Facebook' },
  { href: 'https://www.youtube.com/@E5Wheels', label: 'E5 Wheels on YouTube', src: YOUTUBE_MEDIA_ICON, alt: 'YouTube' },
  { href: 'https://www.tiktok.com/@e5wheels', label: 'E5 Wheels on TikTok', src: TIKTOK_MEDIA_ICON, alt: 'TikTok' },
];
</script>

<template>
  <footer class="site-footer" :data-footer-variant="variant">
    <!-- A: BMW / Lucid / Porsche OEM sitemap -->
    <div v-if="variant === 'a'" class="ft ft-a">
      <nav class="col-grid desktop-only" aria-label="Footer">
        <div class="col">
          <p class="ft-label">Explore</p>
          <a v-for="link in exploreLinks" :key="'ad-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Support</p>
          <a v-for="link in supportLinks" :key="'ad-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Company</p>
          <a v-for="link in companyLinks" :key="'ad-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Contact</p>
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
            <img :src="PIN_BLACK_ICON" alt="" class="ft-icon ft-pin" width="22" height="22" />
            <span>E5 WHEELS, LLC<br />3500 NW 77 CT<br />DORAL, FL 33122</span>
          </a>
          <a href="tel:+13059647429" class="ft-link ft-icon-link">
            <img :src="PHONE_BLACK_ICON" alt="" class="ft-icon" width="22" height="22" />
            (305) 964-7429
          </a>
          <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
          <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
        </div>
      </nav>
      <nav class="mobile-only" aria-label="Footer">
        <details class="acc">
          <summary class="ft-label">Explore</summary>
          <a v-for="link in exploreLinks" :key="'am-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Support</summary>
          <a v-for="link in supportLinks" :key="'am-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Company</summary>
          <a v-for="link in companyLinks" :key="'am-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc" open>
          <summary class="ft-label">Contact</summary>
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
            <img :src="PIN_BLACK_ICON" alt="" class="ft-icon ft-pin" width="22" height="22" />
            <span>E5 WHEELS, LLC<br />3500 NW 77 CT<br />DORAL, FL 33122</span>
          </a>
          <a href="tel:+13059647429" class="ft-link ft-icon-link">
            <img :src="PHONE_BLACK_ICON" alt="" class="ft-icon" width="22" height="22" />
            (305) 964-7429
          </a>
          <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
          <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
        </details>
      </nav>
      <div class="oem-bar">
        <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo" width="1191" height="101" />
        <div class="oem-legal">
          <a :href="TERMS_ROUTE" class="ft-legal">TERMS &amp; CONDITIONS</a>
          <a :href="PRIVACY_ROUTE" class="ft-legal">PRIVACY POLICY</a>
          <span class="ft-copy">© {{ year }} COPYRIGHT E5 WHEELS, LLC</span>
        </div>
        <div class="ft-socials">
          <a v-for="s in socials" :key="'a-'+s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
            <img :src="s.src" :alt="s.alt" width="48" height="48" />
          </a>
        </div>
      </div>
    </div>

    <!-- B: Tesla / Rivian ultra-minimal -->
    <div v-else-if="variant === 'b'" class="ft ft-b">
      <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo ft-logo-center" width="1191" height="101" />
      <nav class="tesla-links" aria-label="Footer">
        <a v-for="link in navLinks" :key="'b-'+link.href" :href="link.href" class="ft-link tesla-link">{{ link.label }}</a>
      </nav>
      <div class="tesla-contact">
        <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-legal">
          E5 WHEELS, LLC · 3500 NW 77 CT · DORAL, FL 33122
        </a>
        <a href="tel:+13059647429" class="ft-legal">(305) 964-7429</a>
        <a href="mailto:SALES@E5WHEELS.COM" class="ft-legal">SALES@E5WHEELS.COM</a>
        <a :href="CONTACT_ROUTE" class="ft-legal tesla-cta">GET IN TOUCH</a>
      </div>
      <div class="ft-socials ft-socials-center">
        <a v-for="s in socials" :key="'b-'+s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
          <img :src="s.src" :alt="s.alt" width="48" height="48" />
        </a>
      </div>
      <p class="tesla-legal">
        <span>© {{ year }} COPYRIGHT E5 WHEELS, LLC</span>
        <a :href="TERMS_ROUTE">TERMS &amp; CONDITIONS</a>
        <a :href="PRIVACY_ROUTE">PRIVACY POLICY</a>
      </p>
    </div>

    <!-- C: Vossen / HRE wheel-brand -->
    <div v-else class="ft ft-c">
      <div class="vossen-top">
        <div class="ft-socials">
          <a v-for="s in socials" :key="'c-'+s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
            <img :src="s.src" :alt="s.alt" width="48" height="48" />
          </a>
        </div>
        <img :src="E5_LOGO_BLACK" alt="E5 Wheels" class="ft-logo ft-logo-center" width="1191" height="101" />
        <a :href="CONTACT_ROUTE" class="ft-cta ft-cta-outline">GET IN TOUCH</a>
      </div>
      <nav class="col-grid desktop-only" aria-label="Footer">
        <div class="col">
          <p class="ft-label">Explore</p>
          <a v-for="link in exploreLinks" :key="'cd-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Support</p>
          <a v-for="link in supportLinks" :key="'cd-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Company</p>
          <a v-for="link in companyLinks" :key="'cd-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Contact</p>
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
            <img :src="PIN_BLACK_ICON" alt="" class="ft-icon ft-pin" width="22" height="22" />
            <span>E5 WHEELS, LLC<br />3500 NW 77 CT<br />DORAL, FL 33122</span>
          </a>
          <a href="tel:+13059647429" class="ft-link ft-icon-link">
            <img :src="PHONE_BLACK_ICON" alt="" class="ft-icon" width="22" height="22" />
            (305) 964-7429
          </a>
          <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
        </div>
      </nav>
      <nav class="mobile-only" aria-label="Footer">
        <details class="acc">
          <summary class="ft-label">Explore</summary>
          <a v-for="link in exploreLinks" :key="'cm-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Support</summary>
          <a v-for="link in supportLinks" :key="'cm-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Company</summary>
          <a v-for="link in companyLinks" :key="'cm-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc" open>
          <summary class="ft-label">Contact</summary>
          <a href="https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8" target="_blank" rel="noopener noreferrer" class="ft-contact">
            <img :src="PIN_BLACK_ICON" alt="" class="ft-icon ft-pin" width="22" height="22" />
            <span>E5 WHEELS, LLC<br />3500 NW 77 CT<br />DORAL, FL 33122</span>
          </a>
          <a href="tel:+13059647429" class="ft-link ft-icon-link">
            <img :src="PHONE_BLACK_ICON" alt="" class="ft-icon" width="22" height="22" />
            (305) 964-7429
          </a>
          <a href="mailto:SALES@E5WHEELS.COM" class="ft-link">SALES@E5WHEELS.COM</a>
        </details>
      </nav>
      <div class="vossen-legal">
        <a :href="TERMS_ROUTE" class="ft-legal">TERMS &amp; CONDITIONS</a>
        <span aria-hidden="true">|</span>
        <a :href="PRIVACY_ROUTE" class="ft-legal">PRIVACY POLICY</a>
        <span class="ft-copy">© {{ year }} COPYRIGHT E5 WHEELS, LLC</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #ffffff;
  color: #141414;
  width: 100%;
  border-top: 1px solid #e6e6e6;
  font-family: Oswald, 'Franklin Gothic Demi', sans-serif;
  font-weight: 500;
}

.ft {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 32px 20px;
}

.ft-logo {
  display: block;
  height: 28px;
  width: auto;
  max-width: none;
  aspect-ratio: 1191 / 101;
  object-fit: contain;
  object-position: left center;
  flex: 0 0 auto;
}

.ft-logo-center {
  object-position: center;
  margin-inline: auto;
}

.ft-link,
.ft-legal,
.ft-contact,
.tesla-legal a {
  color: #141414;
  text-decoration: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ft-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-size: 13px;
  line-height: 1.25;
}

.ft-link:hover,
.ft-link:focus-visible,
.ft-legal:hover,
.ft-legal:focus-visible,
.ft-contact:hover,
.ft-contact:focus-visible,
.tesla-legal a:hover,
.tesla-legal a:focus-visible {
  color: var(--color-e5-red);
}

.ft-legal {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 12px;
}

.ft-contact {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 44px;
  font-size: 13px;
  line-height: 1.4;
  margin: 4px 0 8px;
}

.ft-icon {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex: 0 0 auto;
}

.ft-pin {
  transform: rotate(180deg) scaleY(-1);
}

.ft-icon-link {
  gap: 10px;
}

.ft-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 20px;
  margin-top: 10px;
  background: var(--color-e5-red);
  color: #ffffff;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-decoration: none;
  text-transform: uppercase;
  width: fit-content;
}

.ft-cta:hover,
.ft-cta:focus-visible {
  background: #b3181f;
}

.ft-cta-outline {
  background: transparent;
  color: #141414;
  border: 1px solid #141414;
  margin-top: 0;
}

.ft-cta-outline:hover,
.ft-cta-outline:focus-visible {
  background: var(--color-e5-red);
  border-color: var(--color-e5-red);
  color: #ffffff;
}

.ft-socials {
  display: flex;
  align-items: center;
  gap: 4px;
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
}

.ft-social img {
  width: 28px;
  height: 28px;
}

.ft-copy {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #333333;
}

.ft-label {
  list-style: none;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4a4a4a;
  min-height: 28px;
  display: flex;
  align-items: center;
  margin: 0 0 8px;
}

.acc .ft-label {
  min-height: 44px;
  cursor: pointer;
  margin: 0;
}

.acc .ft-label::-webkit-details-marker {
  display: none;
}

.col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.col-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 40px;
}

.mobile-only {
  display: none;
}

.oem-bar {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid #e6e6e6;
}

.oem-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  flex: 1;
}

.oem-bar .ft-socials {
  margin-left: auto;
}

.ft-b {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 48px;
  padding-bottom: 28px;
  gap: 8px;
}

.tesla-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 4px;
  max-width: 980px;
  margin-top: 12px;
}

.tesla-link {
  display: inline-flex;
  padding: 0 10px;
  font-size: 12px;
  letter-spacing: 0.06em;
}

.tesla-contact {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 18px;
  margin-top: 8px;
}

.tesla-cta {
  color: var(--color-e5-red);
}

.tesla-legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px 18px;
  margin: 16px 0 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: #333333;
}

.tesla-legal a,
.tesla-legal span {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.vossen-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding-bottom: 22px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e6e6e6;
}

.vossen-top .ft-cta {
  justify-self: end;
}

.vossen-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e6e6e6;
}

.acc {
  width: 100%;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.acc .ft-link,
.acc .ft-contact,
.acc .ft-cta {
  margin-left: 2px;
}

@media (min-width: 1024px) {
  .ft-link {
    min-height: 30px;
  }
}

@media (max-width: 1023px) {
  .ft {
    padding: 24px 20px 16px;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .oem-bar,
  .vossen-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .vossen-top .ft-cta,
  .oem-bar .ft-socials {
    margin-left: 0;
    justify-self: center;
  }

  .ft-logo {
    height: 24px;
  }

  .tesla-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    max-width: none;
    gap: 0;
  }

  .tesla-link {
    justify-content: center;
    padding: 0 8px;
  }

  .oem-legal,
  .vossen-legal {
    justify-content: center;
  }
}
</style>
