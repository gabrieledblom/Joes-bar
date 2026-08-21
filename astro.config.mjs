// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: site.url,
  integrations: site.sokmotorindexering ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
