import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5001';
const desktop = { viewport: { width: 1280, height: 800 } };

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Every test resets the one in-memory server the app runs on, so tests must not overlap.
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Percy snapshots run only on request: `npm run test:visual`.
  grepInvert: process.env.VISUAL === '1' ? undefined : /@visual/,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...desktop } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], ...desktop } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], ...desktop } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm --prefix .. run start:demo',
        url: 'http://localhost:5001/api/health',
        reuseExistingServer: !process.env.CI,
        // start:demo builds the client before the server starts listening.
        timeout: 180_000,
      },
});
