import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CouponInput } from '../components/discount/CouponInput'

const { post, remove, refreshCart } = vi.hoisted(() => ({
  post: vi.fn(),
  remove: vi.fn(),
  refreshCart: vi.fn()
}))

vi.mock('../services/apiClient', () => ({
  apiClient: { post, delete: remove }
}))

vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({ refreshCart })
}))

describe('CouponInput selection revalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  it('removes and reports a coupon that becomes invalid after selected items change', async () => {
    post
      .mockResolvedValueOnce({
        data: { result: { isValid: true, discountAmount: 10_000, discountType: 'fixed_amount' } }
      })
      .mockResolvedValueOnce({
        data: { result: { isValid: false, message: 'Không đủ giá trị đơn hàng' } }
      })
    remove.mockResolvedValue({ data: {} })

    const initialCoupons = [{
      code: 'MINIMUM',
      name: 'Giảm theo giá trị đơn',
      discountAmount: 10_000,
      type: 'fixed_amount' as const
    }]
    const { rerender } = render(
      <CouponInput
        subtotal={200_000}
        items={[{ productId: 'p1', quantity: 2, totalPrice: 200_000 }]}
        initialCoupons={initialCoupons}
      />
    )

    await act(async () => vi.advanceTimersByTimeAsync(300))
    rerender(
      <CouponInput
        subtotal={100_000}
        items={[{ productId: 'p1', quantity: 1, totalPrice: 100_000 }]}
        initialCoupons={initialCoupons}
      />
    )
    await act(async () => vi.advanceTimersByTimeAsync(300))

    expect(post).toHaveBeenLastCalledWith('/coupons/validate', expect.objectContaining({
      code: 'MINIMUM',
      cartSubtotal: 100_000
    }))
    expect(remove).toHaveBeenCalledWith('/coupons/remove', { data: { code: 'MINIMUM' } })
    expect(refreshCart).toHaveBeenCalled()
    expect(screen.getByText('Một mã giảm giá không còn áp dụng cho các sản phẩm đã chọn.')).toBeInTheDocument()
  })
})
