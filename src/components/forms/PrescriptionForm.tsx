import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { CalendarIcon, Sparkles, X, PhoneCall } from 'lucide-react'
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
export interface MedicationItem {
  productName: string
  dosage: string
  quantity: number | null
  unit: string | null
  instructions: string
  productId?: string
  matchedName?: string
  image?: string | null
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

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* OCR Auto-fill badge */}
      {isOCRFilled && (
        <div className='flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl'>
          <Sparkles className='w-5 h-5 text-emerald-600 shrink-0' />
          <span className='text-sm text-emerald-800 font-medium'>Form đã được điền tự động từ Đơn thuốc</span>
          {initialData?.confidence && (
            <Badge variant='outline' className='ml-auto text-emerald-700 border-emerald-300 text-xs'>
              Độ tin cậy: {initialData.confidence}
            </Badge>
          )}
        </div>
      )}

      {/* Patient Information */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
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
                className='border-2 border-blue-200 focus:border-blue-500'
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
                className='border-2 border-blue-200 focus:border-blue-500'
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
                <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
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
                  className='border-2 border-blue-200 focus:border-blue-500 pl-10'
                  required
                />
                <PhoneCall className='w-4 h-4 text-gray-400 absolute left-3 top-3' />
              </div>

              {showPhoneSuggestion && (
                <div className='mt-2.5 text-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 text-indigo-700 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200 shadow-sm'>
                  <span className='font-medium flex-1 flex items-center gap-1.5'>
                    <Sparkles className='w-4 h-4 text-indigo-500' />
                    AI tìm thấy SĐT trên đơn: <strong>{suggestedPhone}</strong>
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 flex-shrink-0 text-xs border-indigo-300 hover:bg-indigo-100/80 hover:text-indigo-900 bg-white'
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
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
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
                className='border-2 border-blue-200 focus:border-blue-500'
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
                className='border-2 border-blue-200 focus:border-blue-500'
                required
              />
            </div>

            <div className='md:col-span-2'>
              <Label className='mb-2 block'>Ngày khám</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal border-2 !border-blue-200 focus:!border-blue-500'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.examinationDate ? (
                      format(formData.examinationDate, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày khám</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0 rounded-xl border-blue-200 shadow-lg overflow-hidden'>
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
                className='border-2 border-blue-200 focus:border-blue-500'
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Medications từ OCR */}
      {medications.length > 0 && (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-emerald-100'>
          <div className='p-6'>
            <h3 className='mb-4 text-emerald-800 flex items-center gap-2'>
              <Sparkles className='w-5 h-5' />
              💊 DANH SÁCH THUỐC (từ OCR)
            </h3>
            <div className='space-y-2'>
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className='flex items-start justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100'
                >
                  <div className='flex items-start gap-3 flex-1'>
                    {med.image && (
                      <div className='w-14 h-14 shrink-0 bg-white rounded-lg border border-emerald-200 overflow-hidden shadow-sm'>
                        <img src={med.image} alt={med.matchedName || med.productName} className='w-full h-full object-cover' />
                      </div>
                    )}
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium text-emerald-900 text-sm'>
                          {med.matchedName || med.productName}
                        </p>
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
                      <div className='flex gap-3 mt-0.5'>
                        {med.quantity != null && (
                          <span className='text-xs text-gray-500'>
                            SL: {med.quantity} {med.unit || ''}
                          </span>
                        )}
                        {med.instructions && <span className='text-xs text-gray-500'>{med.instructions}</span>}
                      </div>
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
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <div className='p-6'>
          <h3 className='mb-4 text-blue-900 flex items-center'>📝 GHI CHÚ ĐẶC BIỆT</h3>

          <Textarea
            placeholder='VD: Cần giao hàng khẩn cấp, dị ứng thuốc, v.v.'
            value={formData.specialNotes}
            onChange={(e) => handleInputChange('specialNotes', e.target.value)}
            className='border-2 border-blue-200 focus:border-blue-500'
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
          className='border-blue-200 text-blue-700 hover:bg-blue-50'
          onClick={handleSaveDraft}
        >
          Lưu nháp
        </Button>

        <div className='flex flex-col sm:flex-row gap-3'>
          <Button type='button' variant='outline' className='border-gray-300 text-gray-700 hover:bg-gray-50'>
            Quay lại
          </Button>

          <Button
            type='submit'
            disabled={!isFormValid() || isSubmitting}
            className='bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 disabled:opacity-50'
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đơn thuốc'}
          </Button>
        </div>
      </div>
    </form>
  )
}
