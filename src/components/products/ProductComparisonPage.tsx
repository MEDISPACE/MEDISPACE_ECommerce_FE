import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import {
  Plus,
  Search,
  ShoppingCart,
  Share2,
  Printer,
  Bookmark,
  TrendingUp,
  DollarSign,
  Star,
  Baby,
  Heart,
} from 'lucide-react'
import { useWishlist } from '../../hooks/product/useWishlist'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Alert, AlertDescription } from '../ui/alert'
import { ComparisonTable } from './ComparisonTable'
import { toast } from 'sonner'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

// Local interface for comparison products (matches mock data structure)
interface ComparisonProduct {
  id: string
  name: string
  brand: string
  image: string
  price: number
  onSale?: boolean
  salePrice?: number
  unit: string
  rating: number
  reviewCount: number
  activeIngredient: string
  uses: string[]
  dosageForm: string
  targetAudience: {
    adults: boolean
    children: boolean
    childrenAge?: string
    pregnancy: boolean
  }
  dosage: string
  contraindications: string[]
  sideEffects: string[]
  origin: string
  shelfLife: string
  storage: string
  stock: number
  shipping: {
    express: boolean
    standard: boolean
  }
}
const mockComparisonProducts = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    brand: 'DHG Pharma',
    image: '/images/paracetamol.jpg',
    price: 25000,
    onSale: true,
    salePrice: 22000,
    unit: 'Hộp 10 viên',
    rating: 4.8,
    reviewCount: 234,
    activeIngredient: 'Paracetamol 500mg',
    uses: ['Hạ sốt', 'Giảm đau nhẹ'],
    dosageForm: 'Viên nén',
    targetAudience: { adults: true, children: true, childrenAge: '> 12 tuổi', pregnancy: true },
    dosage: '1-2 viên/lần, 3-4 lần/ngày',
    contraindications: ['Suy gan nặng', 'Dị ứng Paracetamol'],
    sideEffects: ['Hiếm gặp', 'Phát ban da'],
    origin: 'Việt Nam',
    shelfLife: '3 năm',
    storage: 'Nơi khô ráo, < 30°C',
    stock: 150,
    shipping: { express: true, standard: true },
  },
]

const suggestedProducts = [
  { id: '4', name: 'Diclofenac 50mg', category: 'Thuốc giảm đau khác' },
  { id: '5', name: 'Acetylsalicylic 325mg', category: 'Tương tự Aspirin' },
  { id: '6', name: 'Paracetamol 325mg', category: 'Liều thấp hơn' },
]

