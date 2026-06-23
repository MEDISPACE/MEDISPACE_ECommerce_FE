import { describe, expect, test } from 'vitest'
import { canReview, formatReviewDate, sortReviews, validateReviewForm, validateReviewPhoto } from '../helpers/account-unit'

describe('account reviews unit rules', () => {
  test('canReview true only for delivered orders not yet reviewed', () => {
    expect(canReview({ status: 'delivered', alreadyReviewed: false })).toBe(true)
  })

  test('canReview false if already reviewed', () => {
    expect(canReview({ status: 'delivered', alreadyReviewed: true })).toBe(false)
  })

  test('canReview false if order not delivered', () => {
    expect(canReview({ status: 'processing', alreadyReviewed: false })).toBe(false)
  })

  test('validateReviewForm fails with no star rating', () => {
    expect(validateReviewForm({ text: 'Sản phẩm rất tốt' })).toBe(false)
  })

  test('validateReviewForm fails with text < min length', () => {
    expect(validateReviewForm({ rating: 5, text: 'ngắn' })).toBe(false)
  })

  test('validateReviewForm fails with text > max length', () => {
    expect(validateReviewForm({ rating: 5, text: 'a'.repeat(1001) })).toBe(false)
  })

  test('validateReviewPhoto rejects invalid file types', () => {
    expect(validateReviewPhoto({ type: 'application/pdf', size: 1000 })).toBe(false)
  })

  test('formatReviewDate displays correctly', () => {
    expect(formatReviewDate('2026-06-23T00:00:00.000Z')).toContain('2026')
  })

  test('sortReviews by date descending', () => {
    expect(sortReviews([{ id: 'old', createdAt: '2026-06-01' }, { id: 'new', createdAt: '2026-06-23' }])[0].id).toBe('new')
  })
})
