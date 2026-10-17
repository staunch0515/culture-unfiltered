import { defineConfig } from '@playwright/test';

export const SITE = 'http://localhost:4421';
export const FIXTURE_SITE = 'http://localhost:4422';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['fixtures/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: SITE, browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    // Dark colour scheme: every page again, for layout and contrast.
    { name: 'mobile-dark', testMatch: /smoke\.spec\.ts/, use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, colorScheme: 'dark' } },
    { name: 'desktop-dark', testMatch: /smoke\.spec\.ts/, use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
  ],
  webServer: [
    { command: 'node scripts/serve.mjs dist 4421', url: SITE, reuseExistingServer: !process.env.CI },
    { command: 'node scripts/serve.mjs dist-fixtures 4422', url: FIXTURE_SITE, reuseExistingServer: !process.env.CI },
  ],
});
