import { useState, useEffect } from 'react'
import { Heart, Grid, List, SortAsc, Share2, ShoppingCart, Trash2, TrendingDown, TrendingUp, Clock } from 'lucide-react'

import { ProductCard } from '../products/ProductCard'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { useWishlist } from '../../hooks/product/useWishlist'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { wishlistService } from '../../services/wishlistService'
import { productService } from '../../services/productService'
import type { Product } from '../../types/product'
import { getProductSalePrice, getProductOriginalPrice } from '../../utils/productHelpers'

interface WishlistProduct {
  id: string
  name: string
  image: string
  currentPrice: number
  originalPrice?: number
  addedDate: string
  priceChange?: number // Positive for increase, negative for decrease
  inStock: boolean
  isRx: boolean
  rating: number
  reviewCount: number
  category: string
  slug: string
}

export function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()

  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')

  // Fetch wishlist products
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true)
      try {
        if (isAuthenticated) {
          // Fetch from API
          const items = await wishlistService.getWishlist()
          const mappedProducts: WishlistProduct[] = items
            .map((product) => ({
              id: product._id || product.id || '',
              name: product.name,
              image: product.featuredImage || product.images?.[0] || product.image || '/placeholder-product.jpg',
              currentPrice: getProductSalePrice(product) || 0,
              originalPrice: getProductOriginalPrice(product),
              addedDate: product.createdAt || new Date().toISOString(),
              priceChange: 0, // API doesn't provide this yet
              inStock: (product.stockQuantity || 0) > 0,
              isRx: product.requiresPrescription || product.isPrescription || false,
              rating: product.rating || 0,
              reviewCount: product.reviewCount || 0,
              category: product.category?.name || 'Sản phẩm',
              slug: product.slug,
            }))
            .filter((p) => p.id !== '')
          setWishlistProducts(mappedProducts)
        } else {
          setWishlistProducts([])
        }
      } catch (error) {
        toast.error('Không thể tải danh sách yêu thích')
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistProducts()
  }, [isAuthenticated, wishlist.length]) // Re-fetch when auth changes or wishlist count changes (for guest)

  if (!isAuthenticated) {
    return (
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
        <CardContent className='p-12 text-center'>
          <Heart className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Vui lòng đăng nhập</h3>
          <p className='text-gray-500 mb-6'>Bạn cần đăng nhập để xem danh sách yêu thích</p>
          <Button
            className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
            onClick={() => (window.location.href = '/login')}
          >
            Đăng nhập ngay
          </Button>
        </CardContent>
      </Card>
    )
  }

  const sortedProducts = [...wishlistProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
      case 'priceAsc':
        return a.currentPrice - b.currentPrice
      case 'priceDesc':
        return b.currentPrice - a.currentPrice
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const handleRemoveFromWishlist = async (productId: string) => {
    await toggleWishlist(productId)
    // Local state update is handled by useEffect re-fetching or we can optimistically update
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId))
    setSelectedProducts((prev) => prev.filter((id) => id !== productId))
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId])
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(wishlistProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleAddSelectedToCart = async () => {
    const inStockSelected = selectedProducts.filter((id) => {
      const product = wishlistProducts.find((p) => p.id === id)
      return product?.inStock
    })

    if (inStockSelected.length === 0) {
      toast.error('Không có sản phẩm nào còn hàng trong danh sách đã chọn')
      return
    }

    // Add each selected product to cart
    let successCount = 0
    for (const id of inStockSelected) {
      const product = wishlistProducts.find((p) => p.id === id)
      if (product) {
        try {
          // Reconstruct Product object for addToCart
          const productData: any = {
            _id: product.id,
            id: product.id,
            name: product.name,
            price: product.originalPrice || product.currentPrice,
            salePrice: product.currentPrice,
            images: [product.image],
            featuredImage: product.image,
            slug: product.slug,
            stockQuantity: 10, // Assume stock
            requiresPrescription: product.isRx,
            isPrescription: product.isRx,
          }

          await addToCart(productData, 1)
          successCount++
        } catch (error) {
          console.error(`Failed to add product ${id} to cart:`, error)
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`)
      setSelectedProducts([])
    } else {
      toast.error('Không thể thêm sản phẩm vào giỏ hàng')
    }
  }

  // Custom add to cart for single item that we can implement easily
  const handleAddToCart = async (product: WishlistProduct) => {
    if (!product.inStock) return

    // We need to reconstruct a Product object compatible with CartContext
    // This is a bit hacky, ideally we store the full product
    const productData: any = {
      _id: product.id,
      id: product.id,
      name: product.name,
      price: product.originalPrice || product.currentPrice,
      salePrice: product.currentPrice,
      images: [product.image],
      slug: product.slug,
      stockQuantity: 10, // Assume stock
      isPrescription: product.isRx,
    }

    addToCart(productData, 1)
  }

  const handleRemoveSelected = async () => {
    for (const id of selectedProducts) {
      await toggleWishlist(id)
    }
    setWishlistProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id)))
    setSelectedProducts([])
    toast.success('Đã xóa các sản phẩm đã chọn')
  }

  const handleShareWishlist = () => {
    if (!shareEmail) {
      toast.error('Vui lòng nhập email người nhận')
      return
    }

    // TODO: Implement backend API to send wishlist via email
    toast.info('Tính năng chia sẻ danh sách yêu thích đang được phát triển', {
      description: 'Chúng tôi sẽ sớm ra mắt tính năng này trong thời gian tới',
      duration: 4000,
    })
    setShareEmail('')
    setIsShareModalOpen(false)
  }

  const formatAddedDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hôm nay'
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const getPriceChangeIndicator = (change?: number) => {
    if (!change) return null

    if (change > 0) {
      return (
        <div className='flex items-center gap-1 text-red-600'>
          <TrendingUp className='w-4 h-4' />
          <span className='text-sm'>+{change.toLocaleString()}đ</span>
        </div>
      )
    } else {
      return (
        <div className='flex items-center gap-1 text-green-600'>
          <TrendingDown className='w-4 h-4' />
          <span className='text-sm'>{change.toLocaleString()}đ</span>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                Sản phẩm yêu thích
              </h1>
              <Badge variant='secondary'>{wishlistProducts.length} sản phẩm</Badge>
            </div>
            <p className='text-gray-600 mt-1'>Lưu trữ các sản phẩm bạn quan tâm</p>
          </div>

          <div className='flex items-center gap-3'>
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='w-40'>
                <SortAsc className='w-4 h-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>Mới nhất</SelectItem>
                <SelectItem value='priceAsc'>Giá tăng dần</SelectItem>
                <SelectItem value='priceDesc'>Giá giảm dần</SelectItem>
                <SelectItem value='name'>Tên A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className='flex border rounded-lg'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('grid')}
                className='rounded-r-none'
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='rounded-l-none'
              >
                <List className='w-4 h-4' />
              </Button>
            </div>

            {/* Share */}
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Share2 className='w-4 h-4 mr-2' />
                  Chia sẻ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Chia sẻ danh sách yêu thích</DialogTitle>
                  <DialogDescription>Gửi danh sách sản phẩm yêu thích của bạn cho bạn bè qua email</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Email người nhận</label>
                    <Input
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder='example@email.com'
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button variant='outline' onClick={() => setIsShareModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleShareWishlist}>Gửi danh sách</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {wishlistProducts.length > 0 && (
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Checkbox
                checked={selectedProducts.length === wishlistProducts.length}
                onCheckedChange={handleSelectAll}
              />
              <span className='text-sm text-gray-600'>
                {selectedProducts.length > 0 ? `Đã chọn ${selectedProducts.length} sản phẩm` : 'Chọn tất cả'}
              </span>
            </div>

            {selectedProducts.length > 0 && (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleAddSelectedToCart}
                  className='text-blue-600 border-blue-200 hover:bg-blue-50'
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRemoveSelected}
                  className='text-red-600 border-red-200 hover:bg-red-50'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Xóa đã chọn
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      {wishlistProducts.length === 0 ? (
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
          <CardContent className='p-12 text-center'>
            <Heart className='w-16 h-16 mx-auto text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Danh sách yêu thích trống</h3>
            <p className='text-gray-500 mb-6'>Khám phá và lưu các sản phẩm bạn quan tâm</p>
            <Button
              className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              onClick={() => (window.location.href = '/products')}
            >
              Khám phá sản phẩm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          }`}
        >
          {sortedProducts.map((product) => (
            <div key={product.id} className='relative'>
              {viewMode === 'list' ? (
                <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200'>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-4'>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                      />

                      <img src={product.image} alt={product.name} className='w-20 h-20 object-cover rounded-lg' />

                      <div className='flex-1'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <h3 className='font-medium text-gray-900 line-clamp-1'>{product.name}</h3>
                            <p className='text-sm text-gray-500'>{product.category}</p>
                          </div>

                          <div className='flex items-center gap-2'>
                            {product.isRx && <Badge className='bg-red-100 text-red-800'>Rx</Badge>}
                            {!product.inStock && (
                              <Badge variant='outline' className='text-gray-500'>
                                Hết hàng
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-medium text-blue-600'>
                                {product.currentPrice.toLocaleString()}đ
                              </span>
                              {product.originalPrice && product.originalPrice > product.currentPrice && (
                                <span className='text-sm text-gray-500 line-through'>
                                  {product.originalPrice.toLocaleString()}đ
                                </span>
                              )}
                            </div>
                            {getPriceChangeIndicator(product.priceChange)}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='relative'>
                  <div className='absolute top-2 left-2 z-10'>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                      className='bg-white shadow-sm'
                    />
                  </div>

                  <ProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      brand: 'Brand', // Default brand since WishlistProduct doesn't have brand
                      image: product.image,
                      originalPrice: product.originalPrice,
                      salePrice: product.currentPrice,
                      rating: product.rating,
                      reviewCount: product.reviewCount,
                      inStock: product.inStock,
                      isPrescription: product.isRx,
                      isOnSale: product.originalPrice ? product.originalPrice > product.currentPrice : false,
                    }}
                    onToggleWishlist={() => handleRemoveFromWishlist(product.id)}
                    isInWishlist={true}
                  />

                  <div className='mt-3 px-4'>
                    <div className='flex items-center justify-between text-sm'>
                      {/* Removed misleading date display */}
                      {getPriceChangeIndicator(product.priceChange)}
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className='w-full mt-2 text-red-500 hover:text-red-700 hover:bg-red-50'
                    >
                      <Heart className='w-4 h-4 mr-2 fill-current' />
                      Bỏ yêu thích
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