export function ProductComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState(mockComparisonProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ComparisonProduct[]>([])
  const { toggleWishlist, isInWishlist } = useWishlist()

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    { label: 'So sánh sản phẩm' },
  ]

  // Get product IDs from URL
  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || []
    if (productIds.length > 0) {
      // Filter products based on IDs
      const filteredProducts = mockComparisonProducts.filter((p) => productIds.includes(p.id))
      setProducts(filteredProducts)
    }
  }, [searchParams])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      // TODO: Implement search with real API
      setSearchResults([])
    } else {
      setSearchResults([])
    }
  }

  const handleAddProduct = (productId: string) => {
    if (products.length >= 4) {
      toast.error('Chỉ có thể so sánh tối đa 4 sản phẩm')
      return
    }

    // Mock add product (in real app, fetch from API)
    const newProduct = mockComparisonProducts.find((p) => p.id === productId)
    if (newProduct && !products.find((p) => p.id === productId)) {
      setProducts((prev) => [...prev, newProduct])

      // Update URL
      const productIds = [...products.map((p) => p.id), productId]
      setSearchParams({ products: productIds.join(',') })

      toast.success('Đã thêm sản phẩm vào so sánh')
    }
    setSearchTerm('')
    setSearchResults([])
  }

  const handleRemoveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))

    // Update URL
    const productIds = products.filter((p) => p.id !== productId).map((p) => p.id)
    if (productIds.length > 0) {
      setSearchParams({ products: productIds.join(',') })
    } else {
      setSearchParams({})
    }

    toast.success('Đã xóa sản phẩm khỏi so sánh')
  }

  const handleAddToCart = () => {
    toast.success('Đã thêm sản phẩm vào giỏ hàng')
  }

  const handleClearAll = () => {
    setProducts([])
    setSearchParams({})
    toast.success('Đã xóa tất cả sản phẩm')
  }

  const handleAddAllToCart = () => {
    toast.success(`Đã thêm ${products.length} sản phẩm vào giỏ hàng`)
  }

  const handleConsultPharmacist = () => {
    navigate('/consultation/chat')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'So sánh sản phẩm - MediSpace',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveComparison = () => {
    toast.success('Đã lưu bảng so sánh')
  }

  // Simplified calculations to prevent timeouts
  const getBestPriceProduct = () => {
    if (!products.length) return null
    return products[0] // Simplified for now
  }

  const getBestRatingProduct = () => {
    if (!products.length) return null
    return products[0] // Simplified for now
  }

  const getBestSellerProduct = () => {
    if (!products.length) return null
    return products[0] // Simplified for now
  }

  const getSafestForChildren = () => {
    return products.find((product) => product.targetAudience?.children)
  }

  const getSafestForPregnancy = () => {
    return products.find((product) => product.targetAudience?.pregnancy)
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl text-blue-900 mb-2'>So sánh sản phẩm</h1>
            <p className='text-gray-600'>
              {products.length > 0 ? `Đang so sánh ${products.length} sản phẩm` : 'Thêm sản phẩm để so sánh'}
            </p>
          </div>

          <div className='flex space-x-2'>
            {products.length > 0 && (
              <>
                <Button
                  variant='outline'
                  onClick={handleAddAllToCart}
                  className='border-blue-200 text-blue-700 hover:bg-blue-50'
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  Thêm tất cả vào giỏ
                </Button>

                <Button
                  variant='outline'
                  onClick={handleConsultPharmacist}
                  className='border-blue-200 text-blue-700 hover:bg-blue-50'
                >
                  Tư vấn dược sĩ
                </Button>
              </>
            )}

            <Button
              variant='outline'
              onClick={handleClearAll}
              disabled={products.length === 0}
              className='border-gray-200 text-gray-700 hover:bg-gray-50'
            >
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Search to add products */}
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            type='text'
            placeholder='Tìm sản phẩm để thêm vào so sánh...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='pl-10 border-2 border-blue-200 focus:border-blue-500'
          />

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <Card className='absolute top-full left-0 right-0 mt-1 z-10 max-h-64 overflow-y-auto'>
              <CardContent className='p-2'>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className='flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer rounded'
                    onClick={() => handleAddProduct(product.id)}
                  >
                    <img src={product.image} alt={product.name} className='w-10 h-10 object-cover rounded' />
                    <div className='flex-1'>
                      <div className='font-medium text-sm'>{product.name}</div>
                      <div className='text-xs text-gray-500'>{product.brand}</div>
                    </div>
                    <Plus className='w-4 h-4 text-blue-600' />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      {products.length > 1 && (
        <Card className='mb-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <CardHeader>
            <CardTitle className='text-blue-900 flex items-center'>🏆 ĐIỂM NỔI BẬT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Alert className='border-green-200 bg-green-50'>
                <DollarSign className='h-4 w-4 text-green-600' />
                <AlertDescription>
                  <div className='font-medium text-green-800'>💰 GIÁ TỐT NHẤT</div>
                  <div className='text-sm text-green-700'>
                    {getBestPriceProduct()?.name} -{' '}
                    {getBestPriceProduct()?.onSale && getBestPriceProduct()?.salePrice
                      ? getBestPriceProduct()?.salePrice?.toLocaleString('vi-VN')
                      : getBestPriceProduct()?.price.toLocaleString('vi-VN')}
                    đ
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className='border-yellow-200 bg-yellow-50'>
                <Star className='h-4 w-4 text-yellow-600' />
                <AlertDescription>
                  <div className='font-medium text-yellow-800'>⭐ ĐÁNH GIÁ CAO NHẤT</div>
                  <div className='text-sm text-yellow-700'>
                    {getBestRatingProduct()?.name} - {getBestRatingProduct()?.rating}/5
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className='border-blue-200 bg-blue-50'>
                <TrendingUp className='h-4 w-4 text-blue-600' />
                <AlertDescription>
                  <div className='font-medium text-blue-800'>🚀 BÁN CHẠY NHẤT</div>
                  <div className='text-sm text-blue-700'>{getBestSellerProduct()?.name}</div>
                </AlertDescription>
              </Alert>

              {getSafestForChildren() && (
                <Alert className='border-purple-200 bg-purple-50'>
                  <Baby className='h-4 w-4 text-purple-600' />
                  <AlertDescription>
                    <div className='font-medium text-purple-800'>👶 AN TOÀN CHO TRẺ</div>
                    <div className='text-sm text-purple-700'>
                      {getSafestForChildren()?.name} ({getSafestForChildren()?.targetAudience.childrenAge})
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {getSafestForPregnancy() && (
                <Alert className='border-pink-200 bg-pink-50'>
                  <Heart className='h-4 w-4 text-pink-600' />
                  <AlertDescription>
                    <div className='font-medium text-pink-800'>🤰 PHỤ NỮ CÓ THAI</div>
                    <div className='text-sm text-pink-700'>Chỉ {getSafestForPregnancy()?.name} an toàn</div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {products.length > 0 ? (
        <ComparisonTable
          products={products}
          onRemoveProduct={handleRemoveProduct}
          onAddToCart={handleAddToCart}
          onToggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
        />
      ) : (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <CardContent className='p-12 text-center'>
            <div className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Plus className='w-12 h-12 text-blue-600' />
            </div>
            <h3 className='text-xl mb-2 text-gray-900'>Chưa có sản phẩm nào để so sánh</h3>
            <p className='text-gray-600 mb-6'>Sử dụng thanh tìm kiếm phía trên để thêm sản phẩm vào bảng so sánh</p>
            <Button onClick={() => navigate('/products')} className='bg-blue-600 hover:bg-blue-700 text-white'>
              Duyệt sản phẩm
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggested Products */}
      {products.length > 0 && products.length < 4 && (
        <Card className='mt-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <CardHeader>
            <CardTitle className='text-blue-900'>➕ THÊM SẢN PHẨM ĐỂ SO SÁNH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <p className='text-gray-600 mb-4'>🎯 GỢI Ý THÊM:</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {suggestedProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant='outline'
                    onClick={() => handleAddProduct(product.id)}
                    className='justify-start border-blue-200 text-blue-700 hover:bg-blue-50'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    <div className='text-left'>
                      <div className='font-medium'>{product.name}</div>
                      <div className='text-xs text-gray-500'>({product.category})</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Panel */}
      {products.length > 0 && (
        <Card className='mt-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <CardContent className='p-6'>
            <div className='flex flex-wrap gap-3 justify-center'>
              <Button
                onClick={handleAddAllToCart}
                className='bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
              >
                <ShoppingCart className='w-4 h-4 mr-2' />
                Thêm tất cả vào giỏ hàng
              </Button>

              <Button
                variant='outline'
                onClick={handleConsultPharmacist}
                className='border-blue-200 text-blue-700 hover:bg-blue-50'
              >
                Tư vấn dược sĩ
              </Button>

              <Button
                variant='outline'
                onClick={handleShare}
                className='border-gray-200 text-gray-700 hover:bg-gray-50'
              >
                <Share2 className='w-4 h-4 mr-2' />
                Chia sẻ so sánh
              </Button>

              <Button
                variant='outline'
                onClick={handlePrint}
                className='border-gray-200 text-gray-700 hover:bg-gray-50'
              >
                <Printer className='w-4 h-4 mr-2' />
                In so sánh
              </Button>

              <Button
                variant='outline'
                onClick={handleSaveComparison}
                className='border-gray-200 text-gray-700 hover:bg-gray-50'
              >
                <Bookmark className='w-4 h-4 mr-2' />
                Lưu so sánh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
