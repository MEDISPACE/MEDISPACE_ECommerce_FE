import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/drug-database/e2e',
  workers: 1,
  timeout: 30_000,
  retries: 0,
  outputDir: 'test-results/drug-database-artifacts',
  reporter: [
    ['html', { outputFolder: 'playwright-report-drug-database' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    screenshot: 'on',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
})
