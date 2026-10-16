// @ts-check
import { defineConfig } from 'astro/config';

// CU_OUT_DIR lets the test suite build a second copy of the site (with fixture
// content) without touching the real `dist/`.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://culture-unfiltered.example',
  outDir: process.env.CU_OUT_DIR ?? './dist',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
