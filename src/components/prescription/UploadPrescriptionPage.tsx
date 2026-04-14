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
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
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

export function UploadPrescriptionPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null)
  const [prescriptionNumber, setPrescriptionNumber] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      } else if (elapsed < 17) {
        setScanStage(2)
        setScanProgress(Math.min(80, 30 + ((elapsed - 5) / 12) * 50))
      } else {
        setScanStage(3)
        setScanProgress(Math.min(99, 80 + ((elapsed - 17) / 1) * 19))
      }
    }, 100)
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
        toast.error('Vui lòng tải lên ít nhất một ảnh đơn thuốc')
        return
      }
      const stillUploading = uploadedImages.some((img) => img.isUploading)
      if (stillUploading) {
        toast.error('Vui lòng đợi ảnh tải lên hoàn tất')
        return
      }

      // ★ Tự động quét OCR sau khi upload ảnh
      setIsScanning(true)
      startScanProgress()
      try {
        const firstImageUrl = uploadedUrls[0]
        const scanResult = await prescriptionsAPI.scanPrescription(firstImageUrl)
        if (scanResult?.data) {
          setOcrData({
            ...scanResult.data,
            rawText: scanResult.rawText,
            confidence: scanResult.data.confidence,
            // Chuẩn hóa null → string cho MedicationItem
            medications: (scanResult.data.medications || []).map((m) => ({
              productName: m.productName || '',
              dosage: m.dosage || '',
              quantity: m.quantity,
              unit: m.unit,
              instructions: m.instructions || '',
            })),
          })
        }
      } catch (err) {
        console.warn('OCR scan failed, user will fill manually:', err)
        toast.warning('Không thể quét tự động. Vui lòng nhập thông tin thủ công.')
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
      toast.error('Vui lòng đăng nhập để gửi đơn thuốc')
      navigate('/login', { state: { from: '/upload-prescription' } })
      return
    }

    const imageUrls = getUploadedImageUrls()
    if (imageUrls.length === 0) {
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
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
          navigate('/login', { state: { from: '/upload-prescription' } })
        } else if (apiError.response?.data?.message) {
          toast.error(apiError.response.data.message)
        } else {
          toast.error('Có lỗi xảy ra khi gửi đơn thuốc. Vui lòng thử lại.')
        }
      } else {
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
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-4'>
                  <Loader2 className='w-4 h-4 text-blue-600 animate-spin' />
                  <span className='text-sm font-medium text-blue-700'>Đang phân tích đơn thuốc</span>
                </div>
                <h2 className='text-xl font-bold text-gray-800 mb-1'>Hệ thống nhận diện đơn thuốc đang làm việc...</h2>
                <p className='text-sm text-gray-500'>Vui lòng không đóng trang. Thường mất khoảng 15-20 giây.</p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Image preview with scan line */}
                <div
                  className='relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-gray-100'
                  style={{ minHeight: '200px' }}
                >
                  {firstUrl && <img src={firstUrl} alt='Đơn thuốc' className='w-full h-full object-contain' />}
                  {/* Animated scan line */}
                  <div
                    className='absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent'
                    style={{
                      top: `${(scanProgress / 100) * 100}%`,
                      transition: 'top 0.1s linear',
                      boxShadow: '0 0 12px 3px rgba(59,130,246,0.6)',
                    }}
                  />
                  {/* Blue tint overlay */}
                  <div className='absolute inset-0 bg-blue-500/5 pointer-events-none' />
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
                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                : 'bg-gray-50 border-gray-200 opacity-40'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-600'
                                : isActive
                                  ? 'bg-blue-100 text-blue-600'
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
                                isDone ? 'text-emerald-700' : isActive ? 'text-blue-700' : 'text-gray-400'
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

            <ImageUploader onImagesChange={handleImagesChange} maxFiles={5} maxSize={10} uploadToServer={true} />

            <div className='flex justify-end space-x-3'>
              <Button
                onClick={handleNextStep}
                disabled={uploadedImages.length === 0 || uploadedImages.some((img) => img.isUploading)}
                className='bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className='space-y-6'>
            {/* Uploaded images summary */}
            <Card className='bg-emerald-50 border-emerald-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5 text-emerald-600' />
                  <span className='text-emerald-800'>Đã tải lên {getUploadedImageUrls().length} ảnh đơn thuốc</span>
                </div>
              </CardContent>
            </Card>

            {/* OCR scanning spinner */}
            {isScanning && (
              <div className='flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl'>
                <Loader2 className='w-5 h-5 text-blue-600 animate-spin shrink-0' />
                <div>
                  <p className='text-sm font-medium text-blue-800'>Đang quét đơn thuốc bằng AI...</p>
                  <p className='text-xs text-blue-600'>Hệ thống sẽ tự điền thông tin sau vài giây</p>
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
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardContent className='p-8 text-center'>
              <div className='mb-6'>
                <div className='w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <CheckCircle className='w-10 h-10 text-emerald-600' />
                </div>

                <h2 className='text-2xl mb-2 text-emerald-900'>✅ ĐÃ GỬI ĐƠN THUỐC THÀNH CÔNG</h2>

                <p className='text-lg text-emerald-700 mb-6'>🎉 Cảm ơn bạn đã gửi đơn thuốc!</p>
              </div>

              <div className='bg-blue-50 rounded-lg p-6 mb-6'>
                <div className='space-y-3 text-left'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>📋 Mã đơn thuốc:</span>
                    <Badge variant='default' className='bg-blue-600'>
                      #{prescriptionNumber || prescriptionId}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>⏰ Thời gian gửi:</span>
                    <span>{new Date().toLocaleString('vi-VN')}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>📸 Số ảnh:</span>
                    <span>{getUploadedImageUrls().length} ảnh</span>
                  </div>
                </div>
              </div>

              <Alert className='mb-6 border-blue-200 bg-blue-50'>
                <Clock className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-800'>
                  👨‍⚕️ Dược sĩ sẽ xem xét và phản hồi trong vòng 2-4 giờ (giờ hành chính)
                </AlertDescription>
              </Alert>

              <div className='bg-gray-50 rounded-lg p-4 mb-6'>
                <p className='text-sm text-gray-700 mb-2'>📱 Chúng tôi sẽ thông báo qua:</p>
                <div className='space-y-1 text-sm'>
                  <div>• Email: {user?.email || 'Email của bạn'}</div>
                  <div>• Thông báo trong tài khoản</div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Button
                  variant='outline'
                  className='border-blue-200 text-blue-700 hover:bg-blue-50'
                  onClick={() => navigate('/account/prescriptions')}
                >
                  📋 Xem đơn thuốc của tôi
                </Button>

                <Button
                  variant='outline'
                  className='border-gray-200 text-gray-700 hover:bg-gray-50'
                  onClick={() => navigate('/')}
                >
                  🏠 Về trang chủ
                </Button>

                <Button
                  variant='outline'
                  className='border-gray-200 text-gray-700 hover:bg-gray-50'
                  onClick={() => navigate('/products')}
                >
                  🛒 Tiếp tục mua sắm
                </Button>

                <Button
                  className='bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                  onClick={() => {
                    // Reset form for new upload
                    setCurrentStep(1)
                    setUploadedImages([])
                    setPrescriptionId(null)
                    setPrescriptionNumber(null)
                  }}
                >
                  ➕ Gửi đơn thuốc khác
                </Button>
              </div>
            </CardContent>
          </Card>
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
            {/* Product Info */}
            {product && (
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
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

            {/* Process Timeline */}
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Quy trình xử lý</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
                        currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
                        currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
              <CardContent className='p-4'>
                <Alert className='border-blue-200 bg-blue-50'>
                  <AlertDescription>
                    <div className='space-y-2'>
                      <p className='font-medium text-blue-900'>Cần hỗ trợ?</p>
                      <p className='text-sm text-blue-800'>
                        Liên hệ hotline: <span className='font-medium text-blue-600'>1800 6928</span>
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
