import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './acceptance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    // launchOptions: { slowMo: 500 },
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // features: what a user can do, journey by journey. layout: how the app must look, the few
  // visual rules that broke before or would hurt (see PROJECT_CONTEXT.md, Testing notes).
  projects: [
    { name: 'features', testDir: './acceptance/features', use: { ...devices['Desktop Chrome'] } },
    { name: 'layout', testDir: './acceptance/layout', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev --mode acceptance',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
