import { defineConfig, devices } from '@playwright/test';
import { appServerURLs } from './fixtures/servers';

const baseURL = process.env.BASE_URL ?? appServerURLs[0] ?? 'http://localhost:5001';
const parallel = appServerURLs.length > 1;
const desktop = { viewport: { width: 1280, height: 800 } };

const allProjects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'], ...desktop } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'], ...desktop } },
  { name: 'webkit', use: { ...devices['Desktop Safari'], ...desktop } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
];

// PW_PROJECT runs a single project, e.g. on BrowserStack, where the SDK turns every project into its own
// session per platform.
const only = process.env.PW_PROJECT;
const projects = only ? allProjects.filter((p) => p.name === only) : allProjects;
if (only && projects.length === 0) {
  throw new Error(`PW_PROJECT="${only}" matches no project (have: ${allProjects.map((p) => p.name).join(', ')})`);
}

export default defineConfig({
  testDir: './tests',
  // Real mobile devices on BrowserStack are much slower per action; cloud runs raise this with TEST_TIMEOUT.
  timeout: Number(process.env.TEST_TIMEOUT) || 30_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Every test resets the in-memory server it talks to, so each worker needs its own server.
  // One server by default; with BASE_URLS, one worker per listed server, all running in parallel.
  workers: parallel ? appServerURLs.length : 1,
  fullyParallel: parallel,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Percy snapshots run only on request: `npm run test:visual`.
  grepInvert: process.env.VISUAL === '1' ? undefined : /@visual/,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects,
  webServer: process.env.BASE_URL || appServerURLs.length
    ? undefined
    : {
        command: 'npm --prefix .. run start:demo',
        url: 'http://localhost:5001/api/health',
        // Always start a fresh server so the run tests the code that is checked out, never a stale build.
        // Stop anything already on :5001 first, or set BASE_URL to test a server you started yourself.
        reuseExistingServer: false,
        // start:demo builds the client before the server starts listening.
        timeout: 180_000,
      },
});
