import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

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
  reporter: [['html', { open: 'never' }], ['list'], ['./custom-reporters/email-reporter.ts']],
  use: {
    baseURL: 'https://www.panxpan.com',
    headless: true,
  },

  projects: [
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        video: {
          mode: 'on',
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
          mode: 'on',
          size: { width: 390, height: 844 },
        },
      },
    },
  ],
});
