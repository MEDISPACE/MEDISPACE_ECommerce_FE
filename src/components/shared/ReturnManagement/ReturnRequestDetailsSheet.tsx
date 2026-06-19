import { useState } from 'react'
import {
  Package,
  RotateCcw,
  FileText,
  ImageIcon,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Wallet,
} from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Separator } from '../../ui/separator'
import { Dialog, DialogContent } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet'
import type { ReturnRequest, ReturnStatus } from '../../../types/returnRequest'
import { returnStatusLabels, returnReasonLabels } from '../../../services/returnRequestService'

interface ReturnRequestDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  request: ReturnRequest | null
  onReview?: (request: ReturnRequest, action: 'approved' | 'rejected') => void
}

// Status badge colors
const statusColors: Record<ReturnStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  reviewing: { bg: 'bg-[#E8EDF5]', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  awaiting_return: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  received: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  refund_processing: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

export function ReturnRequestDetailsSheet({ isOpen, onClose, request, onReview }: ReturnRequestDetailsSheetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!request) return null

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const handlePrevImage = () => {
    if (request.evidence) {
      setCurrentImageIndex((prev) => (prev === 0 ? request.evidence!.length - 1 : prev - 1))
    }
  }

  const handleNextImage = () => {
    if (request.evidence) {
      setCurrentImageIndex((prev) => (prev === request.evidence!.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className='w-full sm:max-w-2xl overflow-y-auto !bg-gradient-to-br !from-blue-50 !to-white border border-[#E8EDF5]'>
          <SheetHeader className='pb-2 border-b border-[#E8EDF5]'>
            <SheetTitle className='text-2xl font-bold text-blue-900 flex items-center gap-2'>
              <RotateCcw className='w-6 h-6 text-[#1E40AF]' />
              Chi tiết yêu cầu
            </SheetTitle>
          </SheetHeader>

          <div className='mt-2 space-y-5 pr-2 pl-2 pb-2'>
            {/* Request Info Card */}
            <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-[#1E40AF]' />
                  Thông tin yêu cầu
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Mã yêu cầu:</span>
                  <span className='font-semibold text-blue-900 font-mono'>{request.requestNumber}</span>
                </div>
                <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Đơn hàng:</span>
                  <span className='font-medium text-[#1E40AF] font-mono'>{request.orderNumber}</span>
                </div>
                <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Ngày tạo:</span>
                  <span className='font-medium text-gray-900'>{formatDate(request.createdAt)}</span>
                </div>
                <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Trạng thái:</span>
                  <Badge className={`${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                    {returnStatusLabels[request.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info Card */}
            {(request.customerName || request.customerEmail || request.customerPhone) && (
              <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                    <User className='w-5 h-5 text-[#1E40AF]' />
                    Thông tin khách hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {request.customerName && (
                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                      <span className='text-sm text-gray-600'>Họ tên:</span>
                      <span className='font-semibold text-gray-900'>{request.customerName}</span>
                    </div>
                  )}
                  {request.customerEmail && (
                    <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                      <span className='text-sm text-gray-600'>Email:</span>
                      <span className='font-medium text-[#1E40AF]'>{request.customerEmail}</span>
                    </div>
                  )}
                  {request.customerPhone && (
                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                      <span className='text-sm text-gray-600'>Số điện thoại:</span>
                      <span className='font-medium text-gray-900'>{request.customerPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reason Card */}
            <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-[#1E40AF]' />
                  Lý do đổi/trả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200'>
                  <p className='font-semibold text-amber-800'>{returnReasonLabels[request.reason]}</p>
                  {request.reasonDetail && <p className='text-gray-700 mt-2 italic'>"{request.reasonDetail}"</p>}
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                  <Package className='w-5 h-5 text-[#1E40AF]' />
                  Sản phẩm ({request.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {request.items.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex gap-3 bg-gradient-to-r from-blue-50/50 to-white p-4 rounded-xl border border-[#E8EDF5] hover:shadow-md transition-shadow'
                  >
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className='w-16 h-16 object-cover rounded-lg border border-[#E8EDF5]'
                      />
                    ) : (
                      <div className='w-16 h-16 bg-[#E8EDF5] rounded-lg flex items-center justify-center'>
                        <Package className='w-8 h-8 text-blue-400' />
                      </div>
                    )}
                    <div className='flex-1 space-y-1'>
                      <p className='font-semibold text-gray-900'>{item.productName}</p>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>SKU: {item.sku}</span>
                        {item.unit && (
                          <span className='text-xs text-[#1E40AF] bg-[#F0F6FF] px-2 py-1 rounded'>{item.unit}</span>
                        )}
                      </div>
                      <p className='text-sm text-gray-600'>
                        <span className='text-[#1E40AF] font-medium'>{formatPrice(item.unitPrice)}</span>
                        {item.unit && <span className='text-gray-400'>/{item.unit}</span>} x {item.quantity}
                      </p>
                    </div>
                    <div className='text-right flex flex-col justify-center'>
                      <p className='text-lg font-bold text-[#1E40AF]'>{formatPrice(item.totalPrice)}</p>
                      {((item.discountAllocation || 0) > 0 ||
                        (item.pointsAllocation || 0) > 0 ||
                        typeof item.netRefundAmount === 'number') && (
                        <div className='mt-2 min-w-[150px] space-y-1 rounded-lg border border-[#E8EDF5] bg-white/80 p-2 text-xs'>
                          <div className='flex justify-between gap-3 text-gray-500'>
                            <span>Giá gốc</span>
                            <span>{formatPrice(item.totalPrice)}</span>
                          </div>
                          {(item.discountAllocation || 0) > 0 && (
                            <div className='flex justify-between gap-3 text-green-600'>
                              <span>Coupon</span>
                              <span>-{formatPrice(item.discountAllocation || 0)}</span>
                            </div>
                          )}
                          {(item.pointsAllocation || 0) > 0 && (
                            <div className='flex justify-between gap-3 text-[#1E40AF]'>
                              <span>Điểm</span>
                              <span>-{formatPrice(item.pointsAllocation || 0)}</span>
                            </div>
                          )}
                          {typeof item.netRefundAmount === 'number' && (
                            <div className='flex justify-between gap-3 border-t border-[#E8EDF5] pt-1 font-semibold text-[#0A2463]'>
                              <span>Hoàn dự kiến</span>
                              <span>{formatPrice(item.netRefundAmount)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Amount Summary Card */}
            <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                  <Wallet className='w-5 h-5 text-[#1E40AF]' />
                  Số tiền
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-[#E8EDF5] space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Số tiền yêu cầu:</span>
                    <span className='font-semibold text-gray-900'>{formatPrice(request.requestedAmount)}</span>
                  </div>
                  {request.approvedAmount && (
                    <div className='flex justify-between items-center text-green-600'>
                      <span className='font-medium'>Số tiền đã duyệt:</span>
                      <span className='font-semibold'>{formatPrice(request.approvedAmount)}</span>
                    </div>
                  )}
                  {request.refundedAmount && (
                    <div className='flex justify-between items-center text-emerald-600'>
                      <span className='font-medium'>Đã hoàn tiền:</span>
                      <span className='font-semibold'>{formatPrice(request.refundedAmount)}</span>
                    </div>
                  )}
                  <Separator className='my-2' />
                  <div className='flex justify-between items-center p-3 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] rounded-lg text-white'>
                    <span className='text-lg font-bold'>Tổng yêu cầu:</span>
                    <span className='text-2xl font-bold'>{formatPrice(request.requestedAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Card */}
            {request.evidence && request.evidence.length > 0 && (
              <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                    <ImageIcon className='w-5 h-5 text-[#1E40AF]' />
                    Hình ảnh chứng minh ({request.evidence.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-3 gap-3'>
                    {request.evidence.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        className='w-full h-28 object-cover rounded-xl border border-[#E8EDF5] hover:border-[#1E40AF] hover:shadow-lg transition-all cursor-pointer'
                        onClick={() => handleImageClick(idx)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Notes */}
            {request.reviewNotes && (
              <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-green-200'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-green-800 flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    Ghi chú duyệt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200'>
                    <p className='text-green-800'>{request.reviewNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {request.rejectionReason && (
              <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-red-200'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-red-800 flex items-center gap-2'>
                    <XCircle className='w-5 h-5 text-red-600' />
                    Lý do từ chối
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-200'>
                    <p className='text-red-800'>{request.rejectionReason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Footer */}
            {onReview && (request.status === 'pending' || request.status === 'reviewing') && (
              <div className='sticky bottom-0 bg-white border-t border-[#E8EDF5] p-4 -mx-2 mt-6 flex gap-3 justify-end'>
                <Button
                  variant='outline'
                  className='!bg-red-50 !text-red-700 !border-red-200 hover:!bg-red-100'
                  onClick={() => {
                    onReview(request, 'rejected')
                    onClose()
                  }}
                >
                  <XCircle className='w-4 h-4 mr-2' />
                  Từ chối
                </Button>
                <Button
                  className='bg-green-600 hover:!bg-green-700 !text-white'
                  onClick={() => {
                    onReview(request, 'approved')
                    onClose()
                  }}
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  Duyệt yêu cầu
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className='max-w-4xl p-0 bg-black/95 border-none'>
          <div className='relative flex items-center justify-center min-h-[70vh]'>
            {/* Close button */}
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-4 right-4 !text-white hover:!bg-white/20 !z-10'
              onClick={() => setLightboxOpen(false)}
            >
              <X className='w-6 h-6' />
            </Button>

            {/* Previous button */}
            {request.evidence && request.evidence.length > 1 && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-4 text-white hover:bg-white/20'
                onClick={handlePrevImage}
              >
                <ChevronLeft className='w-8 h-8' />
              </Button>
            )}

            {/* Image */}
            {request.evidence && request.evidence[currentImageIndex] && (
              <img
                src={request.evidence[currentImageIndex]}
                alt={`Evidence ${currentImageIndex + 1}`}
                className='max-w-full max-h-[80vh] object-contain'
              />
            )}

            {/* Next button */}
            {request.evidence && request.evidence.length > 1 && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-4 text-white hover:bg-white/20'
                onClick={handleNextImage}
              >
                <ChevronRight className='w-8 h-8' />
              </Button>
            )}

            {/* Image counter */}
            {request.evidence && request.evidence.length > 1 && (
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm'>
                {currentImageIndex + 1} / {request.evidence.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
