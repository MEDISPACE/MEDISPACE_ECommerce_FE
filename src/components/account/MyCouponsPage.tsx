import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  Copy,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Ticket,
  Truck,
} from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

type CouponStatus = 'usable' | 'needs_min_order' | 'used_up' | 'expired' | 'not_started'

interface MyCoupon {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  startDate: string
  endDate: string
  userCouponStatus: CouponStatus
  userUsageCount?: number
  userUsageLimit?: number
  isTargeted?: boolean
  excludePrescriptionItems?: boolean
}

const statusConfig: Record<CouponStatus, { label: string; className: string }> = {
  usable: { label: 'Có thể dùng ngay', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  needs_min_order: { label: 'Cần đủ điều kiện', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  used_up: { label: 'Đã dùng hết lượt', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
  expired: { label: 'Đã hết hạn', className: 'bg-red-100 text-red-600 hover:bg-red-100' },
  not_started: { label: 'Chưa bắt đầu', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN')

function getCouponValue(coupon: MyCoupon) {
  if (coupon.type === 'free_shipping') return 'Freeship'
  if (coupon.type === 'percentage') {
    return `Giảm ${coupon.value}%${coupon.maxDiscountAmount ? ` tối đa ${formatCurrency(coupon.maxDiscountAmount)}` : ''}`
  }
  return `Giảm ${formatCurrency(coupon.value)}`
}

function getStatusDetail(coupon: MyCoupon) {
  if (coupon.userCouponStatus === 'needs_min_order')
    return `Áp dụng cho đơn từ ${formatCurrency(coupon.minOrderAmount || 0)}`
  if (coupon.userCouponStatus === 'used_up')
    return `Bạn đã dùng ${coupon.userUsageCount || 0}/${coupon.userUsageLimit || 1} lượt`
  if (coupon.userCouponStatus === 'expired') return `Hết hạn từ ${formatDate(coupon.endDate)}`
  if (coupon.userCouponStatus === 'not_started') return `Bắt đầu từ ${formatDate(coupon.startDate)}`
  return coupon.minOrderAmount
    ? `Đơn từ ${formatCurrency(coupon.minOrderAmount)}`
    : 'Không yêu cầu giá trị đơn tối thiểu'
}

function CouponCard({ coupon }: { coupon: MyCoupon }) {
  const [copied, setCopied] = useState(false)
  const status = statusConfig[coupon.userCouponStatus]

  const copyCode = async () => {
    await navigator.clipboard.writeText(coupon.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <Card className='border-[#E8EDF5] bg-white'>
      <CardContent className='p-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <code className='rounded-md bg-[#F0F6FF] px-2.5 py-1 text-sm font-bold text-[#0A2463]'>
                {coupon.code}
              </code>
              <Badge className={status.className}>{status.label}</Badge>
              {coupon.isTargeted && (
                <Badge className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5]'>Dành riêng cho bạn</Badge>
              )}
            </div>
            <h3 className='font-semibold text-gray-900'>{coupon.name}</h3>
            {coupon.description && <p className='mt-1 line-clamp-2 text-sm text-gray-500'>{coupon.description}</p>}
            <div className='mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2'>
              <div className='flex items-center gap-2'>
                {coupon.type === 'free_shipping' ? (
                  <Truck className='h-4 w-4 text-[#1E40AF]' />
                ) : (
                  <Ticket className='h-4 w-4 text-[#1E40AF]' />
                )}
                <span>{getCouponValue(coupon)}</span>
              </div>
              <div className='flex items-center gap-2'>
                <CalendarClock className='h-4 w-4 text-[#1E40AF]' />
                <span>
                  {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                </span>
              </div>
            </div>
            <p className='mt-2 text-sm text-gray-500'>{getStatusDetail(coupon)}</p>
            {coupon.excludePrescriptionItems && (
              <p className='mt-1 text-xs text-gray-400'>Không áp dụng cho đơn có thuốc kê đơn.</p>
            )}
          </div>
          <div className='flex shrink-0 gap-2 sm:flex-col'>
            <Button type='button' variant='outline' className='gap-2 border-[#BFDBFE]' onClick={copyCode}>
              {copied ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
              {copied ? 'Đã copy' : 'Copy mã'}
            </Button>
            {coupon.userCouponStatus === 'usable' && (
              <Link to='/cart'>
                <Button className='w-full gap-2 bg-[#0A2463] text-white hover:bg-[#071A49]'>
                  <ShoppingCart className='h-4 w-4' />
                  Dùng ngay
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MyCouponsPage() {
  const [coupons, setCoupons] = useState<MyCoupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCoupons = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiClient.get<{ result: MyCoupon[] }>('/coupons/mine')
      setCoupons(res.data.result || [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Chưa thể tải ưu đãi của bạn.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const grouped = useMemo(
    () => ({
      usable: coupons.filter((c) => c.userCouponStatus === 'usable'),
      condition: coupons.filter(
        (c) => c.userCouponStatus === 'needs_min_order' || c.userCouponStatus === 'not_started',
      ),
      unavailable: coupons.filter((c) => c.userCouponStatus === 'expired' || c.userCouponStatus === 'used_up'),
    }),
    [coupons],
  )

  const renderList = (items: MyCoupon[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <Card className='border-dashed border-[#BFDBFE]'>
          <CardContent className='p-8 text-center text-gray-500'>{emptyText}</CardContent>
        </Card>
      )
    }
    return (
      <div className='space-y-3'>
        {items.map((coupon) => (
          <CouponCard key={coupon._id || coupon.code} coupon={coupon} />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-blue-800 mb-2'>Ưu đãi của tôi</h1>
          <p className='text-gray-600'>Theo dõi mã công khai và mã dành riêng cho tài khoản của bạn.</p>
        </div>
        <Button variant='outline' onClick={fetchCoupons} className='gap-2 border-[#BFDBFE]' disabled={isLoading}>
          {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
          Làm mới
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <p className='text-sm text-gray-500'>Có thể dùng</p>
            <p className='mt-1 text-2xl font-bold text-green-700'>{grouped.usable.length}</p>
          </CardContent>
        </Card>
        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <p className='text-sm text-gray-500'>Cần điều kiện</p>
            <p className='mt-1 text-2xl font-bold text-yellow-700'>{grouped.condition.length}</p>
          </CardContent>
        </Card>
        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <p className='text-sm text-gray-500'>Hết hạn/đã dùng</p>
            <p className='mt-1 text-2xl font-bold text-gray-700'>{grouped.unavailable.length}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className='border-red-100 bg-red-50'>
          <CardContent className='flex items-center gap-2 p-4 text-sm text-red-700'>
            <AlertCircle className='h-4 w-4' />
            {error}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card className='border-[#E8EDF5]'>
          <CardContent className='flex h-48 items-center justify-center gap-3 text-gray-500'>
            <Loader2 className='h-5 w-5 animate-spin text-[#1E40AF]' />
            Đang tải ưu đãi...
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue='usable' className='space-y-4'>
          <TabsList className='bg-[#F0F6FF]'>
            <TabsTrigger value='usable'>Dùng được</TabsTrigger>
            <TabsTrigger value='condition'>Chưa đủ điều kiện</TabsTrigger>
            <TabsTrigger value='unavailable'>Hết hạn/đã dùng</TabsTrigger>
          </TabsList>
          <TabsContent value='usable'>{renderList(grouped.usable, 'Hiện chưa có mã nào dùng được ngay.')}</TabsContent>
          <TabsContent value='condition'>
            {renderList(grouped.condition, 'Không có mã nào đang chờ đủ điều kiện.')}
          </TabsContent>
          <TabsContent value='unavailable'>
            {renderList(grouped.unavailable, 'Chưa có mã hết hạn hoặc đã dùng hết lượt.')}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
