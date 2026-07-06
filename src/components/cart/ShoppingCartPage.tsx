import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ShoppingCart, Trash2, Heart, Plus, Minus, Gift, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { useCart, createSelectionKey } from '../../contexts/CartContext'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { addressService } from '../../services/addressService'
import wishlistService from '../../services/wishlistService'
import type { Address } from '../../types/user'
import { CouponInput } from '../discount/CouponInput'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { usePostPurchase } from '../../hooks/product/useRecommendations'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

export function ShoppingCartPage() {
  const {
    state: { cart, selectedItems, isLoading },
    updateQuantity,
    updateUnit,
    removeFromCart,
    toggleItemSelection,
    selectAllItems,
    moveToWishlist,
    getSelectedItemsCount,
    getSelectedItemsTotal,
  } = useCart()

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Cart product IDs for cross-sell recommendations
  const cartProductIds = cart?.items?.map((item) => item.productId).filter(Boolean) ?? []
  const {
    products: crossSellProducts,
    loading: crossSellLoading,
    algorithm: crossSellAlgorithm,
  } = usePostPurchase(cartProductIds, 8)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [loadingAddress, setLoadingAddress] = useState(true)

  const [appliedCoupons, setAppliedCoupons] = useState<any[]>([])
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [freeShippingFromCoupon, setFreeShippingFromCoupon] = useState(false)

  const breadcrumbItems = [{ label: 'Giỏ hàng' }]

  // Initialize coupons from cart state
  useEffect(() => {
    if (cart?.appliedCoupons) {
      setAppliedCoupons(cart.appliedCoupons)
      // Dùng cart.discountAmount từ DB làm nguồn chính xác nhất
      const totalDisc =
        (cart as any).discountAmount > 0
          ? (cart as any).discountAmount
          : cart.appliedCoupons
              .filter((c: any) => c.type !== 'free_shipping')
              .reduce((sum: number, c: any) => sum + (c.discountAmount || 0), 0)
      setCouponDiscount(totalDisc)
      setFreeShippingFromCoupon(cart.appliedCoupons.some((c: any) => c.type === 'free_shipping'))
    }
  }, [cart])

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return // Don't fetch addresses if not logged in

      try {
        setLoadingAddress(true)
        const fetchedAddresses = await addressService.getAddresses()
        setAddresses(fetchedAddresses)

        // Find default address or use first one
        const defaultAddr = fetchedAddresses.find((addr) => addr.isDefault) || fetchedAddresses[0] || null
        setDefaultAddress(defaultAddr)
      } catch (error) {
      } finally {
        setLoadingAddress(false)
      }
    }

    fetchAddresses()
  }, [isAuthenticated])

  // Validate selected items when component mounts or cart changes
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      // Cart is empty, clear all selections and sessionStorage
      selectAllItems(false)
      sessionStorage.removeItem('medispace_selected_items')
      return
    }

    // Check if any selected items are no longer in cart
    const validKeys = new Set(cart.items.map((item) => createSelectionKey(item.productId, item.unit)))
    const invalidKeys: string[] = []

    selectedItems.forEach((key) => {
      if (!validKeys.has(key)) {
        invalidKeys.push(key)
      }
    })

    // Only remove invalid selections, keep valid ones
    if (invalidKeys.length > 0) {
      invalidKeys.forEach((key) => {
        toggleItemSelection(key.split('-')[0], key.includes('-') ? key.split('-').slice(1).join('-') : undefined)
      })
    }
  }, [cart?.items])

  // Handle checkout navigation
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tiếp tục thanh toán')
      navigate('/login', { state: { returnUrl: '/cart/checkout' } })
      return
    }

    if (getSelectedItemsCount() === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán')
      return
    }

    navigate('/cart/checkout')
  }

  // Note: Don't clear selections on mount anymore
  // Selections are managed by CartContext and persisted in sessionStorage

  // Calculate if all items are selected
  const allSelected =
    cart?.items &&
    cart.items.length > 0 &&
    cart.items.every((item) => selectedItems.has(createSelectionKey(item.productId, item.unit)))

  // Calculate totals
  const subtotal = getSelectedItemsTotal()
  const selectedCartItems = (cart?.items || []).filter((item) =>
    selectedItems.has(createSelectionKey(item.productId, item.unit)),
  )
  const hasPrescriptionItems = (cart?.items || []).some((item) => item.prescriptionRequired)
  const discount = couponDiscount
  const shippingFee = getSelectedItemsCount() === 0 ? 0 : subtotal >= 300000 || freeShippingFromCoupon ? 0 : 30000
  const total = Math.max(0, subtotal - discount + shippingFee)

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    selectAllItems(selected)
  }

  // Handle select item
  const handleSelectItem = (productId: string, unit?: string) => {
    toggleItemSelection(productId, unit)
  }

  // Handle quantity change
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity)
  }

  // Handle remove item
  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId)
  }

  // Handle add to wishlist (without removing from cart)
  const handleAddToWishlist = async (productId: string) => {
    try {
      await wishlistService.addToWishlist(productId)
      toast.success('Đã thêm sản phẩm vào danh sách yêu thích')
    } catch (error) {
      toast.error('Không thể thêm sản phẩm vào danh sách yêu thích')
    }
  }

  // Check if cart is empty
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <Card className='max-w-md mx-auto text-center p-8 border-[#BFDBFE] bg-white'>
          <CardContent>
            <ShoppingCart className='w-24 h-24 text-blue-300 mx-auto mb-6' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Giỏ hàng trống</h2>
            <p className='text-gray-600 mb-6'>
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
            </p>
            <Link to='/products'>
              <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'>
                Tiếp tục mua sắm
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      <div className='flex items-center gap-4 mb-6 mt-4'>
        <h1 className='text-2xl font-bold text-blue-800'>Giỏ hàng của bạn</h1>
        <Badge variant='secondary' className='bg-[#E8EDF5] text-[#0A2463]'>
          {cart?.itemCount || 0} sản phẩm
        </Badge>
      </div>

      {hasPrescriptionItems && (
        <Card className='mb-6 border-amber-200 bg-amber-50'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              <div className='space-y-1'>
                <p className='font-medium text-amber-900'>Giỏ hàng có thuốc kê đơn</p>
                <p className='text-sm text-amber-800'>
                  Bạn cần chọn đơn thuốc còn hiệu lực đã được dược sĩ xác nhận trước khi đặt hàng các sản phẩm này.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
        {/* Cart Items - 70% width */}
        <div className='lg:col-span-7 space-y-6'>
          {/* Cart Header */}
          <Card className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                  <span className='font-medium'>Chọn tất cả ({cart?.items.length || 0})</span>
                </div>

                <div className='flex items-center gap-4'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-500 hover:text-red-500 hover:!bg-red-100 hover:!border-red-100 hover:shadow-md transition-shadow'
                    disabled={getSelectedItemsCount() === 0}
                    onClick={async () => {
                      const itemsToRemove = [...selectedCartItems]
                      if (itemsToRemove.length === 0) {
                        toast.info('Vui lòng chọn sản phẩm cần xóa')
                        return
                      }

                      // Use cart items directly so productId/unit are exact and stale selection keys are ignored.
                      for (const item of itemsToRemove) {
                        await removeFromCart(item.productId, item.unit)
                      }

                      // Clear selections after successful deletion
                      selectAllItems(false)
                      toast.success('Đã xóa sản phẩm đã chọn khỏi giỏ hàng')
                    }}
                  >
                    <Trash2 className='w-4 h-4 mr-1' />
                    Xóa đã chọn
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-500 hover:text-[#1E40AF] hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:shadow-md transition-shadow'
                    disabled={getSelectedItemsCount() === 0}
                    onClick={async () => {
                      let successCount = 0
                      for (const item of selectedCartItems) {
                        try {
                          await wishlistService.addToWishlist(item.productId)
                          successCount++
                        } catch (error) {
                          console.error('Failed to add to wishlist:', error)
                        }
                      }
                      if (successCount > 0) {
                        toast.success(`Đã thêm ${successCount} sản phẩm vào danh sách yêu thích`)
                      }
                    }}
                  >
                    <Heart className='w-4 h-4 mr-1' />
                    Thêm vào yêu thích
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <div className='space-y-4'>
            {cart?.items.map((item) => (
              <Card
                key={createSelectionKey(item.productId, item.unit)}
                className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'
              >
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <Checkbox
                      checked={selectedItems.has(createSelectionKey(item.productId, item.unit))}
                      onCheckedChange={() => handleSelectItem(item.productId, item.unit)}
                    />

                    <div className='w-20 h-20 flex-shrink-0'>
                      <ImageWithFallback
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className='w-full h-full object-cover rounded-lg border border-gray-200'
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <Link
                        to={`/products/${item.productId}`}
                        className='font-medium text-gray-900 hover:text-[#1E40AF] line-clamp-2 mb-1'
                      >
                        {item.name}
                      </Link>
                      <p className='text-sm text-gray-500 mb-2'>MediSpace Pharmacy</p>
                      <p className='text-xs text-gray-400 mb-2'>SKU: {item.sku}</p>
                      {item.prescriptionRequired && (
                        <Badge variant='outline' className='mb-2 border-amber-300 bg-amber-50 text-amber-700'>
                          Cần đơn thuốc đã xác nhận
                        </Badge>
                      )}

                      {/* Unit selector - show dropdown when multiple variants */}
                      {item.priceVariants && item.priceVariants.length > 1 ? (
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='text-xs text-gray-500'>Đơn vị:</span>
                          <Select value={item.unit} onValueChange={(value) => updateUnit(item.productId, value)}>
                            <SelectTrigger className='h-7 w-[100px] text-xs border-[#BFDBFE]'>
                              <SelectValue placeholder='Chọn đơn vị' />
                            </SelectTrigger>
                            <SelectContent>
                              {item.priceVariants.map((variant) => (
                                <SelectItem key={variant.unit} value={variant.unit} className='text-xs'>
                                  {variant.unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        item.unit && (
                          <div className='mb-2'>
                            <span className='inline-flex items-center px-2 py-1 text-xs bg-[#F0F6FF] text-[#1E40AF] rounded-full'>
                              Đơn vị: {item.unit}
                            </span>
                          </div>
                        )
                      )}

                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='text-lg font-bold text-[#1E40AF]'>
                            {new Intl.NumberFormat('vi-VN').format(item.unitPrice)}đ
                            {item.unit && <span className='text-sm font-normal text-gray-500 ml-1'>/ {item.unit}</span>}
                          </div>
                          {/* Giá gốc nếu có campaign */}
                          {(item as any).originalUnitPrice && (item as any).originalUnitPrice > item.unitPrice && (
                            <div className='text-xs text-gray-400 line-through'>
                              {new Intl.NumberFormat('vi-VN').format((item as any).originalUnitPrice)}đ
                            </div>
                          )}
                        </div>

                        <div className='flex items-center gap-4'>
                          {/* Quantity Controls */}
                          <div className='flex items-center border border-[#BFDBFE] rounded-lg'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isLoading}
                              className='h-8 w-8 rounded-none hover:bg-[#F0F6FF]'
                            >
                              <Minus className='w-3 h-3' />
                            </Button>
                            <div className='w-12 text-center text-sm font-medium'>{item.quantity}</div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= 10 || isLoading} // Max 10 items
                              className='h-8 w-8 rounded-none hover:bg-[#F0F6FF]'
                            >
                              <Plus className='w-3 h-3' />
                            </Button>
                          </div>

                          {/* Subtotal */}
                          <div className='text-lg font-bold text-[#1E40AF] min-w-[100px] text-right'>
                            {new Intl.NumberFormat('vi-VN').format(item.totalPrice)}đ
                          </div>

                          {/* Actions */}
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleAddToWishlist(item.productId)}
                              className='text-gray-400 hover:text-[#1E40AF]'
                            >
                              <Heart className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveItem(item.productId)}
                              className='text-gray-400 hover:text-red-500'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Stock Warning - Temporarily disabled as stock info not in cart item */}
                      {/* {item.quantity > item.product.stockQuantity && (
                        <div className='mt-2 text-sm text-red-500'>
                          Chỉ còn {item.product.stockQuantity} sản phẩm trong kho
                        </div>
                      )} */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Promotion Section */}
          <Card
            className={`bg-white border-[#E8EDF5] hover:shadow-md transition-shadow ${getSelectedItemsCount() === 0 ? 'opacity-60' : ''}`}
          >
            <CardHeader>
              <CardTitle className='text-blue-800 flex items-center gap-2'>
                <Gift className='w-5 h-5' />
                Mã giảm giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getSelectedItemsCount() === 0 ? (
                <p className='text-sm text-gray-400 italic'>Vui lòng chọn ít nhất 1 sản phẩm để áp dụng mã giảm giá.</p>
              ) : (
                <CouponInput
                  subtotal={subtotal}
                  hasPrescriptionItems={selectedCartItems.some((i) => i.prescriptionRequired)}
                  items={selectedCartItems.map((item) => ({
                    productId: item.productId,
                    unit: item.unit,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    prescriptionRequired: item.prescriptionRequired,
                  }))}
                  initialCoupons={appliedCoupons}
                  onCouponsChange={(coupons, discount, hasFreeship) => {
                    setAppliedCoupons([...coupons])
                    setCouponDiscount(discount)
                    setFreeShippingFromCoupon(hasFreeship)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary - 30% width */}
        <div className='lg:col-span-3'>
          <div className='sticky top-6 space-y-6'>
            {/* Order Summary */}
            <Card className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Tạm tính</span>
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
                    <span className='text-gray-600'>Phí vận chuyển (ước tính)</span>
                    <span className='font-medium'>
                      {shippingFee === 0 ? (
                        <span className='text-green-600'>0đ</span>
                      ) : (
                        `${new Intl.NumberFormat('vi-VN').format(shippingFee)}đ`
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className='flex justify-between text-lg'>
                  <span className='font-bold'>Tổng cộng</span>
                  <span className='font-bold text-[#1E40AF]'>{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                </div>

                <Button
                  className='w-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white h-12 mt-4 mb-2'
                  disabled={!cart?.items || cart.items.length === 0 || getSelectedItemsCount() === 0}
                  onClick={handleCheckout}
                >
                  Thanh toán
                </Button>

                <div className='text-center'>
                  <Link to='/products'>
                    <Button
                      variant='outline'
                      className='w-full !border-[#BFDBFE] hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:shadow-md transition-shadow text-[#1E40AF]'
                    >
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            {/* <Card className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'>
              <CardContent className='p-4 space-y-3'>
                <div className='text-sm'>
                  <span className='font-medium'>Giao đến:</span>
                  <div className='text-gray-600 mt-1'>
                    {loadingAddress ? (
                      <span className='text-gray-400'>Đang tải...</span>
                    ) : defaultAddress ? (
                      <>
                        <div>{defaultAddress.name} - {defaultAddress.phone}</div>
                        <div>{defaultAddress.address}</div>
                        <div>{defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.province}</div>
                      </>
                    ) : (
                      <span className='text-orange-600'>Chưa có địa chỉ giao hàng</span>
                    )}
                  </div>
                  <Link to='/account/addresses'>
                    <Button variant='link' className='p-0 h-auto text-[#1E40AF] text-sm'>
                      {defaultAddress ? 'Thay đổi' : 'Thêm địa chỉ'}
                    </Button>
                  </Link>
                </div>

                <div className='text-sm text-gray-600'>
                  Dự kiến giao hàng: <span className='font-medium text-[#1E40AF]'>2-4 giờ</span>
                </div>
              </CardContent>
            </Card> */}

            {/* Trust Badges */}
            <Card className='bg-white border-[#E8EDF5] hover:shadow-md transition-shadow'>
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

      {/* Cross-sell Recommendations */}
      {cart?.items && cart.items.length > 0 && (
        <div className='mt-8'>
          <RecommendationCarousel
            title='Thêm vào đơn hàng?'
            subtitle='Khách hàng thường mua kèm với sản phẩm trong giỏ của bạn'
            badge='bundle'
            products={crossSellProducts}
            loading={crossSellLoading}
            algorithm={crossSellAlgorithm}
            viewAllLink='/products'
          />
        </div>
      )}
    </div>
  )
}
