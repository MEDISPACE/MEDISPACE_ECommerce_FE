import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle, ArrowLeft, Clock, UserCheck, Package, Upload } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { ImageUploader } from '../forms/ImageUploader'
import { PrescriptionForm } from '../forms/PrescriptionForm'
import { ProgressStepper } from '../forms/ProgressStepper'
import { toast } from 'sonner'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import type { Product } from '../../types/product'

interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
}

const uploadSteps = [
  { id: 'upload', title: 'Upload ảnh', description: 'Tải lên đơn thuốc' },
  { id: 'info', title: 'Thông tin', description: 'Điền thông tin' },
  { id: 'complete', title: 'Hoàn thành', description: 'Kết quả' },
]

export function UploadPrescriptionPage() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null)

  // Find product if specified - TODO: Replace with real API call
  const product: Product | null = null // productSlug ? mockProducts.find((p: Product) => p.slug === productSlug) : null

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    ...(product ? [{ label: (product as Product).name, href: `/products/${(product as Product).slug}` }] : []),
    { label: 'Upload đơn thuốc' },
  ]

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && uploadedImages.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một ảnh đơn thuốc')
      return
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

  const handleFormSubmit = async () => {
    try {
      // Quick simulation
      setTimeout(() => {
        const newPrescriptionId = 'DT' + Math.random().toString().substr(2, 6)
        setPrescriptionId(newPrescriptionId)
        setCurrentStep(3)
        toast.success('Đơn thuốc đã được gửi thành công!')
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleSaveDraft = () => {
    toast.success('Đã lưu nháp thành công')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='space-y-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
            <ImageUploader onImagesChange={handleImagesChange} maxFiles={5} maxSize={10} />

            <div className='flex justify-end space-x-3'>
              <Button
                onClick={handleNextStep}
                disabled={uploadedImages.length === 0}
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
            <PrescriptionForm onSubmit={handleFormSubmit} onSaveDraft={handleSaveDraft} />

            <div className='flex justify-between'>
              <Button
                variant='outline'
                onClick={handlePrevStep}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
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
                      #{prescriptionId}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>⏰ Thời gian gửi:</span>
                    <span>{new Date().toLocaleString('vi-VN')}</span>
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
                  <div>• Tin nhắn SMS: 0901***567</div>
                  <div>• Email: cust***@email.com</div>
                  <div>• Thông báo trong app</div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Button
                  variant='outline'
                  className='border-blue-200 text-blue-700 hover:bg-blue-50'
                  onClick={() => navigate('/consultation/chat')}
                >
                  💬 Chat với dược sĩ
                </Button>

                <Button
                  variant='outline'
                  className='border-blue-200 text-blue-700 hover:bg-blue-50'
                  onClick={() => navigate(`/account/prescriptions`)}
                >
                  📋 Xem đơn thuốc
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
