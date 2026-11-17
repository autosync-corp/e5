<script setup lang="ts">
import {
  E5_LOGO_BLACK_PNG,
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

const socials = [
  { href: 'https://www.instagram.com/e5wheels/', label: 'E5 Wheels on Instagram', src: INSTAGRAM_MEDIA_ICON, alt: 'Instagram' },
  { href: 'https://www.facebook.com/e5wheels/', label: 'E5 Wheels on Facebook', src: FACEBOOK_MEDIA_ICON, alt: 'Facebook' },
  { href: 'https://www.youtube.com/@E5Wheels', label: 'E5 Wheels on YouTube', src: YOUTUBE_MEDIA_ICON, alt: 'YouTube' },
  { href: 'https://www.tiktok.com/@e5wheels', label: 'E5 Wheels on TikTok', src: TIKTOK_MEDIA_ICON, alt: 'TikTok' },
];
</script>

<template>
  <footer class="site-footer">
    <div class="ft">
      <div class="vossen-top">
        <div class="ft-socials">
          <a v-for="s in socials" :key="s.href" :href="s.href" target="_blank" rel="noopener" :aria-label="s.label" class="ft-social">
            <img :src="s.src" :alt="s.alt" width="48" height="48" />
          </a>
        </div>
        <img :src="E5_LOGO_BLACK_PNG" alt="E5 Wheels" class="ft-logo" width="1191" height="101" />
        <a :href="CONTACT_ROUTE" class="ft-cta">GET IN TOUCH</a>
      </div>

      <nav class="col-grid" aria-label="Footer">
        <div class="col">
          <p class="ft-label">Explore</p>
          <a v-for="link in exploreLinks" :key="'d-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Support</p>
          <a v-for="link in supportLinks" :key="'d-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </div>
        <div class="col">
          <p class="ft-label">Company</p>
          <a v-for="link in companyLinks" :key="'d-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
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

      <nav class="acc-nav" aria-label="Footer">
        <details class="acc">
          <summary class="ft-label">Explore</summary>
          <a v-for="link in exploreLinks" :key="'m-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Support</summary>
          <a v-for="link in supportLinks" :key="'m-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc">
          <summary class="ft-label">Company</summary>
          <a v-for="link in companyLinks" :key="'m-'+link.href" :href="link.href" class="ft-link">{{ link.label }}</a>
        </details>
        <details class="acc" data-contact>
          <summary class="ft-label">Contact</summary>
          <div class="acc-contact">
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
        </details>
      </nav>

      <div class="legal">
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
  background-color: #ffffff;
  color: #141414;
  width: 100%;
  border-top: 1px solid #e6e6e6;
  font-family: Oswald, 'Franklin Gothic Demi', sans-serif;
  font-weight: 500;
  color-scheme: only light;
}

.ft {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 32px 20px;
}

.ft-logo {
  display: block;
  height: 28px;
  width: calc(28px * 1191 / 101);
  max-width: 100%;
  min-width: 0;
  aspect-ratio: 1191 / 101;
  object-fit: contain;
  object-position: center;
  flex: 0 0 auto;
}

.ft-link,
.ft-legal,
.ft-contact {
  color: #141414;
  text-decoration: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ft-link {
  display: flex;
  align-items: center;
  min-height: 30px;
  font-size: 13px;
  line-height: 1.25;
}

.ft-link:hover,
.ft-link:focus-visible,
.ft-legal:hover,
.ft-legal:focus-visible,
.ft-contact:hover,
.ft-contact:focus-visible {
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
  background: transparent;
  color: #141414;
  border: 1px solid #141414;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-decoration: none;
  text-transform: uppercase;
  width: fit-content;
  justify-self: end;
}

.ft-cta:hover,
.ft-cta:focus-visible {
  background: var(--color-e5-red);
  border-color: var(--color-e5-red);
  color: #ffffff;
}

.ft-socials {
  display: flex;
  align-items: center;
  gap: 4px;
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
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4a4a4a;
  min-height: 28px;
  display: flex;
  align-items: center;
  margin: 0 0 8px;
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

.acc-nav {
  display: none;
}

.vossen-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding-bottom: 22px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e6e6e6;
}

.legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e6e6e6;
}

/* Mobile only. Tablet 768–1023 keeps the desktop C layout. */
@media (max-width: 767px) {
  .ft {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px 8px;
  }

  .col-grid {
    display: none;
  }

  .vossen-top {
    display: contents;
  }

  .ft-logo {
    order: 1;
    height: 24px;
    width: calc(24px * 1191 / 101);
    margin: 4px 0 8px;
  }

  .ft-cta {
    order: 2;
    margin: 0 0 8px;
    justify-self: center;
  }

  .acc-nav {
    display: block;
    order: 3;
    width: 100%;
    border-top: 1px solid #e6e6e6;
  }

  .legal {
    order: 4;
    width: 100%;
    gap: 0 10px;
    margin-top: 12px;
    padding-top: 0;
    border-top: 0;
  }

  .ft-socials {
    order: 5;
    margin-top: 8px;
  }

  .ft-label {
    margin: 0;
  }

  .acc {
    margin: 0;
    padding: 0;
    border-bottom: 1px solid #e6e6e6;
  }

  .acc .ft-label {
    list-style: none;
    height: 44px;
    min-height: 44px;
    padding: 0;
    margin: 0;
    cursor: pointer;
    box-sizing: border-box;
  }

  .acc .ft-label::-webkit-details-marker {
    display: none;
  }

  .acc .ft-link {
    min-height: 44px;
    padding: 0 2px;
  }

  .acc-contact {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 2px 8px;
  }

  .acc-contact .ft-contact,
  .acc-contact .ft-link {
    position: relative;
    margin: 0;
    min-height: 0;
    padding: 2px 0;
  }

  .acc-contact .ft-contact {
    line-height: 1.25;
    gap: 8px;
  }

  .acc-contact .ft-contact::after,
  .acc-contact .ft-link::after {
    content: '';
    position: absolute;
    left: -8px;
    right: -8px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }

  .legal .ft-legal {
    min-height: 44px;
  }

  .ft-copy {
    flex-basis: 100%;
    text-align: center;
    padding: 4px 0 0;
  }
}
</style>
