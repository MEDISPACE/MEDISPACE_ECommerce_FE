import type { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export async function screenshot(page: Page, spec: string, testName: string, step: string): Promise<void> {
  const dir = path.join('test-results', 'screenshots', spec, testName.replace(/\s+/g, '-').toLowerCase())
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, `${step}.png`), fullPage: true })
}

export default screenshot
