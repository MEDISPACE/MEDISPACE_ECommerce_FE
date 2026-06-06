import { defineConfig } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve('../MEDISPACE_ECommerce_BE/.env'), override: false })
config({ path: resolve('.env.test'), override: false })

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const SS_DIR = 'tests/e2e/screenshots/product-filter-sort'

export default defineConfig({
  testDir: './tests/e2e/specs/product-filter-sort',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-product', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: false,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 20_000,
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'product-filter-sort',
      use: {},
    },
  ],
})

export { SS_DIR }
