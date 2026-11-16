import js from '@eslint/js';
import globals from 'globals';
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      '.agents/**',
      '.artifacts/**',
      '.playwright/**',
      '.cache/**',
      'infra/generated/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.mjs', 'public/scripts/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
