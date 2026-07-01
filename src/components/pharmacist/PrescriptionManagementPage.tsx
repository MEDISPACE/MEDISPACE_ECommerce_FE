/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  User,
  FileText,
  Stethoscope,
  Loader2,
} from 'lucide-react'
/* eslint-enable @typescript-eslint/no-unused-vars */

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { toast } from 'sonner'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'
import { getPrescriptionStatusBadge } from '../../utils/badgeUtils'
import { prescriptionService, type Prescription, type PrescriptionStats } from '~/services/pharmacist'
import { PrescriptionDetailsDialog } from './PrescriptionDetailsDialog'

export function PrescriptionManagementPage() {
  // State management
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [stats, setStats] = useState<PrescriptionStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const prescriptionsPerPage = 5

  // Map frontend status to backend status (already lowercase, no conversion needed)
  const mapStatusToBackend = (status: string): string | undefined => {
    if (status === 'all') return undefined
    return status // Return as-is since we're using lowercase throughout
  }

  // Load prescriptions and stats from API
  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      const mappedStatus = mapStatusToBackend(statusFilter)

      // Load stats and prescriptions in parallel
      const [statsData, prescriptionsData] = await Promise.all([
        prescriptionService.getStats(),
        prescriptionService.getAll({
          page: 1,
          limit: 100,
          status: mappedStatus,
        }),
      ])

      setStats(statsData)
      setPrescriptions(prescriptionsData)
    } catch (error) {
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

  // Filter by search and date (status already filtered by backend)
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerId.toLowerCase().includes(searchQuery.toLowerCase())

    // Date filtering
    const prescriptionDate = new Date(prescription.createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let matchesDate = true
    if (dateFilter === 'today') {
      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)
      matchesDate = prescriptionDate >= today && prescriptionDate <= todayEnd
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      matchesDate = prescriptionDate >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(today.getMonth() - 1)
      matchesDate = prescriptionDate >= monthAgo
    }

    return matchesSearch && matchesDate
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage)
  const startIndex = (currentPage - 1) * prescriptionsPerPage
  const endIndex = startIndex + prescriptionsPerPage
  const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, dateFilter])

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
  }

  // TODO: Will be used when chat API is ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStartChat = (customerPhone: string) => {
    // Open chat with customer
    window.location.href = `/contact?phone=${customerPhone}`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN')
  }

  const { StatsCard } = useStatsCards()

  // Define stats cards config using real API data
  const statsCards: StatCardConfig[] = [
    {
      title: 'Chờ xử lý',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Đã duyệt',
      value: stats?.verified || 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Đã từ chối',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Hết hạn',
      value: stats?.expired || 0,
      icon: AlertTriangle,
      color: 'orange',
    },
  ]

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-[#1E40AF] mx-auto mb-4' />
          <p className='text-gray-600'>Đang tải danh sách đơn thuốc...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6' data-testid='prescriptions-page'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1
              className='text-3xl font-bold bg-clip-text text-transparent'
              style={{
                backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
              }}
            >
              Quản lý đơn thuốc
            </h1>
            <p className='text-gray-600 mt-1'>Xem xét và phê duyệt đơn thuốc từ khách hàng</p>
          </div>
        </div>

        {/* Stats - Using reusable hook */}
        <div className='mt-6'>
          <StatsCardGrid cols={4}>
            {statsCards.map((stat, index) => (
              <div key={index} className='h-full' data-testid={`prescription-stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}>
                <StatsCard config={stat} />
              </div>
            ))}
          </StatsCardGrid>
        </div>
      </div>

      {/* Filter & Search */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                data-testid='prescription-search-input'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm theo mã đơn, tên khách hàng, SĐT...'
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-40' data-testid='prescription-status-filter'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='pending'>Chờ xử lý</SelectItem>
              <SelectItem value='verified'>Đã duyệt</SelectItem>
              <SelectItem value='rejected'>Từ chối</SelectItem>
              <SelectItem value='expired'>Hết hạn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className='w-40' data-testid='prescription-date-filter'>
              <SelectValue placeholder='Thời gian' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả thời gian</SelectItem>
              <SelectItem value='today'>Hôm nay</SelectItem>
              <SelectItem value='week'>7 ngày qua</SelectItem>
              <SelectItem value='month'>30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prescription List */}
      <div className='space-y-4'>
        {/* Header with pagination info */}
        {filteredPrescriptions.length > 0 && (
          <div className='flex items-center justify-between px-2'>
            <p className='text-sm text-gray-600'>
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredPrescriptions.length)} /{' '}
              {filteredPrescriptions.length} đơn thuốc
            </p>
            <p className='text-sm text-gray-600'>
              Trang {currentPage} / {totalPages || 1}
            </p>
          </div>
        )}

        {filteredPrescriptions.length === 0 ? (
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-[#E8EDF5]' data-testid='prescription-empty-state'>
            <CardContent className='p-12 text-center'>
              <FileText className='w-16 h-16 mx-auto text-gray-300 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy đơn thuốc</h3>
              <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </CardContent>
          </Card>
        ) : (
          paginatedPrescriptions.map((prescription) => (
            <Card
              key={prescription._id}
              data-testid={`prescription-card-${prescription._id}`}
              data-status={prescription.status}
              data-prescription-number={prescription.prescriptionNumber}
              className='bg-white/80 backdrop-blur-lg shadow-lg border border-[#E8EDF5] hover:shadow-xl transition-all duration-200'
            >
              <CardContent className='p-5'>
                <div className='flex items-start justify-between gap-3 mb-3'>
                  {/* Left: identity */}
                  <div className='flex items-start gap-3 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-[#E8EDF5] flex items-center justify-center shrink-0'>
                      <FileText className='w-5 h-5 text-[#1E40AF]' />
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                        <span className='font-semibold text-sm text-gray-900'>{prescription.prescriptionNumber}</span>
                        {getPrescriptionStatusBadge(prescription.status)}
                        {/* Urgency: how long waiting? */}
                        {prescription.status === 'pending' &&
                          (() => {
                            const diffHours = (Date.now() - new Date(prescription.createdAt).getTime()) / 3600000
                            return diffHours > 8 ? (
                              <span data-testid='urgency-indicator' className='flex items-center gap-1 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200'>
                                <AlertTriangle className='w-3 h-3' />
                                Chờ {Math.floor(diffHours)}h
                              </span>
                            ) : null
                          })()}
                      </div>
                      {/* Patient name prominently */}
                      <p className='text-sm font-medium text-blue-800'>
                        {prescription.patientName ? (
                          <span className='flex items-center gap-1'>
                            <User className='w-3.5 h-3.5' />
                            {prescription.patientName}
                            {prescription.patientAge ? `, ${prescription.patientAge} tuổi` : ''}
                          </span>
                        ) : (
                          <span className='text-gray-400 italic text-xs'>Chưa có tên bệnh nhân</span>
                        )}
                      </p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        BS. {prescription.doctorName}
                        {prescription.hospitalName ? ` · ${prescription.hospitalName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='text-xs text-gray-400 hidden sm:block'>
                      <Clock className='w-3 h-3 inline mr-0.5' />
                      {formatDateTime(prescription.createdAt)}
                    </span>
                    <Button
                      data-testid='review-prescription-btn'
                      variant='outline'
                      size='sm'
                      onClick={() => handleViewPrescription(prescription)}
                      className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
                    >
                      <Eye className='w-4 h-4 mr-1' />
                      Xem &amp; Xét duyệt
                    </Button>
                  </div>
                </div>

                {/* Info chips */}
                <div className='flex flex-wrap gap-2 text-xs text-gray-600'>
                  <span className='bg-gray-100 px-2 py-0.5 rounded-full'>
                    💊 {prescription.medications.length} thuốc
                  </span>
                  {prescription.diagnosis && (
                    <span className='bg-[#F0F6FF] text-[#1E40AF] px-2 py-0.5 rounded-full max-w-xs truncate'>
                      <Stethoscope className='w-3 h-3 inline mr-0.5' />
                      {prescription.diagnosis}
                    </span>
                  )}
                </div>

                {prescription.notes && (
                  <div className='mt-3 p-2 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg'>
                    <p className='text-xs text-blue-800'>
                      <strong>Ghi chú:</strong> {prescription.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className='flex items-center justify-center gap-2 mt-6'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className='flex gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  data-testid='pagination-page-btn'
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-[#0A2463] hover:bg-[#071A49] text-white' : ''}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      {/* Prescription Details Dialog */}
      <PrescriptionDetailsDialog
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
        onUpdate={loadPrescriptions}
      />
    </div>
  )
}
