/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare, // TODO: Will be used for chat button when API is ready
  Package,
  User,
  Phone, // TODO: Will be used to display customer phone
  FileText,
  Pill,
  Loader2,
} from 'lucide-react'
/* eslint-enable @typescript-eslint/no-unused-vars */

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { toast } from 'sonner'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'
import { getPrescriptionStatusBadge } from '../../utils/badgeUtils'
import { prescriptionService, type Prescription } from '~/services/pharmacist'

export function PrescriptionManagementPage() {
  // State management
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [pharmacistNotes, setPharmacistNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Map frontend status to backend status
  const mapStatusToBackend = (status: string): string | undefined => {
    if (status === 'all') return undefined
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      approved: 'Verified',
      rejected: 'Rejected',
    }
    return statusMap[status]
  }

  // Load prescriptions from API
  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      const mappedStatus = mapStatusToBackend(statusFilter)
      console.log('Loading prescriptions with status:', statusFilter, '→', mappedStatus)

      const data = await prescriptionService.getAll({
        page: 1,
        limit: 100,
        status: mappedStatus,
      })
      setPrescriptions(data)
    } catch (error) {
      console.error('Failed to load prescriptions:', error)
      toast.error('Không thể tải danh sách đơn thuốc', {
        description: 'Vui lòng thử lại sau',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  // Filter only by search (status already filtered by backend)
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerId.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const getStatusStats = () => {
    const pending = prescriptions.filter((p) => p.status === 'Pending').length
    const verified = prescriptions.filter((p) => p.status === 'Verified').length
    const rejected = prescriptions.filter((p) => p.status === 'Rejected').length
    const expired = prescriptions.filter((p) => p.status === 'Expired').length

    return { pending, verified, rejected, expired }
  }

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setPharmacistNotes(prescription.notes || '')
  }

  const handleUpdateStatus = async (prescriptionId: string, newStatus: 'Verified' | 'Rejected', notes?: string) => {
    try {
      setSubmitting(true)
      await prescriptionService.verify(prescriptionId, {
        status: newStatus,
        notes: notes || pharmacistNotes,
      })

      const statusText = newStatus === 'Verified' ? 'đã duyệt' : 'đã từ chối'
      toast.success(`Đơn thuốc ${statusText} thành công`)

      // Reload prescriptions
      await loadPrescriptions()

      setSelectedPrescription(null)
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

  const handleCreateOrder = (prescriptionId: string) => {
    // Navigate to create order page with prescription context
    window.location.href = `/pharmacist/create-order?prescriptionId=${prescriptionId}`
  }

  // TODO: Will be used when chat API is ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStartChat = (customerPhone: string) => {
    // Open chat with customer
    window.location.href = `/consultation/chat?phone=${customerPhone}`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN')
  }

  const stats = getStatusStats()
  const { StatsCard } = useStatsCards()

  // Define stats cards config
  const statsCards: StatCardConfig[] = [
    {
      title: 'Chờ xử lý',
      value: stats.pending,
      icon: Clock,
      color: 'yellow',
      badge:
        stats.pending > 0
          ? {
              text: 'Cần xử lý',
              icon: AlertTriangle,
              show: true,
            }
          : undefined,
    },
    {
      title: 'Đã duyệt',
      value: stats.verified,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Đã từ chối',
      value: stats.rejected,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Hết hạn',
      value: stats.expired,
      icon: AlertTriangle,
      color: 'orange',
    },
  ]

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-600'>Đang tải danh sách đơn thuốc...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
              Quản lý đơn thuốc
            </h1>
            <p className='text-gray-600 mt-1'>Xem xét và phê duyệt đơn thuốc từ khách hàng</p>
          </div>
        </div>

        {/* Stats - Using reusable hook */}
        <div className='mt-6'>
          <StatsCardGrid cols={4}>
            {statsCards.map((stat, index) => (
              <StatsCard key={index} config={stat} />
            ))}
          </StatsCardGrid>
        </div>
      </div>

      {/* Filter & Search */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm theo mã đơn, tên khách hàng, SĐT...'
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='pending'>Chờ xử lý</SelectItem>
              <SelectItem value='processing'>Đang xử lý</SelectItem>
              <SelectItem value='approved'>Đã duyệt</SelectItem>
              <SelectItem value='rejected'>Từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='Độ ưu tiên' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='urgent'>Khẩn cấp</SelectItem>
              <SelectItem value='normal'>Bình thường</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prescription List */}
      <div className='space-y-4'>
        {filteredPrescriptions.length === 0 ? (
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
            <CardContent className='p-12 text-center'>
              <FileText className='w-16 h-16 mx-auto text-gray-300 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy đơn thuốc</h3>
              <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <Card
              key={prescription._id}
              className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200'
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarFallback>Rx</AvatarFallback>
                    </Avatar>

                    <div>
                      <div className='flex items-center gap-3 mb-1'>
                        <h3 className='font-medium text-gray-900'>{prescription.prescriptionNumber}</h3>
                        {getPrescriptionStatusBadge(prescription.status)}
                      </div>

                      <div className='flex items-center gap-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <User className='w-4 h-4' />
                          BS. {prescription.doctorName}
                        </div>
                        {prescription.hospitalName && (
                          <div className='flex items-center gap-1'>
                            <FileText className='w-4 h-4' />
                            {prescription.hospitalName}
                          </div>
                        )}
                        <div className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          {formatDateTime(prescription.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleViewPrescription(prescription)}>
                      <Eye className='w-4 h-4 mr-1' />
                      Xem chi tiết
                    </Button>

                    {prescription.status === 'Verified' && (
                      <Button
                        size='sm'
                        onClick={() => handleCreateOrder(prescription._id)}
                        className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                      >
                        <Package className='w-4 h-4 mr-1' />
                        Tạo đơn hàng
                      </Button>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-500'>Bác sĩ:</span>
                    <p className='font-medium'>{prescription.doctorName}</p>
                  </div>
                  <div>
                    <span className='text-gray-500'>Bệnh viện:</span>
                    <p className='font-medium'>{prescription.hospitalName || 'Không có'}</p>
                  </div>
                  <div>
                    <span className='text-gray-500'>Số thuốc:</span>
                    <p className='font-medium'>{prescription.medications.length} loại</p>
                  </div>
                </div>

                {prescription.notes && (
                  <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-blue-800'>
                      <strong>Ghi chú:</strong> {prescription.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Chi tiết đơn thuốc {selectedPrescription.prescriptionNumber}</DialogTitle>
              <DialogDescription>Xem chi tiết, phê duyệt hoặc từ chối đơn thuốc</DialogDescription>
            </DialogHeader>

            <div className='space-y-6'>
              {/* Doctor Info */}
              <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                <Avatar>
                  <AvatarFallback>Rx</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-medium'>BS. {selectedPrescription.doctorName}</h3>
                  <p className='text-sm text-gray-600'>{selectedPrescription.hospitalName || 'Không có thông tin'}</p>
                </div>
                <div className='ml-auto flex gap-2'>{getPrescriptionStatusBadge(selectedPrescription.status)}</div>
              </div>

              {/* Prescription Images */}
              <div>
                <h4 className='font-medium mb-3'>Ảnh đơn thuốc</h4>
                <div className='grid grid-cols-2 gap-4'>
                  {selectedPrescription.images.map((image, index) => (
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
                      <p className='font-medium'>{selectedPrescription.prescriptionNumber}</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Ngày kê đơn:</span>
                      <p className='font-medium'>
                        {new Date(selectedPrescription.prescriptionDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Thời gian tạo:</span>
                      <p className='font-medium'>{formatDateTime(selectedPrescription.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-medium mb-3'>Danh sách thuốc</h4>
                  <div className='space-y-2'>
                    {selectedPrescription.medications.map((medication, index) => (
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
              {selectedPrescription.notes && (
                <div>
                  <h4 className='font-medium mb-2'>Ghi chú từ bệnh nhân</h4>
                  <p className='text-sm text-gray-700 p-3 bg-gray-50 rounded-lg'>{selectedPrescription.notes}</p>
                </div>
              )}

              {/* Pharmacist Notes */}
              <div>
                <h4 className='font-medium mb-2'>Ghi chú dược sĩ</h4>
                <Textarea
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  placeholder='Thêm ghi chú cho đơn thuốc này...'
                  rows={3}
                  className='border-2 border-blue-200 focus:border-blue-500'
                />
              </div>

              {/* Actions */}
              <div className='flex justify-end gap-3 pt-4 border-t'>
                {selectedPrescription.status === 'Pending' && (
                  <>
                    <Button
                      variant='outline'
                      onClick={() => handleUpdateStatus(selectedPrescription._id, 'Rejected', pharmacistNotes)}
                      disabled={submitting}
                      className='text-red-600 border-red-200 hover:bg-red-50'
                    >
                      <XCircle className='w-4 h-4 mr-2' />
                      {submitting ? 'Đang xử lý...' : 'Từ chối'}
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedPrescription._id, 'Verified', pharmacistNotes)}
                      disabled={submitting}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      {submitting ? 'Đang xử lý...' : 'Phê duyệt'}
                    </Button>
                  </>
                )}

                {selectedPrescription.status === 'Verified' && (
                  <Button
                    onClick={() => {
                      handleCreateOrder(selectedPrescription._id)
                      setSelectedPrescription(null)
                    }}
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                  >
                    <Package className='w-4 h-4 mr-2' />
                    Tạo đơn hàng
                  </Button>
                )}

                {(selectedPrescription.status === 'Rejected' || selectedPrescription.status === 'Expired') && (
                  <Button variant='outline' onClick={() => setSelectedPrescription(null)}>
                    Đóng
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
