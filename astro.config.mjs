import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { getSitemapLastmod } from './src/core/constants/sitemapLastmod.ts';
import { SITE_URL } from './src/core/constants/Site.ts';

const seenSitemapUrls = new Set();

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  trailingSlash: 'ignore',
  adapter: vercel(),
  integrations: [
    vue(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => {
        const path = (page.replace(SITE_URL, '') || '/').replace(/\/+$/, '') || '/';
        const excludedPrefixes = [
          '/admin',
          '/checkout',
          '/pending',
          '/visualize-test',
          '/visualizer-callback',
          '/shop/single-product',
          '/request-quote',
        ];
        const excludedExact = ['/order-success', '/registration', '/404'];
        if (excludedExact.includes(path) || excludedPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) {
          return false;
        }
        // Finish-only shop URLs belong in customPages; drop series hubs and fitment variants.
        if (path.startsWith('/shop/')) {
          const parts = path.split('/').filter(Boolean);
          if (parts.length !== 3) return false;
        }
        return true;
      },
      customPages: [
        `${SITE_URL}/shop`,
        // Blog pages (WordPress headless — SSR routes not auto-discovered)
        `${SITE_URL}/blog`,
        `${SITE_URL}/blog/cracked-oem-c7-corvette-wheels`,
        `${SITE_URL}/blog/revamp-your-ride-e5-custom-wheels-for-your-c7-corvette`,
        `${SITE_URL}/blog/e5-wheels-at-corvettes-at-carlisle-2025`,
        `${SITE_URL}/blog/c6-corvette-aftermarket-wheels-personalize-your-ride`,
        `${SITE_URL}/e5-visualizer`,
        // Shop finish pages from the official price file, plus live extra finishes already 200.
        `${SITE_URL}/shop/daytona/gloss-black`,
        `${SITE_URL}/shop/daytona/titanium-brushed`,
        `${SITE_URL}/shop/daytona/titanium-gray-brushed`,
        `${SITE_URL}/shop/daytona/bronze-brushed-tint`,
        `${SITE_URL}/shop/daytona/chrome`,
        `${SITE_URL}/shop/sebring/gloss-black`,
        `${SITE_URL}/shop/sebring/titanium-brushed`,
        `${SITE_URL}/shop/sebring/titanium-gray-brushed`,
        `${SITE_URL}/shop/sebring/bronze-brushed-tint`,
        `${SITE_URL}/shop/sebring/chrome`,
        `${SITE_URL}/shop/sebring-2p/gloss-black`,
        `${SITE_URL}/shop/sebring-2p/gloss-black-polished-lip`,
        `${SITE_URL}/shop/sebring-2p/bronze-black-lip`,
        `${SITE_URL}/shop/sebring-2p/bronze-polished-lip`,
        `${SITE_URL}/shop/sebring-2p/gray-black-lip`,
        `${SITE_URL}/shop/sebring-2p/titanium-black-lip`,
        `${SITE_URL}/shop/sebring-2p/titanium-polished-lip`,
        `${SITE_URL}/shop/speedway/gloss-black`,
        `${SITE_URL}/shop/speedway/titanium-brushed`,
        `${SITE_URL}/shop/speedway/titanium-brushed-tint`,
        `${SITE_URL}/shop/speedway/dark-bronze`,
        `${SITE_URL}/shop/speedway/chrome`,
        `${SITE_URL}/shop/talladega/brushed-aluminum`,
        `${SITE_URL}/shop/talladega/gloss-black`,
        `${SITE_URL}/shop/talladega/polished`,
        `${SITE_URL}/shop/talladega/satin-black`,
        `${SITE_URL}/shop/sonoma/brushed-aluminum`,
        `${SITE_URL}/shop/sonoma/gloss-black`,
        `${SITE_URL}/shop/sonoma/polished`,
        `${SITE_URL}/shop/sonoma/satin-black`,
        `${SITE_URL}/shop/laguna/brushed-aluminum`,
        `${SITE_URL}/shop/laguna/gloss-black`,
        `${SITE_URL}/shop/laguna/polished`,
        `${SITE_URL}/shop/laguna/satin-black`,
        `${SITE_URL}/shop/gt01/brushed-aluminum`,
        `${SITE_URL}/shop/gt02/brushed-aluminum`,
        `${SITE_URL}/shop/gt02/gloss-black`,
        `${SITE_URL}/shop/gt02/satin-black`,
        `${SITE_URL}/shop/gt03/brushed-aluminum`,
        `${SITE_URL}/shop/gt03/gloss-black`,
        `${SITE_URL}/shop/gt03/satin-black`,
        `${SITE_URL}/shop/gt04/brushed-aluminum`,
        `${SITE_URL}/shop/gt04/gloss-black`,
        `${SITE_URL}/shop/gt04/satin-black`,
        // Generation model pages (SSR routes not auto-discovered)
        `${SITE_URL}/generations/c5/c5-base`,
        `${SITE_URL}/generations/c6/c6-z06`,
        `${SITE_URL}/generations/c6/c6-zr1`,
        `${SITE_URL}/generations/c7/c7-zr1`,
        // GT Forged model pages (SSR routes)
        `${SITE_URL}/wheels/gt-01`,
        `${SITE_URL}/wheels/gt-02`,
        `${SITE_URL}/wheels/gt-03`,
        `${SITE_URL}/wheels/gt-04`,
      ],
      serialize(item) {
        // Strip trailing slashes to match canonical URLs (keep root slash)
        if (item.url.endsWith('/') && item.url !== `${SITE_URL}/`) {
          item.url = item.url.slice(0, -1);
        }
        if (seenSitemapUrls.has(item.url)) return undefined;
        seenSitemapUrls.add(item.url);
        const lastmod = getSitemapLastmod(item.url);
        if (lastmod) {
          item.lastmod = lastmod;
        } else {
          delete item.lastmod;
        }
        return item;
      },
    }),
  ],
  redirects: {
    // Blog listing
    '/category/blog': '/blog',
    '/category/blog/': '/blog',

    // Old blog post URLs → new WordPress blog post URLs
    '/cracked_c7_corvette_wheels': '/blog/cracked-oem-c7-corvette-wheels',
    '/cracked_c7_corvette_wheels/': '/blog/cracked-oem-c7-corvette-wheels',
    '/e5-custom-wheels-for-your-c7-corvette': '/blog/revamp-your-ride-e5-custom-wheels-for-your-c7-corvette',
    '/e5-custom-wheels-for-your-c7-corvette/': '/blog/revamp-your-ride-e5-custom-wheels-for-your-c7-corvette',
    '/e5-wheels-at-corvettes-at-carlisle-2025-the-corvette-event-of-the-year': '/blog/e5-wheels-at-corvettes-at-carlisle-2025',
    '/e5-wheels-at-corvettes-at-carlisle-2025-the-corvette-event-of-the-year/': '/blog/e5-wheels-at-corvettes-at-carlisle-2025',
    '/elevate-your-c6-corvette-personalize-your-c6-with-aftermarket-rims-from-e5wheels-com': '/blog/c6-corvette-aftermarket-wheels-personalize-your-ride',
    '/elevate-your-c6-corvette-personalize-your-c6-with-aftermarket-rims-from-e5wheels-com/': '/blog/c6-corvette-aftermarket-wheels-personalize-your-ride',

    // Unique redirects not covered by vercel.json
    '/catalog-2025/': '/catalog',

    '/wheels/gt.01': '/wheels/gt-01',
    '/wheels/gt.01/': '/wheels/gt-01',
    '/wheels/gt01': '/wheels/gt-01',
    '/wheels/gt01/': '/wheels/gt-01',
    '/wheels/gt_01': '/wheels/gt-01',
    '/wheels/gt_01/': '/wheels/gt-01',
    '/wheels/gt.02': '/wheels/gt-02',
    '/wheels/gt.02/': '/wheels/gt-02',
    '/wheels/gt02': '/wheels/gt-02',
    '/wheels/gt02/': '/wheels/gt-02',
    '/wheels/gt_02': '/wheels/gt-02',
    '/wheels/gt_02/': '/wheels/gt-02',
    '/wheels/gt.03': '/wheels/gt-03',
    '/wheels/gt.03/': '/wheels/gt-03',
    '/wheels/gt03': '/wheels/gt-03',
    '/wheels/gt03/': '/wheels/gt-03',
    '/wheels/gt_03': '/wheels/gt-03',
    '/wheels/gt_03/': '/wheels/gt-03',
    '/wheels/gt.04': '/wheels/gt-04',
    '/wheels/gt.04/': '/wheels/gt-04',
    '/wheels/gt04': '/wheels/gt-04',
    '/wheels/gt04/': '/wheels/gt-04',
    '/wheels/gt_04': '/wheels/gt-04',
    '/wheels/gt_04/': '/wheels/gt-04',

    '/catalog-2025': '/catalog',

    // Product pages - Talladega
    '/product/talladega/': '/shop/talladega/brushed-aluminum',

    '/product/talladega': '/shop/talladega/brushed-aluminum',
    '/product/rear-21-x-13-20mm-talladega-brushed-aluminum/': '/shop/talladega/brushed-aluminum',

    '/product/rear-21-x-13-20mm-talladega-brushed-aluminum': '/shop/talladega/brushed-aluminum',

    // Product pages - Sonoma
    '/product/sonoma/': '/shop/sonoma/brushed-aluminum',

    '/product/sonoma': '/shop/sonoma/brushed-aluminum',

    // Product pages - Sebring
    '/product/sebring/': '/shop/sebring/gloss-black',

    '/product/sebring': '/shop/sebring/gloss-black',
    '/product/sebring-2/': '/shop/sebring/titanium-gray-brushed',

    '/product/sebring-2': '/shop/sebring/titanium-gray-brushed',
    '/product/sebring-3/': '/shop/sebring/gloss-black',

    '/product/sebring-3': '/shop/sebring/gloss-black',
    '/product/sebring-4/': '/shop/sebring/titanium-brushed',

    '/product/sebring-4': '/shop/sebring/titanium-brushed',
    '/product/sebring-5/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-5': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-6/': '/shop/sebring/gloss-black',

    '/product/sebring-6': '/shop/sebring/gloss-black',
    '/product/sebring-7/': '/shop/sebring/titanium-brushed',

    '/product/sebring-7': '/shop/sebring/titanium-brushed',
    '/product/sebring-8/': '/shop/sebring/gloss-black',

    '/product/sebring-8': '/shop/sebring/gloss-black',
    '/product/sebring-9/': '/shop/sebring/titanium-gray-brushed',

    '/product/sebring-9': '/shop/sebring/titanium-gray-brushed',
    '/product/sebring-10/': '/shop/sebring/gloss-black',

    '/product/sebring-10': '/shop/sebring/gloss-black',
    '/product/sebring-11/': '/shop/sebring/titanium-gray-brushed',

    '/product/sebring-11': '/shop/sebring/titanium-gray-brushed',
    '/product/sebring-12/': '/shop/sebring/gloss-black',

    '/product/sebring-12': '/shop/sebring/gloss-black',
    '/product/sebring-13/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-13': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-14/': '/shop/sebring/titanium-brushed',

    '/product/sebring-14': '/shop/sebring/titanium-brushed',
    '/product/sebring-15/': '/shop/sebring/titanium-brushed',

    '/product/sebring-15': '/shop/sebring/titanium-brushed',
    '/product/sebring-16/': '/shop/sebring/titanium-brushed',

    '/product/sebring-16': '/shop/sebring/titanium-brushed',
    '/product/sebring-17/': '/shop/sebring/titanium-brushed',

    '/product/sebring-17': '/shop/sebring/titanium-brushed',
    '/product/sebring-18/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-18': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-19/': '/shop/sebring/gloss-black',

    '/product/sebring-19': '/shop/sebring/gloss-black',
    '/product/sebring-20/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-20': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-21/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-21': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-22/': '/shop/sebring/chrome',

    '/product/sebring-22': '/shop/sebring/chrome',
    '/product/sebring-23/': '/shop/sebring/chrome',

    '/product/sebring-23': '/shop/sebring/chrome',
    '/product/sebring-24/': '/shop/sebring/chrome',

    '/product/sebring-24': '/shop/sebring/chrome',
    '/product/sebring-25/': '/shop/sebring/chrome',

    '/product/sebring-25': '/shop/sebring/chrome',
    '/product/sebring-gblk/': '/shop/sebring/gloss-black',

    '/product/sebring-gblk': '/shop/sebring/gloss-black',
    '/product/sebring-brz/': '/shop/sebring/bronze-brushed-tint',

    '/product/sebring-brz': '/shop/sebring/bronze-brushed-tint',
    '/product/sebring-tiu/': '/shop/sebring/titanium-gray-brushed',

    '/product/sebring-tiu': '/shop/sebring/titanium-gray-brushed',

    // Product pages - Daytona
    '/product/daytona/': '/shop/daytona/gloss-black',

    '/product/daytona': '/shop/daytona/gloss-black',
    '/product/daytona-2/': '/shop/daytona/titanium-brushed',

    '/product/daytona-2': '/shop/daytona/titanium-brushed',
    '/product/daytona-3/': '/shop/daytona/gloss-black',

    '/product/daytona-3': '/shop/daytona/gloss-black',
    '/product/daytona-4/': '/shop/daytona/titanium-brushed',

    '/product/daytona-4': '/shop/daytona/titanium-brushed',
    '/product/daytona-5/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-5': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-6/': '/shop/daytona/gloss-black',

    '/product/daytona-6': '/shop/daytona/gloss-black',
    '/product/daytona-7/': '/shop/daytona/titanium-brushed',

    '/product/daytona-7': '/shop/daytona/titanium-brushed',
    '/product/daytona-8/': '/shop/daytona/gloss-black',

    '/product/daytona-8': '/shop/daytona/gloss-black',
    '/product/daytona-9/': '/shop/daytona/titanium-brushed',

    '/product/daytona-9': '/shop/daytona/titanium-brushed',
    '/product/daytona-10/': '/shop/daytona/gloss-black',

    '/product/daytona-10': '/shop/daytona/gloss-black',
    '/product/daytona-11/': '/shop/daytona/titanium-brushed',

    '/product/daytona-11': '/shop/daytona/titanium-brushed',
    '/product/daytona-12/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-12': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-13/': '/shop/daytona/gloss-black',

    '/product/daytona-13': '/shop/daytona/gloss-black',
    '/product/daytona-14/': '/shop/daytona/titanium-brushed',

    '/product/daytona-14': '/shop/daytona/titanium-brushed',
    '/product/daytona-15/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-15': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-16/': '/shop/daytona/gloss-black',

    '/product/daytona-16': '/shop/daytona/gloss-black',
    '/product/daytona-17/': '/shop/daytona/titanium-brushed',

    '/product/daytona-17': '/shop/daytona/titanium-brushed',
    '/product/daytona-18/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-18': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-19/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-19': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-20/': '/shop/daytona/chrome',

    '/product/daytona-20': '/shop/daytona/chrome',
    '/product/daytona-21/': '/shop/daytona/chrome',

    '/product/daytona-21': '/shop/daytona/chrome',
    '/product/daytona-22/': '/shop/daytona/chrome',

    '/product/daytona-22': '/shop/daytona/chrome',
    '/product/daytona-23/': '/shop/daytona/chrome',

    '/product/daytona-23': '/shop/daytona/chrome',
    '/product/daytona-24/': '/shop/daytona/titanium-gray-brushed',

    '/product/daytona-24': '/shop/daytona/titanium-gray-brushed',
    '/product/daytona-25/': '/shop/daytona/gloss-black',

    '/product/daytona-25': '/shop/daytona/gloss-black',
    '/product/daytona-26/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-26': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-gblk/': '/shop/daytona/gloss-black',

    '/product/daytona-gblk': '/shop/daytona/gloss-black',
    '/product/daytona-brz/': '/shop/daytona/bronze-brushed-tint',

    '/product/daytona-brz': '/shop/daytona/bronze-brushed-tint',
    '/product/daytona-tiu/': '/shop/daytona/titanium-brushed',

    '/product/daytona-tiu': '/shop/daytona/titanium-brushed',

    // Product pages - Speedway
    '/product/speedway/': '/shop/speedway/gloss-black',

    '/product/speedway': '/shop/speedway/gloss-black',
    '/product/speedway-2/': '/shop/speedway/gloss-black',

    '/product/speedway-2': '/shop/speedway/gloss-black',
    '/product/speedway-3/': '/shop/speedway/chrome',

    '/product/speedway-3': '/shop/speedway/chrome',
    '/product/speedway-4/': '/shop/speedway/dark-bronze',

    '/product/speedway-4': '/shop/speedway/dark-bronze',
    '/product/speedway-5/': '/shop/speedway/titanium-brushed',

    '/product/speedway-5': '/shop/speedway/titanium-brushed',
    '/product/speedway-6/': '/shop/speedway/gloss-black',

    '/product/speedway-6': '/shop/speedway/gloss-black',
    '/product/speedway-7/': '/shop/speedway/dark-bronze',

    '/product/speedway-7': '/shop/speedway/dark-bronze',
    '/product/speedway-8/': '/shop/speedway/titanium-brushed',

    '/product/speedway-8': '/shop/speedway/titanium-brushed',
    '/product/speedway-9/': '/shop/speedway/dark-bronze',

    '/product/speedway-9': '/shop/speedway/dark-bronze',
    '/product/speedway-10/': '/shop/speedway/titanium-brushed-tint',

    '/product/speedway-10': '/shop/speedway/titanium-brushed-tint',
    '/product/speedway-11/': '/shop/speedway/chrome',

    '/product/speedway-11': '/shop/speedway/chrome',
    '/product/speedway-12/': '/shop/speedway/gloss-black',

    '/product/speedway-12': '/shop/speedway/gloss-black',
    '/product/speedway-13/': '/shop/speedway/titanium-brushed',

    '/product/speedway-13': '/shop/speedway/titanium-brushed',
    '/product/speedway-14/': '/shop/speedway/dark-bronze',

    '/product/speedway-14': '/shop/speedway/dark-bronze',
    '/product/speedway-15/': '/shop/speedway/chrome',

    '/product/speedway-15': '/shop/speedway/chrome',
    '/product/speedway-gloss-black/': '/shop/speedway/gloss-black',

    '/product/speedway-gloss-black': '/shop/speedway/gloss-black',
    '/product/speedway-titanium-brushed/': '/shop/speedway/titanium-brushed',

    '/product/speedway-titanium-brushed': '/shop/speedway/titanium-brushed',
    '/product/speedway-bronze-brushed-tint/': '/shop/speedway/dark-bronze',

    '/product/speedway-bronze-brushed-tint': '/shop/speedway/dark-bronze',

    // Catch-all for any unmapped /product/* URL — preserves link equity from legacy WordPress URLs
    '/product/[...slug]': '/shop',

  },
  server: {
    port: 8080
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
});
