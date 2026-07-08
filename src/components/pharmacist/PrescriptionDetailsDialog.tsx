import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  CheckCircle,
  XCircle,
  Package,
  Pill,
  User,
  Hospital,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Stethoscope,
  Eye,
  Phone,
  Mail,
  ShieldAlert,
  Info,
  X,
} from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { toast } from 'sonner'
import { prescriptionService, type Prescription } from '~/services/pharmacist'
import { PrescriptionImageViewer } from '~/components/shared/PrescriptionImageViewer'

interface PrescriptionDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  prescription: Prescription | null
  onUpdate?: () => void
}

// Urgency: how long has the prescription been waiting?
function getUrgencyInfo(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffHours = diffMs / 3600000
  if (diffHours > 24) {
    return { label: `${Math.floor(diffHours / 24)} ngày trước`, level: 'high' as const }
  }
  if (diffHours > 4) {
    return { label: `${Math.floor(diffHours)} giờ trước`, level: 'medium' as const }
  }
  const diffMins = Math.floor(diffMs / 60000)
  return { label: diffMins < 1 ? 'Vừa xong' : `${diffMins} phút trước`, level: 'low' as const }
}

function timeAgo(dateStr: string) {
  return getUrgencyInfo(dateStr).label
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OCRConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null
  const map: Record<string, { label: string; cls: string }> = {
    high: { label: 'OCR: Cao', cls: 'bg-green-100 text-green-700 border-green-300' },
    medium: { label: 'OCR: Trung bình', cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    low: { label: 'OCR: Thấp ⚠️', cls: 'bg-red-100 text-red-700 border-red-300' },
  }
  const info = map[confidence] || map.medium
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${info.cls}`}>{info.label}</span>
}

interface OCRImageQuality {
  level?: string
  flags?: string[]
  width?: number
  height?: number
  blurScore?: number
  brightness?: number
  contrast?: number
}

interface OCRQualityInfo {
  level?: string
  score?: number
  flags?: string[]
  imageQuality?: OCRImageQuality
  pages?: Array<{
    page?: number
    success?: boolean
    imageQuality?: OCRImageQuality
    quality?: {
      score?: number
      level?: string
      flags?: string[]
    }
  }>
}

const imageQualityLabels: Record<string, string> = {
  blurry: 'Ảnh mờ',
  too_dark: 'Ảnh tối',
  too_bright: 'Ảnh quá sáng',
  low_contrast: 'Tương phản thấp',
  low_resolution: 'Độ phân giải thấp',
  extreme_aspect_ratio: 'Khung ảnh bất thường',
}

function OCRQualityPanel({ quality }: { quality?: Record<string, unknown> }) {
  const info = quality as OCRQualityInfo | undefined
  if (!info) return null

  const pageQualities = Array.isArray(info.pages) ? info.pages : []
  const imageFlags = [
    ...(info.imageQuality?.flags || []),
    ...pageQualities.flatMap((page) => page.imageQuality?.flags || []),
  ]
  const uniqueImageFlags = Array.from(new Set(imageFlags))
  const hasWarning = uniqueImageFlags.length > 0 || info.level === 'low' || info.imageQuality?.level === 'poor'
  if (!hasWarning && pageQualities.length === 0 && info.score == null) return null

  return (
    <div className={`p-3 rounded-lg border flex gap-2 ${hasWarning ? 'bg-amber-50 border-amber-200' : 'bg-[#F0F6FF] border-[#BFDBFE]'}`}>
      <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${hasWarning ? 'text-amber-600' : 'text-[#1E40AF]'}`} />
      <div className='space-y-2 min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className={`text-sm font-medium ${hasWarning ? 'text-amber-800' : 'text-[#0A2463]'}`}>
            Chất lượng OCR{pageQualities.length > 0 ? ` (${pageQualities.length} ảnh)` : ''}
          </p>
          {info.score != null && (
            <Badge variant='outline' className='text-xs bg-white border-gray-200 text-gray-600'>
              Điểm {info.score}
            </Badge>
          )}
          {uniqueImageFlags.map((flag) => (
            <Badge key={flag} variant='outline' className='text-xs border-amber-300 bg-white text-amber-700'>
              {imageQualityLabels[flag] || flag}
            </Badge>
          ))}
        </div>

        {pageQualities.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
            {pageQualities.map((page, idx) => {
              const flags = page.imageQuality?.flags || []
              return (
                <div key={idx} className='text-xs rounded-md bg-white/80 border border-gray-200 px-2 py-1.5 text-gray-600'>
                  <span className='font-medium text-gray-700'>Trang {page.page || idx + 1}</span>
                  {page.quality?.score != null && <span> · điểm {page.quality.score}</span>}
                  {page.imageQuality?.blurScore != null && <span> · blur {page.imageQuality.blurScore}</span>}
                  {flags.length > 0 && <span> · {flags.map((flag) => imageQualityLabels[flag] || flag).join(', ')}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

type ConfirmAction = 'verified' | 'rejected' | null

type PrescriptionCorrections = {
  patientName: string
  patientAge: string
  patientGender: string
  diagnosis: string
  doctorName: string
  hospitalName: string
  prescriptionDate: string
  medications: Array<{
    productId?: string
    productName: string
    dosage: string
    quantity: number
    instructions: string
  }>
}

function buildCorrections(prescription: Prescription): PrescriptionCorrections {
  return {
    patientName: prescription.patientName || '',
    patientAge: prescription.patientAge || '',
    patientGender: prescription.patientGender || '',
    diagnosis: prescription.diagnosis || '',
    doctorName: prescription.doctorName || '',
    hospitalName: prescription.hospitalName || '',
    prescriptionDate: prescription.prescriptionDate || '',
    medications: prescription.medications.map((medication) => ({
      productId: medication.productId,
      productName: medication.productName || medication.matchedName || '',
      dosage: medication.dosage || '',
      quantity: Number(medication.quantity) || 1,
      instructions: medication.instructions || '',
    })),
  }
}

function getErrorMessage(error: unknown) {
  const fallback = 'Vui lòng thử lại sau'
  if (typeof error !== 'object' || error === null) return fallback

  const maybeAxiosError = error as { response?: { data?: { message?: string; errors?: unknown } }; message?: string }
  return maybeAxiosError.response?.data?.message || maybeAxiosError.message || fallback
}

export function PrescriptionDetailsDialog({ isOpen, onClose, prescription, onUpdate }: PrescriptionDetailsDialogProps) {
  const [pharmacistNotes, setPharmacistNotes] = useState(prescription?.pharmacistNotes || '')
  const [corrections, setCorrections] = useState<PrescriptionCorrections | null>(
    prescription ? buildCorrections(prescription) : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!prescription) return
    setPharmacistNotes(prescription.pharmacistNotes || '')
    setCorrections(buildCorrections(prescription))
    setConfirmAction(null)
  }, [prescription?._id])

  if (!prescription) return null

  const isPending = prescription.status === 'pending'
  const urgency = getUrgencyInfo(prescription.createdAt)

  const genderLabel =
    prescription.patientGender === 'male'
      ? 'Nam'
      : prescription.patientGender === 'female'
        ? 'Nữ'
        : prescription.patientGender || ''

  const customerName = prescription.customer
    ? `${prescription.customer.firstName} ${prescription.customer.lastName}`
    : null

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    if (confirmAction === 'rejected' && !pharmacistNotes.trim()) {
      toast.error('Vui lòng nhập lý do từ chối trước khi xác nhận')
      return
    }
    try {
      setSubmitting(true)
      await prescriptionService.verify(prescription._id, {
        status: confirmAction,
        notes: pharmacistNotes,
        corrections: confirmAction === 'verified' && corrections ? corrections : undefined,
      })
      toast.success(
        confirmAction === 'verified' ? '✅ Đơn thuốc đã được phê duyệt thành công!' : '❌ Đơn thuốc đã bị từ chối',
        { description: pharmacistNotes || undefined },
      )
      if (onUpdate) await onUpdate()
      onClose()
      setPharmacistNotes('')
      setConfirmAction(null)
    } catch (error) {
      toast.error('Không thể cập nhật đơn thuốc', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid='prescription-detail-dialog' className='!w-[calc(100vw-2rem)] sm:!w-[calc(100vw-4rem)] 2xl:!w-[1320px] !max-w-none max-h-[94vh] flex flex-col overflow-hidden rounded-xl p-0'>
        {/* ── HEADER ── */}
        <div className='px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 relative'>
          <DialogHeader>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
              <div className='min-w-0'>
                <DialogTitle className='text-base sm:text-lg font-bold text-blue-900 flex items-start gap-2 break-words'>
                  <FileText className='w-5 h-5 shrink-0 mt-0.5' />
                  <span className='min-w-0 break-words'>{prescription.prescriptionNumber}</span>
                </DialogTitle>
                <DialogDescription className='text-sm text-gray-500 mt-0.5'>
                  Gửi lúc {formatDateTime(prescription.createdAt)}
                </DialogDescription>
              </div>
              <div className='flex items-center gap-2 flex-wrap sm:flex-nowrap sm:justify-end'>
                <OCRConfidenceBadge confidence={prescription.ocrConfidence} />
                {/* Urgency badge */}
                {isPending && (
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium
                    ${
                      urgency.level === 'high'
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : urgency.level === 'medium'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                          : 'bg-[#F0F6FF] text-[#0A2463] border-[#BFDBFE]'
                    }`}
                  >
                    <Clock className='w-3 h-3' />
                    {urgency.label}
                  </span>
                )}
                {/* Status badge */}
                <span
                  data-testid='prescription-dialog-status'
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border
                  ${
                    prescription.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                      : prescription.status === 'verified'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : prescription.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}
                >
                  {prescription.status === 'pending'
                    ? 'Chờ xử lý'
                    : prescription.status === 'verified'
                      ? 'Đã duyệt'
                      : prescription.status === 'rejected'
                        ? 'Từ chối'
                        : 'Hết hạn'}
                </span>
                {/* Close button */}
                <DialogClose asChild>
                  <button
                    className='absolute top-4 right-4 sm:static sm:ml-1 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
                    aria-label='Đóng'
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24'>
                      <path
                        fill='currentColor'
                        d='m12 13.4l-2.917 2.925q-.277.275-.704.275t-.704-.275q-.275-.275-.275-.7t.275-.7L10.6 12L7.675 9.108Q7.4 8.831 7.4 8.404t.275-.704q.275-.275.7-.275t.7.275L12 10.625L14.892 7.7q.277-.275.704-.275t.704.275q.3.3.3.713t-.3.687L13.375 12l2.925 2.917q.275.277.275.704t-.275.704q-.3.3-.712.3t-.688-.3z'
                      />
                    </svg>
                  </button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className='px-6 py-5 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-400'>
          {/* ── REJECTION REASON (if rejected) ── */}
          {prescription.status === 'rejected' && (prescription.pharmacistNotes || prescription.notes) && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2' data-testid='rejection-reason'>
              <ShieldAlert className='w-4 h-4 text-red-600 mt-0.5 shrink-0' />
              <div>
                <p className='text-sm font-medium text-red-700'>Lý do từ chối</p>
                <p className='text-sm text-red-600 mt-0.5'>{prescription.pharmacistNotes || prescription.notes}</p>
                {prescription.verifiedAt && (
                  <p className='text-xs text-red-400 mt-1'>Từ chối lúc {formatDateTime(prescription.verifiedAt)}</p>
                )}
              </div>
            </div>
          )}

          {/* ── APPROVED NOTE (if verified) ── */}
          {prescription.status === 'verified' && (
            <div className='p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2' data-testid='approval-note'>
              <CheckCircle className='w-4 h-4 text-green-600 mt-0.5 shrink-0' />
              <div>
                <p className='text-sm font-medium text-green-700'>
                  Đã phê duyệt lúc {formatDateTime(prescription.verifiedAt || '')}
                </p>
                {prescription.pharmacistNotes && (
                  <p className='text-sm text-green-600 mt-0.5'>Ghi chú: {prescription.pharmacistNotes}</p>
                )}
              </div>
            </div>
          )}

          <OCRQualityPanel quality={prescription.ocrQuality} />

          {/* ── MAIN 2-COL LAYOUT ── */}
          <div className='grid grid-cols-1 xl:grid-cols-[minmax(360px,480px)_minmax(0,1fr)] gap-6'>
            {/* LEFT: images */}
            <div className='min-w-0'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                Ảnh đơn thuốc ({prescription.images.length})
              </p>
              <div data-testid='prescription-image-viewer'>
                <PrescriptionImageViewer images={prescription.images} />
              </div>
            </div>

            {/* RIGHT: info panels */}
            <div className='min-w-0 space-y-4'>
              {/* Patient Info */}
              <InfoSection title='Thông tin bệnh nhân' icon={<User className='w-4 h-4' />}>
                <div className='grid grid-cols-2 gap-3 text-sm' data-testid='patient-info-section'>
                  <InfoRow label='Họ và tên' value={prescription.patientName} />
                  <InfoRow label='Tuổi' value={prescription.patientAge} />
                  <InfoRow label='Giới tính' value={genderLabel} />
                  <InfoRow label='Chẩn đoán' value={prescription.diagnosis} fullWidth />
                </div>
                {prescription.specialNotes && (
                  <div className='mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex gap-2'>
                    <AlertCircle className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                    <p className='text-xs text-amber-800'>
                      <strong>Ghi chú đặc biệt:</strong> {prescription.specialNotes}
                    </p>
                  </div>
                )}
              </InfoSection>

              {/* Doctor / Clinic Info */}
              <InfoSection title='Thông tin khám bệnh' icon={<Hospital className='w-4 h-4' />}>
                <div className='grid grid-cols-2 gap-3 text-sm' data-testid='doctor-info-section'>
                  <InfoRow label='Bác sĩ' value={prescription.doctorName} />
                  <InfoRow label='Phòng khám / BV' value={prescription.hospitalName} />
                  <InfoRow label='Ngày kê đơn' value={formatDate(prescription.prescriptionDate)} />
                </div>
              </InfoSection>

              {/* Customer account info (from DB lookup) */}
              {customerName && (
                <InfoSection title='Tài khoản khách hàng' icon={<Phone className='w-4 h-4' />}>
                  <div data-testid='customer-account-section'>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <InfoRow label='Tên tài khoản' value={customerName} />
                    {prescription.customer?.phoneNumber && (
                      <InfoRow label='Số điện thoại' value={prescription.customer.phoneNumber} />
                    )}
                    {prescription.customer?.email && <InfoRow label='Email' value={prescription.customer.email} />}
                  </div>
                  </div>
                </InfoSection>
              )}
              {!customerName && <p data-testid='customer-account-missing' className='text-sm text-gray-500'>Không tìm thấy tài khoản khách hàng liên kết</p>}
            </div>
          </div>

          {isPending && corrections && (
            <InfoSection title='Dữ liệu xác nhận trước khi duyệt' icon={<Info className='w-4 h-4' />}>
              <div data-testid='prescription-correction-form' className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
                <Input
                  data-testid='correction-patient-name'
                  value={corrections.patientName}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, patientName: event.target.value } : prev))}
                  placeholder='Tên bệnh nhân'
                  className='border-[#BFDBFE]'
                />
                <Input
                  data-testid='correction-patient-age'
                  value={corrections.patientAge}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, patientAge: event.target.value } : prev))}
                  placeholder='Tuổi'
                  className='border-[#BFDBFE]'
                />
                <Input
                  data-testid='correction-patient-gender'
                  value={corrections.patientGender}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, patientGender: event.target.value } : prev))}
                  placeholder='Giới tính'
                  className='border-[#BFDBFE]'
                />
                <Input
                  data-testid='correction-doctor-name'
                  value={corrections.doctorName}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, doctorName: event.target.value } : prev))}
                  placeholder='Bác sĩ'
                  className='border-[#BFDBFE]'
                />
                <Input
                  data-testid='correction-hospital-name'
                  value={corrections.hospitalName}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, hospitalName: event.target.value } : prev))}
                  placeholder='Bệnh viện/phòng khám'
                  className='border-[#BFDBFE]'
                />
                <Input
                  data-testid='correction-diagnosis'
                  value={corrections.diagnosis}
                  onChange={(event) => setCorrections((prev) => (prev ? { ...prev, diagnosis: event.target.value } : prev))}
                  placeholder='Chẩn đoán'
                  className='border-[#BFDBFE]'
                />
              </div>
            </InfoSection>
          )}

          {/* ── MEDICATIONS ── */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                Danh sách thuốc ({prescription.medications.length} loại)
              </p>
              {prescription.medications.some((m) => m.productId) && (
                <span className='text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium'>
                  ✓ {prescription.medications.filter((m) => m.productId).length}/{prescription.medications.length} khớp kho
                </span>
              )}
            </div>
            {prescription.medications.length === 0 ? (
              <p className='text-sm text-gray-400 italic'>Không có thông tin thuốc</p>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' data-testid='drug-list'>
                {prescription.medications.map((med, idx) => (
                  <div
                    key={idx}
                    data-testid='drug-item'
                    data-mapped={false}
                    className='flex gap-3 p-3 rounded-lg border bg-[#F0F6FF] border-[#E8EDF5]'
                  >
                    <div className='w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 bg-[#0A2463]'>
                      {idx + 1}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start gap-1.5 flex-wrap'>
                        <p className='text-sm font-semibold truncate text-blue-900'>
                          {med.productName}
                        </p>
                      </div>
                      {med.needsReview && (
                        <span className='inline-flex w-fit text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium'>
                          Cần kiểm tra
                        </span>
                      )}
                      {med.activeIngredient && (
                        <p className='text-[11px] text-gray-500'>Hoạt chất: {med.activeIngredient}</p>
                      )}
                      {(med.source || med.confidence || med.sourcePage) && (
                        <p className='text-[11px] text-gray-400'>Nguồn: {med.source || 'OCR'}{med.confidence ? ` · ${med.confidence}` : ''}</p>
                      )}
                      {med.sourcePage && (
                        <p className='text-[11px] text-gray-400'>Trang ảnh: {med.sourcePage}</p>
                      )}
                      <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5'>
                        {med.dosage && <p className='text-xs text-gray-600'>💊 {med.dosage}</p>}
                        <p className='text-xs text-gray-600'>
                          📦 SL:{' '}
                          <span className='font-medium text-gray-800'>
                            {med.quantity}
                            {med.unit ? ` ${med.unit}` : ''}
                          </span>
                        </p>
                      </div>
                      {med.instructions && med.instructions !== med.dosage && (
                        <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>📋 {med.instructions}</p>
                      )}
                      {med.equivalentProducts && med.equivalentProducts.length > 0 && (
                        <div className='mt-3 rounded-lg border border-[#E8EDF5] bg-white p-2'>
                          <p className='mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
                            Sản phẩm Medispace gợi ý
                          </p>
                          <div className='space-y-1.5'>
                            {med.equivalentProducts.slice(0, 3).map((product) => (
                              <Link
                                key={product.productId}
                                to={`/products/${product.slug}`}
                                className='flex min-w-0 items-center gap-2 rounded-md border border-gray-100 bg-white p-1.5 hover:border-[#BFDBFE] hover:bg-[#F0F6FF]'
                              >
                                {product.image && (
                                  <img src={product.image} alt={product.name} className='h-8 w-8 shrink-0 rounded object-cover' />
                                )}
                                <span className='min-w-0 flex-1'>
                                  <span className='block truncate text-[11px] font-medium text-gray-900'>{product.name}</span>
                                  <span className='block truncate text-[10px] text-gray-500'>
                                    {product.reason || 'San pham Medispace goi y'}
                                    {product.price != null ? ` - ${Number(product.price).toLocaleString('vi-VN')}d` : ''}
                                  </span>
                                </span>
                                <Badge
                                  variant='outline'
                                  className={`shrink-0 text-[10px] ${product.requiresPrescription ? 'border-red-200 text-red-600' : 'border-emerald-200 text-emerald-600'}`}
                                >
                                  {product.requiresPrescription ? 'Rx' : 'OTC'}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {isPending && corrections?.medications[idx] && (
                        <div className='mt-3 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_90px_76px] gap-2'>
                          <Input
                            data-testid='correction-drug-name'
                            value={corrections.medications[idx].productName}
                            onChange={(event) =>
                              setCorrections((prev) => {
                                if (!prev) return prev
                                const medications = [...prev.medications]
                                medications[idx] = { ...medications[idx], productName: event.target.value }
                                return { ...prev, medications }
                              })
                            }
                            className='h-8 text-xs border-[#BFDBFE]'
                          />
                          <Input
                            data-testid='correction-drug-dosage'
                            value={corrections.medications[idx].dosage}
                            onChange={(event) =>
                              setCorrections((prev) => {
                                if (!prev) return prev
                                const medications = [...prev.medications]
                                medications[idx] = { ...medications[idx], dosage: event.target.value }
                                return { ...prev, medications }
                              })
                            }
                            className='h-8 text-xs border-[#BFDBFE]'
                          />
                          <Input
                            data-testid='correction-drug-quantity'
                            type='number'
                            min={1}
                            value={corrections.medications[idx].quantity}
                            onChange={(event) =>
                              setCorrections((prev) => {
                                if (!prev) return prev
                                const medications = [...prev.medications]
                                medications[idx] = { ...medications[idx], quantity: Number(event.target.value) || 1 }
                                return { ...prev, medications }
                              })
                            }
                            className='h-8 text-xs border-[#BFDBFE]'
                          />
                          <Textarea
                            data-testid='correction-drug-instructions'
                            value={corrections.medications[idx].instructions}
                            onChange={(event) =>
                              setCorrections((prev) => {
                                if (!prev) return prev
                                const medications = [...prev.medications]
                                medications[idx] = { ...medications[idx], instructions: event.target.value }
                                return { ...prev, medications }
                              })
                            }
                            rows={2}
                            className='sm:col-span-3 text-xs border-[#BFDBFE] resize-none'
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PHARMACIST NOTES ── */}
          {isPending && (
            <div>
              <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2'>
                <Info className='w-3.5 h-3.5' />
                Ghi chú dược sĩ
                {confirmAction === 'rejected' && (
                  <span className='text-red-500 text-xs normal-case font-normal'>(Bắt buộc khi từ chối)</span>
                )}
              </label>
              <Textarea
                data-testid='pharmacist-notes-input'
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                placeholder='Nhập ghi chú, lý do từ chối hoặc hướng dẫn thêm...'
                rows={3}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] resize-none'
              />
            </div>
          )}

          {/* Existing pharmacist notes for non-pending */}
          {!isPending && prescription.pharmacistNotes && (
            <div>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Ghi chú dược sĩ</p>
              <p className='text-sm text-gray-700 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                {prescription.pharmacistNotes}
              </p>
            </div>
          )}

          {/* ── CONFIRM PANEL ── */}
          {confirmAction && (
            <div
              data-testid='confirmation-panel'
              className={`p-4 rounded-xl border-2 ${
                confirmAction === 'verified' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}
            >
              <div className='flex items-start gap-3'>
                {confirmAction === 'verified' ? (
                  <CheckCircle className='w-5 h-5 text-green-600 mt-0.5 shrink-0' />
                ) : (
                  <XCircle className='w-5 h-5 text-red-600 mt-0.5 shrink-0' />
                )}
                <div className='flex-1'>
                  <p
                    className={`font-semibold text-sm ${confirmAction === 'verified' ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {confirmAction === 'verified'
                      ? 'Xác nhận phê duyệt đơn thuốc này?'
                      : 'Xác nhận từ chối đơn thuốc này?'}
                  </p>
                  <p className='text-xs mt-0.5 text-gray-600'>
                    {confirmAction === 'verified'
                      ? 'Sau khi duyệt, bạn có thể tạo đơn hàng cho khách hàng.'
                      : 'Khách hàng sẽ nhận được thông báo từ chối cùng lý do.'}
                  </p>
                </div>
                <div className='flex gap-2 shrink-0'>
                  <Button data-testid='cancel-confirmation-btn' variant='outline' size='sm' onClick={() => setConfirmAction(null)} disabled={submitting}>
                    <X className='w-3.5 h-3.5 mr-1' /> Huỷ
                  </Button>
                  <Button
                    data-testid='confirm-action-btn'
                    size='sm'
                    onClick={handleConfirmAction}
                    disabled={submitting}
                    className={
                      confirmAction === 'verified'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER (fixed, does not scroll) ── */}
        <div className='px-6 py-3 border-t border-gray-100 bg-white flex justify-between items-center gap-3 shrink-0'>
          <p className='text-xs text-gray-400'>Cập nhật: {timeAgo(prescription.updatedAt)}</p>

          <div className='flex gap-2'>
            {isPending && !confirmAction && (
              <>
                <Button
                  data-testid='reject-btn'
                  variant='outline'
                  size='sm'
                  onClick={() => setConfirmAction('rejected')}
                  className='text-red-600 border-red-200 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-1' /> Từ chối
                </Button>
                <Button
                  data-testid='approve-btn'
                  size='sm'
                  onClick={() => setConfirmAction('verified')}
                  className='bg-green-600 hover:bg-green-700 text-white'
                >
                  <CheckCircle className='w-4 h-4 mr-1' /> Phê duyệt
                </Button>
              </>
            )}

            {prescription.status === 'verified' && (
              <Button
                data-testid='create-order-from-prescription-btn'
                size='sm'
                onClick={() => {
                  onClose()
                  // Pass pre-mapped productIds as query param so CreateOrderPage can prefill
                  const mappedIds = prescription.medications
                    .filter((m) => m.productId)
                    .map((m) => m.productId)
                    .join(',')
                  const query = mappedIds
                    ? `?prescriptionId=${prescription._id}&productIds=${mappedIds}`
                    : `?prescriptionId=${prescription._id}`
                  navigate(`/pharmacist/create-order${query}`)
                }}
                className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
              >
                <Package className='w-4 h-4 mr-1' />
                {prescription.medications.some((m) => m.productId)
                  ? `Tạo đơn (${prescription.medications.filter((m) => m.productId).length} sản phẩm AI map)`
                  : 'Tạo đơn hàng'}
              </Button>
            )}

            {(prescription.status === 'rejected' || prescription.status === 'expired') && (
              <Button variant='outline' size='sm' onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Helper components ──

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className='p-3 bg-gray-50 rounded-lg border border-gray-100'>
      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2'>
        {icon} {title}
      </p>
      {children}
    </div>
  )
}

function InfoRow({ label, value, fullWidth }: { label: string; value?: string | null; fullWidth?: boolean }) {
  if (!value) return null
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className='text-xs text-gray-400'>{label}</p>
      <p className='text-sm font-medium text-gray-800 mt-0.5'>{value}</p>
    </div>
  )
}
