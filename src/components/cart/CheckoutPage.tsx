import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Shield, ChevronRight, MapPin, CreditCard, Truck, Clock, Smartphone, Plus, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { useCart, createSelectionKey } from '../../contexts/CartContext'
import type { ShippingMethod, PaymentMethod } from '../../types/product'
import { AddressFormDialog } from '../shared/AddressFormDialog'
import { addressService } from '../../services/addressService'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import { useSearchParams } from 'react-router-dom'
import type { User, Address } from '../../types/user'
import type { CartItem } from '../../types/cart'
import { productService } from '../../services/productService'
import { ghnService } from '../../services/ghnService'

const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng trong 2-4 ngày. Miễn phí cho đơn từ 300k',
    price: 30000,
    estimatedDays: '2-4 ngày',
  },
  {
    id: 'fast',
    name: 'Giao hàng nhanh',
    description: 'Giao hàng nhanh trong 1-2 ngày',
    price: 45000,
    estimatedDays: '1-2 ngày',
  },
  {
    id: 'express',
    name: 'Giao hàng hỏa tốc',
    description: 'Giao hàng trong 2-4 giờ (Nội thành)',
    price: 60000,
    estimatedDays: '2-4 giờ',
  },
]

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: '💰',
    type: 'cod',
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    icon: '📱',
    type: 'ewallet',
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    description: 'Thanh toán qua ví VNPay (ATM/Visa/Master/JCB/QR Pay)',
    icon: '💳',
    type: 'ewallet',
  },
  {
    id: 'payos',
    name: 'Thanh toán qua PayOS',
    description: 'Thanh toán bằng mã QR VietQR (Mọi ngân hàng)',
    icon: '🏦',
    type: 'ewallet',
  },
]

