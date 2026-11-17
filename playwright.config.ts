import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4321/ja/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME
          ? { channel: 'chrome' }
          : {}),
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ...(process.env.PLAYWRIGHT_INCLUDE_EDGE
      ? [
          {
            name: 'edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
          },
        ]
      : []),
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' },
    },
  ],
});
