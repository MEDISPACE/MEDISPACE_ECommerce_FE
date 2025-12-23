import { useState } from 'react'
import {
  Search,
  Download,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pill,
  UserCheck,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import { getPrescriptionStatusBadge } from '../../utils/badgeUtils'
import adminService from '../../services/adminService'
import { PrescriptionImageViewer } from '../shared/PrescriptionImageViewer'

interface Prescription {
  _id?: string // MongoDB ObjectId from backend
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAvatar?: string
  pharmacistId?: string
  pharmacistName?: string
  pharmacistAvatar?: string
  pharmacistPhone?: string
  pharmacistEmail?: string
  pharmacistLicense?: string
  images: string[]
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'fulfilled' | 'expired'


  createdAt: string
  updatedAt: string
  doctorName?: string
  diagnosis?: string
  medications: {
    name: string
    dosage: string
    quantity: number
  }[]
  notes?: string
  pharmacistNotes?: string
  rejectionReason?: string
  orderId?: string
}

export function PrescriptionManagementPage() {
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')


  const [page, setPage] = useState(1)
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [dateRange, setDateRange] = useState('all')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showExpireConfirm, setShowExpireConfirm] = useState(false)

  // Fetch prescriptions with React Query
  const { data: prescriptionsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'prescriptions', { page, status: statusFilter, search: searchQuery }],
    queryFn: () => adminService.getAllPrescriptions({
      page,
      limit: 10,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery
    }),
    staleTime: 30000 // 30 seconds
  })

  // Fetch prescription stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'prescriptions', 'stats'],
    queryFn: adminService.getPrescriptionStats,
    staleTime: 60000 // 1 minute
  })

  // Update prescription status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updatePrescriptionStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prescriptions'] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: () => {
      toast.error('Cập nhật trạng thái thất bại')
    }
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      adminService.bulkUpdatePrescriptions(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prescriptions'] })
      setSelectedPrescriptions([])
      toast.success('Cập nhật hàng loạt thành công')
    },
    onError: () => {
      toast.error('Cập nhật hàng loạt thất bại')
    }
  })

  // Extract data
  const prescriptions = prescriptionsData?.prescriptions || []
  const pagination = prescriptionsData?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Client-side filtering for type and priority (since backend doesn't support these yet)
  const filteredPrescriptions = prescriptions.filter((prescription: any) => {



    // Date range filter
    let matchesDateRange = true
    if (dateRange !== 'all') {
      const now = new Date()
      const createdDate = new Date(prescription.createdAt)
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

      if (dateRange === 'today') matchesDateRange = daysDiff === 0
      else if (dateRange === 'week') matchesDateRange = daysDiff <= 7
      else if (dateRange === 'month') matchesDateRange = daysDiff <= 30
    }

    return matchesDateRange
  })

  // Map backend stats to frontend format
  const stats = {
    total: statsData?.total || 0,
    pending: statsData?.pending || 0,
    approved: statsData?.verified || 0, // Backend uses 'verified' instead of 'approved'
    rejected: statsData?.rejected || 0,
    fulfilled: 0, // Backend doesn't have this status

    approvedToday: statsData?.verifiedToday || 0
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedPrescriptions.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đơn thuốc')
      return
    }

    switch (action) {
      case 'approve':
        bulkUpdateMutation.mutate({
          ids: selectedPrescriptions,
          status: 'verified' // Backend uses 'verified' instead of 'approved'
        })
        break
      case 'reject':
        bulkUpdateMutation.mutate({
          ids: selectedPrescriptions,
          status: 'rejected'
        })
        break
      case 'export':
        toast.success(`Đã xuất ${selectedPrescriptions.length} đơn thuốc`)
        setSelectedPrescriptions([])
        break
    }
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedPrescriptions((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedPrescriptions.length === filteredPrescriptions.length) {
      setSelectedPrescriptions([])
    } else {
      setSelectedPrescriptions(filteredPrescriptions.map((p: any) => p._id || p.id))
    }
  }

  // View prescription details
  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
  }

  // Handle approve prescription
  const handleApprovePrescription = () => {
    if (!selectedPrescription) return

    updateStatusMutation.mutate({
      id: selectedPrescription._id || selectedPrescription.id,
      data: {
        status: 'verified',
        pharmacistNotes: 'Đã phê duyệt bởi Admin'
      }
    }, {
      onSuccess: () => {
        setSelectedPrescription(null)
        setShowApproveConfirm(false)
      }
    })
  }

  // Handle reject prescription
  const handleRejectPrescription = () => {
    if (!selectedPrescription || !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    updateStatusMutation.mutate({
      id: selectedPrescription._id || selectedPrescription.id,
      data: {
        status: 'rejected',
        pharmacistNotes: rejectionReason
      }
    }, {
      onSuccess: () => {
        setSelectedPrescription(null)
        setShowRejectDialog(false)
        setRejectionReason('')
      }
    })
  }

  // Handle expire prescription
  const handleExpirePrescription = () => {
    if (!selectedPrescription) return

    updateStatusMutation.mutate({
      id: selectedPrescription._id || selectedPrescription.id,
      data: {
        status: 'expired',
        pharmacistNotes: 'Đơn thuốc đã hết hạn sử dụng'
      }
    }, {
      onSuccess: () => {
        setSelectedPrescription(null)
        setShowExpireConfirm(false)
      }
    })
  }

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
            }}
          >
            Quản lý đơn thuốc
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý và giám sát tất cả đơn thuốc trong hệ thống</p>
        </div>
        <Button variant='outline' className='gap-2'>
          <Download className='w-4 h-4' />
          Xuất báo cáo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng số</p>
                <p className='text-2xl font-semibold text-gray-700'>{stats.total}</p>
              </div>
              <FileText className='w-8 h-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Chờ xử lý</p>
                <p className='text-2xl font-semibold text-yellow-600'>{stats.pending}</p>
              </div>
              <Clock className='w-8 h-8 text-yellow-400' />
            </div>
            {stats.pending > 0 && (
              <div className='mt-2 flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded'>
                <AlertTriangle className='w-3 h-3' />
                Cần xử lý
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Đã duyệt</p>
                <p className='text-2xl font-semibold text-green-600'>{stats.approved}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Từ chối</p>
                <p className='text-2xl font-semibold text-red-600'>{stats.rejected}</p>
              </div>
              <XCircle className='w-8 h-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Hoàn thành</p>
                <p className='text-2xl font-semibold text-cyan-600'>{stats.fulfilled}</p>
              </div>
              <Package className='w-8 h-8 text-cyan-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Duyệt hôm nay</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats.approvedToday}</p>
              </div>
              <TrendingUp className='w-8 h-8 text-blue-400' />
            </div>
            {stats.approvedToday > 0 && (
              <div className='mt-2 flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded'>
                Hiệu quả
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm theo mã đơn, khách hàng, dược sĩ, thuốc...'
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-40 border-2 border-blue-200 focus:border-blue-500'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='pending'>Chờ xử lý</SelectItem>
              <SelectItem value='verified'>Đã duyệt</SelectItem>
              <SelectItem value='rejected'>Từ chối</SelectItem>
              {/* <SelectItem value='fulfilled'>Hoàn thành</SelectItem> */}
            </SelectContent>
          </Select>





          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className='w-40 border-2 border-blue-200 focus:border-blue-500'>
              <SelectValue placeholder='Thời gian' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả thời gian</SelectItem>
              <SelectItem value='today'>Hôm nay</SelectItem>
              <SelectItem value='week'>7 ngày</SelectItem>
              <SelectItem value='month'>30 ngày</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedPrescriptions.length > 0 && (
          <div className='flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <span className='text-sm text-blue-800'>Đã chọn {selectedPrescriptions.length} đơn thuốc</span>
            <div className='flex gap-2 ml-auto'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('approve')}
                className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              >
                <CheckCircle className='w-4 h-4 mr-1' />
                Phê duyệt
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('reject')}
                className='bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              >
                <XCircle className='w-4 h-4 mr-1' />
                Từ chối
              </Button>
              <Button size='sm' variant='outline' onClick={() => handleBulkAction('export')}>
                <Download className='w-4 h-4 mr-1' />
                Xuất
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Prescriptions Table */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200'>
              <tr>
                <th className='p-4 text-left'>
                  <Checkbox
                    checked={
                      selectedPrescriptions.length === filteredPrescriptions.length && filteredPrescriptions.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className='p-4 text-left text-sm text-gray-700'>Mã đơn</th>
                <th className='p-4 text-left text-sm text-gray-700'>Khách hàng</th>
                <th className='p-4 text-left text-sm text-gray-700'>Dược sĩ</th>

                <th className='p-4 text-left text-sm text-gray-700'>Trạng thái</th>
                <th className='p-4 text-left text-sm text-gray-700'>Thuốc</th>
                <th className='p-4 text-left text-sm text-gray-700'>Ngày tạo</th>
                <th className='p-4 text-center text-sm text-gray-700'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className='p-12 text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className='p-12 text-center'>
                    <p className='text-red-600'>Có lỗi xảy ra khi tải dữ liệu</p>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'prescriptions'] })}
                      className='mt-4'
                    >
                      Thử lại
                    </Button>
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className='p-12 text-center'>
                    <FileText className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                    <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy đơn thuốc</h3>
                    <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription: any) => (
                  <tr key={prescription._id || prescription.id} className='hover:bg-blue-50/50 transition-colors'>
                    <td className='p-4'>
                      <Checkbox
                        checked={selectedPrescriptions.includes(prescription._id || prescription.id)}
                        onCheckedChange={() => toggleSelection(prescription._id || prescription.id)}
                      />
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm'>{prescription.prescriptionNumber || prescription.id}</span>
                      </div>
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-8 h-8'>
                          <AvatarImage src={prescription.customerAvatar} />
                          <AvatarFallback>{prescription.customerName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm text-gray-900'>{prescription.customerName}</p>
                          <p className='text-xs text-gray-500'>{prescription.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className='p-4'>
                      {prescription.pharmacistName ? (
                        <div className='flex items-center gap-2'>
                          <UserCheck className='w-4 h-4 text-blue-600' />
                          <span className='text-sm text-gray-700'>{prescription.pharmacistName}</span>
                        </div>
                      ) : (
                        <span className='text-xs text-gray-400'>Chưa phân công</span>
                      )}
                    </td>

                    <td className='p-4'>{getPrescriptionStatusBadge(prescription.status)}</td>
                    <td className='p-4'>
                      <div className='text-sm text-gray-700'>{prescription.medications?.length || 0} loại thuốc</div>
                    </td>
                    <td className='p-4'>
                      <div className='text-sm text-gray-700'>{formatDateTime(prescription.createdAt)}</div>
                    </td>
                    <td className='p-4 text-center'>
                      <Button size='sm' variant='outline' onClick={() => handleViewPrescription(prescription)}>
                        <Eye className='w-4 h-4 mr-1' />
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className='flex items-center justify-between p-4 border-t border-gray-200'>
            <div className='text-sm text-gray-600'>
              Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.total} đơn)
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className='w-4 h-4 mr-1' />
                Trước
              </Button>
              <div className='flex items-center gap-1'>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className='w-8 h-8 p-0'
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
              >
                Sau
                <ChevronRight className='w-4 h-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Detail Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className='!w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                <span>Chi tiết đơn thuốc #{selectedPrescription.id}</span>

                {getPrescriptionStatusBadge(selectedPrescription.status)}

              </DialogTitle>
              <DialogDescription>Xem đầy đủ thông tin đơn thuốc, dược sĩ phụ trách và lịch sử xử lý</DialogDescription>
            </DialogHeader>

            <div className='space-y-6'>
              {/* Customer & Pharmacist Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <h4 className='text-sm text-blue-800 mb-3'>Thông tin khách hàng</h4>
                  <div className='flex items-center gap-3 mb-3'>
                    <Avatar>
                      <AvatarImage src={selectedPrescription.customerAvatar} />
                      <AvatarFallback>{selectedPrescription.customerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='text-sm'>{selectedPrescription.customerName}</p>
                      <p className='text-xs text-gray-600'>{selectedPrescription.customerPhone}</p>
                    </div>
                  </div>
                </div>

                <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                  <h4 className='text-sm text-green-800 mb-3'>Dược sĩ phụ trách</h4>
                  {selectedPrescription.pharmacistName ? (
                    <div className='space-y-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={selectedPrescription.pharmacistAvatar} />
                          <AvatarFallback className='bg-green-600 text-white'>
                            {selectedPrescription.pharmacistName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium'>{selectedPrescription.pharmacistName}</p>
                          {selectedPrescription.pharmacistLicense && (
                            <p className='text-xs text-gray-600'>GPLX: {selectedPrescription.pharmacistLicense}</p>
                          )}
                        </div>
                      </div>
                      {selectedPrescription.pharmacistPhone && (
                        <div className='flex items-center gap-2 text-sm text-gray-700'>
                          <Phone className='w-4 h-4' />
                          <span>{selectedPrescription.pharmacistPhone}</span>
                        </div>
                      )}
                      {selectedPrescription.pharmacistEmail && (
                        <div className='flex items-center gap-2 text-sm text-gray-700'>
                          <Mail className='w-4 h-4' />
                          <span>{selectedPrescription.pharmacistEmail}</span>
                        </div>
                      )}
                    </div>
                  ) : (

                    <p className='text-sm text-gray-500'>Chưa phân công</p>
                  )}
                </div>
              </div>

              {/* Prescription Images */}
              <PrescriptionImageViewer images={selectedPrescription.images} />

              {/* Medical Information */}
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <h4 className='mb-3'>Thông tin y tế</h4>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm text-gray-500'>Bác sĩ kê đơn:</span>
                      <p className='text-sm'>{selectedPrescription.doctorName || 'Không rõ'}</p>
                    </div>
                    <div>
                      <span className='text-sm text-gray-500'>Chẩn đoán:</span>
                      <p className='text-sm'>{selectedPrescription.diagnosis || 'Không rõ'}</p>
                    </div>
                    <div>
                      <span className='text-sm text-gray-500'>Ngày tạo:</span>
                      <p className='text-sm'>{formatDateTime(selectedPrescription.createdAt)}</p>
                    </div>
                    <div>
                      <span className='text-sm text-gray-500'>Cập nhật lần cuối:</span>
                      <p className='text-sm'>{formatDateTime(selectedPrescription.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='mb-3'>Danh sách thuốc</h4>
                  <div className='space-y-2'>
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={index} className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                        <div className='flex items-start gap-2'>
                          <Pill className='w-4 h-4 text-blue-600 mt-0.5' />
                          <div className='flex-1'>
                            <p className='text-sm'>{medication.name}</p>
                            <p className='text-xs text-gray-600'>
                              Liều dùng: {medication.dosage} • Số lượng: {medication.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <h4 className='text-sm text-yellow-800 mb-2'>Ghi chú từ bệnh nhân</h4>
                  <p className='text-sm text-gray-700'>{selectedPrescription.notes}</p>
                </div>
              )}

              {selectedPrescription.pharmacistNotes && (
                <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <h4 className='text-sm text-green-800 mb-2'>Ghi chú dược sĩ</h4>
                  <p className='text-sm text-gray-700'>{selectedPrescription.pharmacistNotes}</p>
                </div>
              )}

              {selectedPrescription.rejectionReason && (
                <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                  <h4 className='text-sm text-red-800 mb-2'>Lý do từ chối</h4>
                  <p className='text-sm text-gray-700'>{selectedPrescription.rejectionReason}</p>
                </div>
              )}

              {/* Order Link */}
              {selectedPrescription.orderId && (
                <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm text-[#0066CC] mb-1'>Đơn hàng liên kết</h4>
                      <p className='text-sm'>Mã đơn: {selectedPrescription.orderId}</p>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => (window.location.href = `/admin/orders?orderId=${selectedPrescription.orderId}`)}
                      className='border-blue-300 text-[#0066CC] hover:bg-blue-100'
                    >
                      <Package className='w-4 h-4 mr-1' />
                      Xem đơn hàng
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {/* Admin can approve/reject any prescription */}
              <div className='flex gap-3 pt-6 border-t'>
                <Button
                  variant='outline'
                  onClick={() => setSelectedPrescription(null)}
                  className='flex-1'
                >
                  Đóng
                </Button>
                {selectedPrescription.status !== 'expired' && (
                  <Button
                    onClick={() => setShowExpireConfirm(true)}
                    className='flex-1 bg-gray-600 hover:bg-gray-700 text-white'
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className='w-4 h-4 mr-2 text-white' />
                    Đánh dấu hết hạn
                  </Button>
                )}
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className='w-4 h-4 mr-2 text-white' />
                  Từ chối
                </Button>
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className='w-4 h-4 mr-2 text-white' />
                  Phê duyệt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Lý do từ chối đơn thuốc</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối đơn thuốc này. Thông tin sẽ được gửi đến khách hàng.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <Textarea
              placeholder='Ví dụ: Ảnh đơn thuốc không rõ ràng, thiếu thông tin bác sĩ...'
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className='resize-none'
            />
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }}
                className='flex-1'
              >
                Hủy
              </Button>
              <Button
                onClick={handleRejectPrescription}
                disabled={!rejectionReason.trim() || updateStatusMutation.isPending}
                className='flex-1 bg-red-600 hover:bg-red-700 text-white'
              >
                {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Xác nhận phê duyệt đơn thuốc</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt đơn thuốc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={() => setShowApproveConfirm(false)}
              className='flex-1'
            >
              Hủy
            </Button>
            <Button
              onClick={handleApprovePrescription}
              disabled={updateStatusMutation.isPending}
              className='flex-1 bg-green-600 hover:bg-green-700 text-white'
            >
              {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expire Confirmation Dialog */}
      <Dialog open={showExpireConfirm} onOpenChange={setShowExpireConfirm}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Đánh dấu đơn thuốc hết hạn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu đơn thuốc này là hết hạn? Đơn thuốc sẽ không thể được sử dụng để mua thuốc.
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={() => setShowExpireConfirm(false)}
              className='flex-1'
            >
              Hủy
            </Button>
            <Button
              onClick={handleExpirePrescription}
              disabled={updateStatusMutation.isPending}
              className='flex-1 bg-gray-600 hover:bg-gray-700 text-white'
            >
              {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hết hạn'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
