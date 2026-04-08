import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  FileText,
  Upload,
  Eye,
  ExternalLink,
  MessageCircle,
  ShoppingCart,
  Calendar,
  User,
  Hospital,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog'
import { StatusBadge } from '../shared/StatusBadge'
import { EmptyState } from '../shared/EmptyState'
import { prescriptionsAPI } from '~/lib/api/prescriptions'
import type { Prescription } from '~/types/account'

// Interface for backend prescription data
interface BackendPrescription {
  _id: string
  prescriptionNumber: string
  customerId: string
  doctorName: string
  hospitalName?: string
  prescriptionDate: string
  images: string[]
  medications: {
    productName: string
    dosage: string
    quantity: number
    instructions: string
  }[]
  status: string
  pharmacistNotes?: string
  notes?: string
  createdAt: string
  updatedAt: string
  orderId?: string
}

// Map backend status to frontend status
const mapStatus = (status: string): Prescription['status'] => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'pending'
    case 'verified':
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'completed':
      return 'completed'
    default:
      return 'pending'
  }
}

// Map backend prescription to frontend format
const mapPrescription = (bp: BackendPrescription): Prescription => ({
  id: bp._id,
  customerId: bp.customerId,
  prescriptionNumber: bp.prescriptionNumber,
  doctorName: bp.doctorName,
  hospital: bp.hospitalName || '',
  prescriptionDate: bp.prescriptionDate,
  images: bp.images || [],
  medicines: (bp.medications || []).map((med, index) => ({
    id: `${bp._id}-med-${index}`,
    name: med.productName,
    dosage: med.dosage,
    frequency: med.instructions,
    duration: '',
    quantity: med.quantity,
  })),
  status: mapStatus(bp.status),
  pharmacistNotes: bp.pharmacistNotes || bp.notes,
  contactPhone: '',
  createdAt: bp.createdAt,
  updatedAt: bp.updatedAt,
  orderId: bp.orderId,
  rejectionReason: bp.status === 'rejected' ? bp.pharmacistNotes || bp.notes : undefined,
})

