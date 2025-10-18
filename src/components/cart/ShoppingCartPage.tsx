import { useState } from 'react'
import { Link } from 'react-router'
import { ShoppingCart, Trash2, Heart, Plus, Minus, Gift, Truck, Shield, RotateCcw } from 'lucide-react'
import { PriceDisplay } from '../products/PriceDisplay'
import { ProductCard } from '../products/ProductCard'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { addToCart, toggleWishlist } from '~/utils/cartUtils'
import type { CartItem } from '~/types/product'
import { mockCartItems, mockProducts } from '../../utils/mockData'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

export function ShoppingCartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupons, setAppliedCoupons] = useState<string[]>([])

  const breadcrumbItems = [{ label: 'Giỏ hàng' }]

  // Calculate totals
  const selectedItems = cartItems.filter((item) => item.selected)
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.product.salePrice ?? item.product.originalPrice ?? 0) * item.quantity,
    0,
  )
  const discount = 50000 // Mock discount
  const shippingFee = subtotal >= 300000 ? 0 : 25000
  const total = subtotal - discount + shippingFee

  // Handle item selection
  const handleSelectItem = (itemId: string, selected: boolean) => {
    setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, selected } : item)))
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setCartItems((prev) => prev.map((item) => ({ ...item, selected })))
  }

  // Handle quantity change
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item)),
    )
  }

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Handle move to wishlist
  const handleMoveToWishlist = (itemId: string) => {
    const item = cartItems.find((item) => item.id === itemId)
    if (item) {
      toggleWishlist(item.product.id, item.product.name)
      handleRemoveItem(itemId)
    }
  }

  // Handle apply coupon
  const handleApplyCoupon = () => {
    if (couponCode && !appliedCoupons.includes(couponCode)) {
      setAppliedCoupons((prev) => [...prev, couponCode])
      setCouponCode('')
    }
  }

  // Handle remove coupon
  const handleRemoveCoupon = (coupon: string) => {
    setAppliedCoupons((prev) => prev.filter((c) => c !== coupon))
  }

  // Recommended products
  const recommendedProducts = mockProducts.slice(0, 4)

  // Check if all items are selected
  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected)

  if (cartItems.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
          <Card className='max-w-md mx-auto text-center p-8'>
            <CardContent>
              <ShoppingCart className='w-24 h-24 text-blue-300 mx-auto mb-6' />
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>Giỏ hàng trống</h2>
              <p className='text-gray-600 mb-6'>
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
              </p>
              <Link to='/products'>
                <Button className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'>
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Continue Shopping Section */}
          {recommendedProducts.length > 0 && (
            <div className='mt-12'>
              <h3 className='text-xl font-bold text-blue-800 mb-6 text-center'>Có thể bạn quan tâm</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      brand: product.brand,
                      image: product.image,
                      originalPrice: product.originalPrice,
                      salePrice: product.salePrice ?? product.originalPrice ?? 0,
                      rating: product.rating,
                      reviewCount: product.reviewCount,
                      inStock: product.inStock,
                      isPrescription: product.isPrescription,
                      isOnSale: product.isOnSale,
                    }}
                    onAddToCart={(productId) => {
                      const prod = mockProducts.find((p) => p.id === productId)
                      if (prod) addToCart(productId, prod.name, 1)
                    }}
                    onToggleWishlist={(productId) => {
                      const prod = mockProducts.find((p) => p.id === productId)
                      if (prod) toggleWishlist(productId, prod.name)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='flex items-center gap-4 mb-6'>
          <h1 className='text-2xl font-bold text-blue-800'>Giỏ hàng của bạn</h1>
          <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
            {cartItems.length} sản phẩm
          </Badge>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
          {/* Cart Items - 70% width */}
          <div className='lg:col-span-7 space-y-6'>
            {/* Cart Header */}
            <Card className='border-blue-100'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                    <span className='font-medium'>Chọn tất cả ({cartItems.length})</span>
                  </div>

                  <div className='flex items-center gap-4'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-gray-500 hover:text-red-500'
                      onClick={() => {
                        const selectedItemIds = cartItems.filter((item) => item.selected).map((item) => item.id)
                        setCartItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)))
                      }}
                    >
                      <Trash2 className='w-4 h-4 mr-1' />
                      Xóa đã chọn
                    </Button>
                    <Button variant='ghost' size='sm' className='text-gray-500 hover:text-pink-500'>
                      <Heart className='w-4 h-4 mr-1' />
                      Thêm vào yêu thích
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <div className='space-y-4'>
              {cartItems.map((item) => (
                <Card key={item.id} className='border-blue-100 hover:shadow-md transition-shadow'>
                  <CardContent className='p-6'>
                    <div className='flex items-start gap-4'>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />

                      <div className='w-20 h-20 flex-shrink-0'>
                        <ImageWithFallback
                          src={item.product.image}
                          alt={item.product.name}
                          className='w-full h-full object-cover rounded-lg border border-gray-200'
                        />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className='font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1'
                        >
                          {item.product.name}
                        </Link>
                        <p className='text-sm text-gray-500 mb-2'>{item.product.brand}</p>
                        <p className='text-xs text-gray-400 mb-2'>SKU: {item.product.sku}</p>

                        <div className='flex items-center justify-between'>
                          <PriceDisplay
                            originalPrice={item.product.originalPrice}
                            salePrice={item.product.salePrice ?? item.product.originalPrice ?? 0}
                            size='md'
                          />

                          <div className='flex items-center gap-4'>
                            {/* Quantity Controls */}
                            <div className='flex items-center border border-blue-200 rounded-lg'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className='h-8 w-8 rounded-none hover:bg-blue-50'
                              >
                                <Minus className='w-3 h-3' />
                              </Button>
                              <div className='w-12 text-center text-sm font-medium'>{item.quantity}</div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stockQuantity}
                                className='h-8 w-8 rounded-none hover:bg-blue-50'
                              >
                                <Plus className='w-3 h-3' />
                              </Button>
                            </div>

                            {/* Subtotal */}
                            <div className='text-lg font-bold text-blue-600 min-w-[100px] text-right'>
                              {new Intl.NumberFormat('vi-VN').format(
                                (item.product.salePrice ?? item.product.originalPrice ?? 0) * item.quantity,
                              )}
                              đ
                            </div>

                            {/* Actions */}
                            <div className='flex items-center gap-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleMoveToWishlist(item.id)}
                                className='text-gray-400 hover:text-pink-500'
                              >
                                <Heart className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleRemoveItem(item.id)}
                                className='text-gray-400 hover:text-red-500'
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {item.quantity > item.product.stockQuantity && (
                          <div className='mt-2 text-sm text-red-500'>
                            Chỉ còn {item.product.stockQuantity} sản phẩm trong kho
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Promotion Section */}
            <Card className='border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <Gift className='w-5 h-5' />
                  Mã giảm giá
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Nhập mã giảm giá'
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className='border-blue-200 focus:border-blue-500'
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                  >
                    Áp dụng
                  </Button>
                </div>

                {appliedCoupons.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>Mã đã áp dụng:</p>
                    {appliedCoupons.map((coupon) => (
                      <div
                        key={coupon}
                        className='flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded'
                      >
                        <span className='text-sm font-medium text-green-700'>{coupon}</span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveCoupon(coupon)}
                          className='text-green-700 hover:text-red-500'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Khuyến mãi có sẵn:</p>
                  <div className='space-y-1'>
                    <div className='text-sm text-blue-600 cursor-pointer hover:underline'>
                      • WELCOME10 - Giảm 10% cho đơn hàng đầu tiên
                    </div>
                    <div className='text-sm text-blue-600 cursor-pointer hover:underline'>
                      • FREESHIP - Miễn phí vận chuyển cho đơn từ 200k
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - 30% width */}
          <div className='lg:col-span-3'>
            <div className='sticky top-6 space-y-6'>
              {/* Order Summary */}
              <Card className='border-blue-100'>
                <CardHeader>
                  <CardTitle className='text-blue-800'>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Tạm tính ({selectedItems.length} sản phẩm)</span>
                      <span className='font-medium'>{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
                    </div>

                    {discount > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Giảm giá</span>
                        <span className='font-medium text-green-600'>
                          -{new Intl.NumberFormat('vi-VN').format(discount)}đ
                        </span>
                      </div>
                    )}

                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Phí vận chuyển</span>
                      <span className='font-medium'>
                        {shippingFee === 0 ? (
                          <span className='text-green-600'>Miễn phí</span>
                        ) : (
                          `${new Intl.NumberFormat('vi-VN').format(shippingFee)}đ`
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className='flex justify-between text-lg'>
                    <span className='font-bold'>Tổng cộng</span>
                    <span className='font-bold text-blue-600'>{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                  </div>

                  <Link to='/cart/checkout'>
                    <Button
                      className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 mt-[0px] mr-[0px] mb-[8px] ml-[0px]'
                      disabled={selectedItems.length === 0}
                    >
                      Thanh toán ({selectedItems.length})
                    </Button>
                  </Link>

                  <div className='text-center'>
                    <Link to='/products'>
                      <Button variant='outline' className='w-full border-blue-200 text-blue-600'>
                        Tiếp tục mua sắm
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card className='border-blue-100'>
                <CardContent className='p-4 space-y-3'>
                  <div className='text-sm'>
                    <span className='font-medium'>Giao đến:</span>
                    <div className='text-gray-600 mt-1'>123 Nguyễn Văn Cừ, Quận 5, TP.HCM</div>
                    <Button variant='link' className='p-0 h-auto text-blue-600 text-sm'>
                      Thay đổi
                    </Button>
                  </div>

                  <div className='text-sm text-gray-600'>
                    Dự kiến giao hàng: <span className='font-medium text-blue-600'>2-4 giờ</span>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card className='border-blue-100'>
                <CardContent className='p-4 space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Shield className='w-4 h-4 text-green-500' />
                    <span>Thanh toán an toàn SSL</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Truck className='w-4 h-4 text-blue-500' />
                    <span>Giao hàng nhanh 2-4h</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <RotateCcw className='w-4 h-4 text-orange-500' />
                    <span>Đổi trả dễ dàng trong 7 ngày</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        {recommendedProducts.length > 0 && (
          <div className='mt-12'>
            <h3 className='text-xl font-bold text-blue-800 mb-6'>Có thể bạn quan tâm</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {recommendedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    brand: product.brand,
                    image: product.image,
                    originalPrice: product.originalPrice,
                    salePrice: product.salePrice ?? product.originalPrice ?? 0,
                    rating: product.rating,
                    reviewCount: product.reviewCount,
                    inStock: product.inStock,
                    isPrescription: product.isPrescription,
                    isOnSale: product.isOnSale,
                  }}
                  onAddToCart={(productId) => console.log('Add to cart:', productId)}
                  onToggleWishlist={(productId) => console.log('Toggle wishlist:', productId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
  )
}
