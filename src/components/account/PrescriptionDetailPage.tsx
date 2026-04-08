import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  X,
  Eye,
  AlertCircle,
  Calendar,
  User,
  Hospital,
  Phone,
  Stethoscope,
  FileText,
  Package,
  ShoppingCart,
  Upload,
  Pill,
  MessageCircle,
  RefreshCw,
  ClipboardList,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { StatusBadge } from '../shared/StatusBadge'
import { prescriptionsAPI } from '~/lib/api/prescriptions'

interface BackendPrescription {
  _id: string
  prescriptionNumber: string
  customerId: string
  patientName?: string
  patientAge?: string
  patientGender?: string
  diagnosis?: string
  specialNotes?: string
  doctorName: string
  hospitalName?: string
  prescriptionDate: string
  images: string[]
  medications: {
    productName: string
    dosage: string
    quantity: number
    unit?: string
    instructions: string
  }[]
  status: string
  verifiedAt?: string
  pharmacistNotes?: string
  notes?: string
  ocrConfidence?: string
  createdAt: string
  updatedAt: string
  orderId?: string
}

type TrackingStatus = 'pending' | 'approved' | 'rejected' | 'completed'

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  description: string
}> = {
  pending: {
    label: 'Chờ xem xét',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: <Clock className='w-5 h-5 text-yellow-600' />,
    description: 'Dược sĩ đang xem xét đơn thuốc của bạn',
  },
  approved: {
    label: 'Đã xác nhận',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <CheckCircle className='w-5 h-5 text-blue-600' />,
    description: 'Đơn thuốc đã được xác nhận, dược sĩ đang tạo đơn hàng',
  },
  rejected: {
    label: 'Đã từ chối',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <X className='w-5 h-5 text-red-600' />,
    description: 'Đơn thuốc không đáp ứng yêu cầu, vui lòng xem lý do bên dưới',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <CheckCircle className='w-5 h-5 text-green-600' />,
    description: 'Đơn thuốc đã được xử lý hoàn tất, đơn hàng đã được tạo',
  },
}

// Timeline steps configuration
const TIMELINE_STEPS = [
  {
    key: 'submitted',
    label: 'Đã gửi đơn thuốc',
    icon: <Upload className='w-4 h-4' />,
    alwaysDone: true,
  },
  {
    key: 'reviewing',
    label: 'Dược sĩ xem xét',
    icon: <Eye className='w-4 h-4' />,
    doneStatuses: ['approved', 'rejected', 'completed'],
    activeStatuses: ['pending'],
  },
  {
    key: 'verified',
    label: 'Xác nhận đơn thuốc',
    icon: <CheckCircle className='w-4 h-4' />,
    doneStatuses: ['completed'],
    activeStatuses: ['approved'],
    rejectedKey: true,
  },
  {
    key: 'order_created',
    label: 'Tạo đơn hàng',
    icon: <Package className='w-4 h-4' />,
    doneStatuses: ['completed'],
    activeStatuses: [],
  },
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  return `${diffDays} ngày trước`
}

function TimelineDot({ status, isRejected }: { status: 'done' | 'active' | 'pending', isRejected?: boolean }) {
  if (isRejected) {
    return (
      <div className='w-8 h-8 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shrink-0 z-10'>
        <X className='w-4 h-4 text-red-600' />
      </div>
    )
  }
  if (status === 'done') {
    return (
      <div className='w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10'>
        <CheckCircle className='w-4 h-4 text-emerald-600' />
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className='w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center shrink-0 z-10 animate-pulse'>
        <Clock className='w-4 h-4 text-blue-600' />
      </div>
    )
  }
  return (
    <div className='w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center shrink-0 z-10' />
  )
}