export function CheckoutPage() {
  const { state, getSelectedItemsTotal, getSelectedItemsCount, clearCart, refreshCart, selectAllItems } = useCart()
  const [searchParams] = useSearchParams()
  const isBuyNow = searchParams.get('mode') === 'buy_now'
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null)

  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(DEFAULT_SHIPPING_METHODS)
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Load Buy Now Item
  useEffect(() => {
    const loadBuyNowItem = async () => {
      if (!isBuyNow) return

      const productId = searchParams.get('productId')
      if (!productId) return

      try {
        const product = await productService.getProductById(productId)
        if (product) {
          const quantity = parseInt(searchParams.get('quantity') || '1')
          const unit = searchParams.get('unit')
          let price = product.price

          // Check for unit price variant
          if (unit && product.priceVariants) {
            const variant = product.priceVariants.find(v => v.unit === unit)
            if (variant) price = variant.price
          }

          setBuyNowItem({
            productId: product._id,
            name: product.name,
            sku: product.sku || '',
            unit: unit || product.unit,
            quantity: quantity || 1,
            unitPrice: price || 0,
            totalPrice: (price || 0) * (quantity || 1),
            prescriptionRequired: product.requiresPrescription || false,
            image: product.images?.[0] || '',
            priceVariants: product.priceVariants
          })
        }
      } catch (error) {
      }
    }

    loadBuyNowItem()
  }, [isBuyNow, searchParams])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, userAddresses] = await Promise.all([
          authService.getMe(),
          addressService.getAddresses()
        ])
        setUser(userData)
        setAddresses(userAddresses)
        // Set default address selection
        if (userAddresses && userAddresses.length > 0) {
          const defaultAddr = userAddresses.find(addr => addr.isDefault) || userAddresses[0]
          setSelectedAddress(defaultAddr.id || '')
        }
      } catch (error) {
        // Failed to fetch user data, continue with null user
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const cartItems = isBuyNow
    ? (buyNowItem ? [buyNowItem] : [])
    : (state.cart?.items.filter(item => state.selectedItems.has(createSelectionKey(item.productId, item.unit))) || [])

  const addressObj = addresses.find((a) => a.id === selectedAddress)

  // Calculate Shipping Fee Dynamic
  useEffect(() => {
    const fetchShippingFee = async () => {
      // Reset to default if no address or missing IDs (fallback to 30k)
      if (!addressObj?.districtId || !addressObj?.wardCode) {
        setShippingMethods(DEFAULT_SHIPPING_METHODS)
        return
      }

      try {
        // Call API
        const feeData = await ghnService.calculateFee({
          to_district_id: addressObj.districtId,
          to_ward_code: addressObj.wardCode,
          weight: 2000, // Estimated 2kg
          service_type_id: 2 // Standard
        })

        if (feeData && feeData.total) {
          const newFee = feeData.total
          setShippingMethods(prev => prev.map(m => {
            if (m.id === 'standard') {
              return { ...m, price: newFee, description: `Giao hàng tiêu chuẩn (GHN). Tạm tính: ${new Intl.NumberFormat('vi-VN').format(newFee)}đ` }
            }
            return m
          }))
        }
      } catch (error) {
        console.error('Failed to calculate shipping fee', error)
        // Keep default on error
        setShippingMethods(DEFAULT_SHIPPING_METHODS)
      }
    }

    fetchShippingFee()
  }, [addressObj])

  // Calculate totals
  const subtotal = isBuyNow
    ? (buyNowItem ? buyNowItem.totalPrice : 0)
    : getSelectedItemsTotal()
  const discount = 0
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethod)
  let bgShippingFee = selectedShipping?.price || 0

  // Apply logic Freeship Frontend
  if (subtotal >= 300000) {
    if (shippingMethod === 'standard') bgShippingFee = 0
    else bgShippingFee = Math.max(0, bgShippingFee - 30000)
  }

  const shippingFee = bgShippingFee
  const total = subtotal - discount + shippingFee

  const handlePlaceOrder = async () => {

    if (!user) {
      alert('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.')
      return
    }

    // Validate that we have addresses and a valid selected address
    if (!addresses || addresses.length === 0) {
      alert('Vui lòng thêm địa chỉ giao hàng trước khi thanh toán')
      return
    }

    // Ensure selectedAddress is valid, fallback to first address if not
    let validSelectedAddress = selectedAddress
    if (!selectedAddress || !addresses.find(addr => addr.id === selectedAddress)) {
      validSelectedAddress = addresses[0].id || ''
      setSelectedAddress(validSelectedAddress)
    }

    setIsProcessing(true)

    try {
      // Get the selected address object
      let addressObj: {
        firstName: string
        lastName: string
        address: string
        ward: string
        district: string
        province: string
        phone: string
        email: string
        provinceId?: number
        districtId?: number
        wardCode?: string
      }

      const selectedAddr = addresses.find(addr => addr.id === validSelectedAddress)
      if (selectedAddr) {
        addressObj = {
          firstName: user.firstName,
          lastName: user.lastName,
          address: selectedAddr.address,
          ward: selectedAddr.ward,
          district: selectedAddr.district || '',
          province: selectedAddr.province,
          phone: selectedAddr.phone || user.phoneNumber || '',
          email: user.email,
          provinceId: selectedAddr.provinceId,
          districtId: selectedAddr.districtId,
          wardCode: selectedAddr.wardCode,
        }
      } else {
        // This should not happen after validation above
        throw new Error('Không tìm thấy địa chỉ giao hàng đã chọn')
      }

      // Map frontend payment method to backend format
      const paymentMethodMap: Record<string, string> = {
        'cod': 'cod',
        'banking': 'bank_transfer',
        'vnpay': 'vnpay',
        'momo': 'momo',
        'payos': 'payos'
      }

      // Create order using real API
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit
        })),
        isDirectBuy: isBuyNow,
        shippingAddress: addressObj,
        paymentMethod: paymentMethodMap[paymentMethod] || 'cod',
        shippingMethod: shippingMethod, // Send shipping method
        notes: orderNotes,
      }

      const { order, paymentUrl } = await orderService.createOrder(orderData)

      // Refresh cart to sync with backend (backend removed selected items)
      await refreshCart()

      // Clear selected items to avoid stale selections
      selectAllItems(false)

      // Redirect logic
      if (paymentUrl) {
        // Redirect to VNPay
        window.location.href = paymentUrl
      } else {
        // Redirect to success page
        window.location.href = `/order/success?orderId=${order.id}`
      }
    } catch (error) {
      alert('Đặt hàng thất bại. Vui lòng thử lại.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className='bg-white min-h-screen'>
      {/* Breadcrumb */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <nav className='flex items-center space-x-2 text-sm text-gray-600'>
            <Link to='/cart' className='hover:text-blue-600'>Giỏ hàng</Link>
            <ChevronRight className='w-4 h-4' />
            <span className='text-blue-600 font-medium'>Thanh toán</span>
          </nav>
        </div>
      </div>


      {/* Progress Steps */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <div className='flex items-center justify-center gap-2'>
            <Link to='/cart' className='flex items-center gap-2 text-blue-600'>
              <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                ✓
              </div>
              <span>Giỏ hàng</span>
            </Link>
            <ChevronRight className='w-4 h-4 text-gray-400' />
            <div className='flex items-center gap-2 text-blue-600'>
              <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                2
              </div>
              <span className='font-medium'>Thanh toán</span>
            </div>
            <ChevronRight className='w-4 h-4 text-gray-400' />
            <div className='flex items-center gap-2 text-gray-400'>
              <div className='w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium'>
                3
              </div>
              <span>Hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
          {/* Checkout Form - 60% width */}
          <div className='lg:col-span-3 space-y-6'>
            {/* Shipping Address */}
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  Thông tin giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {loading ? (
                  <div className='text-center py-4'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
                    <p className='mt-2 text-sm text-gray-600'>Đang tải thông tin...</p>
                  </div>
                ) : addresses && addresses.length > 0 ? (
                  <div className='space-y-3'>
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map((address, index) => (
                        <div key={address.id || index} className='flex items-start space-x-2'>
                          <RadioGroupItem value={address.id || `address-${index}`} id={address.id || `address-${index}`} />
                          <Label htmlFor={address.id || `address-${index}`} className='flex-1 cursor-pointer'>
                            <div className='p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='font-medium'>{address.name}</span>
                                <span className='text-gray-400'>|</span>
                                <span className='text-gray-600'>{address.phone}</span>
                                {address.isDefault && (
                                  <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
                                    Địa chỉ mặc định
                                  </Badge>
                                )}
                              </div>
                              <div className='text-sm text-gray-600'>
                                {address.address}, {address.ward}, {address.district}, {address.province}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <Button
                      variant='outline'
                      onClick={() => setUseNewAddress(true)}
                      className='w-full border-gray-200 text-blue-600'
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Giao đến địa chỉ khác
                    </Button>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có địa chỉ giao hàng</h3>
                    <p className='text-gray-500 mb-4'>Thêm địa chỉ để tiếp tục thanh toán</p>
                    <Button
                      onClick={() => setUseNewAddress(true)}
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Thêm địa chỉ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Form Dialog */}
            <AddressFormDialog
              open={useNewAddress}
              onOpenChange={setUseNewAddress}
              onSuccess={async () => {
                // Reload addresses
                const updatedAddresses = await addressService.getAddresses()
                setAddresses(updatedAddresses)

                // Set the new address as selected
                if (updatedAddresses.length > 0) {
                  const newAddress = updatedAddresses[updatedAddresses.length - 1]
                  setSelectedAddress(newAddress.id || '')
                }
              }}
              title="Thêm địa chỉ giao hàng"
              description="Thêm địa chỉ mới để giao hàng thuận tiện hơn"
              showEmail={false}
              showType={true}
              showNameFields={true}
              submitButtonText="Lưu địa chỉ"
            />

            {/* Shipping Method */}
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <Truck className='w-5 h-5' />
                  Phương thức giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className='space-y-3'>
                    {shippingMethods.map((method) => (
                      <div key={method.id} className='flex items-center space-x-2'>
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className='flex-1 cursor-pointer'>
                          <div className='p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
                            <div className='flex items-center justify-between mb-1'>
                              <div className='flex items-center gap-2'>
                                <Clock className='w-4 h-4 text-blue-500' />
                                <span className='font-medium'>{method.name}</span>
                                {subtotal >= 300000 ? (
                                  method.id === 'standard' ? (
                                    <Badge variant='secondary' className='bg-green-100 text-green-800 hover:bg-green-100'>
                                      Miễn phí
                                    </Badge>
                                  ) : (
                                    <div className='flex gap-2 items-center'>
                                      <span className='line-through text-gray-400 text-xs'>
                                        {new Intl.NumberFormat('vi-VN').format(method.price)}đ
                                      </span>
                                      <span>
                                        {new Intl.NumberFormat('vi-VN').format(Math.max(0, method.price - 30000))}đ
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <span>{new Intl.NumberFormat('vi-VN').format(method.price)}đ</span>
                                )}
                              </div>
                              <span className='font-medium text-blue-600'>
                                {method.price === 0
                                  ? 'Miễn phí'
                                  : `${new Intl.NumberFormat('vi-VN').format(method.price)}đ`}
                              </span>
                            </div>
                            <div className='text-sm text-gray-600'>{method.description}</div>
                            <div className='text-sm text-blue-600 mt-1'>Dự kiến: {method.estimatedDays}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <CreditCard className='w-5 h-5' />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className='space-y-3'>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className='flex items-center space-x-2'>
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className='flex-1 cursor-pointer'>
                          <div className='p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
                            <div className='flex items-center gap-3'>
                              <span className='text-2xl'>{method.icon}</span>
                              <div>
                                <div className='font-medium'>{method.name}</div>
                                <div className='text-sm text-gray-600'>{method.description}</div>
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Ghi chú đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder='Ghi chú cho đơn hàng (tùy chọn)'
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className='border-gray-200 focus:border-blue-500'
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - 40% width */}
          <div className='lg:col-span-2'>
            <div className='sticky top-6 space-y-6'>
              {/* Order Review */}
              <Card className='border-gray-200'>
                <CardHeader>
                  <CardTitle className='text-blue-800'>Đơn hàng của bạn</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    {cartItems.map((item) => (
                      <div key={item.productId} className='flex items-center gap-3'>
                        <div className='w-12 h-12 flex-shrink-0'>
                          <ImageWithFallback
                            src={item.image || '/placeholder-product.jpg'}
                            alt={item.name}
                            className='w-full h-full object-cover rounded border border-gray-200'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium text-sm line-clamp-1'>{item.name}</div>
                          <div className='text-xs text-gray-500'>
                            SL: {item.quantity}{item.unit ? ` x ${item.unit}` : ''}
                          </div>
                        </div>
                        <div className='text-sm font-medium text-blue-600'>
                          {new Intl.NumberFormat('vi-VN').format(item.totalPrice)}đ
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='text-center'>
                    <Link to='/cart' className='text-blue-600 hover:underline text-sm'>
                      Sửa giỏ hàng
                    </Link>
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Tạm tính</span>
                      <span>{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Phí vận chuyển</span>
                      <span>
                        {shippingFee === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(shippingFee)}đ`}
                      </span>
                    </div>

                    {/* {discount > 0 && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Giảm giá</span>
                          <span className='text-green-600'>-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
                        </div>
                      )} */}
                  </div>

                  <Separator />

                  <div className='flex justify-between text-lg font-bold'>
                    <span>Tổng cộng</span>
                    <span className='text-blue-600'>{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Checkout */}
              <Card className='border-gray-200'>
                <CardContent className='p-6 space-y-4'>
                  <div className='flex items-start space-x-2'>
                    <Checkbox
                      id='agree-terms'
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className='flex-shrink-0 mt-0.5'
                    />
                    <Label htmlFor='agree-terms' className='text-sm leading-relaxed flex-1 cursor-pointer'>
                      <span>
                        Tôi đồng ý với{' '}
                        <Link to='/terms' className='text-blue-600 hover:underline'>
                          điều khoản sử dụng
                        </Link>{' '}
                        và{' '}
                        <Link to='/privacy' className='text-blue-600 hover:underline'>
                          chính sách bảo mật
                        </Link>{' '}
                        của MediSpace
                      </span>
                    </Label>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={!agreeToTerms || isProcessing}
                    className='w-full text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-lg font-semibold'
                  >
                    {isProcessing ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Đang xử lý...
                      </div>
                    ) : (
                      <>Đặt hàng ({cartItems.length} sản phẩm - {new Intl.NumberFormat('vi-VN').format(total)}đ)</>
                    )}
                  </Button>

                  <div className='text-xs text-gray-500 text-center leading-relaxed'>
                    Bằng cách đặt hàng, bạn đồng ý với các điều khoản và chính sách của MediSpace
                  </div>
                </CardContent>
              </Card>

              {/* Trust Elements */}
              <Card className='border-gray-200'>
                <CardContent className='p-4 space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Shield className='w-4 h-4 text-green-500' />
                    <span>Thanh toán được bảo mật SSL</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <RotateCcw className='w-4 h-4 text-orange-500' />
                    <span>Đổi trả miễn phí trong 7 ngày</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Smartphone className='w-4 h-4 text-blue-500' />
                    <span>Hỗ trợ 24/7: 1800 6928</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
