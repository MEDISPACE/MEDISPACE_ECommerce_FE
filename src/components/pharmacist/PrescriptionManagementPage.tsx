import { useState } from 'react'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Package,
  User,
  Phone,
  FileText,
  Pill,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { toast } from 'sonner'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'
import { getPrescriptionStatusBadge, getPriorityBadge } from '../../utils/badgeUtils'

interface Prescription {
  id: string
  customerName: string
  customerPhone: string
  customerAvatar?: string
  images: string[]
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed'
  priority: 'normal' | 'urgent'
  createdAt: string
  doctorName?: string
  diagnosis?: string
  medications: string[]
  notes?: string
  pharmacistNotes?: string
}

const mockPrescriptions: Prescription[] = [
  {
    id: 'DT001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    images: [
      'https://images.unsplash.com/photo-1576671081837-49000212a370?w=400',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
    ],
    status: 'pending',
    priority: 'urgent',
    createdAt: '2024-01-15T08:30:00Z',
    doctorName: 'BS. Nguyễn Thị B',
    diagnosis: 'Viêm họng cấp',
    medications: ['Augmentin 500mg', 'Paracetamol 500mg', 'Nước súc miệng Betadine'],
    notes: 'Uống thuốc sau ăn 30 phút',
  },
  {
    id: 'DT002',
    customerName: 'Trần Thị C',
    customerPhone: '0987654321',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'processing',
    priority: 'normal',
    createdAt: '2024-01-15T07:15:00Z',
    doctorName: 'BS. Lê Văn D',
    diagnosis: 'Đau dạ dày',
    medications: ['Omeprazole 20mg', 'Sucralfate 1g'],
    pharmacistNotes: 'Cần bổ sung ảnh mặt sau đơn thuốc',
  },
  {
    id: 'DT003',
    customerName: 'Phạm Văn E',
    customerPhone: '0912345678',
    images: ['https://images.unsplash.com/photo-1576671081837-49000212a370?w=400'],
    status: 'approved',
    priority: 'normal',
    createdAt: '2024-01-15T06:00:00Z',
    doctorName: 'BS. Hoàng Thị F',
    diagnosis: 'Tăng huyết áp',
    medications: ['Amlodipine 5mg', 'Hydrochlorothiazide 25mg'],
  },
]

