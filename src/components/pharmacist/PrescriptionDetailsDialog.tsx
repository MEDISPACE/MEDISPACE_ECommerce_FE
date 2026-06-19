import { useState } from 'react'
import { useNavigate } from 'react-router'
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

type ConfirmAction = 'verified' | 'rejected' | null

export function PrescriptionDetailsDialog({ isOpen, onClose, prescription, onUpdate }: PrescriptionDetailsDialogProps) {
  const [pharmacistNotes, setPharmacistNotes] = useState(prescription?.pharmacistNotes || '')
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const navigate = useNavigate()

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
      })
      toast.success(
        confirmAction === 'verified' ? '✅ Đơn thuốc đã được phê duyệt thành công!' : '❌ Đơn thuốc đã bị từ chối',
        { description: pharmacistNotes || undefined },
      )
      if (onUpdate) await onUpdate()
      onClose()
      setPharmacistNotes('')
      setConfirmAction(null)
    } catch {
      toast.error('Không thể cập nhật đơn thuốc', { description: 'Vui lòng thử lại sau' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl p-0'>
        {/* ── HEADER ── */}
        <div className='px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10'>
          <DialogHeader>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <DialogTitle className='text-lg font-bold text-blue-900 flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  {prescription.prescriptionNumber}
                </DialogTitle>
                <DialogDescription className='text-sm text-gray-500 mt-0.5'>
                  Gửi lúc {formatDateTime(prescription.createdAt)}
                </DialogDescription>
              </div>
              <div className='flex items-center gap-2 shrink-0'>
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
                    className='ml-1 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
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

        <div className='px-6 py-4 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-400'>
          {/* ── REJECTION REASON (if rejected) ── */}
          {prescription.status === 'rejected' && (prescription.pharmacistNotes || prescription.notes) && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2'>
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
            <div className='p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2'>
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

          {/* ── MAIN 2-COL LAYOUT ── */}
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-5'>
            {/* LEFT: images */}
            <div className='lg:col-span-2'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                Ảnh đơn thuốc ({prescription.images.length})
              </p>
              <PrescriptionImageViewer images={prescription.images} />
            </div>

            {/* RIGHT: info panels */}
            <div className='lg:col-span-3 space-y-4'>
              {/* Patient Info */}
              <InfoSection title='Thông tin bệnh nhân' icon={<User className='w-4 h-4' />}>
                <div className='grid grid-cols-2 gap-3 text-sm'>
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
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <InfoRow label='Bác sĩ' value={prescription.doctorName} />
                  <InfoRow label='Phòng khám / BV' value={prescription.hospitalName} />
                  <InfoRow label='Ngày kê đơn' value={formatDate(prescription.prescriptionDate)} />
                </div>
              </InfoSection>

              {/* Customer account info (from DB lookup) */}
              {customerName && (
                <InfoSection title='Tài khoản khách hàng' icon={<Phone className='w-4 h-4' />}>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <InfoRow label='Tên tài khoản' value={customerName} />
                    {prescription.customer?.phoneNumber && (
                      <InfoRow label='Số điện thoại' value={prescription.customer.phoneNumber} />
                    )}
                    {prescription.customer?.email && <InfoRow label='Email' value={prescription.customer.email} />}
                  </div>
                </InfoSection>
              )}
            </div>
          </div>

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
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {prescription.medications.map((med, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 p-3 rounded-lg border ${
                      med.productId
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-[#F0F6FF] border-[#E8EDF5]'
                    }`}
                  >
                    {/* Product thumbnail or numbered circle */}
                    {med.image ? (
                      <div className='w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 bg-white shrink-0 shadow-sm'>
                        <img src={med.image} alt={med.matchedName || med.productName} className='w-full h-full object-cover' />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${
                        med.productId ? 'bg-emerald-600' : 'bg-[#0A2463]'
                      }`}>
                        {idx + 1}
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start gap-1.5 flex-wrap'>
                        <p className={`text-sm font-semibold truncate ${
                          med.productId ? 'text-emerald-900' : 'text-blue-900'
                        }`}>
                          {med.matchedName || med.productName}
                        </p>
                        {med.productId && (
                          <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium shrink-0'>
                            ✓ Có trong kho
                          </span>
                        )}
                      </div>
                      {med.matchedName && med.matchedName !== med.productName && (
                        <p className='text-[11px] text-gray-400 italic'>AI đọc: {med.productName}</p>
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
                  <Button variant='outline' size='sm' onClick={() => setConfirmAction(null)} disabled={submitting}>
                    <X className='w-3.5 h-3.5 mr-1' /> Huỷ
                  </Button>
                  <Button
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
                  variant='outline'
                  size='sm'
                  onClick={() => setConfirmAction('rejected')}
                  className='text-red-600 border-red-200 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-1' /> Từ chối
                </Button>
                <Button
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
