/**
 * health-checker.spec.ts
 *
 * E2E: Trang /health/checker
 * - Hiển thị đúng danh sách triệu chứng và yếu tố rủi ro
 * - Bấm checkbox → cập nhật sidebar "Thông tin đã chọn"
 * - Click "Xem gợi ý" → hiện card kết quả đúng màu
 * - Chọn chestPain → kết quả urgent (đỏ)
 * - Chọn triệu chứng thường → kết quả selfcare (xanh)
 * - Sau đánh giá → hiện section "Bài viết nên đọc"
 * - Chụp ảnh mỗi bước quan trọng
 */

import path from 'node:path'
import { expect, test } from '@playwright/test'
import { APP_URL, SS_DIR, snap } from './helpers'

const CHECKER_URL = `${APP_URL}/health/checker`

test.describe('Health Checker — /health/checker', () => {
  test('page loads with correct sections', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    // H1 tiêu đề
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kiểm tra nhanh trước khi đọc hoặc mua')

    // Section triệu chứng
    await expect(page.getByText('Bạn đang gặp vấn đề gì?')).toBeVisible()

    // Section rủi ro
    await expect(page.getByText('Có yếu tố cần thận trọng không?')).toBeVisible()

    // Nút đánh giá bị disabled khi chưa chọn
    const evaluateBtn = page.getByRole('button', { name: 'Xem gợi ý' })
    await expect(evaluateBtn).toBeDisabled()

    await snap(page, '01-checker-initial')
  })

  test('selecting symptoms updates sidebar badges', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    // Sidebar ban đầu chưa có gì
    await expect(page.getByText('Chưa chọn triệu chứng')).toBeVisible()

    // Chọn "Sốt hoặc ớn lạnh"
    const feverLabel = page.getByText('Sốt hoặc ớn lạnh')
    await feverLabel.click()
    await snap(page, '02-checker-fever-selected')

    // Sidebar xuất hiện badge — Badge component render với data-slot='badge'
    // Sidebar "Thông tin đã chọn" – không còn hiện "Chưa chọn triệu chứng"
    await expect(page.getByText('Chưa chọn triệu chứng')).not.toBeVisible({ timeout: 5000 })

    // Nút "Xem gợi ý" đã enabled
    await expect(page.getByRole('button', { name: 'Xem gợi ý' })).toBeEnabled()

    // Chọn thêm ho/cảm
    await page.getByText('Ho, đau họng hoặc nghẹt mũi').click()
    await snap(page, '03-checker-two-symptoms')

    // Sidebar có 2 badges trong card "Thông tin đã chọn" (data-slot='badge')
    // Scope vào card sidebar để tránh match badge ở chỗ khác trên trang
    const sidebarCard = page.getByText('Thông tin đã chọn').locator('../..')
    const sidebarBadges = sidebarCard.locator('[data-slot="badge"]')
    const badgeCount = await sidebarBadges.count()
    expect(badgeCount).toBeGreaterThanOrEqual(2)
  })

  test('selfcare level result appears for mild symptoms', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    // Chỉ chọn triệu chứng thường (không chọn rủi ro cao)
    await page.getByText('Đau đầu, đau cơ hoặc đau nhức').click()
    await page.getByRole('button', { name: 'Xem gợi ý' }).click()

    // Chờ kết quả xuất hiện
    const resultCard = page.getByText('Có thể đọc thêm và chọn sản phẩm phù hợp')
    await expect(resultCard).toBeVisible({ timeout: 15_000 })

    await snap(page, '04-checker-selfcare-result')

    // Card màu xanh emerald (selfcare)
    const card = page.locator('.border-emerald-200')
    await expect(card).toBeVisible()

    // 3 nút hành động
    await expect(page.getByRole('link', { name: 'Hỏi dược sĩ' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gửi đơn thuốc' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tìm sản phẩm' })).toBeVisible()
  })

  test('urgent result appears when chestPain is selected', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    // Chọn "Đau ngực, khó thở, tím tái hoặc choáng" (chestPain)
    await page.getByText('Đau ngực, khó thở, tím tái hoặc choáng').click()
    await page.getByRole('button', { name: 'Xem gợi ý' }).click()

    // Kết quả urgent
    const urgentText = page.getByText('Cần tư vấn y tế ngay')
    await expect(urgentText).toBeVisible({ timeout: 15_000 })

    await snap(page, '05-checker-urgent-result')

    // Card màu đỏ (urgent)
    const urgentCard = page.locator('.border-red-200.bg-red-50')
    await expect(urgentCard).toBeVisible()
    await expect(urgentCard).toContainText('Không tự mua thuốc để trì hoãn thăm khám')
  })

  test('pharmacist level result for high-risk factors', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    // Chọn "Đang mang thai" (pregnant)
    await page.getByText('Đang mang thai, cho con bú hoặc trẻ nhỏ dùng thuốc').click()
    await page.getByRole('button', { name: 'Xem gợi ý' }).click()

    const pharmacistText = page.getByText('Nên hỏi dược sĩ trước khi mua')
    await expect(pharmacistText).toBeVisible({ timeout: 15_000 })

    await snap(page, '06-checker-pharmacist-result')

    // Card màu amber
    const amberCard = page.locator('.border-amber-200.bg-amber-50')
    await expect(amberCard).toBeVisible()
  })

  test('related articles section appears after evaluation', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    await page.getByText('Sốt hoặc ớn lạnh').click()
    await page.getByRole('button', { name: 'Xem gợi ý' }).click()

    // Chờ section "Bài viết nên đọc" xuất hiện
    const section = page.getByRole('heading', { name: 'Bài viết nên đọc' })
    await expect(section).toBeVisible({ timeout: 20_000 })

    await snap(page, '07-checker-related-articles')

    // Có ít nhất 1 card bài viết hoặc message không tìm thấy
    const hasArticles = await page.locator('a[href*="/health/article/"]').count()
    const noArticlesMsg = await page.getByText('Chưa tìm thấy bài viết phù hợp').isVisible()
    expect(hasArticles > 0 || noArticlesMsg).toBeTruthy()
  })

  test('can navigate to article from checker results', async ({ page }) => {
    await page.goto(CHECKER_URL)
    await page.waitForLoadState('networkidle')

    await page.getByText('Ho, đau họng hoặc nghẹt mũi').click()
    await page.getByRole('button', { name: 'Xem gợi ý' }).click()

    // Chờ bài viết xuất hiện
    const articleLinks = page.locator('a[href*="/health/article/"]')
    await expect(articleLinks.first()).toBeVisible({ timeout: 20_000 })

    const href = await articleLinks.first().getAttribute('href')
    await articleLinks.first().click()

    await page.waitForLoadState('networkidle')
    await snap(page, '08-checker-navigate-to-article')

    // Đang ở trang bài viết
    expect(page.url()).toContain('/health/article/')
  })
})
