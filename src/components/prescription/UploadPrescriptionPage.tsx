import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle, ArrowLeft, Clock, UserCheck, Package, Upload } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { ImageUploader, type UploadedImage } from '../forms/ImageUploader'
import { PrescriptionForm } from '../forms/PrescriptionForm'
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

  // Find product if specified - TODO: Replace with real API call
  const product: Product | null = null

  const breadcrumbItems = [
    ...(product ? [{ label: (product as Product).name, href: `/products/${(product as Product).slug}` }] : []),
    { label: 'Upload đơn thuốc' },
  ]

  // Get S3 URLs of successfully uploaded images
  const getUploadedImageUrls = (): string[] => {
    return uploadedImages
      .filter(img => img.isUploaded && img.url.startsWith('http'))
      .map(img => img.url)
  }

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      const uploadedUrls = getUploadedImageUrls()
      if (uploadedUrls.length === 0) {
        toast.error('Vui lòng tải lên ít nhất một ảnh đơn thuốc')
        return
      }

      // Check if any images are still uploading
      const stillUploading = uploadedImages.some(img => img.isUploading)
      if (stillUploading) {
        toast.error('Vui lòng đợi ảnh tải lên hoàn tất')
        return
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

  const handleFormSubmit = async (formData: {
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
  }) => {
    // Check authentication
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
      // Prepare data for API - matching backend UploadPrescriptionReqBody
      const prescriptionData = {
        doctorName: formData.doctorName,
        hospitalName: formData.hospitalName,
        prescriptionDate: formData.examinationDate
          ? formData.examinationDate.toISOString()
          : new Date().toISOString(),
        images: imageUrls,
        medications: [
          {
            productName: formData.diagnosis || 'Theo đơn thuốc',
            dosage: 'Theo chỉ định bác sĩ',
            quantity: 1,
            instructions: formData.specialNotes || 'Theo hướng dẫn của bác sĩ'
          }
        ],
      }

      // Call the actual API
      const response = await prescriptionsAPI.submitPrescription(prescriptionData)

      if (response?.result) {
        setPrescriptionId(response.result._id)
        setPrescriptionNumber(response.result.prescriptionNumber)
        setCurrentStep(3)
        toast.success('Đơn thuốc đã được gửi thành công!')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error submitting prescription:', error)

      // Handle specific errors
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
        navigate('/login', { state: { from: '/upload-prescription' } })
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
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
        return (
          <div className='space-y-6'>
            <UniversalBreadcrumb items={breadcrumbItems} />

            {/* Login reminder */}
            {!isAuthenticated && (
              <Alert className='border-amber-200 bg-amber-50'>
                <AlertDescription className='text-amber-800'>
                  ⚠️ Bạn cần <Button variant="link" className="p-0 h-auto text-amber-800 underline" onClick={() => navigate('/login', { state: { from: '/upload-prescription' } })}>đăng nhập</Button> để gửi đơn thuốc.
                </AlertDescription>
              </Alert>
            )}

            <ImageUploader
              onImagesChange={handleImagesChange}
              maxFiles={5}
              maxSize={10}
              uploadToServer={true}
            />

            <div className='flex justify-end space-x-3'>
              <Button
                onClick={handleNextStep}
                disabled={uploadedImages.length === 0 || uploadedImages.some(img => img.isUploading)}
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
            {/* Show uploaded images summary */}
            <Card className='bg-emerald-50 border-emerald-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5 text-emerald-600' />
                  <span className='text-emerald-800'>
                    Đã tải lên {getUploadedImageUrls().length} ảnh đơn thuốc
                  </span>
                </div>
              </CardContent>
            </Card>

            <PrescriptionForm
              onSubmit={handleFormSubmit}
              onSaveDraft={handleSaveDraft}
              // @ts-ignore - PrescriptionForm needs to be updated to accept isSubmitting
              isSubmitting={isSubmitting}
            />

            <div className='flex justify-between'>
              <Button
                variant='outline'
                onClick={handlePrevStep}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
                disabled={isSubmitting}
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
                      src={(product as Product).images?.[0] || (product as Product).featuredImage || '/placeholder-product.jpg'}
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
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
                <Alert>
                  <AlertDescription>
                    <div className='space-y-2'>
                      <p className='font-medium'>Cần hỗ trợ?</p>
                      <p className='text-sm'>
                        Liên hệ hotline: <span className='font-medium text-blue-600'>1800 6928</span>
                      </p>
                      <p className='text-sm'>Hoặc chat trực tiếp với dược sĩ</p>
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
