import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import {
  Search,
  Pill,
  AlertTriangle,
  Info,
  BookOpen,
  Tag,
  ChevronRight,
  Package,
  ShoppingCart,
  Loader2,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Separator } from '../ui/separator'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import type { Product, Category } from '../../types/product'
import { getProductPrice, getProductOriginalPrice } from '../../utils/priceUtils'

export function DrugDatabasePage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) setSearchQuery(search)
  }, [searchParams])

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productsData, categoriesData] = await Promise.all([
          productService.getProducts({ limit: 1000 }),
          categoryService.getCategories(),
        ])
        setProducts(Array.isArray(productsData) ? productsData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.details?.activeIngredients || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || product.categoryId === categoryFilter || product.category?._id === categoryFilter
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'Rx' && product.requiresPrescription) ||
      (typeFilter === 'OTC' && !product.requiresPrescription)
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'inStock' && product.stockQuantity > 0) ||
      (stockFilter === 'outOfStock' && product.stockQuantity <= 0)

    return matchesSearch && matchesCategory && matchesType && matchesStock
  })

  // Get product price formatted
  const formatPrice = (product: Product) => {
    const price = getProductPrice(product)
    return price.toLocaleString('vi-VN') + 'đ'
  }

  // Get product unit
  const getUnit = (product: Product) => {
    const defaultVariant = product.priceVariants?.find((v) => v.isDefault) || product.priceVariants?.[0]
    return defaultVariant?.unit || product.unit || 'Đơn vị'
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <h1 className='text-2xl font-bold bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] bg-clip-text text-transparent'>
          Cơ sở dữ liệu thuốc
        </h1>
        <p className='text-gray-600 mt-1'>
          Tra cứu thông tin chi tiết về thuốc và sản phẩm y tế ({products.length} sản phẩm)
        </p>
      </div>

      {/* Search & Filters */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm theo tên thuốc, hoạt chất, thương hiệu...'
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-48 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
              <SelectValue placeholder='Danh mục' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-40 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
              <SelectValue placeholder='Loại thuốc' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='Rx'>Rx - Kê đơn</SelectItem>
              <SelectItem value='OTC'>OTC - Không kê đơn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className='w-36 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
              <SelectValue placeholder='Tồn kho' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='inStock'>Còn hàng</SelectItem>
              <SelectItem value='outOfStock'>Hết hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-12'>
          <div className='flex flex-col items-center justify-center'>
            <Loader2 className='w-12 h-12 text-[#1E40AF] animate-spin mb-4' />
            <p className='text-gray-600'>Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        /* Drug List */
        <div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredProducts.length === 0 ? (
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] md:col-span-2 lg:col-span-3 xl:col-span-4'>
              <CardContent className='p-12 text-center'>
                <Pill className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy sản phẩm</h3>
                <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.slice(0, 50).map((product) => (
              <Card
                key={product._id}
                className='bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border border-[#E8EDF5] hover:shadow-xl transition-all cursor-pointer'
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className='p-4'>
                  {/* Header with badges */}
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex gap-1'>
                      <Badge
                        className={
                          product.requiresPrescription
                            ? 'bg-red-500 text-white text-xs'
                            : 'bg-green-500 text-white text-xs'
                        }
                      >
                        {product.requiresPrescription ? 'Rx' : 'OTC'}
                      </Badge>
                      {product.stockQuantity <= 0 && <Badge className='bg-gray-500 text-white text-xs'>Hết hàng</Badge>}
                    </div>
                    {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                      <Badge className='bg-yellow-500 text-white text-xs'>Còn {product.stockQuantity}</Badge>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className='w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden'>
                    {product.featuredImage ? (
                      <img src={product.featuredImage} alt={product.name} className='w-full h-full object-contain' />
                    ) : (
                      <Pill className='w-10 h-10 text-gray-300' />
                    )}
                  </div>

                  {/* Name & Brand */}
                  <h3 className='font-medium text-gray-900 text-sm line-clamp-2 mb-1'>{product.name}</h3>
                  <p className='text-xs text-gray-500 mb-2'>{product.brand?.name || 'Không có thương hiệu'}</p>

                  {/* Active Ingredients */}
                  {product.details?.activeIngredients && (
                    <p className='text-xs text-[#1E40AF] mb-2 line-clamp-1'>
                      <Pill className='w-3 h-3 inline mr-1' />
                      {product.details.activeIngredients}
                    </p>
                  )}

                  <Separator className='my-2' />

                  {/* Price & Stock */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-[#1E40AF] font-semibold text-sm'>{formatPrice(product)}</p>
                      <p className='text-xs text-gray-500'>/ {getUnit(product)}</p>
                    </div>
                    <div className='flex items-center gap-1 text-xs'>
                      <Package className='w-3 h-3 text-gray-400' />
                      <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} trong kho` : 'Hết hàng'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Show more info */}
      {!loading && filteredProducts.length > 50 && (
        <p className='text-center text-gray-500 text-sm'>
          Hiển thị 50/{filteredProducts.length} sản phẩm. Sử dụng bộ lọc để thu hẹp kết quả.
        </p>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                <span>{selectedProduct.name}</span>
                <Badge
                  className={selectedProduct.requiresPrescription ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}
                >
                  {selectedProduct.requiresPrescription ? 'Rx - Kê đơn' : 'OTC'}
                </Badge>
                {selectedProduct.stockQuantity <= 0 && <Badge className='bg-gray-500 text-white'>Hết hàng</Badge>}
              </DialogTitle>
              <DialogDescription>{selectedProduct.brand?.name || 'Không có thương hiệu'}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue='info' className='space-y-4'>
              <TabsList className='grid w-full grid-cols-4 bg-[#F0F6FF]'>
                <TabsTrigger value='info' className='data-[state=active]:bg-white'>
                  Thông tin
                </TabsTrigger>
                <TabsTrigger value='usage' className='data-[state=active]:bg-white'>
                  Cách dùng
                </TabsTrigger>
                <TabsTrigger value='stock' className='data-[state=active]:bg-white'>
                  Tồn kho
                </TabsTrigger>
                <TabsTrigger value='pricing' className='data-[state=active]:bg-white'>
                  Giá bán
                </TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='space-y-4'>
                {/* Product Image */}
                <div className='flex gap-4'>
                  <div className='w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                    {selectedProduct.featuredImage ? (
                      <img
                        src={selectedProduct.featuredImage}
                        alt={selectedProduct.name}
                        className='w-full h-full object-contain'
                      />
                    ) : (
                      <Pill className='w-16 h-16 text-gray-300' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg text-gray-900 mb-2'>{selectedProduct.name}</h3>
                    <p className='text-gray-600 text-sm'>{selectedProduct.shortDescription || 'Không có mô tả'}</p>
                  </div>
                </div>

                <Separator />

                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm text-gray-600'>Hoạt chất</label>
                    <p className='text-gray-900 font-medium'>{selectedProduct.details?.activeIngredients || 'N/A'}</p>
                  </div>
                  <div>
                    <label className='text-sm text-gray-600'>Dạng bào chế</label>
                    <p className='text-gray-900'>{selectedProduct.details?.dosageForm || 'N/A'}</p>
                  </div>
                  <div>
                    <label className='text-sm text-gray-600'>Quy cách đóng gói</label>
                    <p className='text-gray-900'>
                      {selectedProduct.details?.packSize || selectedProduct.packaging || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm text-gray-600'>Nhà sản xuất</label>
                    <p className='text-gray-900'>
                      {selectedProduct.details?.manufacturer || selectedProduct.brand?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm text-gray-600'>Danh mục</label>
                    <p className='text-gray-900'>{selectedProduct.category?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className='text-sm text-gray-600'>Mã SKU</label>
                    <p className='text-gray-900 font-mono text-sm'>{selectedProduct.sku}</p>
                  </div>
                </div>

                {selectedProduct.details?.indications && (
                  <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg'>
                    <label className='text-sm text-blue-800 mb-2 block font-medium'>Chỉ định</label>
                    <p className='text-gray-900'>{selectedProduct.details.indications}</p>
                  </div>
                )}

                {selectedProduct.details?.storageInstructions && (
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                    <label className='text-sm text-gray-600 mb-2 block'>Bảo quản</label>
                    <p className='text-gray-900'>{selectedProduct.details.storageInstructions}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value='usage' className='space-y-4'>
                {selectedProduct.details?.dosageInstructions ? (
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <label className='text-sm text-green-800 mb-2 block flex items-center gap-2 font-medium'>
                      <Pill className='w-4 h-4' />
                      Liều dùng & Cách dùng
                    </label>
                    <p className='text-gray-900 whitespace-pre-line'>{selectedProduct.details.dosageInstructions}</p>
                  </div>
                ) : (
                  <div className='p-8 text-center text-gray-500'>
                    <Info className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                    <p>Chưa có thông tin liều dùng cho sản phẩm này</p>
                  </div>
                )}

                {selectedProduct.warnings && selectedProduct.warnings.length > 0 && (
                  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <label className='text-sm text-yellow-800 mb-3 block flex items-center gap-2 font-medium'>
                      <AlertTriangle className='w-4 h-4' />
                      Cảnh báo
                    </label>
                    <ul className='space-y-1'>
                      {selectedProduct.warnings.map((warning, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <ChevronRight className='w-4 h-4 text-yellow-600 mt-0.5' />
                          <span className='text-gray-900'>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value='stock' className='space-y-4'>
                <div className='grid md:grid-cols-3 gap-4'>
                  <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg text-center'>
                    <Package className='w-8 h-8 mx-auto mb-2 text-[#1E40AF]' />
                    <p className='text-2xl font-bold text-[#1E40AF]'>
                      {selectedProduct.stockQuantity.toLocaleString('vi-VN')}
                    </p>
                    <p className='text-sm text-gray-600'>Tồn kho (đơn vị nhỏ nhất)</p>
                  </div>
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg text-center'>
                    <ShoppingCart className='w-8 h-8 mx-auto mb-2 text-green-600' />
                    <p className='text-2xl font-bold text-green-600'>{selectedProduct.maxOrderQuantity}</p>
                    <p className='text-sm text-gray-600'>SL đặt tối đa/đơn</p>
                  </div>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg text-center'>
                    <Info className='w-8 h-8 mx-auto mb-2 text-gray-600' />
                    <p className='text-2xl font-bold text-gray-600'>{selectedProduct.status}</p>
                    <p className='text-sm text-gray-600'>Trạng thái</p>
                  </div>
                </div>

                {/* Stock breakdown by unit */}
                {selectedProduct.priceVariants && selectedProduct.priceVariants.length > 0 && (
                  <div className='p-4 bg-white border border-[#BFDBFE] rounded-lg'>
                    <p className='text-sm font-medium text-gray-700 mb-3'>📦 Quy đổi tồn kho theo đơn vị:</p>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                      {selectedProduct.priceVariants.map((variant, idx) => {
                        const stockByUnit = Math.floor(selectedProduct.stockQuantity / (variant.quantityPerUnit || 1))
                        return (
                          <div key={idx} className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'>
                            <span className='text-sm text-gray-600'>{variant.unit}</span>
                            <span className='font-semibold text-[#1E40AF]'>{stockByUnit.toLocaleString('vi-VN')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div
                  className={`p-4 rounded-lg ${selectedProduct.stockQuantity > 10 ? 'bg-green-50 border-green-200' : selectedProduct.stockQuantity > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border`}
                >
                  <p
                    className={`font-medium ${selectedProduct.stockQuantity > 10 ? 'text-green-800' : selectedProduct.stockQuantity > 0 ? 'text-yellow-800' : 'text-red-800'}`}
                  >
                    {selectedProduct.stockQuantity > 10
                      ? '✓ Còn hàng - Sẵn sàng bán'
                      : selectedProduct.stockQuantity > 0
                        ? '⚠ Tồn kho thấp - Cần nhập thêm'
                        : '✗ Hết hàng - Không thể bán'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value='pricing' className='space-y-4'>
                <div className='grid md:grid-cols-2 gap-4'>
                  {selectedProduct.priceVariants && selectedProduct.priceVariants.length > 0 ? (
                    selectedProduct.priceVariants.map((variant, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${variant.isDefault ? 'bg-[#F0F6FF] border-[#BFDBFE]' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <span className='font-medium text-gray-900'>{variant.unit}</span>
                          {variant.isDefault && <Badge className='bg-[#1E40AF] text-white text-xs'>Mặc định</Badge>}
                        </div>
                        <p className='text-xl font-bold text-[#1E40AF]'>{variant.price.toLocaleString('vi-VN')}đ</p>
                        {variant.originalPrice && variant.originalPrice > variant.price && (
                          <p className='text-sm text-gray-400 line-through'>
                            {variant.originalPrice.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                        {variant.costPrice && (
                          <p className='text-xs text-gray-500 mt-1'>
                            Giá vốn: {variant.costPrice.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg'>
                      <p className='text-sm text-gray-600 mb-1'>Giá bán</p>
                      <p className='text-xl font-bold text-[#1E40AF]'>{formatPrice(selectedProduct)}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
