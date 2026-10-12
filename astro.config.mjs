import { defineConfig } from 'astro/config';

export default defineConfig({
  devToolbar: { enabled: false },
  // The CSS is small (~4 KB gzipped): inline it rather than block rendering on a request.
  build: { inlineStylesheets: 'always' },
});
