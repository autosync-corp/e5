import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
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
