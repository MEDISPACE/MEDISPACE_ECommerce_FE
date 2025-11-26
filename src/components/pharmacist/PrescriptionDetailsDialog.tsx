import { useState } from 'react'
import { CheckCircle, XCircle, Package, Pill } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { toast } from 'sonner'
import { prescriptionService, type Prescription } from '~/services/pharmacist'

interface PrescriptionDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  prescription: Prescription | null
  onUpdate?: () => void // Callback to reload data after update
}

export function PrescriptionDetailsDialog({ isOpen, onClose, prescription, onUpdate }: PrescriptionDetailsDialogProps) {
  const [pharmacistNotes, setPharmacistNotes] = useState(prescription?.pharmacistNotes || '')
  const [submitting, setSubmitting] = useState(false)

  if (!prescription) return null

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'verified':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý'
      case 'verified':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'expired':
        return 'Hết hạn'
      default:
        return status
    }
  }

  const handleUpdateStatus = async (newStatus: 'verified' | 'rejected', notes?: string) => {
    try {
      setSubmitting(true)
      await prescriptionService.verify(prescription._id, {
        status: newStatus,
        notes: notes || pharmacistNotes,
      })

      const statusText = newStatus === 'verified' ? 'đã duyệt' : 'đã từ chối'
      toast.success(`Đơn thuốc ${statusText} thành công`)

      // Call callback to reload data
      if (onUpdate) {
        await onUpdate()
      }

      onClose()
      setPharmacistNotes('')
    } catch (error) {
      console.error('Failed to update prescription:', error)
      toast.error('Không thể cập nhật đơn thuốc', {
        description: 'Vui lòng thử lại sau',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateOrder = () => {
    window.location.href = `/pharmacist/create-order?prescriptionId=${prescription._id}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-500 rounded-lg'>
        <DialogHeader>
          <DialogTitle>Chi tiết đơn thuốc {prescription.prescriptionNumber}</DialogTitle>
          <DialogDescription>Xem chi tiết, phê duyệt hoặc từ chối đơn thuốc</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Doctor Info */}
          <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
            <Avatar className='bg-blue-100'>
              <AvatarFallback>
                <Pill className='w-5 h-5 text-blue-600' />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className='font-medium'>BS. {prescription.doctorName}</h3>
              <p className='text-sm text-gray-600'>{prescription.hospitalName || 'Không có thông tin'}</p>
            </div>
            <div className='ml-auto flex gap-2'>
              <Badge className={getStatusColor(prescription.status?.toLowerCase() || 'pending')}>
                {getStatusText(prescription.status?.toLowerCase() || 'pending')}
              </Badge>
            </div>
          </div>

          {/* Prescription Images */}
          <div>
            <h4 className='font-medium mb-3'>Ảnh đơn thuốc</h4>
            <div className='grid grid-cols-2 gap-4'>
              {prescription.images.map((image, index) => (
                <div key={index} className='relative'>
                  <img
                    src={image}
                    alt={`Đơn thuốc ${index + 1}`}
                    className='w-full h-48 object-cover rounded-lg border'
                  />
                  <div className='absolute top-2 left-2'>
                    <Badge className='bg-white text-gray-800'>Ảnh {index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription Details */}
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <h4 className='font-medium mb-3'>Thông tin đơn thuốc</h4>
              <div className='space-y-2 text-sm'>
                <div>
                  <span className='text-gray-500'>Mã đơn thuốc:</span>
                  <p className='font-medium'>{prescription.prescriptionNumber}</p>
                </div>
                <div>
                  <span className='text-gray-500'>Ngày kê đơn:</span>
                  <p className='font-medium'>{new Date(prescription.prescriptionDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <span className='text-gray-500'>Thời gian tạo:</span>
                  <p className='font-medium'>{formatDateTime(prescription.createdAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className='font-medium mb-3'>Danh sách thuốc</h4>
              <div className='space-y-2'>
                {prescription.medications.map((medication, index) => (
                  <div key={index} className='p-2 bg-blue-50 rounded'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Pill className='w-4 h-4 text-blue-600' />
                      <span className='text-sm font-medium'>{medication.productName}</span>
                    </div>
                    <p className='text-xs text-gray-600 ml-6'>
                      {medication.dosage} - SL: {medication.quantity} - {medication.instructions}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div>
              <h4 className='font-medium mb-2'>Ghi chú từ bệnh nhân</h4>
              <p className='text-sm text-gray-700 p-3 bg-gray-50 rounded-lg'>{prescription.notes}</p>
            </div>
          )}

          {/* Pharmacist Notes */}
          <div>
            <h4 className='font-medium mb-2'>Ghi chú dược sĩ</h4>
            <Textarea
              value={pharmacistNotes}
              onChange={(e) => setPharmacistNotes(e.target.value)}
              placeholder={
                prescription?.status === 'pending' ? 'Thêm ghi chú cho đơn thuốc này...' : 'Không có ghi chú...'
              }
              rows={3}
              disabled={prescription?.status !== 'pending'}
              className={`border-2 focus:border-blue-500 ${
                prescription?.status !== 'pending' ? 'bg-gray-100 cursor-not-allowed' : 'border-blue-200'
              }`}
            />
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-3 pt-4 border-t'>
            {prescription?.status === 'pending' && (
              <>
                <Button
                  variant='outline'
                  onClick={() => handleUpdateStatus('rejected', pharmacistNotes)}
                  disabled={submitting}
                  className='text-red-600 border-red-200 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-2' />
                  {submitting ? 'Đang xử lý...' : 'Từ chối'}
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('verified', pharmacistNotes)}
                  disabled={submitting}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  {submitting ? 'Đang xử lý...' : 'Phê duyệt'}
                </Button>
              </>
            )}

            {prescription.status === 'verified' && (
              <Button
                onClick={() => {
                  handleCreateOrder()
                  onClose()
                }}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
              >
                <Package className='w-4 h-4 mr-2' />
                Tạo đơn hàng
              </Button>
            )}

            {(prescription.status === 'rejected' || prescription.status === 'expired') && (
              <Button variant='outline' onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
