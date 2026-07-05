import { defineConfig } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load env from the BE side (where DB_USERNAME etc live) for DB assertions
config({ path: resolve('../MEDISPACE_ECommerce_BE/.env'), override: false })
// Also load local .env.test if it exists
config({ path: resolve('.env.test'), override: false })

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: Number(process.env.PLAYWRIGHT_WORKERS || 1),
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['html', { outputFolder: 'test-results/report' }],
    ['list'],
  ],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    screenshot: 'on',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
})
