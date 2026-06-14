import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getPaymentStatusBadge } from '../utils/badgeUtils'

describe('payment status badge labels', () => {
  it('shows COD pending payment as awaiting cash collection', () => {
    render(getPaymentStatusBadge('pending', { paymentMethod: 'cod' }))

    expect(screen.getByText('Chờ thu tiền khi nhận hàng')).toBeInTheDocument()
  })

  it('keeps online pending payment label as awaiting payment', () => {
    render(getPaymentStatusBadge('pending', { paymentMethod: 'payos' }))

    expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument()
  })
})
