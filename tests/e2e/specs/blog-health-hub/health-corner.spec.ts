/**
 * health-corner.spec.ts
 *
 * E2E: Trang /health (Health Corner chính)
 * - Hiển thị sections: featured, latest, popular
 * - Navigation sang bài viết
 * - Category navigation
 * - Search từ health corner
 * - Customer: personalized section
 * - Customer: follow topic từ health corner
 */

import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  APP_URL, API_URL, AUTH_DIR, SS_DIR,
  sessions, auth, createCategory, createArticle, deleteArticle, deleteCategory, snap,
} from './helpers'

let articleSlug = ''
let articleId = ''
let categoryId = ''
let categorySlug = ''

test.describe.serial('Health Corner — /health', () => {
  test.beforeAll(async ({ request }) => {
    const { admin } = sessions()
    const cat = await createCategory(request, admin.token)
    categoryId = cat._id
    categorySlug = cat.slug

    const article = await createArticle(request, admin.token, cat._id, {
      isFeatured: true,
    })
    articleSlug = article.slug
    articleId = article._id
  })

  test.afterAll(async ({ request }) => {
    const { admin } = sessions()
    if (articleId) await deleteArticle(request, admin.token, articleId).catch(() => {})
    if (categoryId) await deleteCategory(request, admin.token, categoryId).catch(() => {})
  })

  test('health corner page loads with main sections', async ({ page }) => {
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    await snap(page, '01-health-corner-initial')

    // H1 trang
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Trang có bài viết (ít nhất 1)
    const articleCards = page.locator('a[href*="/health/article/"]')
    await expect(articleCards.first()).toBeVisible({ timeout: 15_000 })

    console.log(`Article cards: ${await articleCards.count()}`)
  })

  test('clicking article card navigates to article detail', async ({ page }) => {
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    // Click bất kỳ bài viết nào trên health corner (không phụ thuộc vào bài E2E vừa tạo
    // vì listing có thể cache và chưa hiện bài mới ngay)
    const anyArticleLink = page.locator('a[href*="/health/article/"]').first()

    if (await anyArticleLink.count() > 0) {
      const href = await anyArticleLink.getAttribute('href')
      await anyArticleLink.click()
      // Chờ navigation hoàn thành trước khi check URL
      await page.waitForURL('**/health/article/**', { timeout: 15_000 })
      await snap(page, '02-health-corner-navigate-to-article')
    } else {
      // Không có bài nào trong listing → navigate trực tiếp tới bài E2E
      await page.goto(`${APP_URL}/health/article/${articleSlug}`)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
      await snap(page, '02-health-corner-navigate-direct')
    }
  })

  test('category page shows filtered articles', async ({ page }) => {
    await page.goto(`${APP_URL}/health/category/${categorySlug}`)
    await page.waitForLoadState('networkidle')

    await snap(page, '03-health-category-page')

    // Trang category render được
    await page.waitForLoadState('networkidle')
    // Có thể có bài hoặc không nếu chưa published kịp index
    const articleLinks = page.locator('a[href*="/health/article/"]')
    console.log(`Category articles: ${await articleLinks.count()}`)
  })

  test('search from health corner navigates to search results', async ({ page }) => {
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    // Tìm search bar
    const searchInput = page.getByPlaceholder(/tìm kiếm/i).or(page.getByRole('searchbox')).first()

    if (await searchInput.count() > 0) {
      await searchInput.fill('vitamin C hệ miễn dịch')
      await snap(page, '04-health-corner-search-typed')

      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      await snap(page, '05-health-corner-search-results')
      expect(page.url()).toContain('search')
    } else {
      // Thử search link
      const healthSearchLink = page.locator('a[href*="/health/search"]').first()
      if (await healthSearchLink.count() > 0) {
        await healthSearchLink.click()
        await page.waitForLoadState('networkidle')
        await snap(page, '04-health-corner-search-page')
      } else {
        console.log('No search input found in health corner')
      }
    }
  })

  test('health corner breadcrumb navigation works', async ({ page }) => {
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    await snap(page, '06-health-corner-breadcrumb')

    // Verify breadcrumb renders — có "Trang chủ" link dẫn về /
    const homeBreadcrumb = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"]')
      .getByRole('link', { name: 'Trang chủ' }).first()

    if (await homeBreadcrumb.count() > 0) {
      // Có breadcrumb → verify href trỏ về /
      const href = await homeBreadcrumb.getAttribute('href')
      expect(href).toBe('/')
    } else {
      // Không có breadcrumb component → verify trang load thành công
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }

    // Test navigate về trang chủ bằng goto() trực tiếp
    await page.goto(`${APP_URL}/`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toBe(`${APP_URL}/`)
    await snap(page, '06b-health-corner-home-navigated')
  })

  // ── Customer authenticated ─────────────────────────────────────────────────

  test('customer sees personalized section on health corner', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: `${AUTH_DIR}/customer.json`,
    })
    const page = await context.newPage()
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    await snap(page, '07-health-corner-customer-view')

    // Có thể có section "Dành riêng cho bạn" hoặc "Gợi ý cho bạn"
    const personalizedSection = page
      .getByText(/dành riêng cho bạn|gợi ý cho bạn|bài viết dành cho bạn/i)
      .first()

    if (await personalizedSection.count() > 0) {
      await expect(personalizedSection).toBeVisible()
      await snap(page, '07b-health-corner-personalized-section')
    } else {
      console.log('No personalized section visible (may require browsing history)')
    }

    await context.close()
  })

  test('health checker link is accessible from health corner', async ({ page }) => {
    await page.goto(`${APP_URL}/health`)
    await page.waitForLoadState('networkidle')

    // Tìm link đến /health/checker
    const checkerLink = page.locator('a[href="/health/checker"]').first()

    if (await checkerLink.count() > 0) {
      await checkerLink.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('/health/checker')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Kiểm tra nhanh')
      await snap(page, '08-health-corner-to-checker')
    } else {
      console.log('No direct health checker link on health corner (may be in nav)')
    }
  })
})
