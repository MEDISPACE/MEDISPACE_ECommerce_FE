import { defineConfig } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'node:path'

// Load env from the BE side (where DB_USERNAME etc live) for DB assertions
config({ path: resolve('../MEDISPACE_ECommerce_BE/.env'), override: false })
// Also load local .env.test if it exists
config({ path: resolve('.env.test'), override: false })

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const apiURL = process.env.E2E_API_URL || 'http://localhost:8000'

export default defineConfig({
  testDir: './tests/e2e/specs',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
})

