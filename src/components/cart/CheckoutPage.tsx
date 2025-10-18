import { useState } from 'react'
import { Link } from 'react-router'
import { Shield, ChevronRight, MapPin, CreditCard, Truck, Clock, Smartphone, Plus, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import type { Address, ShippingMethod, PaymentMethod, CartItem } from '../../types/product'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

const mockAddresses: Address[] = [
  {
    id: '1',
    fullName: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'nguyenvana@email.com',
    address: '123 Nguyễn Văn Cừ',
    province: 'TP.HCM',
    district: 'Quận 5',
    ward: 'Phường 4',
    isDefault: true,
  },
]

const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng trong 2-3 ngày',
    price: 0,
    estimatedDays: '2-3 ngày',
  },
  {
    id: 'fast',
    name: 'Giao hàng nhanh',
    description: 'Giao hàng trong ngày',
    price: 15000,
    estimatedDays: 'Trong ngày',
  },
  {
    id: 'express',
    name: 'Giao hàng siêu tốc',
    description: 'Giao hàng trong 2-4 giờ',
    price: 25000,
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
    id: 'banking',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản qua ngân hàng',
    icon: '🏦',
    type: 'banking',
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    icon: '📱',
    type: 'ewallet',
  },
  {
    id: 'credit',
    name: 'Thẻ tín dụng/ghi nợ',
    description: 'Visa, Mastercard, JCB',
    icon: '💳',
    type: 'credit',
  },
]

