import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Playwright configuration for the PanXpan E2E test suite.  This config
 * mirrors the original repository, setting the base URL to the public
 * panxpan.com domain and defining Desktop and Mobile projects.  It also
 * integrates custom reporters for email and Slack notifications if
 * configured in the environment.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 1.5 * 60 * 1000,
  expect: {
    timeout: 20000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./custom-reporters/email-reporter.ts'],
    ['./custom-reporters/slack-reporter.ts'],
    ['./custom-reporters/numbered-reporter.ts'],
  ],
  use: {
    baseURL: 'https://www.panxpan.com',
    headless: true,
    // Increase default action timeout so long operations (e.g., after clicking
    // Generate) are not capped at 30s. This ensures explicit waits like 50s
    // are not interrupted by action timeouts.
    actionTimeout: 60 * 1000,
    navigationTimeout: 60 * 1000,
  },
  projects: [
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        video: {
          mode: 'retain-on-failure',
          size: { width: 1280, height: 720 },
        },
      },
    },
    {
      name: 'Mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        video: {
          mode: 'retain-on-failure',
          size: { width: 390, height: 844 },
        },
      },
    },
  ],
});