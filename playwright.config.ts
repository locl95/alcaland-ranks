import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './acceptance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    launchOptions: { slowMo: 1000 },
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev --mode acceptance',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
