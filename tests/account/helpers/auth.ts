import type { Browser, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { users } from '../fixtures/users'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'

export function testId(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"]`)
}

export async function loginAs(page: Page, role: keyof typeof users = 'standard') {
  const user = users[role] as any
  await page.goto(`${APP_URL}/login`)
  await testId(page, 'login-email').fill(user.email)
  await testId(page, 'login-password').fill(user.password ?? users.standard.password)
  await testId(page, 'login-submit').click()
  await expect(page).toHaveURL(/\/account|\//)
}

export async function pageForAccountUser(browser: Browser, role: keyof typeof users = 'standard') {
  const context = await browser.newContext()
  const page = await context.newPage()
  await loginAs(page, role)
  return { context, page }
}

export async function expectRedirectsToLogin(page: Page, path: string) {
  await page.goto(`${APP_URL}${path}`)
  await expect(page).toHaveURL(/\/login/)
}
