import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  CheckCircle,
  ArrowLeft,
  Clock,
  UserCheck,
  Package,
  Upload,
  AlertCircle,
  Sparkles,
  Loader2,
  ScanLine,
  Brain,
  FileSearch,
  Check,
  X,
  Copy,
  Bell,
  Mail,
  ShoppingBag,
  ClipboardList,
  Home,
  PlusCircle,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { ImageUploader, type UploadedImage } from '../forms/ImageUploader'
import { PrescriptionForm } from '../forms/PrescriptionForm'
import type { OCRInitialData, MedicationItem } from '../forms/PrescriptionForm'
import { ProgressStepper } from '../forms/ProgressStepper'
import { toast } from 'sonner'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { prescriptionsAPI } from '../../lib/api/prescriptions'
import { useAuth } from '../../contexts/AuthContext'
import type { Product } from '../../types/product'

const uploadSteps = [
  { id: 'upload', title: 'Upload ảnh', description: 'Tải lên đơn thuốc' },
  { id: 'info', title: 'Thông tin', description: 'Điền thông tin' },
  { id: 'complete', title: 'Hoàn thành', description: 'Kết quả' },
]

interface UploadedPrescriptionPreviewProps {
  images: UploadedImage[]
  selectedIndex: number
  onSelect: (index: number) => void
  onBackToUpload: () => void
  className?: string
}

