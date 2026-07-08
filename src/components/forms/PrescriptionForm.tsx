import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { AlertTriangle, CalendarIcon, Sparkles, X, PhoneCall, ExternalLink, ShoppingCart } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'

interface PrescriptionFormData {
  patientName: string
  patientAge: string
  patientGender: string
  phoneNumber: string
  relationship: string
  doctorName: string
  hospitalName: string
  examinationDate: Date | undefined
  diagnosis: string
  specialNotes: string
  agreements: {
    authentic: boolean
    contactPermission: boolean
    legalUnderstanding: boolean
  }
}

// Thông tin thuốc từ OCR
export interface MedicationProductSummary {
  productId: string
  name: string
  slug: string
  image?: string | null
  price?: number | null
  unit?: string
  stockQuantity?: number
  requiresPrescription?: boolean
  activeIngredients?: string
  strength?: string
  dosageForm?: string
  reason?: string
}

export interface MedicationItem {
  productName: string
  activeIngredient?: string | null
  dosage: string
  quantity: number | null
  unit: string | null
  instructions: string
  productId?: string
  matchedName?: string
  slug?: string
  image?: string | null
  price?: number | null
  stockQuantity?: number
  requiresPrescription?: boolean
  confidence?: string
  needsReview?: boolean
  source?: string
  sourcePage?: number
  reviewReason?: string
  equivalentProducts?: MedicationProductSummary[]
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

// Dữ liệu OCR để auto-fill
export interface OCRInitialData {
  patientName?: string | null
  patientAge?: string | null
  patientGender?: string | null
  phoneNumber?: string | null
  doctorName?: string | null
  hospitalName?: string | null
  prescriptionDate?: string | null
  diagnosis?: string | null
  specialNotes?: string | null
  medications?: MedicationItem[]
  confidence?: string
  rawText?: string
  _extraction_method?: string
  quality?: Record<string, unknown>
}

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionFormData, medications: MedicationItem[]) => void
  onSaveDraft: (data: PrescriptionFormData) => void
  initialData?: OCRInitialData // ← Dữ liệu auto-fill từ OCR
  className?: string
}

