import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account reviews', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/reviews`)
  })

  test('review tabs show purchased unreviewed and submitted reviews', async ({ page }) => {
    await expect(testId(page, 'reviews-page')).toBeVisible()
    await testId(page, 'reviews-tab-pending').click()
    await expect(testId(page, 'pending-reviews-list')).toBeVisible()
    await testId(page, 'reviews-tab-all').click()
    await expect(testId(page, 'submitted-reviews-list')).toBeVisible()
  })

  test('review form validates and submit appears in submitted tab', async ({ page }) => {
    await testId(page, 'write-review-btn').first().click()
    await expect(testId(page, 'review-dialog')).toBeVisible()
    await testId(page, 'submit-review-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
    await testId(page, 'rating-star-5').click()
    await testId(page, 'review-textarea').fill('Sản phẩm tốt, giao hàng đúng và đóng gói cẩn thận')
    await testId(page, 'submit-review-btn').click()
    await expect(testId(page, 'submitted-reviews-list')).toContainText('Sản phẩm tốt')
  })

  test('edit and delete existing review work with confirmation', async ({ page }) => {
    await testId(page, 'edit-review-btn').first().click()
    await expect(testId(page, 'review-dialog')).toBeVisible()
    await testId(page, 'review-textarea').fill('Nội dung đánh giá đã chỉnh sửa')
    await testId(page, 'submit-review-btn').click()
    await testId(page, 'delete-review-btn').first().click()
    await expect(testId(page, 'delete-review-dialog')).toBeVisible()
    await testId(page, 'confirm-delete-review').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })

  test('cannot review product not purchased or before delivery', async ({ page }) => {
    await page.goto(`${APP_URL}/products/prod-1`)
    await expect(testId(page, 'write-review-btn')).not.toBeVisible()
  })
})
