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
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { getPrescriptionStatusBadge, getProductTypeBadge, getPriorityBadge } from '../../utils/badgeUtils'

interface Prescription {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAvatar?: string
  pharmacistId?: string
  pharmacistName?: string
  images: string[]
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'fulfilled'
  prescriptionType: 'Rx' | 'OTC'
  priority: 'normal' | 'urgent'
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

const mockPrescriptions: Prescription[] = [
  {
    id: 'RX001',
    customerId: 'C001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    pharmacistId: 'P001',
    pharmacistName: 'Ds. Trần Thị B',
    images: [
      'https://images.unsplash.com/photo-1576671081837-49000212a370?w=400',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
    ],
    status: 'approved',
    prescriptionType: 'Rx',
    priority: 'urgent',
    createdAt: '2025-01-15T08:30:00Z',
    updatedAt: '2025-01-15T09:15:00Z',
    doctorName: 'BS. Nguyễn Thị C',
    diagnosis: 'Viêm họng cấp',
    medications: [
      { name: 'Augmentin 500mg', dosage: '2 viên/ngày', quantity: 20 },
      { name: 'Paracetamol 500mg', dosage: '3 viên/ngày', quantity: 30 },
      { name: 'Nước súc miệng Betadine', dosage: '3 lần/ngày', quantity: 1 },
    ],
    notes: 'Uống thuốc sau ăn 30 phút',
    pharmacistNotes: 'Đã kiểm tra đơn thuốc, phê duyệt',
    orderId: 'DH001',
  },
  {
    id: 'RX002',
    customerId: 'C002',
    customerName: 'Trần Thị D',
    customerPhone: '0987654321',
    pharmacistId: 'P002',
    pharmacistName: 'Ds. Lê Văn E',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'processing',
    prescriptionType: 'Rx',
    priority: 'normal',
    createdAt: '2025-01-15T07:15:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    doctorName: 'BS. Phạm Văn F',
    diagnosis: 'Đau dạ dày',
    medications: [
      { name: 'Omeprazole 20mg', dosage: '1 viên/ngày', quantity: 30 },
      { name: 'Sucralfate 1g', dosage: '2 viên/ngày', quantity: 60 },
    ],
    pharmacistNotes: 'Đang xác minh với bệnh nhân',
  },
  {
    id: 'RX003',
    customerId: 'C003',
    customerName: 'Phạm Văn G',
    customerPhone: '0912345678',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'pending',
    prescriptionType: 'Rx',
    priority: 'urgent',
    createdAt: '2025-01-15T06:00:00Z',
    updatedAt: '2025-01-15T06:00:00Z',
    doctorName: 'BS. Hoàng Thị H',
    diagnosis: 'Tăng huyết áp',
    medications: [
      { name: 'Amlodipine 5mg', dosage: '1 viên/ngày', quantity: 30 },
      { name: 'Hydrochlorothiazide 25mg', dosage: '1 viên/ngày', quantity: 30 },
    ],
    notes: 'Cần gấp, bệnh nhân đang ở xa',
  },
  {
    id: 'RX004',
    customerId: 'C004',
    customerName: 'Lê Thị I',
    customerPhone: '0923456789',
    pharmacistId: 'P001',
    pharmacistName: 'Ds. Trần Thị B',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'fulfilled',
    prescriptionType: 'Rx',
    priority: 'normal',
    createdAt: '2025-01-14T10:30:00Z',
    updatedAt: '2025-01-14T15:45:00Z',
    doctorName: 'BS. Vũ Văn K',
    diagnosis: 'Nhiễm trùng đường hô hấp',
    medications: [
      { name: 'Azithromycin 500mg', dosage: '1 viên/ngày', quantity: 3 },
      { name: 'Bromhexine 8mg', dosage: '3 viên/ngày', quantity: 30 },
    ],
    pharmacistNotes: 'Đã hoàn thành đơn hàng',
    orderId: 'DH002',
  },
  {
    id: 'RX005',
    customerId: 'C005',
    customerName: 'Võ Văn L',
    customerPhone: '0934567890',
    pharmacistId: 'P003',
    pharmacistName: 'Ds. Nguyễn Văn M',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'rejected',
    prescriptionType: 'Rx',
    priority: 'normal',
    createdAt: '2025-01-15T05:00:00Z',
    updatedAt: '2025-01-15T05:30:00Z',
    doctorName: 'BS. Đặng Thị N',
    diagnosis: 'Viêm da',
    medications: [{ name: 'Betamethasone cream', dosage: 'Bôi 2 lần/ngày', quantity: 1 }],
    pharmacistNotes: 'Hình ảnh đơn thuốc không rõ ràng',
    rejectionReason: 'Đơn thuốc bị mờ, không đọc được chữ ký bác sĩ. Vui lòng chụp lại.',
  },
  {
    id: 'OTC001',
    customerId: 'C006',
    customerName: 'Đỗ Thị O',
    customerPhone: '0945678901',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'pending',
    prescriptionType: 'OTC',
    priority: 'normal',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
    medications: [
      { name: 'Vitamin C 1000mg', dosage: '1 viên/ngày', quantity: 60 },
      { name: 'Omega-3', dosage: '2 viên/ngày', quantity: 100 },
    ],
    notes: 'Tư vấn bổ sung vitamin',
  },
]

export function PrescriptionManagementPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [dateRange, setDateRange] = useState('all')

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerPhone.includes(searchQuery) ||
      prescription.pharmacistName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medications.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter
    const matchesType = typeFilter === 'all' || prescription.prescriptionType === typeFilter
    const matchesPriority = priorityFilter === 'all' || prescription.priority === priorityFilter

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

    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesDateRange
  })

  // Get statistics
  const getStats = () => {
    const total = prescriptions.length
    const pending = prescriptions.filter((p) => p.status === 'pending').length
    const approved = prescriptions.filter((p) => p.status === 'approved').length
    const rejected = prescriptions.filter((p) => p.status === 'rejected').length
    const fulfilled = prescriptions.filter((p) => p.status === 'fulfilled').length
    const urgent = prescriptions.filter((p) => p.priority === 'urgent').length

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const approvedToday = prescriptions.filter((p) => {
      const updatedDate = new Date(p.updatedAt)
      return p.status === 'approved' && updatedDate >= today
    }).length

    return { total, pending, approved, rejected, fulfilled, urgent, approvedToday }
  }

  const stats = getStats()

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedPrescriptions.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đơn thuốc')
      return
    }

    const count = selectedPrescriptions.length

    switch (action) {
      case 'approve':
        setPrescriptions((prev) =>
          prev.map((p) =>
            selectedPrescriptions.includes(p.id) && p.status === 'pending'
              ? { ...p, status: 'approved', updatedAt: new Date().toISOString() }
              : p,
          ),
        )
        toast.success(`Đã phê duyệt ${count} đơn thuốc`)
        break
      case 'reject':
        setPrescriptions((prev) =>
          prev.map((p) =>
            selectedPrescriptions.includes(p.id) && p.status === 'pending'
              ? { ...p, status: 'rejected', updatedAt: new Date().toISOString() }
              : p,
          ),
        )
        toast.success(`Đã từ chối ${count} đơn thuốc`)
        break
      case 'export':
        toast.success(`Đã xuất ${count} đơn thuốc`)
        break
    }

    setSelectedPrescriptions([])
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedPrescriptions((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedPrescriptions.length === filteredPrescriptions.length) {
      setSelectedPrescriptions([])
    } else {
      setSelectedPrescriptions(filteredPrescriptions.map((p) => p.id))
    }
  }

  // View prescription details
  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
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
          <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
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
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Khẩn cấp</p>
                <p className='text-2xl font-semibold text-orange-600'>{stats.urgent}</p>
              </div>
              <AlertTriangle className='w-8 h-8 text-orange-400' />
            </div>
            {stats.urgent > 0 && (
              <div className='mt-2 flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded'>
                Ưu tiên cao
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
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
              <SelectItem value='processing'>Đang xử lý</SelectItem>
              <SelectItem value='approved'>Đã duyệt</SelectItem>
              <SelectItem value='rejected'>Từ chối</SelectItem>
              <SelectItem value='fulfilled'>Hoàn thành</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-32 border-2 border-blue-200 focus:border-blue-500'>
              <SelectValue placeholder='Loại' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='Rx'>Rx - Kê đơn</SelectItem>
              <SelectItem value='OTC'>OTC</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className='w-32 border-2 border-blue-200 focus:border-blue-500'>
              <SelectValue placeholder='Độ ưu tiên' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='urgent'>Khẩn cấp</SelectItem>
              <SelectItem value='normal'>Bình thường</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className='w-32 border-2 border-blue-200 focus:border-blue-500'>
              <SelectValue placeholder='Thời gian' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
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
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 overflow-hidden'>
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
                <th className='p-4 text-left text-sm text-gray-700'>Loại</th>
                <th className='p-4 text-left text-sm text-gray-700'>Trạng thái</th>
                <th className='p-4 text-left text-sm text-gray-700'>Thuốc</th>
                <th className='p-4 text-left text-sm text-gray-700'>Ngày tạo</th>
                <th className='p-4 text-center text-sm text-gray-700'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className='p-12 text-center'>
                    <FileText className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                    <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy đơn thuốc</h3>
                    <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className='hover:bg-blue-50/50 transition-colors'>
                    <td className='p-4'>
                      <Checkbox
                        checked={selectedPrescriptions.includes(prescription.id)}
                        onCheckedChange={() => toggleSelection(prescription.id)}
                      />
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm'>{prescription.id}</span>
                        {getPriorityBadge(prescription.priority)}
                      </div>
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-8 h-8'>
                          <AvatarImage src={prescription.customerAvatar} />
                          <AvatarFallback>{prescription.customerName.charAt(0)}</AvatarFallback>
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
                    <td className='p-4'>{getProductTypeBadge(prescription.prescriptionType)}</td>
                    <td className='p-4'>{getPrescriptionStatusBadge(prescription.status)}</td>
                    <td className='p-4'>
                      <div className='text-sm text-gray-700'>{prescription.medications.length} loại thuốc</div>
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
      </div>

      {/* Prescription Detail Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                <span>Chi tiết đơn thuốc #{selectedPrescription.id}</span>
                {getProductTypeBadge(selectedPrescription.prescriptionType)}
                {getPrescriptionStatusBadge(selectedPrescription.status)}
                {getPriorityBadge(selectedPrescription.priority)}
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
                    <div className='flex items-center gap-2'>
                      <UserCheck className='w-5 h-5 text-green-600' />
                      <span className='text-sm'>{selectedPrescription.pharmacistName}</span>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>Chưa phân công</p>
                  )}
                </div>
              </div>

              {/* Prescription Images */}
              <div>
                <h4 className='mb-3'>Ảnh đơn thuốc ({selectedPrescription.images.length})</h4>
                <div className='grid grid-cols-2 gap-4'>
                  {selectedPrescription.images.map((image, index) => (
                    <div key={index} className='relative group'>
                      <img
                        src={image}
                        alt={`Đơn thuốc ${index + 1}`}
                        className='w-full h-48 object-cover rounded-lg border-2 border-gray-200'
                      />
                      <Badge className='absolute top-2 left-2 bg-white/90 text-gray-800'>Ảnh {index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>

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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
