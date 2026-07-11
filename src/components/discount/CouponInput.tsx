import { useState, useEffect, useRef } from 'react'
import { Tag, X, CheckCircle, Loader2, Ticket } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { apiClient } from '../../services/apiClient'
import { useCart } from '../../contexts/CartContext'

interface AppliedCoupon {
  code: string
  name: string
  discountAmount: number
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
}

interface PublicCoupon {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  excludePrescriptionItems?: boolean
}

interface CouponInputProps {
  subtotal: number
  hasPrescriptionItems?: boolean
  items?: Array<{
    productId: string
    unit?: string
    quantity?: number
    totalPrice: number
    prescriptionRequired?: boolean
  }>
  initialCoupons?: AppliedCoupon[]
  isDirectBuy?: boolean
  onCouponsChange?: (coupons: AppliedCoupon[], totalDiscount: number, freeShipping: boolean) => void
  className?: string
}

const hasStoredAccessToken = () => {
  if (typeof window === 'undefined') return false
  const storage = window.localStorage
  if (!storage || typeof storage.getItem !== 'function') return false
  return Boolean(storage.getItem('medispace_access_token'))
}

export function CouponInput({ subtotal, hasPrescriptionItems = false, items = [], initialCoupons = [], isDirectBuy = false, onCouponsChange, className }: CouponInputProps) {
  const { refreshCart } = useCart()
  const [inputCode, setInputCode] = useState('')
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>(initialCoupons)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [publicCoupons, setPublicCoupons] = useState<PublicCoupon[]>([])
  const [isLoadingPublicCoupons, setIsLoadingPublicCoupons] = useState(false)

  // Sync khi initialCoupons thay đổi (do cart load async từ API)
  const prevInitialRef = useRef<string>('')
  useEffect(() => {
    const key = initialCoupons.map(c => c.code).join(',')
    if (key !== prevInitialRef.current) {
      prevInitialRef.current = key
      setAppliedCoupons(initialCoupons)
    }
  }, [initialCoupons])

  useEffect(() => {
    let mounted = true

    const fetchAvailableCoupons = async () => {
      setIsLoadingPublicCoupons(true)
      try {
        const hasAccessToken = hasStoredAccessToken()
        const res = await apiClient.get<any>(hasAccessToken ? '/coupons/available' : '/coupons/public')
        if (mounted) setPublicCoupons(res.data.result || [])
      } catch (err: any) {
        const status = err?.response?.status
        const shouldFallbackToPublic = hasStoredAccessToken() && (status === 401 || status === 403)

        if (shouldFallbackToPublic) {
          try {
            const res = await apiClient.get<any>('/coupons/public')
            if (mounted) setPublicCoupons(res.data.result || [])
          } catch {
            if (mounted) setPublicCoupons([])
          }
          return
        }

        if (mounted) setPublicCoupons([])
      } finally {
        if (mounted) setIsLoadingPublicCoupons(false)
      }
    }

    fetchAvailableCoupons()
    return () => {
      mounted = false
    }
  }, [])

  const selectionSignature = `${subtotal}:${items
    .map(item => `${item.productId}:${item.unit || ''}:${item.quantity || 0}:${item.totalPrice}`)
    .join('|')}`

  useEffect(() => {
    if (appliedCoupons.length === 0) return

    const timeout = window.setTimeout(async () => {
      try {
        const validations = await Promise.all(
          appliedCoupons.map(async coupon => {
            const res = await apiClient.post<any>('/coupons/validate', {
              code: coupon.code,
              cartSubtotal: subtotal,
              hasPrescriptionItems,
              items,
            })
            return { coupon, validation: res.data.result }
          }),
        )

        const invalidCodes = validations
          .filter(({ validation }) => !validation.isValid)
          .map(({ coupon }) => coupon.code)

        if (!isDirectBuy && invalidCodes.length > 0) {
          await Promise.all(invalidCodes.map(code => apiClient.delete('/coupons/remove', { data: { code } })))
          await refreshCart()
        }

        const updated = validations
          .filter(({ validation }) => validation.isValid)
          .map(({ coupon, validation }) => ({
            ...coupon,
            discountAmount: validation.discountAmount,
            type: validation.discountType,
          }))
        const currentKey = appliedCoupons.map(c => `${c.code}:${c.discountAmount}`).join('|')
        const updatedKey = updated.map(c => `${c.code}:${c.discountAmount}`).join('|')

        if (currentKey !== updatedKey) setAppliedCoupons(updated)
        const totalDiscount = updated
          .filter(c => c.type !== 'free_shipping')
          .reduce((sum, c) => sum + c.discountAmount, 0)
        onCouponsChange?.(updated, totalDiscount, updated.some(c => c.type === 'free_shipping'))
        if (invalidCodes.length > 0) setError('Một mã giảm giá không còn áp dụng cho các sản phẩm đã chọn.')
      } catch {
        // Keep the last confirmed preview when re-validation is temporarily unavailable.
      }
    }, 300)

    return () => window.clearTimeout(timeout)
    // Revalidate only when the selected cart contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionSignature])

  const handleApply = async (presetCode?: string) => {
    const code = (presetCode || inputCode).trim().toUpperCase()
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
        const res = await apiClient.post<any>('/coupons/validate', {
          code,
          cartSubtotal: subtotal,
          hasPrescriptionItems,
          items
        })
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
        if (!presetCode) setInputCode('')
        setSuccess(`Áp dụng "${newCoupon.name}" thành công!`)

        const totalDiscount = updated
          .filter(c => c.type !== 'free_shipping')
          .reduce((sum, c) => sum + c.discountAmount, 0)
        const hasFreeShip = updated.some(c => c.type === 'free_shipping')
        onCouponsChange?.(updated, totalDiscount, hasFreeShip)

      } else {
        // Normal cart flow — truyền subtotal của items đang được chọn
        const res = await apiClient.post<any>('/coupons/apply', {
          code,
          selectedItems: items.map(item => ({ productId: item.productId, unit: item.unit }))
        })
        const data = res.data.result

        const newCoupon: AppliedCoupon = data.addedCoupon
        const updated = [...appliedCoupons, newCoupon]
        setAppliedCoupons(updated)
        if (!presetCode) setInputCode('')
        setSuccess(`Áp dụng "${newCoupon.name}" thành công!`)

        const totalDiscount = updated
          .filter(c => c.type !== 'free_shipping')
          .reduce((sum, c) => sum + c.discountAmount, 0)
        const hasFreeShip = updated.some(c => c.type === 'free_shipping')
        onCouponsChange?.(updated, totalDiscount, hasFreeShip)

        // Sync lại CartContext để checkout và các trang khác thấy mã
        await refreshCart()
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
        // Sync cart context sau khi xóa mã
        await refreshCart()
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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Chưa thể xoá mã giảm giá. Vui lòng thử lại.')
      setSuccess('')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ'

  const getCouponLabel = (coupon: AppliedCoupon) => {
    if (coupon.type === 'free_shipping') return 'Miễn phí vận chuyển'
    return `-${formatCurrency(coupon.discountAmount)}`
  }

  const getPublicCouponLabel = (coupon: PublicCoupon) => {
    if (coupon.type === 'free_shipping') return 'Freeship'
    if (coupon.type === 'percentage') {
      return `-${coupon.value}%${coupon.maxDiscountAmount ? ` tối đa ${formatCurrency(coupon.maxDiscountAmount)}` : ''}`
    }
    return `-${formatCurrency(coupon.value)}`
  }

  const getPublicCouponUnavailableReason = (coupon: PublicCoupon) => {
    if (appliedCoupons.some(applied => applied.code === coupon.code)) return 'Đang áp dụng'
    if ((coupon.minOrderAmount || 0) > subtotal) return `Cần đơn từ ${formatCurrency(coupon.minOrderAmount || 0)}`
    if (coupon.excludePrescriptionItems && hasPrescriptionItems) return 'Không áp dụng thuốc kê đơn'
    if (coupon.type === 'free_shipping' && appliedCoupons.some(applied => applied.type === 'free_shipping')) {
      return 'Đã có mã freeship'
    }
    if (coupon.type !== 'free_shipping' && appliedCoupons.some(applied => applied.type !== 'free_shipping')) {
      return 'Đã có mã giảm giá'
    }
    return ''
  }

  const visiblePublicCoupons = publicCoupons
    .filter(coupon => !appliedCoupons.some(applied => applied.code === coupon.code))
    .map(coupon => ({ coupon, unavailableReason: getPublicCouponUnavailableReason(coupon) }))

  const usableCoupons = visiblePublicCoupons
    .filter(item => !item.unavailableReason)
    .slice(0, 3)

  const unavailableCoupons = visiblePublicCoupons
    .filter(item => item.unavailableReason)
    .slice(0, 3)

  const hasVisibleCoupons = usableCoupons.length > 0 || unavailableCoupons.length > 0

  const renderCouponRow = (coupon: PublicCoupon, unavailableReason = '') => {
    const isUnavailable = Boolean(unavailableReason)

    return (
      <div
        key={coupon._id || coupon.code}
        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
          isUnavailable ? 'border-gray-100 bg-gray-50' : 'border-[#BFDBFE] bg-[#F0F6FF]'
        }`}
      >
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <code className='rounded bg-white px-2 py-0.5 text-xs font-bold text-[#0A2463]'>
              {coupon.code}
            </code>
            <Badge className={isUnavailable ? 'bg-gray-100 text-gray-600 hover:bg-gray-100' : 'bg-green-100 text-green-800 hover:bg-green-100'}>
              {getPublicCouponLabel(coupon)}
            </Badge>
          </div>
          <p className='mt-1 truncate text-xs text-gray-600'>{coupon.name}</p>
          {unavailableReason && <p className='mt-0.5 text-xs text-gray-400'>{unavailableReason}</p>}
        </div>
        <Button
          type='button'
          size='sm'
          variant={isUnavailable ? 'outline' : 'default'}
          disabled={isLoading || isUnavailable}
          onClick={() => handleApply(coupon.code)}
          className={isUnavailable ? 'shrink-0' : 'shrink-0 bg-[#0A2463] text-white hover:bg-[#071A49]'}
        >
          Áp dụng
        </Button>
      </div>
    )
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
          onClick={() => handleApply()}
          disabled={isLoading || !inputCode.trim()}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white px-5 shrink-0'
        >
          {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Áp dụng'}
        </Button>
      </div>

      {(isLoadingPublicCoupons || hasVisibleCoupons) && (
        <div className='mt-3 rounded-lg border border-[#E8EDF5] bg-white p-3'>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='text-sm font-semibold text-[#0A2463]'>Mã giảm giá khả dụng</span>
            {isLoadingPublicCoupons && <Loader2 className='h-3.5 w-3.5 animate-spin text-[#1E40AF]' />}
          </div>
          <div className='space-y-2'>
            {usableCoupons.length > 0 && (
              <div className='space-y-2'>
                <p className='text-xs font-semibold uppercase tracking-wide text-green-700'>Dùng được</p>
                {usableCoupons.map(({ coupon }) => renderCouponRow(coupon))}
              </div>
            )}
            {unavailableCoupons.length > 0 && (
              <div className='space-y-2'>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Chưa đủ điều kiện</p>
                {unavailableCoupons.map(({ coupon, unavailableReason }) => renderCouponRow(coupon, unavailableReason))}
              </div>
            )}
          </div>
        </div>
      )}

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
              className='flex items-center justify-between bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg px-3 py-2'
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
