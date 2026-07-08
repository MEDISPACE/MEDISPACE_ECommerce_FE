import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import returnRequestService, {
  ReturnStatus,
  returnStatusLabels,
  returnStatusColors,
  returnReasonLabels,
} from '~/services/returnRequestService'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Status timeline order
const statusOrder: ReturnStatus[] = [
  ReturnStatus.PENDING,
  ReturnStatus.REVIEWING,
  ReturnStatus.APPROVED,
  ReturnStatus.AWAITING_RETURN,
  ReturnStatus.RECEIVED,
  ReturnStatus.REFUND_PROCESSING,
  ReturnStatus.COMPLETED,
]

const getCarrierDisplayName = (carrier?: string) => {
  const carriers: Record<string, string> = {
    mock_carrier: 'MEDISPACE Delivery',
    ghn: 'GHN',
    ghtk: 'GHTK',
    ahamove: 'Ahamove',
  }
  return carrier ? carriers[carrier] || carrier : ''
}

const getTrackingStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    arranged: 'Đã sắp xếp thu hồi',
    picked_up: 'Đã lấy hàng',
    in_transit: 'Đang vận chuyển',
    delivered_to_store: 'Đã về MEDISPACE',
    failed: 'Thu hồi chưa thành công',
    cancelled: 'Đã hủy thu hồi',
  }
  return status ? labels[status] || status : ''
}

const getTrackingEventMessage = (event: { status: string; message?: string }) => {
  const legacyMessages: Record<string, string> = {
    'Return pickup has been arranged by MEDISPACE': 'MEDISPACE đã sắp xếp thu hồi hàng trả',
    'Return pickup has been arranged': 'MEDISPACE đã sắp xếp thu hồi hàng trả',
    'Returned items have been picked up from customer': 'Đã lấy hàng trả từ khách',
    'Returned items are in transit to MEDISPACE': 'Hàng trả đang vận chuyển về MEDISPACE',
    'Returned items have arrived at MEDISPACE': 'Hàng trả đã về MEDISPACE',
    'Returned items have been received by MEDISPACE': 'MEDISPACE đã nhận hàng trả',
    'Return pickup failed and needs follow-up': 'Thu hồi hàng trả chưa thành công, cần xử lý lại',
    'Return pickup has been cancelled': 'Đã hủy lịch thu hồi hàng trả',
  }
  if (event.message && legacyMessages[event.message]) return legacyMessages[event.message]
  return event.message || getTrackingStatusLabel(event.status)
}

