import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://deepledeeple.com',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  markdown: { shikiConfig: { theme: 'github-light' } },
});