export function PrescriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState<BackendPrescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await prescriptionsAPI.getPrescription(id) as { result?: BackendPrescription }
        if (res.result) {
          setPrescription(res.result)
        } else {
          setError('Không tìm thấy đơn thuốc')
        }
      } catch {
        setError('Không thể tải thông tin đơn thuốc. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-24'>
        <RefreshCw className='w-8 h-8 text-blue-500 animate-spin mb-3' />
        <p className='text-gray-500'>Đang tải thông tin đơn thuốc...</p>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className='flex flex-col items-center justify-center py-24 text-center'>
        <AlertCircle className='w-12 h-12 text-red-400 mb-3' />
        <h2 className='text-lg font-semibold text-gray-800 mb-1'>{error || 'Không tìm thấy đơn thuốc'}</h2>
        <p className='text-gray-500 mb-6'>Đơn thuốc không tồn tại hoặc bạn không có quyền xem.</p>
        <Button onClick={() => navigate('/account/prescriptions')} variant='outline'>
          <ArrowLeft className='w-4 h-4 mr-2' /> Quay lại danh sách
        </Button>
      </div>
    )
  }

  const status = prescription.status as TrackingStatus
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  // Compute timeline step states
  const getStepState = (step: typeof TIMELINE_STEPS[number]): 'done' | 'active' | 'pending' => {
    if (step.alwaysDone) return 'done'
    if (step.doneStatuses?.includes(status)) return 'done'
    if (step.activeStatuses?.includes(status)) return 'active'
    return 'pending'
  }

  const genderLabel = prescription.patientGender === 'male' ? 'Nam' :
    prescription.patientGender === 'female' ? 'Nữ' : prescription.patientGender || ''

  return (
    <div className='space-y-6'>
      {/* Back button + Header */}
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='sm' onClick={() => navigate('/account/prescriptions')} className='text-gray-500 hover:text-blue-700 -ml-2'>
          <ArrowLeft className='w-4 h-4 mr-1' /> Lịch sử đơn thuốc
        </Button>
      </div>

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-blue-900 flex items-center gap-2'>
            <ClipboardList className='w-6 h-6' />
            Đơn thuốc #{prescription.prescriptionNumber}
          </h1>
          <p className='text-gray-500 text-sm mt-1'>Gửi lúc {formatDateTime(prescription.createdAt)} · {timeAgo(prescription.createdAt)}</p>
        </div>
        <StatusBadge status={status} type='prescription' />
      </div>

      {/* Current status banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bgColor} ${cfg.borderColor}`}>
        {cfg.icon}
        <div className='flex-1'>
          <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
          <p className={`text-sm mt-0.5 ${cfg.color} opacity-80`}>{cfg.description}</p>
          {status === 'rejected' && (prescription.notes || prescription.pharmacistNotes) && (
            <div className='mt-2 p-2 bg-white/60 rounded-lg border border-red-200'>
              <p className='text-sm font-medium text-red-700'>Lý do từ chối:</p>
              <p className='text-sm text-red-600 mt-0.5'>{prescription.pharmacistNotes || prescription.notes}</p>
            </div>
          )}
          {status === 'approved' && prescription.pharmacistNotes && (
            <div className='mt-2 p-2 bg-white/60 rounded-lg border border-blue-200'>
              <p className='text-sm font-medium text-blue-700'>Ghi chú từ dược sĩ:</p>
              <p className='text-sm text-blue-600 mt-0.5'>{prescription.pharmacistNotes}</p>
            </div>
          )}
        </div>
        {/* Action buttons based on status */}
        <div className='shrink-0'>
          {status === 'rejected' && (
            <Link to='/upload-prescription'>
              <Button size='sm' className='bg-red-600 hover:bg-red-700 text-white'>
                <Upload className='w-4 h-4 mr-1' /> Gửi lại
              </Button>
            </Link>
          )}
          {status === 'completed' && prescription.orderId && (
            <Link to={`/account/orders/${prescription.orderId}`}>
              <Button size='sm' className='bg-green-600 hover:bg-green-700 text-white'>
                <ShoppingCart className='w-4 h-4 mr-1' /> Xem đơn hàng
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main content */}
        <div className='lg:col-span-2 space-y-6'>

          {/* Tracking Timeline */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900 flex items-center gap-2'>
                <Clock className='w-4 h-4' /> Theo dõi trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='relative'>
                {/* Vertical line */}
                <div className='absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-200' />

                <div className='space-y-6'>
                  {TIMELINE_STEPS.map((step, idx) => {
                    const stepStatus = getStepState(step)
                    const isRejectedStep = step.rejectedKey && status === 'rejected'
                    const label = isRejectedStep ? 'Đã từ chối' : step.label

                    return (
                      <div key={step.key} className='flex items-start gap-4 relative'>
                        <TimelineDot status={isRejectedStep ? 'done' : stepStatus} isRejected={isRejectedStep} />
                        <div className='pt-1 flex-1 min-w-0'>
                          <p className={`font-medium text-sm ${
                            stepStatus === 'done' || isRejectedStep ? 'text-gray-800' :
                            stepStatus === 'active' ? 'text-blue-700' : 'text-gray-400'
                          }`}>{label}</p>
                          {/* Timestamps */}
                          {idx === 0 && (
                            <p className='text-xs text-gray-400 mt-0.5'>{formatDateTime(prescription.createdAt)}</p>
                          )}
                          {step.rejectedKey && status === 'rejected' && prescription.verifiedAt && (
                            <p className='text-xs text-gray-400 mt-0.5'>{formatDateTime(prescription.verifiedAt)}</p>
                          )}
                          {step.rejectedKey && status !== 'rejected' && stepStatus === 'done' && prescription.verifiedAt && (
                            <p className='text-xs text-gray-400 mt-0.5'>{formatDateTime(prescription.verifiedAt)}</p>
                          )}
                          {stepStatus === 'active' && (
                            <p className='text-xs text-blue-500 mt-0.5 animate-pulse'>Đang xử lý...</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900 flex items-center gap-2'>
                <User className='w-4 h-4' /> Thông tin bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <InfoRow icon={<User className='w-4 h-4 text-blue-400' />} label='Tên bệnh nhân' value={prescription.patientName} />
                <InfoRow icon={<Calendar className='w-4 h-4 text-blue-400' />} label='Tuổi' value={prescription.patientAge} />
                <InfoRow icon={<User className='w-4 h-4 text-blue-400' />} label='Giới tính' value={genderLabel} />
                <InfoRow icon={<Stethoscope className='w-4 h-4 text-blue-400' />} label='Chẩn đoán' value={prescription.diagnosis} />
              </div>
              {prescription.specialNotes && (
                <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                  <p className='text-xs font-medium text-amber-700 mb-0.5'>⚠️ Ghi chú đặc biệt</p>
                  <p className='text-sm text-amber-800'>{prescription.specialNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900 flex items-center gap-2'>
                <Hospital className='w-4 h-4' /> Thông tin khám bệnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <InfoRow icon={<User className='w-4 h-4 text-blue-400' />} label='Bác sĩ' value={prescription.doctorName} />
                <InfoRow icon={<Hospital className='w-4 h-4 text-blue-400' />} label='Phòng khám / Bệnh viện' value={prescription.hospitalName} />
                <InfoRow icon={<Calendar className='w-4 h-4 text-blue-400' />} label='Ngày kê đơn' value={formatDate(prescription.prescriptionDate)} />
                {prescription.ocrConfidence && (
                  <div className='flex items-start gap-2'>
                    <FileText className='w-4 h-4 text-blue-400 mt-0.5 shrink-0' />
                    <div>
                      <p className='text-xs text-gray-400'>Độ tin cậy OCR</p>
                      <Badge variant='outline' className={
                        prescription.ocrConfidence === 'high' ? 'border-green-300 text-green-700' :
                        prescription.ocrConfidence === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-red-300 text-red-700'
                      }>
                        {prescription.ocrConfidence === 'high' ? 'Cao' :
                         prescription.ocrConfidence === 'medium' ? 'Trung bình' : 'Thấp'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900 flex items-center gap-2'>
                <Pill className='w-4 h-4' /> Danh sách thuốc ({prescription.medications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescription.medications.length === 0 ? (
                <p className='text-sm text-gray-400 italic'>Không có thông tin thuốc</p>
              ) : (
                <div className='space-y-3'>
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className='flex items-start gap-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100'>
                      <div className='w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-blue-700'>
                        {idx + 1}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm text-blue-900'>{med.productName}</p>
                        <div className='flex flex-wrap gap-x-4 gap-y-0.5 mt-1'>
                          {med.dosage && <p className='text-xs text-gray-600'>💊 Liều: {med.dosage}</p>}
                          <p className='text-xs text-gray-600'>
                            📦 Số lượng: <span className='font-medium'>{med.quantity} {med.unit || ''}</span>
                          </p>
                          {med.instructions && med.instructions !== med.dosage && (
                            <p className='text-xs text-gray-500 w-full mt-0.5'>📋 {med.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-5'>
          {/* Prescription images */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900 flex items-center gap-2'>
                <FileText className='w-4 h-4' /> Ảnh đơn thuốc ({prescription.images.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescription.images.length === 0 ? (
                <p className='text-sm text-gray-400 italic'>Không có ảnh đính kèm</p>
              ) : (
                <div className='grid grid-cols-2 gap-2'>
                  {prescription.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className='relative group rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all'
                    >
                      <img src={img} alt={`Ảnh đơn ${idx + 1}`} className='w-full h-24 object-cover' />
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center'>
                        <Eye className='w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className='border-blue-100 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base text-blue-900'>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Link to='/upload-prescription'>
                <Button variant='outline' size='sm' className='w-full justify-start text-blue-700 border-blue-200 hover:bg-blue-50'>
                  <Upload className='w-4 h-4 mr-2' /> Gửi đơn thuốc mới
                </Button>
              </Link>
              <Link to={`/contact?ref=prescription&id=${prescription._id}`}>
                <Button variant='outline' size='sm' className='w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50'>
                  <MessageCircle className='w-4 h-4 mr-2' /> Liên hệ dược sĩ
                </Button>
              </Link>
              {status === 'completed' && prescription.orderId && (
                <Link to={`/account/orders/${prescription.orderId}`}>
                  <Button size='sm' className='w-full justify-start bg-green-600 hover:bg-green-700 text-white'>
                    <ShoppingCart className='w-4 h-4 mr-2' /> Xem đơn hàng
                  </Button>
                </Link>
              )}
              {status === 'rejected' && (
                <Link to='/upload-prescription'>
                  <Button size='sm' className='w-full justify-start bg-red-600 hover:bg-red-700 text-white'>
                    <Upload className='w-4 h-4 mr-2' /> Gửi lại đơn thuốc
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className='border-gray-100 shadow-sm'>
            <CardContent className='p-4 space-y-2 text-xs text-gray-500'>
              <div className='flex justify-between'>
                <span>Mã đơn:</span>
                <span className='font-mono font-medium text-gray-700'>#{prescription.prescriptionNumber}</span>
              </div>
              <div className='flex justify-between'>
                <span>Ngày gửi:</span>
                <span>{formatDateTime(prescription.createdAt)}</span>
              </div>
              <div className='flex justify-between'>
                <span>Cập nhật:</span>
                <span>{timeAgo(prescription.updatedAt)}</span>
              </div>
              {prescription.verifiedAt && (
                <div className='flex justify-between'>
                  <span>Xét duyệt lúc:</span>
                  <span>{formatDateTime(prescription.verifiedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {selectedImage && (
        <div
          className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div className='relative max-w-4xl max-h-full' onClick={e => e.stopPropagation()}>
            <button
              className='absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 text-sm'
              onClick={() => setSelectedImage(null)}
            >
              <X className='w-5 h-5' /> Đóng
            </button>
            <img src={selectedImage} alt='preview' className='max-w-full max-h-[85vh] rounded-lg border border-white/20' />
          </div>
        </div>
      )}
    </div>
  )
}

// Reusable info row component
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className='flex items-start gap-2'>
      <span className='mt-0.5 shrink-0'>{icon}</span>
      <div>
        <p className='text-xs text-gray-400'>{label}</p>
        <p className='text-sm font-medium text-gray-800'>{value}</p>
      </div>
    </div>
  )
}
