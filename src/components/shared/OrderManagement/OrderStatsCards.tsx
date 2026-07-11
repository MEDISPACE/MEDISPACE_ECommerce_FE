import { ShoppingCart, Clock, Package, CheckCircle, XCircle, CreditCard, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import type { OrderStats, RoleConfig } from './types'
import { formatCurrency } from '~/utils/formatCurrency'

interface OrderStatsCardsProps {
  stats: OrderStats
  config: RoleConfig
}

export function OrderStatsCards({ stats, config }: OrderStatsCardsProps) {
  const isPharmacist = config.themeColor === 'cyan'
  const labels = isPharmacist
    ? {
        total: 'Chờ chung',
        pending: 'Của tôi',
        processing: 'Đang xử lý',
        delivered: 'Hoàn tất',
        returned: 'Đổi/trả',
        cancelled: 'Đã hủy',
        revenue: 'Doanh thu của tôi',
      }
    : {
        total: 'Tổng đơn',
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        delivered: 'Đã giao',
        returned: 'Đổi/trả',
        cancelled: 'Đã hủy',
        revenue: 'Tổng doanh thu',
      }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4'>
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.total}</p>
              <p className={`text-2xl font-semibold text-${config.themeColor}-600`}>{stats.total}</p>
            </div>
            <ShoppingCart className={`w-8 h-8 text-${config.themeColor}-400`} />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.pending}</p>
              <p className='text-2xl font-semibold text-yellow-600'>{stats.pending}</p>
            </div>
            <Clock className='w-8 h-8 text-yellow-400' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.processing}</p>
              <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.processing}</p>
            </div>
            <Package className='w-8 h-8 text-[#1E40AF]' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.delivered}</p>
              <p className='text-2xl font-semibold text-green-600'>{stats.delivered}</p>
            </div>
            <CheckCircle className='w-8 h-8 text-green-400' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.returned}</p>
              <p className='text-2xl font-semibold text-amber-600'>{stats.returned}</p>
            </div>
            <RotateCcw className='w-8 h-8 text-amber-400' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.cancelled}</p>
              <p className='text-2xl font-semibold text-red-600'>{stats.cancelled}</p>
            </div>
            <XCircle className='w-8 h-8 text-red-400' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] lg:col-span-2'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600'>{labels.revenue}</p>
              <p className='text-xl font-semibold text-green-600'>{formatCurrency(stats.revenue)}</p>
              <p className='text-xs text-gray-500 mt-1'>TB: {formatCurrency(stats.avgOrder)}/đơn</p>
            </div>
            <CreditCard className='w-8 h-8 text-green-400' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
