import { type Browser, type Page } from '@playwright/test'
import { storageState, type TestRole } from '../fixtures/users'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'

export async function pageForRole(browser: Browser, role: TestRole) {
  const state = storageState[role]
  const context = await browser.newContext(state ? { storageState: state } : {})
  const page = await context.newPage()
  return { context, page }
}

export async function loginAs(page: Page, role: Exclude<TestRole, 'guest'>) {
  const state = storageState[role]
  if (!state) return
  const context = page.context()
  await context.addInitScript((roleName) => {
    window.localStorage.setItem('medispace_e2e_role', roleName as string)
  }, role)
}

export function testId(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"]`)
}
