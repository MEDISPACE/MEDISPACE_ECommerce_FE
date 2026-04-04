import { useState } from 'react'
import { Tag, X, CheckCircle, Loader2, Ticket } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { apiClient } from '../../services/apiClient'

interface AppliedCoupon {
  code: string
  name: string
  discountAmount: number
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
}

interface CouponInputProps {
  subtotal: number
  hasPrescriptionItems?: boolean
  initialCoupons?: AppliedCoupon[]
  isDirectBuy?: boolean
  onCouponsChange?: (coupons: AppliedCoupon[], totalDiscount: number, freeShipping: boolean) => void
  className?: string
}

export function CouponInput({ subtotal, hasPrescriptionItems = false, initialCoupons = [], isDirectBuy = false, onCouponsChange, className }: CouponInputProps) {
  const [inputCode, setInputCode] = useState('')
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>(initialCoupons)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleApply = async () => {
    const code = inputCode.trim().toUpperCase()
    if (!code) {
      setError('Vui lòng nhập mã giảm giá.')
      return
    }

    // Check already applied
    if (appliedCoupons.some(c => c.code === code)) {
      setError('Mã này đã được áp dụng.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isDirectBuy) {
        // Direct buy just previews the coupon without saving to cart
        const res = await apiClient.post<any>('/coupons/validate', { code, cartSubtotal: subtotal, hasPrescriptionItems })
        const data = res.data.result

        if (!data.isValid) {
            setError(data.message)
            setIsLoading(false)
            return
        }

        const newCoupon: AppliedCoupon = {
           code: data.coupon.code,
           name: data.coupon.name,
           discountAmount: data.discountAmount,
           type: data.discountType
        }

        const updated = [...appliedCoupons, newCoupon]
        
        // Stacking rules validation manually for preview
        const hasFreeship = updated.filter(c => c.type === 'free_shipping').length > 1
        const hasDiscount = updated.filter(c => c.type !== 'free_shipping').length > 1

        if (hasFreeship) {
            setError('Chỉ được áp dụng 1 mã miễn phí vận chuyển.')
            setIsLoading(false)
            return
        }
        if (hasDiscount) {
            setError('Chỉ được áp dụng 1 mã giảm giá.')
            setIsLoading(false)
            return
        }

        setAppliedCoupons(updated)
        setInputCode('')
        setSuccess(`Áp dụng "${newCoupon.name}" thành công!`)

        const totalDiscount = updated
          .filter(c => c.type !== 'free_shipping')
          .reduce((sum, c) => sum + c.discountAmount, 0)
        const hasFreeShip = updated.some(c => c.type === 'free_shipping')
        onCouponsChange?.(updated, totalDiscount, hasFreeShip)

      } else {
        // Normal cart flow
        const res = await apiClient.post<any>('/coupons/apply', { code })
        const data = res.data.result

        const newCoupon: AppliedCoupon = data.addedCoupon
        const updated = [...appliedCoupons, newCoupon]
        setAppliedCoupons(updated)
        setInputCode('')
        setSuccess(`Áp dụng "${newCoupon.name}" thành công!`)

        const totalDiscount = updated
          .filter(c => c.type !== 'free_shipping')
          .reduce((sum, c) => sum + c.discountAmount, 0)
        const hasFreeShip = updated.some(c => c.type === 'free_shipping')
        onCouponsChange?.(updated, totalDiscount, hasFreeShip)
      }

      // Clear success message after 3s
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã giảm giá không hợp lệ.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (code: string) => {
    try {
      if (!isDirectBuy) {
        await apiClient.delete('/coupons/remove', { data: { code } })
      }
      
      const updated = appliedCoupons.filter(c => c.code !== code)
      setAppliedCoupons(updated)
      setError('')
      setSuccess('')

      const totalDiscount = updated
        .filter(c => c.type !== 'free_shipping')
        .reduce((sum, c) => sum + c.discountAmount, 0)
      const hasFreeShip = updated.some(c => c.type === 'free_shipping')
      onCouponsChange?.(updated, totalDiscount, hasFreeShip)
    } catch {
      // silently remove from UI anyway
      const updated = appliedCoupons.filter(c => c.code !== code)
      setAppliedCoupons(updated)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ'

  const getCouponLabel = (coupon: AppliedCoupon) => {
    if (coupon.type === 'free_shipping') return 'Miễn phí vận chuyển'
    return `-${formatCurrency(coupon.discountAmount)}`
  }

  return (
    <div className={className}>
      {/* Input Row */}
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Tag className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <Input
            id='coupon-input'
            value={inputCode}
            onChange={e => { setInputCode(e.target.value.toUpperCase()); setError(''); setSuccess('') }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder='Nhập mã giảm giá'
            className='pl-9 border-gray-200 uppercase placeholder:normal-case focus:border-blue-400'
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={isLoading || !inputCode.trim()}
          className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-5 shrink-0'
        >
          {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Áp dụng'}
        </Button>
      </div>

      {/* Error / Success messages */}
      {error && (
        <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
          <X className='w-3.5 h-3.5' />
          {error}
        </p>
      )}
      {success && (
        <p className='text-green-600 text-sm mt-1.5 flex items-center gap-1'>
          <CheckCircle className='w-3.5 h-3.5' />
          {success}
        </p>
      )}

      {/* Applied coupons list */}
      {appliedCoupons.length > 0 && (
        <div className='mt-3 space-y-2'>
          {appliedCoupons.map(coupon => (
            <div
              key={coupon.code}
              className='flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2'
            >
              <div className='flex items-center gap-2'>
                <Ticket className='w-4 h-4 text-blue-500 shrink-0' />
                <div>
                  <span className='font-semibold text-blue-800 text-sm'>{coupon.code}</span>
                  <span className='text-gray-500 text-xs ml-2'>{coupon.name}</span>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-100 text-green-800 hover:bg-green-100 font-semibold'>
                  {getCouponLabel(coupon)}
                </Badge>
                <button
                  onClick={() => handleRemove(coupon.code)}
                  className='text-gray-400 hover:text-red-500 transition-colors'
                  aria-label={`Xoá mã ${coupon.code}`}
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
