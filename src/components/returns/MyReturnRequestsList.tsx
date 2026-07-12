import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Package, Clock, ChevronRight, RefreshCw } from 'lucide-react'
import returnRequestService, {
  type ReturnRequest,
  ReturnStatus,
  returnStatusLabels,
  returnStatusColors,
  returnReasonLabels,
} from '~/services/returnRequestService'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function MyReturnRequestsList() {
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-return-requests', statusFilter, page],
    queryFn: () =>
      returnRequestService.getMyReturnRequests({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  const requests = data?.requests || []
  const pagination = data?.pagination

  return (
    <div className='space-y-6 text-gray-900 [color-scheme:light]'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-blue-800 mb-2'>Yêu cầu đổi/trả hàng</h1>
          <p className='text-gray-600'>Theo dõi các yêu cầu đổi trả của bạn</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => refetch()}
          className='bg-white text-gray-900 hover:bg-gray-50'
        >
          <RefreshCw className='h-4 w-4 mr-2' />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className='flex gap-4'>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReturnStatus | 'all')}>
          <SelectTrigger className='w-[200px] bg-white text-gray-900 border-gray-300 [color-scheme:light]'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            {Object.values(ReturnStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {returnStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <Card key={i} className='border-[#E8EDF5] bg-white text-gray-900'>
              <CardContent className='pt-6'>
                <div className='flex gap-4'>
                  <Skeleton className='h-16 w-16 rounded' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='h-4 w-1/4' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && requests.length === 0 && (
        <Card className='border-[#E8EDF5] bg-white text-gray-900 shadow-sm'>
          <CardContent className='pt-12 pb-12 text-center border-[#E8EDF5]'>
            <Package className='h-12 w-12 mx-auto text-[#0A2463] mb-4' />
            <h3 className='font-medium mb-2'>Chưa có yêu cầu đổi/trả nào</h3>
            <p className='text-sm text-gray-600'>
              Bạn chưa gửi yêu cầu đổi/trả hàng nào. Nếu cần đổi trả sản phẩm, vui lòng vào chi tiết đơn hàng đã giao.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Requests list */}
      {!isLoading && requests.length > 0 && (
        <div className='space-y-4'>
          {requests.map((request: ReturnRequest) => (
            <Card
              key={request._id}
              className='bg-white text-gray-900 hover:shadow-md transition-shadow border-[#E8EDF5]'
            >
              <CardContent className='pt-6'>
                <Link to={`/account/returns/${request._id}`} className='block'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-3 mb-2'>
                        <span className='font-medium text-blue-800'>#{request.requestNumber}</span>
                        <Badge className={returnStatusColors[request.status]}>
                          {returnStatusLabels[request.status]}
                        </Badge>
                      </div>

                      <p className='text-sm text-muted-foreground mb-2'>Đơn hàng: #{request.orderNumber}</p>

                      <p className='text-sm mb-2'>
                        <span className='text-muted-foreground'>Lý do: </span>
                        {returnReasonLabels[request.reason]}
                      </p>

                      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Package className='h-4 w-4' />
                          <span>{request.items.length} sản phẩm</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-4 w-4' />
                          <span>
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className='mt-3 pt-3 border-t border-[#BFDBFE]'>
                        <p className='font-medium'>
                          Số tiền yêu cầu hoàn:{' '}
                          <span className='text-[#1E40AF]'>{request.requestedAmount.toLocaleString()}đ</span>
                        </p>
                        {request.approvedAmount && (
                          <p className='text-sm text-muted-foreground'>
                            Số tiền được duyệt: {request.approvedAmount.toLocaleString()}đ
                          </p>
                        )}
                        {request.refundedAmount && (
                          <p className='text-sm text-green-600'>Đã hoàn: {request.refundedAmount.toLocaleString()}đ</p>
                        )}
                      </div>
                    </div>

                    <ChevronRight className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className='text-sm text-muted-foreground'>
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