export default function ReturnRequestDetail() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { data: request, isLoading } = useQuery({
    queryKey: ['return-request', requestId],
    queryFn: () => returnRequestService.getReturnRequestById(requestId!),
    enabled: !!requestId,
    refetchInterval: 5000,
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => returnRequestService.cancelReturnRequest(requestId!),
    onSuccess: () => {
      toast.success('Đã hủy yêu cầu đổi/trả')
      queryClient.invalidateQueries({ queryKey: ['return-request', requestId] })
      setShowCancelDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể hủy yêu cầu')
    },
  })

  // Check if can cancel
  const canCancel = request && [ReturnStatus.PENDING, ReturnStatus.REVIEWING].includes(request.status as ReturnStatus)

  // Check if the approved return request is past its pickup deadline
  const isReturnDeadlinePassed = request?.returnDeadline
    ? new Date(request.returnDeadline).getTime() < Date.now()
    : false

  // Get status index for timeline
  const getStatusIndex = (status: ReturnStatus) => {
    if (status === ReturnStatus.REJECTED || status === ReturnStatus.CANCELLED) {
      return -1
    }
    return statusOrder.indexOf(status)
  }

  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <Skeleton className='h-8 w-48' />
        <Card>
          <CardContent className='pt-6 space-y-4'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-1/2' />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!request) {
    return (
      <div className='max-w-4xl mx-auto p-6 text-center'>
        <XCircle className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
        <h2 className='text-xl font-medium mb-2'>Không tìm thấy yêu cầu</h2>
        <Button onClick={() => navigate('/account/returns')}>Quay lại danh sách</Button>
      </div>
    )
  }

  const currentStatusIndex = getStatusIndex(request.status as ReturnStatus)

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate('/account/returns')}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-blue-900'>Chi tiết yêu cầu #{request.requestNumber}</h1>
          <p className='text-muted-foreground'>Đơn hàng: #{request.orderNumber}</p>
        </div>
        <Button variant='outline' onClick={() => navigate(`/account/orders/${request.orderId}`)}>
          <ExternalLink className='h-4 w-4 mr-2' />
          Xem đơn hàng
        </Button>
        <Badge className={returnStatusColors[request.status]}>{returnStatusLabels[request.status]}</Badge>
      </div>

      {/* Status Timeline */}
      {currentStatusIndex >= 0 && (
        <Card className='border-[#E8EDF5]'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-blue-800'>
              <Clock className='h-5 w-5' />
              Tiến trình xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Timeline */}
            <div className='relative'>
              {/* Connecting line */}
              <div
                className='absolute top-5 left-0 right-0 h-0.5 bg-gray-200'
                style={{ marginLeft: '7%', marginRight: '7%' }}
              />
              <div
                className='absolute top-5 left-0 h-0.5 bg-[#1E40AF] transition-all duration-500'
                style={{
                  marginLeft: '7%',
                  width: `${Math.min(currentStatusIndex, statusOrder.length - 1) * (86 / (statusOrder.length - 1))}%`,
                }}
              />

              {/* Steps */}
              <div className='flex items-start justify-between relative'>
                {statusOrder.map((status, index) => {
                  const isCompleted = index < currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  const isActive = index <= currentStatusIndex

                  return (
                    <div key={status} className='flex flex-col items-center flex-1 z-10'>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-[#1E40AF] border-[#1E40AF] text-white'
                            : isCurrent
                              ? 'bg-[#1E40AF] border-[#1E40AF] text-white ring-4 ring-blue-100'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className='h-5 w-5' />
                        ) : (
                          <span className='text-sm font-semibold'>{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 text-center max-w-[80px] leading-tight ${
                          isActive ? 'font-medium text-[#0A2463]' : 'text-gray-500'
                        }`}
                      >
                        {returnStatusLabels[status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected/Cancelled notice */}
      {(request.status === ReturnStatus.REJECTED || request.status === ReturnStatus.CANCELLED) && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <XCircle className='h-5 w-5 text-red-600 flex-shrink-0' />
              <div>
                <p className='font-medium text-red-800'>
                  {request.status === ReturnStatus.REJECTED ? 'Yêu cầu bị từ chối' : 'Yêu cầu đã hủy'}
                </p>
                {request.rejectionReason && (
                  <p className='text-sm text-red-700 mt-1'>Lý do: {request.rejectionReason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Action buttons */}
      {(canCancel || request.status === ReturnStatus.APPROVED || request.status === ReturnStatus.AWAITING_RETURN) && (
        <Card className='border-[#E8EDF5]'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              {canCancel && (
                <Button variant='destructive' onClick={() => setShowCancelDialog(true)}>
                  Hủy yêu cầu
                </Button>
              )}
            </div>
            {request.status === ReturnStatus.APPROVED && !isReturnDeadlinePassed && (
              <p className='text-sm text-[#1E40AF] mt-2'>
                <Truck className='h-4 w-4 inline mr-1' />
                Yêu cầu đã được duyệt. MEDISPACE đang sắp xếp thu hồi hàng trả, bạn vui lòng chuẩn bị sản phẩm và giữ nguyên tình trạng hàng.
              </p>
            )}
            {request.status === ReturnStatus.APPROVED && request.returnDeadline && !isReturnDeadlinePassed && (
              <p className='text-sm text-amber-600 mt-2'>
                <AlertTriangle className='h-4 w-4 inline mr-1' />
                Hạn xử lý thu hồi: {format(new Date(request.returnDeadline), 'dd/MM/yyyy')}
              </p>
            )}
            {request.status === ReturnStatus.APPROVED && isReturnDeadlinePassed && (
              <p className='text-sm text-red-600 mt-2'>
                <AlertTriangle className='h-4 w-4 inline mr-1' />
                Yêu cầu đã quá hạn thu hồi hàng trả.
              </p>
            )}
            {request.status === ReturnStatus.AWAITING_RETURN && (
              <p className='text-sm text-[#1E40AF] mt-2'>
                <Truck className='h-4 w-4 inline mr-1' />
                MEDISPACE đang thu hồi hàng trả. Mã vận đơn thu hồi sẽ được dùng để đối soát khi nhận hàng.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-800'>
            <Package className='h-5 w-5' />
            Sản phẩm đổi/trả ({request.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {request.items.map((item, index) => (
              <div key={index} className='flex gap-4 p-4 border border-[#E8EDF5] rounded-lg bg-[#F0F6FF]/30'>
                {/* Product Image */}
                <div className='w-20 h-20 bg-[#E8EDF5] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className='w-full h-full object-cover' />
                  ) : (
                    <Package className='h-8 w-8 text-blue-400' />
                  )}
                </div>
                <div className='flex-1'>
                  <h4 className='font-medium text-blue-800'>{item.productName}</h4>
                  <p className='text-sm text-muted-foreground'>
                    SKU: {item.sku} | Đơn vị: {item.unit} | Số lượng: {item.quantity}
                  </p>
                  <p className='text-sm'>
                    Giá: <span className='text-[#1E40AF]'>{(item.unitPrice ?? 0).toLocaleString()}đ</span> ×{' '}
                    {item.quantity} ={' '}
                    <span className='font-medium text-[#1E40AF]'>{(item.totalPrice ?? 0).toLocaleString()}đ</span>
                  </p>
                  {((item.discountAllocation || 0) > 0 || (item.pointsAllocation || 0) > 0 || item.netRefundAmount !== undefined) && (
                    <div className='mt-2 rounded-lg bg-white border border-[#E8EDF5] p-3 text-sm space-y-1'>
                      {(item.discountAllocation || 0) > 0 && (
                        <div className='flex justify-between text-green-700'>
                          <span>Coupon đã dùng</span>
                          <span>-{(item.discountAllocation || 0).toLocaleString()}đ</span>
                        </div>
                      )}
                      {(item.pointsAllocation || 0) > 0 && (
                        <div className='flex justify-between text-[#1E40AF]'>
                          <span>Điểm đã đổi</span>
                          <span>-{(item.pointsAllocation || 0).toLocaleString()}đ</span>
                        </div>
                      )}
                      {item.netRefundAmount !== undefined && (
                        <div className='flex justify-between font-semibold pt-1 border-t border-[#E8EDF5]'>
                          <span>Hoàn thực nhận cho sản phẩm</span>
                          <span className='text-[#1E40AF]'>{(item.netRefundAmount || 0).toLocaleString()}đ</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className='text-sm mt-1'>
                    <span className='text-muted-foreground'>Lý do: </span>
                    {returnReasonLabels[item.returnReason]}
                  </p>
                  {item.isPrescriptionProduct && (
                    <Badge variant='outline' className='mt-2 text-red-600 border-red-200'>
                      Thuốc kê đơn
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request details */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-800'>
            <FileText className='h-5 w-5' />
            Chi tiết yêu cầu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Lý do chính</p>
              <p className='font-medium'>{returnReasonLabels[request.reason]}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Loại yêu cầu</p>
              <p className='font-medium'>{request.type === 'refund' ? 'Hoàn tiền' : 'Đổi hàng'}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Ngày tạo</p>
              <p className='font-medium'>{format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
            </div>
            {request.reviewedAt && (
              <div>
                <p className='text-sm text-muted-foreground'>Ngày xử lý</p>
                <p className='font-medium'>
                  {format(new Date(request.reviewedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className='text-sm text-muted-foreground mb-1'>Mô tả chi tiết</p>
            <p className='p-3 bg-muted rounded-lg'>{request.reasonDetail}</p>
          </div>

          {request.evidence.length > 0 && (
            <div>
              <p className='text-sm text-muted-foreground mb-2'>Hình ảnh chứng minh</p>
              <div className='flex flex-wrap gap-2'>
                {request.evidence.map((url, index) => (
                  <a key={index} href={url} target='_blank' rel='noopener noreferrer'>
                    <img src={url} alt={`Evidence ${index + 1}`} className='w-20 h-20 object-cover rounded' />
                  </a>
                ))}
              </div>
            </div>
          )}

          {request.reviewNotes && (
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Ghi chú xử lý</p>
              <p className='p-3 bg-[#F0F6FF] text-blue-800 rounded-lg'>{request.reviewNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping info */}
      {request.returnShippingInfo && (
        <Card className='border-[#E8EDF5]'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-blue-800'>
              <Truck className='h-5 w-5' />
              Thông tin thu hồi hàng trả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              {request.returnShippingInfo.trackingNumber && (
                <div>
                  <p className='text-sm text-muted-foreground'>Mã thu hồi nội bộ</p>
                  <p className='font-medium'>{request.returnShippingInfo.trackingNumber}</p>
                </div>
              )}
              {request.returnShippingInfo.carrierTrackingCode && (
                <div>
                  <p className='text-sm text-muted-foreground'>Mã vận đơn hãng</p>
                  <p className='font-medium'>{request.returnShippingInfo.carrierTrackingCode}</p>
                </div>
              )}
              {request.returnShippingInfo.trackingUrl && (
                <div>
                  <p className='text-sm text-muted-foreground'>Theo dõi vận chuyển</p>
                  <a
                    href={request.returnShippingInfo.trackingUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 font-medium text-[#1E40AF] hover:underline'
                  >
                    Mở tracking
                    <ExternalLink className='h-3.5 w-3.5' />
                  </a>
                </div>
              )}
              {request.returnShippingInfo.trackingStatus && (
                <div>
                  <p className='text-sm text-muted-foreground'>Trạng thái tracking</p>
                  <p className='font-medium'>{getTrackingStatusLabel(request.returnShippingInfo.trackingStatus)}</p>
                </div>
              )}
              {request.returnShippingInfo.carrier && (
                <div>
                  <p className='text-sm text-muted-foreground'>Đơn vị thu hồi</p>
                  <p className='font-medium'>{getCarrierDisplayName(request.returnShippingInfo.carrier)}</p>
                </div>
              )}
              {request.returnShippingInfo.shippedAt && (
                <div>
                  <p className='text-sm text-muted-foreground'>Ngày sắp xếp thu hồi</p>
                  <p className='font-medium'>
                    {format(new Date(request.returnShippingInfo.shippedAt), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              )}
              {request.returnShippingInfo.receivedAt && (
                <div>
                  <p className='text-sm text-muted-foreground'>Ngày nhận</p>
                  <p className='font-medium'>
                    {format(new Date(request.returnShippingInfo.receivedAt), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              )}
              {request.returnShippingInfo.condition && (
                <div>
                  <p className='text-sm text-muted-foreground'>Tình trạng</p>
                  <Badge variant={request.returnShippingInfo.condition === 'good' ? 'default' : 'destructive'}>
                    {request.returnShippingInfo.condition === 'good'
                      ? 'Tốt'
                      : request.returnShippingInfo.condition === 'damaged'
                        ? 'Hư hỏng'
                        : request.returnShippingInfo.condition === 'opened'
                          ? 'Đã mở'
                          : 'Không sử dụng được'}
                  </Badge>
                </div>
              )}
            </div>
            {!!request.returnShippingInfo.trackingEvents?.length && (
              <div className='mt-4 space-y-2 rounded-lg bg-[#F8FAFB] p-3'>
                <p className='text-sm text-muted-foreground'>Nhật ký tracking</p>
                {request.returnShippingInfo.trackingEvents.map((event, index) => (
                  <div key={`${event.status}-${event.occurredAt}-${index}`} className='border-l-2 border-[#BFDBFE] pl-3 text-sm'>
                    <p className='font-medium'>{getTrackingEventMessage(event)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {format(new Date(event.occurredAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                    {event.location && <p className='text-xs text-muted-foreground'>{event.location}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refund summary */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-800'>
            <CreditCard className='h-5 w-5' />
            Thông tin hoàn tiền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Số tiền yêu cầu hoàn</span>
              <span className='font-medium'>{(request.requestedAmount ?? 0).toLocaleString()}đ</span>
            </div>
            {request.approvedAmount !== undefined && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Số tiền được duyệt</span>
                <span className='font-medium text-[#1E40AF]'>{(request.approvedAmount ?? 0).toLocaleString()}đ</span>
              </div>
            )}
            {request.refundedAmount !== undefined && (
              <div className='flex justify-between pt-2 border-t border-[#BFDBFE]'>
                <span className='font-medium'>Đã hoàn tiền</span>
                <span className='font-bold text-green-600'>{(request.refundedAmount ?? 0).toLocaleString()}đ</span>
              </div>
            )}
            {request.refundTransactionId && (
              <div className='pt-2 text-sm text-muted-foreground'>Mã giao dịch: {request.refundTransactionId}</div>
            )}
            {request.refundMethod && (
              <div className='text-sm text-muted-foreground'>
                Phương thức:{' '}
                {request.refundMethod === 'original'
                  ? 'Hoàn về phương thức thanh toán ban đầu'
                  : request.refundMethod === 'bank_transfer'
                    ? 'Chuyển khoản ngân hàng'
                    : 'Ví điện tử'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy yêu cầu đổi/trả?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy yêu cầu này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCancelDialog(false)}>
              Giữ lại
            </Button>
            <Button variant='destructive' onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