export function CheckoutPage() {
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0].id)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    district: '',
    ward: '',
    saveAsDefault: false,
  })

  const breadcrumbItems = [{ label: 'Giỏ hàng', href: '/cart' }, { label: 'Thanh toán' }]

  // Calculate totals - TODO: Replace with real cart data
  const cartItems: CartItem[] = [] // mockCartItems.filter((item: CartItem) => item.selected)
  const subtotal = cartItems.reduce(
    (sum: number, item: CartItem) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  )
  const discount = 50000
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethod)
  const shippingFee = selectedShipping?.price || 0
  const total = subtotal - discount + shippingFee

  const handlePlaceOrder = async () => {
    if (!agreeToTerms) {
      alert('Vui lòng đồng ý với điều khoản sử dụng')
      return
    }

    setIsProcessing(true)

    try {
      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Redirect to success page
      window.location.href = '/order-success'
    } catch (error) {
      console.error('Order failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className='bg-blue-50 min-h-screen'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        {/* Security Header */}
        <div className='bg-white border-b border-blue-200'>
          <div className='max-w-7xl mx-auto px-4 py-3'>
            <div className='flex items-center justify-center gap-2 text-green-600'>
              <Shield className='w-5 h-5' />
              <span className='font-medium'>Thanh toán an toàn SSL</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className='bg-white border-b border-blue-200'>
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
              <Card className='border-blue-100'>
                <CardHeader>
                  <CardTitle className='text-blue-800 flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Saved Addresses */}
                  {mockAddresses.length > 0 && !useNewAddress && (
                    <div className='space-y-3'>
                      <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                        {mockAddresses.map((address) => (
                          <div key={address.id} className='flex items-start space-x-2'>
                            <RadioGroupItem value={address.id} id={address.id} />
                            <Label htmlFor={address.id} className='flex-1 cursor-pointer'>
                              <div className='p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <span className='font-medium'>{address.fullName}</span>
                                  <span className='text-gray-400'>|</span>
                                  <span className='text-gray-600'>{address.phone}</span>
                                  {address.isDefault && (
                                    <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
                                      Mặc định
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
                        className='w-full border-blue-200 text-blue-600'
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Giao đến địa chỉ khác
                      </Button>
                    </div>
                  )}

                  {/* New Address Form */}
                  {(useNewAddress || mockAddresses.length === 0) && (
                    <div className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='fullName'>Họ tên *</Label>
                          <Input
                            id='fullName'
                            value={newAddress.fullName}
                            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                            placeholder='Nhập họ tên'
                            className='border-blue-200 focus:border-blue-500'
                          />
                        </div>
                        <div>
                          <Label htmlFor='phone'>Số điện thoại *</Label>
                          <Input
                            id='phone'
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            placeholder='Nhập số điện thoại'
                            className='border-blue-200 focus:border-blue-500'
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          type='email'
                          value={newAddress.email}
                          onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                          placeholder='Nhập email'
                          className='border-blue-200 focus:border-blue-500'
                        />
                      </div>

                      <div>
                        <Label htmlFor='address'>Địa chỉ cụ thể *</Label>
                        <Input
                          id='address'
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          placeholder='Số nhà, tên đường'
                          className='border-blue-200 focus:border-blue-500'
                        />
                      </div>

                      <div className='grid grid-cols-3 gap-4'>
                        <div>
                          <Label>Tỉnh/Thành phố *</Label>
                          <Select
                            value={newAddress.province}
                            onValueChange={(value) => setNewAddress({ ...newAddress, province: value })}
                          >
                            <SelectTrigger className='border-blue-200'>
                              <SelectValue placeholder='Chọn tỉnh/thành' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='hcm'>TP.HCM</SelectItem>
                              <SelectItem value='hanoi'>Hà Nội</SelectItem>
                              <SelectItem value='danang'>Đà Nẵng</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quận/Huyện *</Label>
                          <Select
                            value={newAddress.district}
                            onValueChange={(value) => setNewAddress({ ...newAddress, district: value })}
                          >
                            <SelectTrigger className='border-blue-200'>
                              <SelectValue placeholder='Chọn quận/huyện' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='q1'>Quận 1</SelectItem>
                              <SelectItem value='q3'>Quận 3</SelectItem>
                              <SelectItem value='q5'>Quận 5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Phường/Xã *</Label>
                          <Select
                            value={newAddress.ward}
                            onValueChange={(value) => setNewAddress({ ...newAddress, ward: value })}
                          >
                            <SelectTrigger className='border-blue-200'>
                              <SelectValue placeholder='Chọn phường/xã' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='p1'>Phường 1</SelectItem>
                              <SelectItem value='p2'>Phường 2</SelectItem>
                              <SelectItem value='p3'>Phường 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='saveAsDefault'
                          checked={newAddress.saveAsDefault}
                          onCheckedChange={(checked) =>
                            setNewAddress({ ...newAddress, saveAsDefault: checked as boolean })
                          }
                        />
                        <Label htmlFor='saveAsDefault' className='text-sm'>
                          Lưu làm địa chỉ mặc định
                        </Label>
                      </div>

                      {mockAddresses.length > 0 && (
                        <Button
                          variant='outline'
                          onClick={() => setUseNewAddress(false)}
                          className='w-full border-blue-200 text-blue-600'
                        >
                          Quay lại địa chỉ đã lưu
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card className='border-blue-100'>
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
                                  {method.price === 0 && (
                                    <Badge className='bg-green-100 text-green-700'>Miễn phí</Badge>
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
              <Card className='border-blue-100'>
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
              <Card className='border-blue-100'>
                <CardHeader>
                  <CardTitle className='text-blue-800'>Ghi chú đơn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder='Ghi chú cho đơn hàng (tùy chọn)'
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className='border-blue-200 focus:border-blue-500'
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary - 40% width */}
            <div className='lg:col-span-2'>
              <div className='sticky top-6 space-y-6'>
                {/* Order Review */}
                <Card className='border-blue-100'>
                  <CardHeader>
                    <CardTitle className='text-blue-800'>Đơn hàng của bạn</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Items */}
                    <div className='space-y-3'>
                      {cartItems.map((item: CartItem) => (
                        <div key={item.id} className='flex items-center gap-3'>
                          <div className='w-12 h-12 flex-shrink-0'>
                            <ImageWithFallback
                              src={item.product.images?.[0] || item.product.featuredImage || '/placeholder-product.jpg'}
                              alt={item.product.name}
                              className='w-full h-full object-cover rounded border border-gray-200'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm line-clamp-1'>{item.product.name}</div>
                            <div className='text-xs text-gray-500'>SL: {item.quantity}</div>
                          </div>
                          <div className='text-sm font-medium text-blue-600'>
                            {new Intl.NumberFormat('vi-VN').format(
                              (item.product.salePrice ?? item.product.originalPrice ?? 0) * item.quantity,
                            )}
                            đ
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

                      {discount > 0 && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Giảm giá</span>
                          <span className='text-green-600'>-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className='flex justify-between text-lg font-bold'>
                      <span>Tổng cộng</span>
                      <span className='text-blue-600'>{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Terms & Checkout */}
                <Card className='border-blue-100'>
                  <CardContent className='p-6 space-y-4'>
                    <div className='flex items-start space-x-2'>
                      <Checkbox
                        id='agree-terms'
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                        className='flex-shrink-0 mt-0.5'
                      />
                      <Label htmlFor='agree-terms' className='text-sm leading-relaxed flex-1'>
                        Tôi đồng ý với{' '}
                        <Link to='/terms' className='text-blue-600 hover:underline'>
                          điều khoản sử dụng
                        </Link>{' '}
                        và{' '}
                        <Link to='/privacy' className='text-blue-600 hover:underline'>
                          chính sách bảo mật
                        </Link>{' '}
                        của MediSpace
                      </Label>
                    </div>

                    <Button
                      onClick={handlePlaceOrder}
                      disabled={!agreeToTerms || isProcessing}
                      className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-lg font-semibold'
                    >
                      {isProcessing ? (
                        <div className='flex items-center gap-2'>
                          <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                          Đang xử lý...
                        </div>
                      ) : (
                        <>Đặt hàng ({new Intl.NumberFormat('vi-VN').format(total)}đ)</>
                      )}
                    </Button>

                    <div className='text-xs text-gray-500 text-center leading-relaxed'>
                      Bằng cách đặt hàng, bạn đồng ý với các điều khoản và chính sách của MediSpace
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Elements */}
                <Card className='border-blue-100'>
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