export function PrescriptionsPage() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('all')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = (await prescriptionsAPI.getPrescriptions()) as {
          result?: { prescriptions?: BackendPrescription[] }
        }
        const backendPrescriptions: BackendPrescription[] = response.result?.prescriptions || []
        const mappedPrescriptions = backendPrescriptions.map(mapPrescription)
        setPrescriptions(mappedPrescriptions)
      } catch (err) {
        console.error('Error fetching prescriptions:', err)
        setError('Không thể tải danh sách đơn thuốc. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [])

  const filterPrescriptions = (status?: string) => {
    if (!status || status === 'all') {
      return prescriptions
    }
    return prescriptions.filter((prescription) => prescription.status === status)
  }

  const getTabCounts = () => {
    return {
      all: prescriptions.length,
      pending: prescriptions.filter((p) => p.status === 'pending').length,
      approved: prescriptions.filter((p) => p.status === 'approved').length,
      rejected: prescriptions.filter((p) => p.status === 'rejected').length,
      completed: prescriptions.filter((p) => p.status === 'completed').length,
    }
  }

  const tabCounts = getTabCounts()
  const filteredPrescriptions = filterPrescriptions(selectedTab === 'all' ? undefined : selectedTab)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-5 h-5 text-yellow-600' />
      case 'reviewing':
        return <Eye className='w-5 h-5 text-blue-600' />
      case 'approved':
        return <CheckCircle className='w-5 h-5 text-green-600' />
      case 'rejected':
        return <X className='w-5 h-5 text-red-600' />
      case 'completed':
        return <CheckCircle className='w-5 h-5 text-green-600' />
      default:
        return <Clock className='w-5 h-5 text-gray-600' />
    }
  }

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => (
    <Card className='border-blue-100 hover:shadow-md transition-all duration-300'>
      <CardContent className='p-6'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              {getStatusIcon(prescription.status)}
            </div>
            <div>
              <h3 className='font-medium'>Đơn thuốc #{prescription.prescriptionNumber}</h3>
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <User className='w-4 h-4' />
                <span>{prescription.doctorName}</span>
              </div>
              <div className='flex items-center gap-4 text-sm text-gray-500 mt-1'>
                <span className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  Ngày kê: {formatDate(prescription.prescriptionDate)}
                </span>
                <span className='flex items-center gap-1'>
                  <Hospital className='w-4 h-4' />
                  {prescription.hospital}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={prescription.status} type='prescription' />
        </div>

        {/* Status Info */}
        <div className='mb-4'>
          {prescription.status === 'pending' && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-yellow-800'>
                <Clock className='w-4 h-4' />
                <span className='text-sm font-medium'>Chờ dược sĩ xác nhận</span>
              </div>
              <p className='text-sm text-yellow-700 mt-1'>Đơn thuốc đang được dược sĩ xem xét. Thời gian xử lý: 24h</p>
            </div>
          )}

          {prescription.status === 'rejected' && prescription.rejectionReason && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-red-800 mb-1'>
                <AlertCircle className='w-4 h-4' />
                <span className='text-sm font-medium'>Đơn thuốc bị từ chối</span>
              </div>
              <p className='text-sm text-red-700'>{prescription.rejectionReason}</p>
              {prescription.pharmacistNotes && (
                <p className='text-sm text-red-600 mt-1'>Ghi chú: {prescription.pharmacistNotes}</p>
              )}
            </div>
          )}

          {prescription.status === 'completed' && prescription.orderId && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-green-800'>
                <CheckCircle className='w-4 h-4' />
                <span className='text-sm font-medium'>Đã tạo đơn hàng thành công</span>
              </div>
              <p className='text-sm text-green-700 mt-1'>Đơn hàng đã được tạo. Kiểm tra trong mục "Đơn hàng của tôi"</p>
            </div>
          )}
        </div>

        {/* Medicines */}
        <div className='mb-4'>
          <h4 className='font-medium text-sm mb-2'>💊 Thuốc được kê:</h4>
          <div className='space-y-1'>
            {prescription.medicines.slice(0, 2).map((medicine) => (
              <div key={medicine.id} className='text-sm text-gray-600'>
                • {medicine.name} - {medicine.frequency} x {medicine.duration}
              </div>
            ))}
            {prescription.medicines.length > 2 && (
              <div className='text-sm text-gray-500'>+ {prescription.medicines.length - 2} thuốc khác...</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center flex-wrap gap-2 pt-3 border-t border-gray-100'>
          <Link to={`/account/prescriptions/${prescription.id}`}>
            <Button size='sm' variant='outline' className='border-blue-200 text-blue-700 hover:bg-blue-50'>
              <ExternalLink className='w-4 h-4 mr-1' />
              Xem chi tiết
            </Button>
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline' size='sm'>
                <Eye className='w-4 h-4 mr-1' />
                Xem ảnh đơn
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl'>
              <DialogHeader>
                <DialogTitle>Đơn thuốc #{prescription.prescriptionNumber}</DialogTitle>
                <DialogDescription>Xem chi tiết ảnh đơn thuốc và thông tin thuốc đã kê</DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {prescription.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Đơn thuốc ${index + 1}`}
                      className='w-full h-auto border border-gray-200 rounded-lg'
                    />
                  ))}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p>
                      <strong>Bác sĩ:</strong> {prescription.doctorName}
                    </p>
                    <p>
                      <strong>Bệnh viện:</strong> {prescription.hospital}
                    </p>
                    <p>
                      <strong>Ngày kê:</strong> {formatDate(prescription.prescriptionDate)}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Trạng thái:</strong> <StatusBadge status={prescription.status} type='prescription' />
                    </p>
                    <p>
                      <strong>Ngày gửi:</strong> {formatDateTime(prescription.createdAt)}
                    </p>
                    {prescription.pharmacistNotes && (
                      <p>
                        <strong>Ghi chú DS:</strong> {prescription.pharmacistNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Link to={`/contact?prescription=${prescription.id}`}>
            <Button variant='outline' size='sm'>
              <MessageCircle className='w-4 h-4 mr-1' />
              Chat DS
            </Button>
          </Link>

          {prescription.status === 'completed' && prescription.orderId && (
            <Link to={`/account/orders/${prescription.orderId}`}>
              <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                <ShoppingCart className='w-4 h-4 mr-1' />
                Xem đơn hàng
              </Button>
            </Link>
          )}

          {prescription.status === 'approved' && !prescription.orderId && (
            <Button size='sm' className='bg-green-600 hover:bg-green-700'>
              <ShoppingCart className='w-4 h-4 mr-1' />
              Mua thuốc
            </Button>
          )}

          {prescription.status === 'rejected' && (
            <Link to={`/upload-prescription?resubmit=${prescription.id}`}>
              <Button size='sm' variant='outline'>
                <Upload className='w-4 h-4 mr-1' />
                Gửi lại
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const tabs = [
    { value: 'all', label: 'Tất cả', count: tabCounts.all },
    { value: 'pending', label: 'Chờ xử lý', count: tabCounts.pending },
    { value: 'approved', label: 'Đã xác nhận', count: tabCounts.approved },
    { value: 'rejected', label: 'Từ chối', count: tabCounts.rejected },
    { value: 'completed', label: 'Hoàn thành', count: tabCounts.completed },
  ]

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-blue-800 mb-2'>Lịch sử đơn thuốc</h1>
          <p className='text-gray-600'>Quản lý và theo dõi tất cả đơn thuốc của bạn</p>
        </div>

        <Link to='/upload-prescription'>
          <Button className='bg-gradient-to-r text-white from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'>
            <Upload className='w-4 h-4 mr-2' />
            Gửi đơn thuốc mới
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-5 bg-blue-50'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className='text-sm'>
              {tab.label}
              {tab.count > 0 && (
                <span className='ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs'>{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Prescriptions List */}
        <div className='mt-6'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='w-8 h-8 text-blue-600 animate-spin mb-4' />
              <p className='text-gray-500'>Đang tải danh sách đơn thuốc...</p>
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
              <AlertCircle className='w-8 h-8 text-red-500 mx-auto mb-2' />
              <p className='text-red-700'>{error}</p>
              <Button variant='outline' className='mt-4' onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          ) : filteredPrescriptions.length > 0 ? (
            <div className='space-y-6'>
              {filteredPrescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))}

              {/* Load More or Pagination */}
              {filteredPrescriptions.length > 5 && (
                <div className='flex justify-center pt-6'>
                  <Button variant='outline'>Xem thêm</Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className='w-16 h-16' />}
              title={
                selectedTab === 'all'
                  ? 'Chưa có đơn thuốc nào'
                  : `Không có đơn thuốc ${
                      selectedTab === 'pending'
                        ? 'chờ xử lý'
                        : selectedTab === 'approved'
                          ? 'đã xác nhận'
                          : selectedTab === 'rejected'
                            ? 'bị từ chối'
                            : 'hoàn thành'
                    }`
              }
              description={
                selectedTab === 'all'
                  ? 'Bạn chưa gửi đơn thuốc nào. Hãy upload đơn thuốc để được dược sĩ tư vấn và tạo đơn hàng.'
                  : `Hiện tại không có đơn thuốc nào ở trạng thái này.`
              }
              actionLabel='Gửi đơn thuốc mới'
              actionUrl='/upload-prescription'
            />
          )}
        </div>
      </Tabs>

      {/* Quick Stats */}
      {prescriptions.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100'>
          <Card className='border-blue-100'>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>{tabCounts.all}</div>
              <div className='text-sm text-gray-600'>Tổng đơn thuốc</div>
            </CardContent>
          </Card>

          <Card className='border-blue-100'>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-600'>{tabCounts.pending}</div>
              <div className='text-sm text-gray-600'>Chờ xử lý</div>
            </CardContent>
          </Card>

          <Card className='border-blue-100'>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>{tabCounts.completed}</div>
              <div className='text-sm text-gray-600'>Hoàn thành</div>
            </CardContent>
          </Card>

          <Card className='border-blue-100'>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-red-600'>{tabCounts.rejected}</div>
              <div className='text-sm text-gray-600'>Từ chối</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
