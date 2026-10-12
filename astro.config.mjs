import { defineConfig } from 'astro/config';

// Absolute URLs (canonical, Open Graph image) need the public origin. On Vercel
// the production domain is provided at build time, including a custom domain
// once one is attached; SITE_URL overrides it if needed.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (productionHost ? `https://${productionHost}` : 'http://localhost:4321');

export default defineConfig({
  site,
  devToolbar: { enabled: false },
  // The CSS is small (~4 KB gzipped): inline it rather than block rendering on a request.
  build: { inlineStylesheets: 'always' },
});
