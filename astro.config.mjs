import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.e5wheels.com',
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
        const excludePaths = [
          '/admin',
          '/checkout',
          '/order-success',
          '/pending',
          '/visualize-test',
          '/visualizer-callback',
          '/registration/',
          '/shop/single-product',
        ];
        return !excludePaths.some(p => page.includes(p));
      },
      customPages: [
        // Blog pages (WordPress headless — SSR routes not auto-discovered)
        'https://www.e5wheels.com/blog',
        'https://www.e5wheels.com/blog/cracked-oem-c7-corvette-wheels',
        'https://www.e5wheels.com/blog/revamp-your-ride-e5-custom-wheels-for-your-c7-corvette',
        'https://www.e5wheels.com/blog/e5-wheels-at-corvettes-at-carlisle-2025',
        'https://www.e5wheels.com/blog/c6-corvette-aftermarket-wheels-personalize-your-ride',
        // Shop level-2 pages: /shop/{series}/{finish} (SSR routes not auto-discovered)
        // Daytona
        'https://www.e5wheels.com/shop/daytona/gloss-black',
        'https://www.e5wheels.com/shop/daytona/titanium-brushed',
        'https://www.e5wheels.com/shop/daytona/titanium-gray-brushed',
        'https://www.e5wheels.com/shop/daytona/bronze-brushed-tint',
        'https://www.e5wheels.com/shop/daytona/chrome',
        // Sebring
        'https://www.e5wheels.com/shop/sebring/gloss-black',
        'https://www.e5wheels.com/shop/sebring/titanium-brushed',
        'https://www.e5wheels.com/shop/sebring/titanium-gray-brushed',
        'https://www.e5wheels.com/shop/sebring/bronze-brushed-tint',
        'https://www.e5wheels.com/shop/sebring/chrome',
        // Sebring 2P
        'https://www.e5wheels.com/shop/sebring-2p/gloss-black-polished-lip',
        'https://www.e5wheels.com/shop/sebring-2p/gray-polished-lip',
        'https://www.e5wheels.com/shop/sebring-2p/bronze-polished-lip',
        // Speedway
        'https://www.e5wheels.com/shop/speedway/gloss-black',
        'https://www.e5wheels.com/shop/speedway/titanium-brushed',
        'https://www.e5wheels.com/shop/speedway/titanium-brushed-tint',
        'https://www.e5wheels.com/shop/speedway/dark-bronze',
        'https://www.e5wheels.com/shop/speedway/chrome',
        // Talladega
        'https://www.e5wheels.com/shop/talladega/brushed-aluminum',
        'https://www.e5wheels.com/shop/talladega/gloss-black',
        // Sonoma
        'https://www.e5wheels.com/shop/sonoma/brushed-aluminum',
      ],
      serialize(item) {
        // Strip trailing slashes to match canonical URLs (keep root slash)
        if (item.url.endsWith('/') && item.url !== 'https://www.e5wheels.com/') {
          item.url = item.url.slice(0, -1);
        }
        // Add lastmod (set to build date for all entries — best signal Google sees)
        item.lastmod = new Date().toISOString();
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
