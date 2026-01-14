import { useState } from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

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

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionFormData) => void
  onSaveDraft: (data: PrescriptionFormData) => void
  className?: string
}

export function PrescriptionForm({ onSubmit, onSaveDraft, className = '' }: PrescriptionFormProps) {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientName: '',
    patientAge: '',
    patientGender: '',
    phoneNumber: '',
    relationship: 'myself',
    doctorName: '',
    hospitalName: '',
    examinationDate: undefined,
    diagnosis: '',
    specialNotes: '',
    agreements: {
      authentic: false,
      contactPermission: false,
      legalUnderstanding: false,
    },
  })

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
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    onSaveDraft(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
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
              <Select onValueChange={(value) => handleInputChange('patientGender', value)}>
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
              <Label htmlFor='phoneNumber' className='mb-2 block'>
                Số điện thoại liên hệ *
              </Label>
              <Input
                id='phoneNumber'
                placeholder='Nhập số điện thoại'
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className='border-2 border-blue-200 focus:border-blue-500'
                required
              />
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
                <PopoverContent className='w-auto p-0'>
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
              />
              <Label htmlFor='authentic' className='text-sm leading-relaxed'>
                Tôi cam kết đơn thuốc này là thật và hợp lệ
              </Label>
            </div>

            <div className='flex items-start space-x-3'>
              <Checkbox
                id='contactPermission'
                checked={formData.agreements.contactPermission}
                onCheckedChange={(checked) => handleAgreementChange('contactPermission', !!checked)}
              />
              <Label htmlFor='contactPermission' className='text-sm leading-relaxed'>
                Tôi đồng ý để dược sĩ liên hệ xác minh
              </Label>
            </div>

            <div className='flex items-start space-x-3'>
              <Checkbox
                id='legalUnderstanding'
                checked={formData.agreements.legalUnderstanding}
                onCheckedChange={(checked) => handleAgreementChange('legalUnderstanding', !!checked)}
              />
              <Label htmlFor='legalUnderstanding' className='text-sm leading-relaxed'>
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
