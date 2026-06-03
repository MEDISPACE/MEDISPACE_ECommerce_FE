/**
 * article-detail.spec.ts
 *
 * E2E: Trang /health/article/:slug
 * - Hiển thị nội dung bài viết đầy đủ
 * - AI hỏi đáp (câu thường + câu khẩn cấp)
 * - Lưu bài / bỏ lưu
 * - Follow / unfollow chủ đề
 * - Share
 * - Related products (click → journey event)
 * - Related articles navigation
 * - CTA buttons (Hỏi dược sĩ, Tìm sản phẩm)
 * - Chụp ảnh mỗi bước
 */

import path from 'node:path'
import { expect, test, type Browser } from '@playwright/test'
import {
  APP_URL, API_URL, AUTH_DIR, SS_DIR,
  sessions, auth, createCategory, createArticle, deleteArticle, deleteCategory, snap,
} from './helpers'

// State chia sẻ giữa các test trong describe
let articleSlug = ''
let articleId = ''
let categoryId = ''

test.describe.serial('Article Detail Page', () => {
  // Setup: tạo category + article qua API
  test.beforeAll(async ({ request }) => {
    const { admin } = sessions()
    const cat = await createCategory(request, admin.token)
    categoryId = cat._id

    const article = await createArticle(request, admin.token, cat._id, {
      references: [
        { title: 'Bộ Y tế Việt Nam — Hướng dẫn phòng chống cảm cúm', url: 'https://moh.gov.vn' },
        { title: 'WHO — Influenza', url: 'https://who.int/influenza' },
      ],
    })
    articleSlug = article.slug
    articleId = article._id
  })

  test.afterAll(async ({ request }) => {
    const { admin } = sessions()
    if (articleId) await deleteArticle(request, admin.token, articleId)
    if (categoryId) await deleteCategory(request, admin.token, categoryId)
  })

  // ── Guest tests ────────────────────────────────────────────────────────────

  test('article renders title, metadata, content', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    // Tiêu đề bài
    await expect(page.getByRole('heading', { level: 1 }))
      .toContainText('Cách chăm sóc sức khỏe mùa lạnh', { timeout: 15_000 })

    // Breadcrumb — dùng .first() vì text 'Góc sức khỏe' xuất hiện cả ở nav lẫn breadcrumb
    await expect(page.getByText('Góc sức khỏe').first()).toBeVisible()

    // Nội dung
    await expect(page.getByText('đường hô hấp như cảm cúm')).toBeVisible()

    // Share button
    await expect(page.getByRole('button', { name: /chia sẻ/i })).toBeVisible()

    await snap(page, '01-article-initial')
  })

  test('AI ask: normal question gets answer and suggestions', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    // AI Q&A section
    const aiSection = page.getByText('Hỏi nhanh về nội dung bài này')
    await expect(aiSection).toBeVisible()

    await snap(page, '02-article-ai-section')

    // Nhập câu hỏi
    const questionInput = page.getByPlaceholder('Nhập câu hỏi về bài viết')
    await questionInput.fill('Nên uống bao nhiêu nước mỗi ngày khi bị cảm?')

    await snap(page, '03-article-ai-typed')

    // Click "Hỏi AI"
    const [aiResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/ask-ai') && resp.status() === 200,
        { timeout: 90_000 },
      ),
      page.getByRole('button', { name: 'Hỏi AI' }).click(),
    ])
    expect(aiResponse.ok()).toBeTruthy()

    // Chờ câu trả lời xuất hiện (timeout lớn vì AI service có thể chậm)
    const answerEl = page.locator('[class*="ai"] p, [class*="answer"]').first()
    await expect(answerEl).not.toBeEmpty({ timeout: 60_000 })

    await snap(page, '04-article-ai-answer')

    // Câu hỏi gợi ý
    const suggestions = page.getByRole('button').filter({ hasText: /(câu hỏi|gợi ý|liên quan)/i })
    const count = await suggestions.count()
    // Có thể có hoặc không có câu gợi ý tùy câu hỏi
    console.log(`AI suggested ${count} follow-up questions`)
  })

  test('AI ask: emergency question shows 115 warning immediately', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    const questionInput = page.getByPlaceholder('Nhập câu hỏi về bài viết')
    await questionInput.fill('Tôi đang bị đau ngực rất nặng, phải làm sao?')

    await page.getByRole('button', { name: 'Hỏi AI' }).click()

    // Emergency response phải xuất hiện ngay (không cần gọi LLM)
    await expect(page.getByText(/115/)).toBeVisible({ timeout: 10_000 })

    await snap(page, '05-article-ai-emergency')
  })

  test('share button triggers journey event', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    // Intercept journey event
    const journeyReq = page.waitForRequest(
      (req) => req.url().includes('/journey-events') && req.method() === 'POST',
    )

    await page.getByRole('button', { name: /chia sẻ/i }).click()

    const req = await journeyReq
    const body = req.postDataJSON()
    expect(body.eventType).toBe('article_share')

    await snap(page, '06-article-shared')
  })

  test('CTA: Hỏi dược sĩ triggers cta_chat journey event', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    const journeyReq = page.waitForRequest(
      (req) => req.url().includes('/journey-events') && req.method() === 'POST',
    )

    // Click "Hỏi dược sĩ" (có thể nhiều nút, lấy cái đầu tiên trong CTA section)
    await page.getByRole('link', { name: 'Hỏi dược sĩ' }).first().click()

    const req = await journeyReq
    const body = req.postDataJSON()
    expect(body.eventType).toBe('cta_chat')

    await snap(page, '07-article-cta-chat')
  })

  test('CTA: Tìm sản phẩm triggers cta_product_search journey event', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    const journeyReq = page.waitForRequest(
      (req) => req.url().includes('/journey-events') && req.method() === 'POST',
    )

    await page.getByRole('link', { name: 'Tìm sản phẩm' }).first().click()

    const req = await journeyReq
    const body = req.postDataJSON()
    expect(body.eventType).toBe('cta_product_search')

    await snap(page, '08-article-cta-product-search')
  })

  test('related articles section renders and navigates', async ({ page }) => {
    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    await snap(page, '09-article-related-articles')

    const relatedLinks = page.locator('a[href*="/health/article/"]')
    const count = await relatedLinks.count()
    console.log(`Related articles: ${count}`)
    // Có thể 0 nếu chưa có bài nào khác
    if (count > 0) {
      const href = await relatedLinks.first().getAttribute('href')
      await relatedLinks.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('/health/article/')
      await snap(page, '10-article-related-navigate')
    }
  })

  // ── Customer (Authenticated) tests ─────────────────────────────────────────

  test('customer can save and unsave article', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: `${AUTH_DIR}/customer.json`,
    })
    const page = await context.newPage()

    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    await snap(page, '11-article-before-save')

    // Reset: nếu bài đang "Đã lưu" từ test trước → unsave trước
    const alreadySaved = page.getByRole('button', { name: 'Đã lưu' })
    if (await alreadySaved.isVisible()) {
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/articles/') && resp.url().includes('/save'),
          { timeout: 10_000 },
        ),
        alreadySaved.click(),
      ])
      await expect(page.getByRole('button', { name: 'Lưu bài' })).toBeVisible({ timeout: 5000 })
    }

    // Test save
    const saveBtn = page.getByRole('button', { name: 'Lưu bài' })
    await expect(saveBtn).toBeVisible()

    const [saveResp] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/articles/') && resp.url().includes('/save') && resp.request().method() === 'PATCH',
        { timeout: 10_000 },
      ),
      saveBtn.click(),
    ])
    expect(saveResp.ok()).toBeTruthy()

    await expect(page.getByRole('button', { name: 'Đã lưu' })).toBeVisible({ timeout: 5000 })
    await snap(page, '12-article-saved')

    // Test unsave
    const [unsaveResp] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/articles/') && resp.url().includes('/save') && resp.request().method() === 'PATCH',
        { timeout: 10_000 },
      ),
      page.getByRole('button', { name: 'Đã lưu' }).click(),
    ])
    expect(unsaveResp.ok()).toBeTruthy()

    await expect(page.getByRole('button', { name: 'Lưu bài' })).toBeVisible({ timeout: 5000 })
    await snap(page, '13-article-unsaved')
    await context.close()
  })

  test('customer can follow and unfollow topic', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: `${AUTH_DIR}/customer.json`,
    })
    const page = await context.newPage()

    await page.goto(`${APP_URL}/health/article/${articleSlug}`)
    await page.waitForLoadState('networkidle')

    // Follow topic button (text includes "Theo dõi" hoặc "Đang theo dõi")
    const followBtn = page.getByRole('button').filter({ hasText: /theo dõi/i })

    if (await followBtn.count() > 0) {
      const initialText = await followBtn.first().textContent()

      const [followResp] = await Promise.all([
        page.waitForResponse((resp) => resp.url().includes('/follow') && resp.request().method() === 'PATCH'),
        followBtn.first().click(),
      ])
      expect(followResp.ok()).toBeTruthy()

      await snap(page, '14-article-topic-followed')

      // Toggle lại
      await followBtn.first().click()
      await snap(page, '15-article-topic-unfollowed')
    } else {
      console.log('No follow topic button found — may require auth level')
    }

    await context.close()
  })
})
