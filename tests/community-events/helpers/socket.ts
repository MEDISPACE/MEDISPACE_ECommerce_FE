import { expect, type Page } from '@playwright/test'

export async function waitForSocketBackedVisible(page: Page, testId: string, timeout = 5_000) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout })
}

export async function waitForSocketBackedHidden(page: Page, testId: string, timeout = 5_000) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeHidden({ timeout })
}

export async function waitForToast(page: Page, testId = 'toast', timeout = 5_000) {
  await expect(page.locator(`[data-testid="${testId}"]`).or(page.locator('[data-sonner-toast]'))).toBeVisible({ timeout })
}

export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle')
}
