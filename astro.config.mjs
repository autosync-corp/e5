import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    vue(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
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
