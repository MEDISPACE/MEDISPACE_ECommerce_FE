import { defineConfig } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const SS_DIR = 'tests/e2e/screenshots/blog-health-hub'

export default defineConfig({
  testDir: './tests/e2e/specs/blog-health-hub',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-blog', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: false,                    // ← mở Chrome thật
    viewport: { width: 1440, height: 900 },
    actionTimeout: 20_000,
    screenshot: 'on',                   // ← chụp ảnh MỌI bước
    video: 'on',                        // ← quay video mọi test
    trace: 'on',                        // ← trace đầy đủ cho debug
    locale: 'vi-VN',
  },
  // Export SS_DIR để các spec dùng
  projects: [
    {
      name: 'blog-health-hub',
      use: {
        // pass qua env để spec lấy
      },
    },
  ],
})

export { SS_DIR }
