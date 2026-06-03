import { defineConfig } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

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
  },
})
