import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Shield,
  AlertTriangle,
  Package2,
  FileText,
  MapPin,
  Phone,
  Plus,
  Minus,
  Check,
  Eye,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ImageWithFallback } from '~/components/ui/ImageWithFallback'
import { toast } from 'sonner'
import '~/style/Products.css'

interface PharmaceuticalProduct {
  id: string
  name: string
  activeIngredient: string
  dosage: string
  dosageForm: string
  packaging: string
  manufacturer: string
  price: number
  originalPrice?: number
  image: string
  category: string
  inStock: boolean
  prescription: boolean
  registrationNumber?: string
  origin?: string
  expiryDate?: string
  discount?: number
  description?: string
  indications?: string[]
  contraindications?: string[]
  sideEffects?: string[]
  dosageInstructions?: string
  storage?: string
  warnings?: string[]
}

// Mock data - sau này sẽ fetch từ API
const mockProducts: PharmaceuticalProduct[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    dosage: '500mg',
    dosageForm: 'Viên nén',
    packaging: '30 viên/hộp',
    manufacturer: 'Công ty Dược phẩm A',
    price: 25000,
    originalPrice: 30000,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
    category: 'Thuốc giảm đau',
    inStock: true,
    prescription: false,
    registrationNumber: 'VD-12345-16',
    origin: 'Việt Nam',
    expiryDate: '2026-12-31',
    discount: 17,
    description:
      'Thuốc giảm đau, hạ sốt hiệu quả và an toàn. Được sử dụng rộng rãi cho các trường hợp đau nhẹ đến vừa và sốt.',
    indications: ['Giảm đau nhẹ đến vừa', 'Hạ sốt', 'Đau đầu, đau răng', 'Đau cơ, đau khớp'],
    contraindications: ['Quá mẫn với paracetamol', 'Suy gan nặng', 'Nghiện rượu mạn tính'],
    sideEffects: ['Hiếm gặp: buồn nôn, nôn', 'Rất hiếm: phát ban da', 'Rối loạn chức năng gan khi dùng quá liều'],
    dosageInstructions: 'Người lớn: 1-2 viên/lần, 3-4 lần/ngày. Không vượt quá 8 viên/24h. Uống sau ăn.',
    storage: 'Bảo quản ở nhiệt độ dưới 30°C, nơi khô ráo, tránh ánh sáng trực tiếp.',
    warnings: ['Không dùng quá liều', 'Không dùng chung với rượu', 'Ngưng thuốc nếu có dấu hiệu dị ứng'],
  },
  {
    id: '2',
    name: 'Amoxicillin 500mg',
    activeIngredient: 'Amoxicillin',
    dosage: '500mg',
    dosageForm: 'Viên nang',
    packaging: '20 viên/hộp',
    manufacturer: 'Công ty Dược phẩm B',
    price: 45000,
    originalPrice: 50000,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    category: 'Kháng sinh',
    inStock: true,
    prescription: true,
    registrationNumber: 'VD-54321-18',
    origin: 'Việt Nam',
    expiryDate: '2025-08-15',
    discount: 10,
    description: 'Kháng sinh phổ rộng nhóm Penicillin, điều trị nhiễm khuẩn do vi khuẩn nhạy cảm.',
    indications: [
      'Nhiễm khuẩn đường hô hấp',
      'Nhiễm khuẩn đường tiết niệu',
      'Nhiễm khuẩn da và mô mềm',
      'Nhiễm khuẩn tai mũi họng',
    ],
    contraindications: ['Quá mẫn với Penicillin', 'Tiền sử dị ứng với beta-lactam', 'Mononucleosis nhiễm khuẩn'],
    sideEffects: ['Rối loạn tiêu hóa: tiêu chảy, buồn nôn', 'Phát ban da', 'Phản ứng dị ứng'],
    dosageInstructions: 'Người lớn: 500mg x 3 lần/ngày, uống trước bữa ăn 1 giờ. Điều trị 7-10 ngày.',
    storage: 'Bảo quản ở nhiệt độ phòng, tránh ẩm.',
    warnings: [
      'Chỉ dùng theo chỉ định của bác sĩ',
      'Hoàn thành toàn bộ liệu trình điều trị',
      'Ngưng thuốc nếu có dấu hiệu dị ứng',
    ],
  },
]

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<PharmaceuticalProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundProduct = mockProducts.find((p) => p.id === id)
      setProduct(foundProduct || null)
      setIsLoading(false)
    }, 800)
  }, [id])

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      setQuantity((prev) => prev + 1)
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = () => {
    if (!product?.inStock) {
      toast.error('Sản phẩm hiện tại hết hàng')
      return
    }
    toast.success(`Đã thêm ${quantity} ${product?.name} vào giỏ hàng`)
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Đã sao chép link sản phẩm')
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-blue-100/30'>
        <div className='container mx-auto px-4 py-8'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded-lg w-32 mb-6'></div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='h-96 bg-gray-200 rounded-2xl'></div>
              <div className='space-y-4'>
                <div className='h-8 bg-gray-200 rounded w-3/4'></div>
                <div className='h-6 bg-gray-200 rounded w-1/2'></div>
                <div className='h-12 bg-gray-200 rounded'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-blue-100/30 flex items-center justify-center'>
        <Card className='p-8 text-center'>
          <h2 className='text-2xl mb-4'>Không tìm thấy sản phẩm</h2>
          <Button onClick={() => navigate('/products')} className='bg-[#0066CC] hover:bg-[#4A90E2]'>
            Quay lại danh sách sản phẩm
          </Button>
        </Card>
      </div>
    )
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-blue-100/30'>
      <div className='container mx-auto px-4 py-8 max-w-[1440px]'>
        {/* Back Navigation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='mb-6'>
          <Button
            variant='ghost'
            onClick={() => navigate('/products')}
            className='hover:bg-white/60 backdrop-blur-sm border border-white/40'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại danh sách sản phẩm
          </Button>
        </motion.div>

        {/* Main Product Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className='relative'
          >
            <Card className='overflow-hidden backdrop-blur-md bg-white/90 border border-white/40 shadow-xl'>
              <CardContent className='p-0'>
                <div className='relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100'>
                  <ImageWithFallback src={product.image} alt={product.name} className='w-full h-full object-cover' />

                  {/* Prescription Badge */}
                  {product.prescription && (
                    <div className='absolute top-4 left-4'>
                      <Badge className='bg-amber-500/90 text-white backdrop-blur-sm'>
                        <FileText className='w-3 h-3 mr-1' />
                        Kê đơn
                      </Badge>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className='absolute top-4 right-4'>
                      <Badge className='bg-red-500 text-white'>-{discountPercentage}%</Badge>
                    </div>
                  )}

                  {/* Stock Status */}
                  {!product.inStock && (
                    <div className='absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center'>
                      <div className='bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 border border-white/40'>
                        <span className='text-gray-800 font-semibold'>Tạm hết hàng</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-6'
          >
            {/* Product Title & Basic Info */}
            <div>
              <h1 className='text-3xl font-bold text-foreground mb-2'>{product.name}</h1>
              <p className='text-muted-foreground mb-4'>{product.description}</p>

              <div className='flex flex-wrap gap-2 mb-4'>
                <Badge variant='outline' className='border-[#0066CC]/30 text-[#0066CC]'>
                  {product.category}
                </Badge>
                <Badge variant='outline' className='border-gray-300'>
                  {product.dosageForm} • {product.dosage}
                </Badge>
                <Badge variant='outline' className='border-gray-300'>
                  {product.packaging}
                </Badge>
              </div>
            </div>

            {/* Price Section */}
            <Card className='backdrop-blur-md bg-white/90 border border-white/40 shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='price-highlight text-3xl font-bold text-[#0066CC]'>
                    {product.price.toLocaleString('vi-VN')}₫
                  </div>
                  {product.originalPrice && (
                    <div className='text-lg text-muted-foreground line-through'>
                      {product.originalPrice.toLocaleString('vi-VN')}₫
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className='flex items-center gap-4 mb-6'>
                  <span className='text-sm font-medium text-foreground'>Số lượng:</span>
                  <div className='flex items-center border border-gray-200 rounded-lg'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                      className='h-8 w-8 p-0'
                    >
                      <Minus className='w-4 h-4' />
                    </Button>
                    <span className='px-4 py-1 min-w-[60px] text-center font-medium'>{quantity}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleQuantityChange('increase')}
                      className='h-8 w-8 p-0'
                    >
                      <Plus className='w-4 h-4' />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='grid grid-cols-2 gap-3'>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`${
                      product.inStock
                        ? 'bg-[#0066CC] hover:bg-[#4A90E2] text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-all duration-300`}
                  >
                    <ShoppingCart className='w-4 h-4 mr-2' />
                    {product.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                  </Button>

                  <div className='grid grid-cols-2 gap-2'>
                    <Button
                      variant='outline'
                      onClick={handleToggleFavorite}
                      className={`${
                        isFavorite ? 'bg-red-50 border-red-200 text-red-600' : ''
                      } hover:bg-red-50 border border-white/40`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>

                    <Button variant='outline' onClick={handleShare} className='hover:bg-blue-50 border border-white/40'>
                      <Share2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Product Info */}
            <Card className='backdrop-blur-md bg-white/90 border border-white/40 shadow-lg'>
              <CardContent className='p-6'>
                <h3 className='font-semibold text-foreground mb-4'>Thông tin cơ bản</h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Ho\u1ea1t ch\u1ea5t:</span>
                    <span className='font-medium'>{product.activeIngredient}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Nh\u00e0 s\u1ea3n xu\u1ea5t:</span>
                    <span className='font-medium'>{product.manufacturer}</span>
                  </div>
                  {product.origin && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Xuất xứ:</span>
                      <span className='font-medium'>{product.origin}</span>
                    </div>
                  )}
                  {product.registrationNumber && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Số đăng ký:</span>
                      <span className='font-medium'>{product.registrationNumber}</span>
                    </div>
                  )}
                  {product.expiryDate && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Hạn sử dụng:</span>
                      <span className='font-medium'>{new Date(product.expiryDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Information Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className='backdrop-blur-md bg-white/90 border border-white/40 shadow-xl'>
            <CardContent className='p-6'>
              <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                <TabsList className='grid w-full grid-cols-5 mb-6'>
                  <TabsTrigger value='overview'>Tổng quan</TabsTrigger>
                  <TabsTrigger value='indications'>Chỉ định</TabsTrigger>
                  <TabsTrigger value='dosage'>Liều dùng</TabsTrigger>
                  <TabsTrigger value='warnings'>Cảnh báo</TabsTrigger>
                  <TabsTrigger value='storage'>Bảo quản</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='space-y-4'>
                  <div className='prose max-w-none'>
                    <p className='text-muted-foreground leading-relaxed'>{product.description}</p>

                    {product.indications && product.indications.length > 0 && (
                      <div className='mt-6'>
                        <h4 className='font-semibold text-foreground mb-3'>Công dụng chính:</h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {product.indications.map((indication, index) => (
                            <div key={index} className='flex items-center gap-2'>
                              <Check className='w-4 h-4 text-green-600 flex-shrink-0' />
                              <span className='text-sm text-muted-foreground'>{indication}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value='indications' className='space-y-4'>
                  {product.indications && (
                    <div>
                      <h4 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                        <Check className='w-5 h-5 text-green-600' />
                        Chỉ định sử dụng
                      </h4>
                      <ul className='space-y-2'>
                        {product.indications.map((indication, index) => (
                          <li key={index} className='flex items-start gap-3'>
                            <div className='w-2 h-2 bg-[#0066CC] rounded-full mt-2 flex-shrink-0'></div>
                            <span className='text-muted-foreground'>{indication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.contraindications && (
                    <div className='mt-6'>
                      <h4 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5 text-red-600' />
                        Chống chỉ định
                      </h4>
                      <ul className='space-y-2'>
                        {product.contraindications.map((contraindication, index) => (
                          <li key={index} className='flex items-start gap-3'>
                            <div className='w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0'></div>
                            <span className='text-muted-foreground'>{contraindication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='dosage' className='space-y-4'>
                  {product.dosageInstructions && (
                    <div>
                      <h4 className='font-semibold text-foreground mb-4'>Cách dùng và liều dùng</h4>
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <p className='text-foreground'>{product.dosageInstructions}</p>
                      </div>
                    </div>
                  )}

                  {product.sideEffects && (
                    <div className='mt-6'>
                      <h4 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                        <Eye className='w-5 h-5 text-orange-600' />
                        Tác dụng phụ
                      </h4>
                      <ul className='space-y-2'>
                        {product.sideEffects.map((effect, index) => (
                          <li key={index} className='flex items-start gap-3'>
                            <div className='w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0'></div>
                            <span className='text-muted-foreground'>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='warnings' className='space-y-4'>
                  {product.warnings && (
                    <div>
                      <h4 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                        <Shield className='w-5 h-5 text-red-600' />
                        Cảnh báo quan trọng
                      </h4>
                      <div className='space-y-3'>
                        {product.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3'
                          >
                            <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                            <span className='text-foreground'>{warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.prescription && (
                    <div className='mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <FileText className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <p className='font-semibold text-amber-800 mb-1'>Thuốc kê đơn</p>
                          <p className='text-sm text-amber-700'>
                            Sản phẩm này yêu cầu có đơn thuốc của bác sĩ. Vui lòng tham khảo ý kiến chuyên gia y tế
                            trước khi sử dụng.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='storage' className='space-y-4'>
                  {product.storage && (
                    <div>
                      <h4 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                        <Package2 className='w-5 h-5 text-blue-600' />
                        Hướng dẫn bảo quản
                      </h4>
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <p className='text-foreground'>{product.storage}</p>
                      </div>
                    </div>
                  )}

                  <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <h5 className='font-semibold text-green-800 mb-2'>✓ Nên làm</h5>
                      <ul className='text-sm text-green-700 space-y-1'>
                        <li>• Để nơi khô ráo, thoáng mát</li>
                        <li>• Đậy kín nắp sau khi sử dụng</li>
                        <li>• Kiểm tra hạn sử dụng</li>
                      </ul>
                    </div>

                    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                      <h5 className='font-semibold text-red-800 mb-2'>✗ Không nên</h5>
                      <ul className='text-sm text-red-700 space-y-1'>
                        <li>• Để nơi có ánh sáng trực tiếp</li>
                        <li>• Bảo quản trong tủ lạnh (trừ khi có chỉ định)</li>
                        <li>• Để xa tầm tay trẻ em</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className='mt-8'
        >
          <Card className='backdrop-blur-md bg-gradient-to-r from-red-50/90 to-orange-50/90 border border-red-200/40 shadow-lg'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Phone className='w-5 h-5 text-red-600' />
                <h3 className='font-semibold text-red-800'>Hỗ trợ khẩn cấp</h3>
              </div>
              <p className='text-sm text-red-700 mb-3'>
                Nếu bạn gặp phản ứng bất thường sau khi sử dụng thuốc, hãy liên hệ ngay:
              </p>
              <div className='flex flex-wrap gap-4'>
                <Button variant='outline' className='border-red-300 text-red-700 hover:bg-red-100'>
                  <Phone className='w-4 h-4 mr-2' />
                  Hotline: 1900-xxxx
                </Button>
                <Button variant='outline' className='border-red-300 text-red-700 hover:bg-red-100'>
                  <MapPin className='w-4 h-4 mr-2' />
                  Tìm hiệu thuốc gần nhất
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