export function PrescriptionManagementPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [pharmacistNotes, setPharmacistNotes] = useState('')

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerPhone.includes(searchQuery)

    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || prescription.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusStats = () => {
    const pending = prescriptions.filter((p) => p.status === 'pending').length
    const processing = prescriptions.filter((p) => p.status === 'processing').length
    const approved = prescriptions.filter((p) => p.status === 'approved').length
    const urgent = prescriptions.filter((p) => p.priority === 'urgent').length

    return { pending, processing, approved, urgent }
  }

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setPharmacistNotes(prescription.pharmacistNotes || '')
  }

  const handleUpdateStatus = (prescriptionId: string, newStatus: string, notes?: string) => {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescriptionId ? { ...p, status: newStatus as Prescription['status'], pharmacistNotes: notes } : p,
      ),
    )

    const statusText =
      {
        processing: 'đang xử lý',
        approved: 'đã duyệt',
        rejected: 'đã từ chối',
        completed: 'hoàn thành',
      }[newStatus] || newStatus

    toast.success(`Đơn thuốc ${prescriptionId} ${statusText}`)
    setSelectedPrescription(null)
    setPharmacistNotes('')
  }

  const handleCreateOrder = (prescriptionId: string) => {
    // Navigate to create order page with prescription context
    window.location.href = `/pharmacist/create-order?prescriptionId=${prescriptionId}`
  }

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
      title: 'Đang xử lý',
      value: stats.processing,
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Khẩn cấp',
      value: stats.urgent,
      icon: AlertTriangle,
      color: 'orange',
      badge:
        stats.urgent > 0
          ? {
              text: 'Ưu tiên cao',
              show: true,
            }
          : undefined,
    },
  ]

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
                key={prescription.id}
                className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200'
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-4'>
                      <Avatar>
                        <AvatarImage src={prescription.customerAvatar} />
                        <AvatarFallback>{prescription.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className='flex items-center gap-3 mb-1'>
                          <h3 className='font-medium text-gray-900'>Đơn thuốc #{prescription.id}</h3>
                          {getPrescriptionStatusBadge(prescription.status)}
                          {getPriorityBadge(prescription.priority)}
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <User className='w-4 h-4' />
                            {prescription.customerName}
                          </div>
                          <div className='flex items-center gap-1'>
                            <Phone className='w-4 h-4' />
                            {prescription.customerPhone}
                          </div>
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

                      <Button variant='outline' size='sm' onClick={() => handleStartChat(prescription.customerPhone)}>
                        <MessageSquare className='w-4 h-4 mr-1' />
                        Chat
                      </Button>

                      {prescription.status === 'approved' && (
                        <Button
                          size='sm'
                          onClick={() => handleCreateOrder(prescription.id)}
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
                      <p className='font-medium'>{prescription.doctorName || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Chẩn đoán:</span>
                      <p className='font-medium'>{prescription.diagnosis || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Số lượng ảnh:</span>
                      <p className='font-medium'>{prescription.images.length} ảnh</p>
                    </div>
                  </div>

                  {prescription.pharmacistNotes && (
                    <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm text-blue-800'>
                        <strong>Ghi chú dược sĩ:</strong> {prescription.pharmacistNotes}
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
                <DialogTitle>Chi tiết đơn thuốc #{selectedPrescription.id}</DialogTitle>
                <DialogDescription>Xem chi tiết, phê duyệt hoặc từ chối đơn thuốc từ khách hàng</DialogDescription>
              </DialogHeader>

              <div className='space-y-6'>
                {/* Customer Info */}
                <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                  <Avatar>
                    <AvatarImage src={selectedPrescription.customerAvatar} />
                    <AvatarFallback>{selectedPrescription.customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className='font-medium'>{selectedPrescription.customerName}</h3>
                    <p className='text-sm text-gray-600'>{selectedPrescription.customerPhone}</p>
                  </div>
                  <div className='ml-auto flex gap-2'>
                    {getPrescriptionStatusBadge(selectedPrescription.status)}
                    {getPriorityBadge(selectedPrescription.priority)}
                  </div>
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
                        <span className='text-gray-500'>Bác sĩ:</span>
                        <p className='font-medium'>{selectedPrescription.doctorName || 'Chưa có'}</p>
                      </div>
                      <div>
                        <span className='text-gray-500'>Chẩn đoán:</span>
                        <p className='font-medium'>{selectedPrescription.diagnosis || 'Chưa có'}</p>
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
                        <div key={index} className='flex items-center gap-2 p-2 bg-blue-50 rounded'>
                          <Pill className='w-4 h-4 text-blue-600' />
                          <span className='text-sm'>{medication}</span>
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
                  {selectedPrescription.status === 'pending' && (
                    <>
                      <Button
                        variant='outline'
                        onClick={() => {
                          // Show rejection reason dialog
                        }}
                        className='text-red-600 border-red-200 hover:bg-red-50'
                      >
                        <XCircle className='w-4 h-4 mr-2' />
                        Từ chối
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedPrescription.id, 'processing', pharmacistNotes)}
                        className='bg-blue-600 hover:bg-blue-700'
                      >
                        Bắt đầu xử lý
                      </Button>
                    </>
                  )}

                  {selectedPrescription.status === 'processing' && (
                    <>
                      <Button
                        variant='outline'
                        onClick={() => handleUpdateStatus(selectedPrescription.id, 'pending', pharmacistNotes)}
                      >
                        Yêu cầu bổ sung
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedPrescription.id, 'approved', pharmacistNotes)}
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Phê duyệt
                      </Button>
                    </>
                  )}

                  {selectedPrescription.status === 'approved' && (
                    <Button
                      onClick={() => {
                        handleCreateOrder(selectedPrescription.id)
                        setSelectedPrescription(null)
                      }}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                    >
                      <Package className='w-4 h-4 mr-2' />
                      Tạo đơn hàng
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