export function PrescriptionForm({ onSubmit, onSaveDraft, initialData, className = '' }: PrescriptionFormProps) {
  const { user } = useAuth()

  const [formData, setFormData] = useState<PrescriptionFormData>(() => ({
    patientName: initialData?.patientName || '',
    patientAge: initialData?.patientAge || '',
    patientGender: initialData?.patientGender || '',
    // Build UX auto-fill profile phone number OR fallback to OCR data
    phoneNumber: (user as any)?.phone || (user as any)?.phoneNumber || initialData?.phoneNumber || '',
    relationship: 'myself',
    doctorName: initialData?.doctorName || '',
    hospitalName: initialData?.hospitalName || '',
    examinationDate: initialData?.prescriptionDate
      ? (() => {
        try {
          const d = parseISO(initialData.prescriptionDate!)
          return isNaN(d.getTime()) ? undefined : d
        } catch {
          return undefined
        }
      })()
      : undefined,
    diagnosis: initialData?.diagnosis || '',
    specialNotes: initialData?.specialNotes || '',
    agreements: {
      authentic: false,
      contactPermission: false,
      legalUnderstanding: false,
    },
  }))

  // Medications từ OCR — có thể edit
  const [medications, setMedications] = useState<MedicationItem[]>(initialData?.medications || [])

  const isOCRFilled = !!(
    initialData?.patientName ||
    initialData?.doctorName ||
    (initialData?.medications && initialData.medications.length > 0)
  )

  // Nếu initialData thay đổi (re-scan), sync lại form
  useEffect(() => {
    if (!initialData) return
    setFormData((prev) => ({
      ...prev,
      patientName: initialData.patientName || prev.patientName,
      patientAge: initialData.patientAge || prev.patientAge,
      patientGender: initialData.patientGender || prev.patientGender,
      phoneNumber: prev.phoneNumber || initialData.phoneNumber || '',
      doctorName: initialData.doctorName || prev.doctorName,
      hospitalName: initialData.hospitalName || prev.hospitalName,
      diagnosis: initialData.diagnosis || prev.diagnosis,
      specialNotes: initialData.specialNotes || prev.specialNotes,
      examinationDate: initialData.prescriptionDate
        ? (() => {
          try {
            const d = parseISO(initialData.prescriptionDate!)
            return isNaN(d.getTime()) ? prev.examinationDate : d
          } catch {
            return prev.examinationDate
          }
        })()
        : prev.examinationDate,
    }))
    if (initialData.medications && initialData.medications.length > 0) {
      setMedications(initialData.medications)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof PrescriptionFormData, value: string | Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAgreementChange = (field: keyof PrescriptionFormData['agreements'], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [field]: checked,
      },
    }))
  }

  const isFormValid = () => {
    const { patientName, phoneNumber, doctorName, hospitalName, agreements } = formData
    return (
      patientName.trim() !== '' &&
      phoneNumber.trim() !== '' &&
      doctorName.trim() !== '' &&
      hospitalName.trim() !== '' &&
      agreements.authentic &&
      agreements.contactPermission &&
      agreements.legalUnderstanding
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData, medications)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    onSaveDraft(formData)
  }

  const suggestedPhone = initialData?.phoneNumber
  const showPhoneSuggestion = !!suggestedPhone && suggestedPhone !== formData.phoneNumber
  const ocrQuality = initialData?.quality as
    | { level?: unknown; imageQuality?: OCRImageQuality; pages?: Array<{ page?: number; imageQuality?: OCRImageQuality }> }
    | undefined
  const ocrImageQuality = ocrQuality?.imageQuality
  const ocrPageQualities = Array.isArray(ocrQuality?.pages) ? ocrQuality.pages : []
  const imageQualityFlags = [
    ...(ocrImageQuality?.flags || []),
    ...ocrPageQualities.flatMap((page) => page.imageQuality?.flags || []),
  ]
  const uniqueImageQualityFlags = Array.from(new Set(imageQualityFlags))
  const hasImageQualityWarning = uniqueImageQualityFlags.length > 0 || ocrImageQuality?.level === 'poor'
  const imageQualityLabels: Record<string, string> = {
    blurry: 'Ảnh mờ',
    too_dark: 'Ảnh tối',
    too_bright: 'Ảnh quá sáng',
    low_contrast: 'Tương phản thấp',
    low_resolution: 'Độ phân giải thấp',
    extreme_aspect_ratio: 'Khung ảnh bất thường',
  }
  const ocrQualityLevel = String(ocrQuality?.level || '').toLowerCase()
  const ocrConfidence = String(initialData?.confidence || '').toLowerCase()
  const needsOcrReview = ocrQualityLevel === 'low' || ocrConfidence === 'low' || hasImageQualityWarning
  const hasMedicationReview = medications.some((med) => med.needsReview || String(med.confidence || '').toLowerCase() === 'low')
  const medicationReviewTone = needsOcrReview || hasMedicationReview
  const confidenceLabel = needsOcrReview
    ? 'Cần kiểm tra'
    : ocrConfidence === 'high'
      ? 'Độ tin cậy: cao'
      : ocrConfidence === 'medium'
        ? 'Độ tin cậy: trung bình'
        : ''

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* OCR Auto-fill badge */}
      {isOCRFilled && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border ${
            needsOcrReview ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          {needsOcrReview ? (
            <AlertTriangle className='w-5 h-5 text-amber-600 shrink-0' />
          ) : (
            <Sparkles className='w-5 h-5 text-emerald-600 shrink-0' />
          )}
          <span className={`text-sm font-medium ${needsOcrReview ? 'text-amber-800' : 'text-emerald-800'}`}>
            {needsOcrReview ? 'Cần kiểm tra lại thông tin OCR' : 'Form đã được điền tự động từ Đơn thuốc'}
          </span>
          {confidenceLabel && (
            <Badge
              variant='outline'
              className={`ml-auto text-xs ${
                needsOcrReview ? 'text-amber-700 border-amber-300' : 'text-emerald-700 border-emerald-300'
              }`}
            >
              {confidenceLabel}
            </Badge>
          )}
        </div>
      )}

      {isOCRFilled && hasImageQualityWarning && (
        <div className='p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900'>
          <div className='flex items-start gap-2'>
            <AlertTriangle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
            <div className='space-y-2'>
              <p className='text-sm font-medium'>Ảnh đơn thuốc cần kiểm tra lại trước khi gửi.</p>
              <div className='flex flex-wrap gap-1.5'>
                {uniqueImageQualityFlags.map((flag) => (
                  <Badge key={flag} variant='outline' className='text-xs border-amber-300 bg-white text-amber-700'>
                    {imageQualityLabels[flag] || flag}
                  </Badge>
                ))}
              </div>
              {ocrPageQualities.length > 0 && (
                <p className='text-xs text-amber-700'>
                  OCR đã quét {ocrPageQualities.length} ảnh. Các dòng thuốc có thể cần đối chiếu lại với ảnh gốc.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Information */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>👤 THÔNG TIN BỆNH NHÂN</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <Label htmlFor='patientName' className='mb-2 block'>
                Tên bệnh nhân *
              </Label>
              <Input
                id='patientName'
                placeholder='Nhập tên bệnh nhân'
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                required
              />
              <p className='text-sm text-gray-600 mt-1'>(Nếu khác với tên tài khoản)</p>
            </div>

            <div>
              <Label htmlFor='patientAge' className='mb-2 block'>
                Tuổi
              </Label>
              <Input
                id='patientAge'
                placeholder='Nhập tuổi'
                value={formData.patientAge}
                onChange={(e) => handleInputChange('patientAge', e.target.value)}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>

            <div>
              <Label htmlFor='patientGender' className='mb-2 block'>
                Giới tính
              </Label>
              <Select
                value={formData.patientGender || ''}
                onValueChange={(value) => handleInputChange('patientGender', value)}
              >
                <SelectTrigger className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
                  <SelectValue placeholder='Chọn giới tính' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='male'>Nam</SelectItem>
                  <SelectItem value='female'>Nữ</SelectItem>
                  <SelectItem value='other'>Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='md:col-span-2'>
              <Label htmlFor='phoneNumber' className='mb-2 block font-medium'>
                SĐT Dược sĩ liên hệ tư vấn *
              </Label>
              <div className='relative'>
                <Input
                  id='phoneNumber'
                  placeholder='Nhập số điện thoại'
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className='border-2 border-[#BFDBFE] focus:border-[#1E40AF] pl-10'
                  required
                />
                <PhoneCall className='w-4 h-4 text-gray-400 absolute left-3 top-3' />
              </div>

              {showPhoneSuggestion && (
                <div className='mt-2.5 text-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[#1E40AF] bg-[#F0F6FF]/80 p-2.5 rounded-lg border border-[#BFDBFE] shadow-sm'>
                  <span className='font-medium flex-1 flex items-center gap-1.5'>
                    <Sparkles className='w-4 h-4 text-[#1E40AF]' />
                    AI tìm thấy SĐT trên đơn: <strong>{suggestedPhone}</strong>
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 flex-shrink-0 text-xs border-[#BFDBFE] hover:bg-[#E8EDF5]/80 hover:text-[#0A2463] bg-white'
                    onClick={() => handleInputChange('phoneNumber', suggestedPhone)}
                  >
                    Dùng số này
                  </Button>
                </div>
              )}
            </div>

            <div className='md:col-span-2'>
              <Label className='mb-2 block'>Mối quan hệ với bệnh nhân</Label>
              <RadioGroup
                value={formData.relationship}
                onValueChange={(value) => handleInputChange('relationship', value)}
                className='flex flex-wrap gap-4 mt-2'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='myself' id='myself' />
                  <Label htmlFor='myself'>Chính tôi</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='child' id='child' />
                  <Label htmlFor='child'>Con</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='spouse' id='spouse' />
                  <Label htmlFor='spouse'>Vợ/Chồng</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='parent' id='parent' />
                  <Label htmlFor='parent'>Bố/Mẹ</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='other' id='other' />
                  <Label htmlFor='other'>Khác</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>

      {/* Medical Information */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>🏥 THÔNG TIN KHÁM BỆNH</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='doctorName' className='mb-2 block'>
                Bác sĩ khám *
              </Label>
              <Input
                id='doctorName'
                placeholder='Nhập tên bác sĩ'
                value={formData.doctorName}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                required
              />
            </div>

            <div>
              <Label htmlFor='hospitalName' className='mb-2 block'>
                Bệnh viện/Phòng khám *
              </Label>
              <Input
                id='hospitalName'
                placeholder='Nhập tên bệnh viện/phòng khám'
                value={formData.hospitalName}
                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                required
              />
            </div>

            <div className='md:col-span-2'>
              <Label className='mb-2 block'>Ngày khám</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal border-2 !border-[#BFDBFE] focus:!border-[#1E40AF]'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.examinationDate ? (
                      format(formData.examinationDate, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày khám</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0 rounded-xl border-[#BFDBFE] shadow-lg overflow-hidden'>
                  <CalendarComponent
                    mode='single'
                    selected={formData.examinationDate}
                    onSelect={(date) => handleInputChange('examinationDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='md:col-span-2'>
              <Label htmlFor='diagnosis' className='mb-2 block'>
                Chẩn đoán
              </Label>
              <Textarea
                id='diagnosis'
                placeholder='Nhập chẩn đoán (tùy chọn)'
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Medications từ OCR */}
      {medications.length > 0 && (
        <Card className={`bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border ${medicationReviewTone ? 'border-amber-200' : 'border-emerald-100'}`}>
          <div className='p-6'>
            <h3 className={`mb-4 flex items-center gap-2 ${medicationReviewTone ? 'text-amber-800' : 'text-emerald-800'}`}>
              {medicationReviewTone ? <AlertTriangle className='w-5 h-5' /> : <Sparkles className='w-5 h-5' />}
              💊 DANH SÁCH THUỐC (từ OCR)
              {medicationReviewTone && (
                <Badge variant='outline' className='ml-auto text-xs text-amber-700 border-amber-300 bg-amber-50'>
                  Cần kiểm tra
                </Badge>
              )}
            </h3>
            <div className='space-y-2'>
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className={`flex items-start justify-between p-3 rounded-lg border ${med.needsReview || String(med.confidence || '').toLowerCase() === 'low' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}
                >
                  <div className='flex items-start gap-3 flex-1'>
                    {med.image && (
                      <div className='w-14 h-14 shrink-0 bg-white rounded-lg border border-emerald-200 overflow-hidden shadow-sm'>
                        <img src={med.image} alt={med.matchedName || med.productName} className='w-full h-full object-cover' />
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className={`font-medium text-sm ${med.needsReview ? 'text-amber-900' : 'text-emerald-900'}`}>
                          {med.matchedName || med.productName}
                        </p>
                        {med.needsReview && (
                          <Badge variant='outline' className='text-[10px] px-1.5 py-0 text-amber-700 border-amber-300 bg-amber-50'>
                            Cần kiểm tra
                          </Badge>
                        )}
                        {med.productId && (
                          <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] px-1.5 py-0 border-emerald-200'>
                            ✓ Có trong kho
                          </Badge>
                        )}
                      </div>
                      {med.matchedName && med.productName !== med.matchedName && (
                        <p className='text-[11px] text-gray-500 italic mt-0.5'>AI đọc: {med.productName}</p>
                      )}
                      {med.dosage && <p className='text-xs text-gray-600 mt-0.5'>Liều: {med.dosage}</p>}
                      {med.sourcePage && (
                        <p className='text-[11px] text-gray-500 mt-0.5'>Nguồn ảnh: trang {med.sourcePage}</p>
                      )}
                      <div className='flex gap-3 mt-0.5'>
                        {med.quantity != null && (
                          <span className='text-xs text-gray-500'>
                            SL: {med.quantity} {med.unit || ''}
                          </span>
                        )}
                        {med.instructions && <span className='text-xs text-gray-500'>{med.instructions}</span>}
                      </div>
                      {(med.slug || (med.equivalentProducts && med.equivalentProducts.length > 0)) && (
                        <div className='mt-3 space-y-2'>
                          {med.slug && (
                            <div className='flex flex-wrap items-center gap-2'>
                              <Link
                                to={`/products/${med.slug}`}
                                className='inline-flex h-8 items-center gap-1.5 rounded-md border border-[#BFDBFE] bg-white px-2.5 text-xs font-medium text-[#0A2463] hover:bg-[#F0F6FF]'
                              >
                                <ExternalLink className='h-3.5 w-3.5' />
                                Xem chi tiet
                              </Link>
                              {med.requiresPrescription === false && (
                                <Link
                                  to={`/products/${med.slug}`}
                                  className='inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0A2463] px-2.5 text-xs font-medium text-white hover:bg-[#071A49]'
                                >
                                  <ShoppingCart className='h-3.5 w-3.5' />
                                  Mua ngay
                                </Link>
                              )}
                              {med.price != null && (
                                <span className='text-xs font-semibold text-[#1E40AF]'>
                                  {Number(med.price).toLocaleString('vi-VN')}d{med.unit ? `/${med.unit}` : ''}
                                </span>
                              )}
                            </div>
                          )}

                          {med.equivalentProducts && med.equivalentProducts.length > 0 && (
                            <div className='rounded-lg border border-[#E8EDF5] bg-white/80 p-2'>
                              <p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
                                Thuốc tương đương / thay thế
                              </p>
                              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                                {med.equivalentProducts.slice(0, 4).map((product) => (
                                  <Link
                                    key={product.productId}
                                    to={`/products/${product.slug}`}
                                    className='flex min-w-0 items-center gap-2 rounded-md border border-gray-100 bg-white p-2 hover:border-[#BFDBFE] hover:bg-[#F0F6FF]'
                                  >
                                    {product.image && (
                                      <img src={product.image} alt={product.name} className='h-9 w-9 shrink-0 rounded object-cover' />
                                    )}
                                    <span className='min-w-0 flex-1'>
                                      <span className='block truncate text-xs font-medium text-gray-900'>{product.name}</span>
                                      <span className='block truncate text-[11px] text-gray-500'>
                                        {product.reason || 'Goi y tuong duong'}
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
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setMedications((prev) => prev.filter((_, i) => i !== idx))}
                    className='text-gray-400 hover:text-red-500 ml-2 shrink-0'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Special Notes */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>📝 GHI CHÚ ĐẶC BIỆT</h3>

          <Textarea
            placeholder='VD: Cần giao hàng khẩn cấp, dị ứng thuốc, v.v.'
            value={formData.specialNotes}
            onChange={(e) => handleInputChange('specialNotes', e.target.value)}
            className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
            rows={4}
          />
        </div>
      </Card>

      {/* Agreements */}
      <Card className='bg-amber-50/80 backdrop-blur-lg shadow-lg rounded-2xl border border-amber-200'>
        <div className='p-6'>
          <h3 className='mb-4 text-amber-900 flex items-center'>⚠️ CAM KẾT</h3>

          <div className='space-y-4'>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='authentic'
                checked={formData.agreements.authentic}
                onCheckedChange={(checked) => handleAgreementChange('authentic', !!checked)}
                className='mt-0.5'
              />
              <Label htmlFor='authentic' className='text-sm leading-normal'>
                Tôi cam kết đơn thuốc này là thật và hợp lệ
              </Label>
            </div>

            <div className='flex items-start space-x-3'>
              <Checkbox
                id='contactPermission'
                checked={formData.agreements.contactPermission}
                onCheckedChange={(checked) => handleAgreementChange('contactPermission', !!checked)}
                className='mt-0.5'
              />
              <Label htmlFor='contactPermission' className='text-sm leading-normal'>
                Tôi đồng ý để dược sĩ liên hệ xác minh
              </Label>
            </div>

            <div className='flex items-start space-x-3'>
              <Checkbox
                id='legalUnderstanding'
                checked={formData.agreements.legalUnderstanding}
                onCheckedChange={(checked) => handleAgreementChange('legalUnderstanding', !!checked)}
                className='mt-0.5'
              />
              <Label htmlFor='legalUnderstanding' className='text-sm leading-normal'>
                Tôi hiểu việc cung cấp thông tin sai có thể bị từ chối hoặc xử lý pháp lý
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-3 justify-between'>
        <Button
          type='button'
          variant='outline'
          className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
          onClick={handleSaveDraft}
        >
          Lưu nháp
        </Button>

        <div className='flex flex-col sm:flex-row gap-3'>
          <Button
            type='submit'
            disabled={!isFormValid() || isSubmitting}
            className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#1E40AF] disabled:opacity-50'
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đơn thuốc'}
          </Button>
        </div>
      </div>
    </form>
  )
}