function UploadedPrescriptionPreview({
  images,
  selectedIndex,
  onSelect,
  onBackToUpload,
  className = '',
}: UploadedPrescriptionPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const uploaded = images.filter((image) => image.isUploaded && image.url.startsWith('http'))
  const activeIndex = uploaded.length > 0 ? Math.min(selectedIndex, uploaded.length - 1) : 0
  const activeImage = uploaded[activeIndex]

  const handlePrev = () => {
    if (uploaded.length <= 1) return
    onSelect(activeIndex === 0 ? uploaded.length - 1 : activeIndex - 1)
  }

  const handleNext = () => {
    if (uploaded.length <= 1) return
    onSelect(activeIndex === uploaded.length - 1 ? 0 : activeIndex + 1)
  }

  if (!activeImage) {
    return (
      <Card className={`bg-white border border-[#E8EDF5] shadow-sm rounded-2xl ${className}`}>
        <CardContent className='p-4 text-sm text-gray-500'>Chưa có ảnh đơn thuốc đã tải lên.</CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-lg border border-[#E8EDF5] shadow-lg rounded-2xl overflow-hidden ${className}`}>
      <CardHeader className='p-4 pb-3'>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle className='text-sm font-bold text-blue-900 flex items-center gap-2'>
            <ImageIcon className='w-4 h-4 text-[#1E40AF]' />
            Ảnh đơn thuốc
          </CardTitle>
          <Badge className='bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'>
            Đã tải lên
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0 space-y-3'>
        <button
          type='button'
          onClick={() => setIsPreviewOpen(true)}
          className='relative w-full aspect-[4/3] lg:h-60 lg:aspect-auto rounded-xl overflow-hidden bg-gray-50 border border-[#E8EDF5] group focus:outline-none focus:ring-2 focus:ring-[#1E40AF]'
        >
          <img src={activeImage.url} alt={activeImage.name} className='w-full h-full object-contain' />
          <div className='absolute top-2 left-2 flex items-center gap-2'>
            <Badge className='bg-white/95 text-[#0A2463] border border-[#BFDBFE] hover:bg-white'>
              Ảnh {activeIndex + 1}/{uploaded.length}
            </Badge>
          </div>
          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
          <div className='absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-[#0A2463]'>
            <ZoomIn className='w-4 h-4' />
          </div>
        </button>

        <div className='min-w-0'>
          <p className='text-sm font-medium text-gray-800 truncate'>{activeImage.name}</p>
          <p className='text-xs text-gray-500'>Dùng ảnh này để kiểm tra lại thông tin OCR bên dưới.</p>
        </div>

        {uploaded.length > 1 && (
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {uploaded.map((image, index) => (
              <button
                type='button'
                key={image.id}
                onClick={() => onSelect(index)}
                className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-gray-50 transition-colors ${
                  index === activeIndex ? 'border-[#1E40AF]' : 'border-transparent hover:border-[#BFDBFE]'
                }`}
              >
                <img src={image.url} alt={image.name} className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
        )}

        <Button
          type='button'
          variant='outline'
          className='w-full border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'
          onClick={onBackToUpload}
        >
          Đổi/Sửa ảnh
        </Button>
      </CardContent>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className='max-w-5xl w-[95vw] max-h-[92vh] p-0 bg-black/95 border-none overflow-hidden'>
          <DialogTitle className='sr-only'>Xem ảnh đơn thuốc</DialogTitle>
          <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 p-4 bg-gradient-to-b from-black/80 to-transparent'>
            <Badge className='bg-white/20 text-white border-white/20 hover:bg-white/20'>
              Ảnh {activeIndex + 1}/{uploaded.length}
            </Badge>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-white hover:bg-white/20 hover:text-white'
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className='w-5 h-5' />
            </Button>
          </div>

          <div className='h-[88vh] flex items-center justify-center p-12'>
            <img src={activeImage.url} alt={activeImage.name} className='max-w-full max-h-[85vh] object-contain' />
          </div>

          {uploaded.length > 1 && (
            <>
              <Button
                type='button'
                variant='ghost'
                className='absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full text-white hover:bg-white/20 hover:text-white p-0'
                onClick={handlePrev}
              >
                <ChevronLeft className='w-7 h-7' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full text-white hover:bg-white/20 hover:text-white p-0'
                onClick={handleNext}
              >
                <ChevronRight className='w-7 h-7' />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function UploadPrescriptionPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null)
  const [prescriptionNumber, setPrescriptionNumber] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // OCR state
  const [isScanning, setIsScanning] = useState(false)
  const [ocrData, setOcrData] = useState<OCRInitialData | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStage, setScanStage] = useState(0) // 0=idle, 1=detect, 2=recognize, 3=extract
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mô phỏng tiến trình pipeline: Stage1(0-5s→0-30%), Stage2(5-17s→30-80%), Stage3(17-18s→80-99%)
  const startScanProgress = () => {
    setScanProgress(0)
    setScanStage(1)
    const startTime = Date.now()
    scanTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed < 5) {
        setScanStage(1)
        setScanProgress(Math.min(30, (elapsed / 5) * 30))
      } else if (elapsed < 25) {
        setScanStage(2)
        setScanProgress(Math.min(72, 30 + ((elapsed - 5) / 20) * 42))
      } else {
        setScanStage(3)
        setScanProgress(Math.min(96, 72 + ((elapsed - 25) / 35) * 24))
      }
    }, 250)
  }

  const stopScanProgress = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    setScanProgress(100)
    setScanStage(0)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const uploadedCount = uploadedImages.filter((image) => image.isUploaded && image.url.startsWith('http')).length
    if (uploadedCount === 0) {
      setSelectedImageIndex(0)
      return
    }
    if (selectedImageIndex >= uploadedCount) {
      setSelectedImageIndex(uploadedCount - 1)
    }
  }, [selectedImageIndex, uploadedImages])

  // Find product if specified - TODO: Replace with real API call
  const product: Product | null = null

  const breadcrumbItems = [
    ...(product ? [{ label: (product as Product).name, href: `/products/${(product as Product).slug}` }] : []),
    { label: 'Upload đơn thuốc' },
  ]

  // Get S3 URLs of successfully uploaded images
  const getUploadedImageUrls = (): string[] => {
    return uploadedImages.filter((img) => img.isUploaded && img.url.startsWith('http')).map((img) => img.url)
  }

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const uploadedUrls = getUploadedImageUrls()
      if (uploadedUrls.length === 0) {
        setFormError('Vui lòng tải lên ít nhất một ảnh đơn thuốc')
        toast.error('Vui lòng tải lên ít nhất một ảnh đơn thuốc')
        return
      }
      const stillUploading = uploadedImages.some((img) => img.isUploading)
      if (stillUploading) {
        setFormError('Vui lòng đợi ảnh tải lên hoàn tất')
        toast.error('Vui lòng đợi ảnh tải lên hoàn tất')
        return
      }

      setFormError('')

      // ★ Tự động quét OCR sau khi upload ảnh
      setIsScanning(true)
      startScanProgress()
      try {
        const ocrMode = (import.meta.env.VITE_PRESCRIPTION_OCR_MODE || undefined) as
          | 'traditional'
          | 'vision'
          | 'parallel'
          | 'parallel_benchmark'
          | undefined
        const scanResult = await prescriptionsAPI.scanPrescription(uploadedUrls, ocrMode)
        if (scanResult?.data) {
          setOcrData({
            ...scanResult.data,
            rawText: scanResult.rawText,
            confidence: scanResult.data.confidence,
            quality: scanResult.quality,
            // Chuẩn hóa null → string cho MedicationItem
            medications: (scanResult.data.medications || []).map((m: any) => ({
              productName: m.productName || '',
              activeIngredient: m.activeIngredient,
              dosage: m.dosage || '',
              quantity: m.quantity,
              unit: m.unit,
              instructions: m.instructions || '',
              productId: m.productId,
              matchedName: m.matchedName,
              image: m.image,
              confidence: m.confidence,
              needsReview: m.needsReview,
              source: m.source,
              reviewReason: m.reviewReason,
            })),
          })
        }
      } catch (err) {
        console.warn('OCR scan failed, user will fill manually:', err)
        const responseData = (err as any)?.response?.data
        const rejectedHost = responseData?.rejectedHost ? ` (${responseData.rejectedHost})` : ''
        if (responseData?.message) {
          toast.warning(`${responseData.message}${rejectedHost}. Vui lòng nhập thông tin thủ công.`)
        } else {
          toast.warning('Không thể quét tự động. Vui lòng nhập thông tin thủ công.')
        }
      } finally {
        stopScanProgress()
        setIsScanning(false)
      }
    }

    if (currentStep < uploadSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFormSubmit = async (
    formData: {
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
    },
    medications: MedicationItem[],
  ) => {
    if (!isAuthenticated) {
      setFormError('Vui lòng đăng nhập để gửi đơn thuốc')
      toast.error('Vui lòng đăng nhập để gửi đơn thuốc')
      navigate('/login', { state: { from: '/upload-prescription' } })
      return
    }

    const imageUrls = getUploadedImageUrls()
    if (imageUrls.length === 0) {
      setFormError('Không có ảnh đơn thuốc. Vui lòng quay lại bước 1')
      toast.error('Không có ảnh đơn thuốc. Vui lòng quay lại bước 1')
      setCurrentStep(1)
      return
    }

    setIsSubmitting(true)

    try {
      // Chuẩn bị data gửi lên BE — đầy đủ các trường mới
      const prescriptionData = {
        // Thông tin bệnh nhân (từ form / từ OCR)
        patientName: formData.patientName || undefined,
        patientAge: formData.patientAge || undefined,
        patientGender: formData.patientGender || undefined,
        diagnosis: formData.diagnosis || undefined,
        specialNotes: formData.specialNotes || undefined,
        // Thông tin khám
        doctorName: formData.doctorName,
        hospitalName: formData.hospitalName,
        prescriptionDate: formData.examinationDate ? formData.examinationDate.toISOString() : new Date().toISOString(),
        images: imageUrls,
        // Thuốc từ OCR (hoặc mặc định nếu không quét được)
        medications:
          medications.length > 0
            ? medications.map((m) => ({
                productName: m.productName,
                dosage: m.dosage || 'Theo chỉ định bác sĩ',
                productId: m.productId,
                matchedName: m.matchedName,
                image: m.image,
                activeIngredient: m.activeIngredient,
                confidence: m.confidence,
                needsReview: m.needsReview,
                source: m.source,
                reviewReason: m.reviewReason,
                quantity: m.quantity ?? 1,
                unit: m.unit || undefined,
                instructions: m.instructions || 'Theo hướng dẫn của bác sĩ',
              }))
            : [
                {
                  productName: 'Theo đơn thuốc',
                  dosage: 'Theo chỉ định bác sĩ',
                  quantity: 1,
                  instructions: 'Theo hướng dẫn của bác sĩ',
                },
              ],
        // OCR metadata
        ocrRawText: ocrData?.rawText || undefined,
        ocrConfidence: ocrData?.confidence || undefined,
        ocrExtractionMethod: ocrData?._extraction_method || undefined,
        ocrQuality: ocrData?.quality || undefined,
      }

      const response = await prescriptionsAPI.submitPrescription(prescriptionData)

      if (response?.result) {
        setPrescriptionId(response.result._id)
        setPrescriptionNumber(response.result.prescriptionNumber)
        setCurrentStep(3)
        toast.success('Đơn thuốc đã được gửi thành công!')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: unknown) {
      console.error('Error submitting prescription:', error)

      // Handle specific errors
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number; data?: { message?: string } } }
        if (apiError.response?.status === 401) {
          setFormError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
          navigate('/login', { state: { from: '/upload-prescription' } })
        } else if (apiError.response?.data?.message) {
          setFormError(apiError.response.data.message)
          toast.error(apiError.response.data.message)
        } else {
          setFormError('Có lỗi xảy ra khi gửi đơn thuốc. Vui lòng thử lại.')
          toast.error('Có lỗi xảy ra khi gửi đơn thuốc. Vui lòng thử lại.')
        }
      } else {
        setFormError('Có lỗi xảy ra khi gửi đơn thuốc. Vui lòng thử lại.')
        toast.error('Có lỗi xảy ra khi gửi đơn thuốc. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    toast.success('Đã lưu nháp thành công')
    // TODO: Implement draft saving to localStorage or API
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Đang quét OCR → thay Step 1 bằng màn hình scanning
        if (isScanning) {
          const firstUrl = getUploadedImageUrls()[0]
          const stageLabels = ['', 'Phát hiện vùng chữ...', 'Đọc text Tiếng Việt...', 'Trích xuất thông tin...']
          const stageIcons = [
            null,
            <ScanLine key='1' className='w-5 h-5' />,
            <FileSearch key='2' className='w-5 h-5' />,
            <Brain key='3' className='w-5 h-5' />,
          ]
          const tips = [
            'Chụp ảnh rõ ràng, đủ ánh sáng để tăng độ chính xác.',
            'Hệ thống nhận diện đơn thuốc có thể có sai sót, vui lòng kiểm tra thông tin sau khi quét.',
            'Thông tin có thể không chính xác 100%, vui lòng kiểm tra lại trước khi gửi.',
          ]
          return (
            <div className='space-y-6'>
              {/* Header */}
              <div className='text-center'>
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-[#F0F6FF] border border-[#BFDBFE] rounded-full mb-4'>
                  <Loader2 className='w-4 h-4 text-[#1E40AF] animate-spin' />
                  <span className='text-sm font-medium text-[#0A2463]'>Đang phân tích đơn thuốc</span>
                </div>
                <h2 className='text-xl font-bold text-gray-800 mb-1'>Hệ thống nhận diện đơn thuốc đang làm việc...</h2>
                <p className='text-sm text-gray-500'>Vui lòng không đóng trang. Đơn viết tay hoặc ảnh khó đọc có thể mất thêm thời gian.</p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Image preview with scan line */}
                <div
                  className='relative rounded-2xl overflow-hidden border-2 border-[#BFDBFE] bg-gray-100'
                  style={{ minHeight: '200px' }}
                >
                  {firstUrl && <img src={firstUrl} alt='Đơn thuốc' className='w-full h-full object-contain' />}
                  {/* Animated scan line */}
                  <div
                    className='absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1E40AF] to-transparent'
                    style={{
                      top: `${(scanProgress / 100) * 100}%`,
                      transition: 'top 0.1s linear',
                      boxShadow: '0 0 12px 3px rgba(59,130,246,0.6)',
                    }}
                  />
                  {/* Blue tint overlay */}
                  <div className='absolute inset-0 bg-[#1E40AF]/5 pointer-events-none' />
                </div>

                {/* Pipeline & progress */}
                <div className='space-y-4'>
                  {/* Overall progress bar */}
                  <div>
                    <div className='flex justify-between text-xs text-gray-500 mb-1'>
                      <span>Tiến trình phân tích</span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className='h-2' />
                  </div>

                  {/* Pipeline stages */}
                  <div className='space-y-2'>
                    {[1, 2, 3].map((stage) => {
                      const isDone = scanStage > stage
                      const isActive = scanStage === stage
                      return (
                        <div
                          key={stage}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                            isDone
                              ? 'bg-emerald-50 border-emerald-200'
                              : isActive
                                ? 'bg-[#F0F6FF] border-[#BFDBFE] shadow-sm'
                                : 'bg-gray-50 border-gray-200 opacity-40'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-600'
                                : isActive
                                  ? 'bg-[#E8EDF5] text-[#1E40AF]'
                                  : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle className='w-5 h-5' />
                            ) : isActive ? (
                              <Loader2 className='w-5 h-5 animate-spin' />
                            ) : (
                              stageIcons[stage]
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p
                              className={`text-xs font-medium ${
                                isDone ? 'text-emerald-700' : isActive ? 'text-[#0A2463]' : 'text-gray-400'
                              }`}
                            >
                              Trạm {stage}:{' '}
                              {isDone ? '✓ Hoàn thành' : isActive ? stageLabels[stage] : stageLabels[stage]}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Tip box */}
                  <div className='bg-amber-50 border border-amber-200 rounded-xl p-3'>
                    <p className='text-xs text-amber-700'>
                      💡 <strong>Mẹo:</strong> {tips[(scanStage - 1) % tips.length] || tips[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // Bình thường — hiện ImageUploader
        return (
          <div className='space-y-6'>
            <UniversalBreadcrumb items={breadcrumbItems} />

            {/* Login reminder */}
            {!isAuthenticated && (
              <Alert className='border-amber-200 bg-amber-50'>
                <AlertDescription className='text-amber-800 flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0' />
                  <span>Bạn cần</span>
                  <Button
                    variant='link'
                    className='p-0 h-auto text-amber-800 underline font-medium hover:text-amber-900'
                    onClick={() => navigate('/login', { state: { from: '/upload-prescription' } })}
                  >
                    đăng nhập
                  </Button>
                  <span>để gửi đơn thuốc.</span>
                </AlertDescription>
              </Alert>
            )}

            <div data-testid='prescription-upload-widget'>
              <ImageUploader
                onImagesChange={handleImagesChange}
                maxFiles={5}
                maxSize={10}
                initialImages={uploadedImages}
                uploadToServer={true}
                uploadPurpose='prescription'
              />
            </div>

            {formError && (
              <p className='text-sm text-red-600' data-testid='form-error'>
                {formError}
              </p>
            )}

            <div className='flex justify-end space-x-3'>
              <Button
                onClick={handleNextStep}
                disabled={uploadedImages.length === 0 || uploadedImages.some((img) => img.isUploading)}
                data-testid='submit-prescription-btn'
                className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#1E40AF]'
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className='space-y-6'>
            <UploadedPrescriptionPreview
              images={uploadedImages}
              selectedIndex={selectedImageIndex}
              onSelect={setSelectedImageIndex}
              onBackToUpload={() => setCurrentStep(1)}
              className='lg:hidden'
            />
            {/* OCR scanning spinner */}
            {isScanning && (
              <div className='flex items-center gap-3 p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-xl'>
                <Loader2 className='w-5 h-5 text-[#1E40AF] animate-spin shrink-0' />
                <div>
                  <p className='text-sm font-medium text-blue-800'>Đang quét đơn thuốc bằng AI...</p>
                  <p className='text-xs text-[#1E40AF]'>AI đang đọc ảnh, đơn viết tay có thể mất thêm thời gian</p>
                </div>
              </div>
            )}

            <PrescriptionForm
              onSubmit={handleFormSubmit}
              onSaveDraft={handleSaveDraft}
              initialData={ocrData || undefined}
            />

            <div className='flex justify-between'>
              <Button
                variant='outline'
                onClick={handlePrevStep}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
                disabled={isSubmitting || isScanning}
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Quay lại
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className='max-w-2xl mx-auto'>
            <Card className='bg-white/80 backdrop-blur-lg shadow-xl rounded-3xl border border-emerald-100 overflow-hidden'>
              <div className='bg-gradient-to-b from-emerald-50 to-white pt-10 pb-6 text-center border-b border-emerald-100/50'>
                <div className='w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50'>
                  <CheckCircle className='w-10 h-10 text-emerald-600' />
                </div>
                <h2 className='text-2xl font-bold mb-2 text-emerald-900'>ĐÃ GỬI ĐƠN THUỐC THÀNH CÔNG</h2>
                <p className='text-emerald-700'>🎉 Cảm ơn bạn đã tin tưởng MEDISPACE!</p>
              </div>

              <CardContent className='p-6 md:p-8 flex flex-col gap-8'>
                
                {/* Info Block */}
                <div className='bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 text-sm'>
                  <div className='flex justify-between items-center pb-4 border-b border-gray-50'>
                    <span className='text-gray-500 font-medium'>Mã đơn thuốc:</span>
                    <div 
                      className='bg-[#F0F6FF] text-[#0A2463] hover:bg-[#E8EDF5] transition-colors px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-mono font-medium border border-[#E8EDF5] active:scale-95'
                      onClick={() => {
                        navigator.clipboard.writeText(prescriptionNumber || prescriptionId || '')
                        toast.success('Đã copy mã đơn thuốc')
                      }}
                    >
                      #{prescriptionNumber || prescriptionId}
                      <Copy className='w-3.5 h-3.5 text-blue-500' />
                    </div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-500 font-medium'>Thời gian gửi:</span>
                    <span className='text-gray-900 font-medium'>{new Date().toLocaleString('vi-VN')}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-500 font-medium'>Số lượng ảnh:</span>
                    <span className='text-gray-900 font-medium'>{getUploadedImageUrls().length} ảnh đính kèm</span>
                  </div>
                </div>

                {/* Next Steps Timeline */}
                <div className='bg-[#F0F6FF]/50 border border-[#E8EDF5]/50 rounded-2xl p-5'>
                  <h3 className='text-xs font-bold text-blue-800 uppercase tracking-wider mb-5 flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    Các bước tiếp theo
                  </h3>
                  
                  <div className='space-y-0'>
                    {/* Item 1 */}
                    <div className='flex gap-4'>
                      <div className='flex flex-col items-center mt-0.5'>
                        <div className='w-8 h-8 rounded-full bg-[#E8EDF5] text-[#1E40AF] flex items-center justify-center shrink-0 z-10'>
                          <UserCheck className='w-4 h-4' />
                        </div>
                        <div className='w-0.5 h-12 bg-[#BFDBFE] my-1 rounded-full'></div>
                      </div>
                      <div className='pb-4'>
                        <h4 className='text-sm font-semibold text-gray-900'>Dược sĩ đang xem xét</h4>
                        <p className='text-sm text-gray-600 mt-1 leading-relaxed'>Chúng tôi sẽ kiểm tra và phản hồi trong vòng <span className='font-medium text-[#0A2463] bg-[#E8EDF5] px-1.5 py-0.5 rounded'>2-4 giờ</span> (giờ hành chính).</p>
                      </div>
                    </div>
                    
                    {/* Item 2 */}
                    <div className='flex gap-4'>
                      <div className='flex flex-col items-center mt-0.5'>
                        <div className='w-8 h-8 rounded-full bg-[#E8EDF5] text-[#1E40AF] flex items-center justify-center shrink-0 z-10'>
                          <Bell className='w-4 h-4' />
                        </div>
                      </div>
                      <div>
                        <h4 className='text-sm font-semibold text-gray-900'>Nhận thông báo kết quả</h4>
                        <div className='text-sm text-gray-600 mt-2 flex flex-wrap items-center gap-2'>
                          <Badge variant='secondary' className='bg-white font-normal hover:bg-white text-gray-700 border-gray-200 shadow-sm'><Mail className='w-3 h-3 mr-1.5 text-gray-400' /> Email</Badge>
                          <Badge variant='secondary' className='bg-white font-normal hover:bg-white text-gray-700 border-gray-200 shadow-sm'><Bell className='w-3 h-3 mr-1.5 text-gray-400' /> Tài khoản</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className='pt-2'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-5'>
                    <Button
                      className='w-full h-12 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#1E40AF] text-white shadow-md border-0 rounded-xl text-base'
                      onClick={() => navigate('/account/prescriptions')}
                    >
                      <ClipboardList className='w-5 h-5 mr-2' />
                      Theo dõi đơn thuốc
                    </Button>

                    <Button
                      variant='outline'
                      className='w-full h-12 border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF] rounded-xl text-base shadow-sm'
                      onClick={() => navigate('/products')}
                    >
                      <ShoppingBag className='w-5 h-5 mr-2' />
                      Tiếp tục mua sắm
                    </Button>
                  </div>
                  
                  <div className='flex items-center justify-center text-sm pt-4 border-t border-gray-100/80'>
                    <Button
                      variant='ghost'
                      className='text-gray-500 hover:text-gray-900'
                      onClick={() => navigate('/')}
                    >
                      <Home className='w-4 h-4 mr-2' />
                      Về trang chủ
                    </Button>
                    <span className='text-gray-300 mx-1'>|</span>
                    <Button
                      variant='ghost'
                      className='text-gray-500 hover:text-[#1E40AF]'
                      onClick={() => {
                        setCurrentStep(1)
                        setUploadedImages([])
                        setSelectedImageIndex(0)
                        setPrescriptionId(null)
                        setPrescriptionNumber(null)
                      }}
                    >
                      <PlusCircle className='w-4 h-4 mr-2' />
                      Gửi đơn khác
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-2xl text-blue-900 mb-2'>Upload đơn thuốc</h1>
        <ProgressStepper steps={uploadSteps} currentStep={currentStep} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-3'>{renderStepContent()}</div>

        {/* Sidebar */}
        {currentStep < 3 && (
          <div className='space-y-6'>
            {currentStep === 2 && (
              <UploadedPrescriptionPreview
                images={uploadedImages}
                selectedIndex={selectedImageIndex}
                onSelect={setSelectedImageIndex}
                onBackToUpload={() => setCurrentStep(1)}
                className='hidden lg:block lg:sticky lg:top-24'
              />
            )}

            {/* Product Info */}
            {product && (
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
                <CardHeader>
                  <CardTitle className='text-blue-800'>Sản phẩm liên quan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-3'>
                    <img
                      src={
                        (product as Product).images?.[0] ||
                        (product as Product).featuredImage ||
                        '/placeholder-product.jpg'
                      }
                      alt={(product as Product).name}
                      className='w-16 h-16 object-cover rounded border border-gray-200'
                    />
                    <div className='flex-1'>
                      <h3 className='font-medium line-clamp-2'>{(product as Product).name}</h3>
                      <p className='text-sm text-gray-500'>{(product as Product).brand?.name || 'Unknown Brand'}</p>
                      {(product as Product).requiresPrescription && (
                        <Badge variant='destructive' className='mt-1 text-xs'>
                          Kê đơn
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guidelines */}
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <div className='p-4'>
                <h3 className='mb-3 text-blue-900 flex items-center text-sm font-bold'>📋 HƯỚNG DẪN CHỤP ẢNH TỐT</h3>

                <div className='space-y-3 text-xs'>
                  <div className='space-y-1.5'>
                    <div className='flex items-start text-emerald-600'>
                      <Check className='w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0' />
                      <span>Ảnh rõ nét, đủ sáng, không bị mờ</span>
                    </div>
                    <div className='flex items-start text-emerald-600'>
                      <Check className='w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0' />
                      <span>Chụp toàn bộ đơn thuốc, không bị cắt</span>
                    </div>
                    <div className='flex items-start text-emerald-600'>
                      <Check className='w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0' />
                      <span>Đặt ngang trên nền phẳng, tránh bóng</span>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <div className='flex items-start text-red-500'>
                      <X className='w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0' />
                      <span>Không chụp nghiêng hay bị che khuất</span>
                    </div>
                    <div className='flex items-start text-red-500'>
                      <X className='w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0' />
                      <span>Không chụp trong điều kiện thiếu sáng</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Process Timeline */}

            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Quy trình xử lý</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= 1 ? 'bg-[#0A2463] text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      <Upload className='w-4 h-4' />
                    </div>
                    <div className='text-sm'>
                      <p className='font-medium'>Upload đơn thuốc</p>
                      <p className='text-gray-600'>Gửi ảnh đơn thuốc rõ ràng</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= 2 ? 'bg-[#0A2463] text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      <UserCheck className='w-4 h-4' />
                    </div>
                    <div className='text-sm'>
                      <p className='font-medium'>Dược sĩ xem xét</p>
                      <p className='text-gray-600'>Xác minh tính hợp lệ</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= 3 ? 'bg-[#0A2463] text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      <Package className='w-4 h-4' />
                    </div>
                    <div className='text-sm'>
                      <p className='font-medium'>Tạo đơn hàng</p>
                      <p className='text-gray-600'>Dược sĩ tạo đơn hàng</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      <CheckCircle className='w-4 h-4' />
                    </div>
                    <div className='text-sm'>
                      <p className='font-medium'>Hoàn thành</p>
                      <p className='text-gray-600'>Nhận thông báo kết quả</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Info */}
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
              <CardContent className='p-4'>
                <Alert className='border-[#BFDBFE] bg-[#F0F6FF]'>
                  <AlertDescription>
                    <div className='space-y-2'>
                      <p className='font-medium text-blue-900'>Cần hỗ trợ?</p>
                      <p className='text-sm text-blue-800'>
                        Liên hệ hotline: <span className='font-medium text-[#1E40AF]'>1800 6928</span>
                      </p>
                      <p className='text-sm text-blue-800'>Hoặc chat trực tiếp với dược sĩ</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
