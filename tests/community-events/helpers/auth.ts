import { type Browser, type Page } from '@playwright/test'
import { storageState, users, type TestRole } from '../fixtures/users'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'

export async function pageForRole(browser: Browser, role: TestRole) {
  const state = storageState[role]
  const context = await browser.newContext(state ? { storageState: state } : {})
  let session: ReturnType<typeof users>[Exclude<TestRole, 'guest'>] | undefined
  if (role !== 'guest') {
    session = users()[role === 'registeredUser' ? 'registeredUser' : role]
    await context.addInitScript(({ token, user }) => {
      window.localStorage.setItem('medispace_access_token', token)
      window.localStorage.setItem('medispace_session_hint', '1')
      window.localStorage.setItem('medispace_user_data', JSON.stringify(user))
    }, session)
  }
  const page = await context.newPage()
  if (session) {
    await page.route('**/users/me**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'OK', user: session?.user }),
      })
    })
    await page.route('**/users/refresh-token**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'OK', result: { accessToken: session?.token } }),
      })
    })
  }
  return { context, page }
}

export async function loginAs(page: Page, role: Exclude<TestRole, 'guest'>) {
  const state = storageState[role]
  if (!state) return
  const context = page.context()
  const session = users()[role === 'registeredUser' ? 'registeredUser' : role]
  await context.addInitScript(({ token, user, roleName }) => {
    window.localStorage.setItem('medispace_e2e_role', roleName as string)
    window.localStorage.setItem('medispace_access_token', token)
    window.localStorage.setItem('medispace_session_hint', '1')
    window.localStorage.setItem('medispace_user_data', JSON.stringify(user))
  }, { ...session, roleName: role })
}

export function testId(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"]`)
}
