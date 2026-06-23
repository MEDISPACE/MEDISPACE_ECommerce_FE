import type { Page } from '@playwright/test'

export async function uploadFixtureFile(page: Page, testId: string, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.locator(`[data-testid="${testId}"]`).setInputFiles(file)
}

export const validImageFile = {
  name: 'valid-prescription.png',
  mimeType: 'image/png',
  buffer: Buffer.from('valid-image'),
}

export const invalidTextFile = {
  name: 'not-image.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('not-image'),
}
