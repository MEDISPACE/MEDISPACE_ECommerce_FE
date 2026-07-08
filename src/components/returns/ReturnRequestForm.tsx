import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X, AlertTriangle, Package } from 'lucide-react'
import returnRequestService, {
  ReturnReason,
  returnReasonLabels,
  RefundMethod,
  ReturnType,
} from '~/services/returnRequestService'
import { mediaService } from '~/services/mediaService'

const MAX_EVIDENCE_FILES = 5
const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface OrderItem {
  productId: string
  name: string
  sku: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAllocation?: number
  pointsAllocation?: number
  prescriptionRequired: boolean
  image?: string
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  total?: number
  deliveredAt?: string
}

interface ReturnRequestFormProps {
  order: Order
  onSubmit?: () => void
  onCancel?: () => void
}

type SelectedReturnItem = {
  productId: string
  unit: string
  quantity: number
  reason: ReturnReason
  reasonDetail: string
}

const getOrderItemKey = (item: Pick<OrderItem, 'productId' | 'unit'>) => `${item.productId}::${item.unit}`

export default function ReturnRequestForm({ order, onSubmit, onCancel }: ReturnRequestFormProps) {
  const navigate = useNavigate()
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedReturnItem>>(new Map())
  const [mainReason, setMainReason] = useState<ReturnReason | ''>('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [returnType, setReturnType] = useState<ReturnType>(ReturnType.REFUND)
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(RefundMethod.ORIGINAL)
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branch: '',
  })
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  // Calculate days since delivery
  const daysSinceDelivery = order.deliveredAt
    ? Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Check if any selected item is prescription
  const hasPrescriptionItem = Array.from(selectedItems.keys()).some((lineKey) => {
    const orderItem = order.items.find((i) => getOrderItemKey(i) === lineKey)
    return orderItem?.prescriptionRequired
  })
  const returnWindowDays = hasPrescriptionItem ? 3 : 7
  const isOutsideReturnWindow = daysSinceDelivery > returnWindowDays

  // Get allowed reasons based on item type
  const getAllowedReasons = useCallback((isPrescription: boolean) => {
    if (isPrescription) {
      // Prescription products can only be returned for specific reasons
      return [
        ReturnReason.DEFECTIVE,
        ReturnReason.WRONG_ITEM,
        ReturnReason.EXPIRED,
        ReturnReason.DAMAGED_SHIPPING,
        ReturnReason.WRONG_PRESCRIPTION,
      ]
    }
    return Object.values(ReturnReason)
  }, [])

  // Toggle item selection
  const toggleItemSelection = (item: OrderItem, checked: boolean) => {
    const lineKey = getOrderItemKey(item)
    const newSelected = new Map(selectedItems)
    if (checked) {
      newSelected.set(lineKey, {
        productId: item.productId,
        unit: item.unit,
        quantity: item.quantity || 1,
        reason: ReturnReason.DEFECTIVE,
        reasonDetail: '',
      })
    } else {
      newSelected.delete(lineKey)
    }
    setSelectedItems(newSelected)
  }

  // Update item quantity
  const updateItemQuantity = (lineKey: string, quantity: number) => {
    const current = selectedItems.get(lineKey)
    if (current) {
      const newSelected = new Map(selectedItems)
      newSelected.set(lineKey, { ...current, quantity })
      setSelectedItems(newSelected)
    }
  }

  // Update item reason
  const updateItemReason = (lineKey: string, reason: ReturnReason) => {
    const current = selectedItems.get(lineKey)
    if (current) {
      const newSelected = new Map(selectedItems)
      newSelected.set(lineKey, { ...current, reason })
      setSelectedItems(newSelected)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const selectedFiles = Array.from(files)
      if (evidence.length + selectedFiles.length > MAX_EVIDENCE_FILES) {
        setFormError(`Chỉ được tải tối đa ${MAX_EVIDENCE_FILES} ảnh chứng minh`)
        toast.error(`Chỉ được tải tối đa ${MAX_EVIDENCE_FILES} ảnh chứng minh`)
        return
      }

      const invalidFile = selectedFiles.find(
        (file) => !ALLOWED_EVIDENCE_TYPES.includes(file.type) || file.size > MAX_EVIDENCE_FILE_SIZE,
      )
      if (invalidFile) {
        setFormError('Ảnh chứng minh phải là JPG, PNG hoặc WebP và không vượt quá 5MB')
        toast.error('Ảnh chứng minh phải là JPG, PNG hoặc WebP và không vượt quá 5MB')
        return
      }

      const uploadPromises = selectedFiles.map(async (file) => {
        // mediaService.uploadImage returns a string URL directly
        const url = await mediaService.uploadImage(file)
        return url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setEvidence((prev) => [...prev, ...uploadedUrls.filter(Boolean)])
      setFormError('')
      toast.success('Tải ảnh thành công')
    } catch (error) {
      setFormError('Không thể tải ảnh lên')
      toast.error('Không thể tải ảnh lên')
    } finally {
      setUploading(false)
    }
  }

  // Remove evidence image
  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const items = Array.from(selectedItems.values()).map((data) => ({
        productId: data.productId,
        unit: data.unit,
        quantity: data.quantity,
        returnReason: data.reason,
        reasonDetail: data.reasonDetail || undefined,
      }))

      return returnRequestService.createReturnRequest({
        orderId: order._id,
        items,
        reason: mainReason as ReturnReason,
        reasonDetail,
        evidence,
        type: returnType,
        refundMethod: returnType === ReturnType.REFUND ? refundMethod : undefined,
        bankInfo: refundMethod === RefundMethod.BANK_TRANSFER ? bankInfo : undefined,
      })
    },
    onSuccess: () => {
      toast.success('Yêu cầu đổi/trả đã được gửi thành công!')
      onSubmit?.()
      navigate('/account/returns')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể gửi yêu cầu đổi/trả'
      setFormError(message)
      toast.error(message)
    },
  })

  // Calculate total refund amount
  const getRefundPreview = (item: OrderItem, quantity: number) => {
    const ratio = item.quantity > 0 ? quantity / item.quantity : 0
    const grossAmount = item.unitPrice * quantity
    const couponDiscount = Math.round((item.discountAllocation || 0) * ratio)
    const pointsDiscount = Math.round((item.pointsAllocation || 0) * ratio)
    const netAmount = Math.max(0, grossAmount - couponDiscount - pointsDiscount)

    return { grossAmount, couponDiscount, pointsDiscount, netAmount }
  }

  const selectedRefundAmount = Array.from(selectedItems.entries()).reduce((sum, [lineKey, data]) => {
    const orderItem = order.items.find((i) => getOrderItemKey(i) === lineKey)
    if (!orderItem) return sum
    return sum + getRefundPreview(orderItem, data.quantity).netAmount
  }, 0)

  const isFullOrderReturn = order.items.length > 0 && order.items.every((item) => {
    const selected = selectedItems.get(getOrderItemKey(item))
    return selected && selected.quantity >= item.quantity
  })

  const totalRefundAmount = isFullOrderReturn && Number(order.total || 0) > 0
    ? Math.max(selectedRefundAmount, Number(order.total || 0))
    : selectedRefundAmount

  const handleSubmitReturn = () => {
    if (selectedItems.size === 0) {
      setFormError('Vui lòng chọn ít nhất một sản phẩm cần đổi/trả')
      return
    }
    if (!mainReason) {
      setFormError('Vui lòng chọn lý do đổi/trả')
      return
    }
    if (reasonDetail.length < 10) {
      setFormError('Vui lòng mô tả chi tiết ít nhất 10 ký tự')
      return
    }
    if (evidence.length < 1) {
      setFormError('Vui lòng tải lên ít nhất một ảnh chứng minh')
      return
    }
    if (returnType === ReturnType.REFUND && refundMethod === RefundMethod.BANK_TRANSFER) {
      if (!bankInfo.bankName.trim() || !bankInfo.accountNumber.trim() || !bankInfo.accountHolder.trim()) {
        setFormError('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng')
        return
      }
    }
    if (isOutsideReturnWindow) {
      setFormError('Đơn hàng đã quá thời hạn đổi/trả')
      return
    }

    setFormError('')
    submitMutation.mutate()
  }

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          className='text-[#1E40AF] hover:!text-[#0A2463] hover:!bg-[#F0F6FF] rounded-full p-2.5 h-10 w-10'
          variant='ghost'
          size='icon'
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className='h-7 w-7' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-blue-800'>Yêu cầu đổi/trả hàng</h1>
          <p className='text-muted-foreground'>Đơn hàng #{order.orderNumber}</p>
        </div>
      </div>

      {/* Warning for prescription items */}
      {hasPrescriptionItem && (
        <Card className='border-amber-200 bg-amber-50'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0' />
              <div>
                <p className='font-medium text-amber-800'>Lưu ý về thuốc kê đơn</p>
                <p className='text-sm text-amber-700'>
                  Thuốc kê đơn chỉ được đổi/trả trong các trường hợp: sản phẩm lỗi, giao sai hàng, hết hạn, hư hại trong
                  vận chuyển hoặc không đúng đơn thuốc. Thời hạn đổi trả: 3 ngày kể từ khi nhận hàng.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return period warning */}
      {daysSinceDelivery > 5 && (
        <Card className={isOutsideReturnWindow ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${isOutsideReturnWindow ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <p className={`font-medium ${isOutsideReturnWindow ? 'text-red-800' : 'text-orange-800'}`}>
                  {isOutsideReturnWindow ? 'Đã quá hạn đổi/trả' : 'Sắp hết hạn đổi/trả'}
                </p>
                <p className={`text-sm ${isOutsideReturnWindow ? 'text-red-700' : 'text-orange-700'}`}>
                  Đơn hàng đã được giao {daysSinceDelivery} ngày trước. Thời hạn đổi/trả là {returnWindowDays} ngày.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select items */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-800'>
            <Package className='h-5 w-5' />
            Chọn sản phẩm cần đổi/trả
          </CardTitle>
          <CardDescription>Chọn các sản phẩm từ đơn hàng muốn đổi hoặc trả</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {order.items.map((item) => {
            const lineKey = getOrderItemKey(item)
            const isSelected = selectedItems.has(lineKey)
            const selectedData = selectedItems.get(lineKey)
            const allowedReasons = getAllowedReasons(item.prescriptionRequired)

            return (
              <div
                key={lineKey}
                className={`border rounded-lg p-4 transition-colors ${
                  isSelected ? 'border-[#1E40AF] bg-[#F0F6FF]' : 'border-[#E8EDF5]'
                }`}
              >
                <div className='flex items-start gap-4'>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => toggleItemSelection(item, checked as boolean)}
                    data-testid='return-item-checkbox'
                  />
                  <img
                    src={item.image || '/placeholder-product.png'}
                    alt={item.name}
                    className='w-16 h-16 object-cover rounded'
                  />
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium truncate'>{item.name}</h4>
                    <p className='text-sm text-muted-foreground'>
                      SKU: {item.sku} | Đơn vị: {item.unit}
                    </p>
                    <p className='text-sm'>
                      Giá: {item.unitPrice.toLocaleString()}đ × {item.quantity} = {item.totalPrice.toLocaleString()}đ
                    </p>
                    {((item.discountAllocation || 0) > 0 || (item.pointsAllocation || 0) > 0) && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        Đã phân bổ giảm giá: {((item.discountAllocation || 0) + (item.pointsAllocation || 0)).toLocaleString()}đ
                      </p>
                    )}
                    {item.prescriptionRequired && (
                      <span className='inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 mt-1'>
                        Thuốc kê đơn
                      </span>
                    )}
                  </div>
                </div>

                {/* Item-specific options when selected */}
                {isSelected && selectedData && (
                  <div className='mt-4 pt-4 border-t space-y-3'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label className='mb-2 block'>Số lượng trả</Label>
                        <Select
                          value={String(selectedData.quantity)}
                          onValueChange={(v) => updateItemQuantity(lineKey, Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: item.quantity }, (_, i) => i + 1).map((q) => (
                              <SelectItem key={q} value={String(q)}>
                                {q}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className='mb-2 block'>Lý do trả</Label>
                        <Select
                          value={selectedData.reason}
                          onValueChange={(v) => updateItemReason(lineKey, v as ReturnReason)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedReasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {returnReasonLabels[reason]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(() => {
                      const preview = getRefundPreview(item, selectedData.quantity)
                      return (
                        <div className='rounded-lg bg-white border border-[#E8EDF5] p-3 text-sm space-y-1'>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Giá trị sản phẩm</span>
                            <span>{preview.grossAmount.toLocaleString()}đ</span>
                          </div>
                          {preview.couponDiscount > 0 && (
                            <div className='flex justify-between text-green-700'>
                              <span>Coupon đã dùng</span>
                              <span>-{preview.couponDiscount.toLocaleString()}đ</span>
                            </div>
                          )}
                          {preview.pointsDiscount > 0 && (
                            <div className='flex justify-between text-[#1E40AF]'>
                              <span>Điểm đã đổi</span>
                              <span>-{preview.pointsDiscount.toLocaleString()}đ</span>
                            </div>
                          )}
                          <div className='flex justify-between font-semibold pt-1 border-t'>
                            <span>Ước tính hoàn thực nhận</span>
                            <span className='text-[#1E40AF]'>{preview.netAmount.toLocaleString()}đ</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Main reason and details */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='text-blue-800'>Chi tiết yêu cầu</CardTitle>
          <CardDescription>Vui lòng cung cấp thông tin chi tiết về yêu cầu đổi/trả</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='mb-2 block'>Lý do chính</Label>
              <Select value={mainReason} onValueChange={(v) => setMainReason(v as ReturnReason)}>
                <SelectTrigger data-testid='return-reason-select'>
                  <SelectValue placeholder='Chọn lý do' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReturnReason).map((reason) => (
                    <SelectItem key={reason} value={reason} data-testid={reason === ReturnReason.DEFECTIVE ? 'return-reason-defective' : undefined}>
                      {returnReasonLabels[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='mb-2 block'>Loại yêu cầu</Label>
              <Select value={returnType} onValueChange={(v) => setReturnType(v as ReturnType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReturnType.REFUND}>Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className='mb-2 block'>Mô tả chi tiết (tối thiểu 10 ký tự)</Label>
            <Textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder='Mô tả chi tiết về vấn đề gặp phải với sản phẩm...'
              data-testid='return-detail-input'
              rows={4}
            />
            <p className='text-xs text-muted-foreground mt-1'>{reasonDetail.length}/1000 ký tự</p>
          </div>

          {/* Evidence upload */}
          <div>
            <Label className='mb-2 block'>Hình ảnh/Video chứng minh (bắt buộc, tối thiểu 1 ảnh)</Label>
            <div className='border-2 border-dashed border-[#BFDBFE] rounded-lg p-6 text-center hover:border-[#BFDBFE] transition-colors'>
              <input
                type='file'
                multiple
                accept='image/jpeg,image/png,image/webp'
                onChange={handleImageUpload}
                className='hidden'
                id='evidence-upload'
                data-testid='evidence-upload'
                disabled={uploading}
              />
              <label htmlFor='evidence-upload' className='cursor-pointer'>
                <Upload className='h-8 w-8 mx-auto text-muted-foreground mb-2' />
                <p className='text-sm text-muted-foreground'>
                  {uploading ? 'Đang tải lên...' : 'Click để tải ảnh JPG, PNG hoặc WebP'}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>Tối đa 5 ảnh, mỗi ảnh không quá 5MB</p>
              </label>
            </div>
            {evidence.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-3' data-testid='evidence-preview'>
                {evidence.map((url, index) => (
                  <div key={index} className='relative'>
                    <img src={url} alt={`Evidence ${index + 1}`} className='w-20 h-20 object-cover rounded' />
                    <button
                      onClick={() => removeEvidence(index)}
                      className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refund method (only for refund type) */}
          {returnType === ReturnType.REFUND && (
            <>
              <div>
                <Label className='mb-2 block'>Phương thức hoàn tiền</Label>
                <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as RefundMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RefundMethod.ORIGINAL}>Hoàn về phương thức thanh toán ban đầu</SelectItem>
                    <SelectItem value={RefundMethod.BANK_TRANSFER}>Chuyển khoản ngân hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {refundMethod === RefundMethod.BANK_TRANSFER && (
                <div className='grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg'>
                  <div>
                    <Label className='mb-2 block'>Tên ngân hàng</Label>
                    <Input
                      value={bankInfo.bankName}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                      placeholder='Ví dụ: Vietcombank'
                    />
                  </div>
                  <div>
                    <Label className='mb-2 block'>Số tài khoản</Label>
                    <Input
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                      placeholder='Số tài khoản'
                    />
                  </div>
                  <div>
                    <Label className='mb-2 block'>Chủ tài khoản</Label>
                    <Input
                      value={bankInfo.accountHolder}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                      placeholder='Tên chủ tài khoản'
                    />
                  </div>
                  <div>
                    <Label className='mb-2 block'>Chi nhánh (tùy chọn)</Label>
                    <Input
                      value={bankInfo.branch}
                      onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                      placeholder='Chi nhánh'
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary and submit */}
      <Card className='border-[#E8EDF5]'>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Số sản phẩm: {selectedItems.size}</p>
              <p className='text-lg font-semibold'>
                Tổng tiền hoàn: <span className='text-[#1E40AF]'>{totalRefundAmount.toLocaleString()}đ</span>
              </p>
              {formError && (
                <p className='mt-2 text-sm text-red-600' data-testid='form-error'>
                  {formError}
                </p>
              )}
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='!border-[#BFDBFE] !text-[#1E40AF] hover:!bg-[#F0F6FF]'
                onClick={onCancel || (() => navigate(-1))}
              >
                Hủy
              </Button>
              <Button
                className='bg-[#0A2463] text-white hover:bg-[#071A49]'
                onClick={handleSubmitReturn}
                disabled={isOutsideReturnWindow || submitMutation.isPending}
                data-testid='submit-return-btn'
              >
                {submitMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
