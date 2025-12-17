import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Plus,
  Minus,
  X,
  Edit,
  AlertTriangle,
  Shield,
  Package,
  Phone,
  MessageCircle,
  History,
  MapPin,
  Truck,
  CreditCard,
  FileText,
  Search,
  User,
  Building2,
  Sparkles,
  Loader2,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { ProductSearchWidget } from '../products/ProductSearchWidget'
import { DrugInteractionChecker } from '../products/DrugInteractionChecker'
import { ProductNoteModal } from '../products/ProductNoteModal'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { toast } from 'sonner'
import { orderService, dashboardService } from '~/services/pharmacist'

interface Product {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  onSale?: boolean
  unit: string
  stock: number
  maxOrderQuantity?: number
  rating: number
  reviewCount?: number
  type: 'rx' | 'otc' | 'supplement' | 'cosmetic'
  brand: string
  barcode?: string
  sku?: string
  category?: { name: string }
  shortDescription?: string
  description?: string
  origin?: string
  packaging?: string
  expiryInfo?: string
  ingredients?: string | string[]
  uses?: string[]
  instructions?: string
  warnings?: string[]
  status?: 'active' | 'discontinued' | 'out_of_stock'
  requiresPrescription?: boolean
  tags?: string[]
}

interface OrderItem {
  id: string
  product: Product
  quantity: number
  notes: string
  warnings: string[]
}

interface CustomerInfo {
  phone: string
  name: string
  email: string
  tier: 'regular' | 'vip' | 'premium'
  totalPurchase: number
  prescriptionId?: string
}

const deliveryOptions = [
  { id: 'standard', label: 'Tiêu chuẩn', time: '2-3 ngày', price: 0, icon: Truck },
  { id: 'fast', label: 'Nhanh', time: 'Trong ngày', price: 15000, icon: Sparkles, recommended: true },
  { id: 'express', label: 'Siêu tốc', time: '2-4 giờ', price: 25000, icon: Truck },
]

const paymentMethods = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Package },
  { id: 'transfer', label: 'Chuyển khoản ngân hàng', icon: Building2 },
  { id: 'ewallet', label: 'Ví điện tử (MoMo/ZaloPay)', icon: CreditCard },
]

export function CreateOrderPage() {
  const [searchParams] = useSearchParams()
  const prescriptionId = searchParams.get('prescription')

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    phone: '',
    name: '',
    email: '',
    tier: 'regular',
    totalPurchase: 0,
  })
  const [searchPhone, setSearchPhone] = useState('')
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState('fast')
  const [selectedPayment, setSelectedPayment] = useState('cod')
  const [orderNotes, setOrderNotes] = useState('')
  const [pharmacistNotes, setPharmacistNotes] = useState('')
  const [showInteractionChecker, setShowInteractionChecker] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean
    itemId: string | null
    productName: string
    currentNote: string
  }>({
    isOpen: false,
    itemId: null,
    productName: '',
    currentNote: '',
  })
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    ward: '',
    district: '',
    province: '',
  })

  const handleProductAdd = (product: Product, quantity: number) => {
    const existingItem = orderItems.find((item) => item.product.id === product.id)

    if (existingItem) {
      setOrderItems((items) =>
        items.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)),
      )
    } else {
      const newItem: OrderItem = {
        id: Math.random().toString(36).substr(2, 9),
        product,
        quantity,
        notes: '',
        warnings: product.type === 'rx' ? ['Cần theo dõi dị ứng'] : [],
      }
      setOrderItems((items) => [...items, newItem])
    }

    toast.success(`Đã thêm ${product.name} vào đơn hàng`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProductInfo = (product: Product) => {
    // Handle product info display - TODO: implement product info modal
  }

  const handleSearchCustomer = async () => {
    if (!searchPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }

    try {
      setIsSearchingCustomer(true)
      const results = await dashboardService.searchPatient(searchPhone)

      if (results.length > 0) {
        const patient = results[0]

        // Split full name if needed
        const nameParts = patient.fullName.split(' ')
        const lastName = nameParts.pop() || ''
        const firstName = nameParts.join(' ') || lastName

        // Map patient data to customer info
        setCustomerInfo({
          phone: patient.phoneNumber || searchPhone,
          name: patient.fullName,
          email: patient.email || '',
          tier: 'regular',
          totalPurchase: 0,
        })

        // Auto-fill shipping address if customer found
        setShippingAddress((prev) => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          phone: patient.phoneNumber || searchPhone,
          email: patient.email || '',
        }))

        toast.success(`Đã tìm thấy khách hàng: ${patient.fullName}`)
      } else {
        // If customer not found, use phone number only
        setCustomerInfo({
          phone: searchPhone,
          name: '',
          email: '',
          tier: 'regular',
          totalPurchase: 0,
        })
        toast.info('Không tìm thấy khách hàng. Vui lòng nhập thông tin địa chỉ giao hàng.')
      }
    } catch (error) {
      // If error, use phone number only
      setCustomerInfo({
        phone: searchPhone,
        name: '',
        email: '',
        tier: 'regular',
        totalPurchase: 0,
      })
      toast.info('Lỗi khi tìm kiếm. Vui lòng thử lại.')
    } finally {
      setIsSearchingCustomer(false)
    }
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems((items) => items.filter((item) => item.id !== itemId))
      return
    }

    setOrderItems((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setOrderItems((items) => items.map((item) => (item.id === itemId ? { ...item, notes } : item)))
  }

  const openNoteModal = (itemId: string, productName: string, currentNote: string) => {
    setNoteModalState({
      isOpen: true,
      itemId,
      productName,
      currentNote,
    })
  }

  const closeNoteModal = () => {
    setNoteModalState({
      isOpen: false,
      itemId: null,
      productName: '',
      currentNote: '',
    })
  }

  const saveNote = (note: string) => {
    if (noteModalState.itemId) {
      updateItemNotes(noteModalState.itemId, note)
    }
  }

  const removeItem = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId))
  }

  const checkDrugInteractions = () => {
    if (orderItems.length < 2) {
      toast.info('Cần ít nhất 2 sản phẩm để kiểm tra tương tác')
      return
    }
    setShowInteractionChecker(true)
  }

  const calculateSubtotal = () => {
    try {
      return orderItems.reduce((sum, item) => {
        const price = item.product?.price || 0
        const quantity = item.quantity || 0
        return sum + price * quantity
      }, 0)
    } catch {
      return 0
    }
  }

  const calculateDiscount = () => {
    return customerInfo?.tier === 'vip' ? 5000 : 0
  }

  const calculateDeliveryFee = () => {
    try {
      const option = deliveryOptions.find((opt) => opt.id === selectedDelivery)
      return option?.price || 0
    } catch {
      return 0
    }
  }

  const calculateTotal = () => {
    try {
      return calculateSubtotal() - calculateDiscount() + calculateDeliveryFee()
    } catch {
      return 0
    }
  }

  const handleCreateOrder = async () => {
    // Validation
    if (orderItems.length === 0) {
      toast.error('Vui lòng thêm sản phẩm vào đơn hàng')
      return
    }

    if (!customerInfo.phone) {
      toast.error('Vui lòng nhập số điện thoại khách hàng')
      return
    }

    if (!shippingAddress.address || !shippingAddress.ward || !shippingAddress.district || !shippingAddress.province) {
      toast.error('Vui lòng nhập đầy đủ địa chỉ giao hàng')
      return
    }

    if (!shippingAddress.firstName || !shippingAddress.lastName) {
      toast.error('Vui lòng nhập tên người nhận')
      return
    }

    try {
      setIsCreatingOrder(true)

      // Prepare order data
      const orderData = {
        customerId: customerInfo.phone, // Using phone as customerId for now
        prescriptionId: prescriptionId || undefined,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone || customerInfo.phone,
          email: shippingAddress.email || customerInfo.email,
          address: shippingAddress.address,
          ward: shippingAddress.ward,
          district: shippingAddress.district,
          province: shippingAddress.province,
        },
        deliveryMethod: selectedDelivery,
        paymentMethod: selectedPayment,
        orderNotes: orderNotes || undefined,
        pharmacistNotes: pharmacistNotes || undefined,
      }

      // Call API to create order
      const response = await orderService.createOrder(orderData)

      toast.success(`Đã tạo đơn hàng #${response.orderNumber} thành công!`, {
        description: `Mã đơn hàng: ${response.orderId}`,
        duration: 3000,
      })

      // Reset form
      setOrderItems([])
      setOrderNotes('')
      setPharmacistNotes('')
      setSearchPhone('')
      setCustomerInfo({
        phone: '',
        name: '',
        email: '',
        tier: 'regular',
        totalPurchase: 0,
      })
      setShippingAddress({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        ward: '',
        district: '',
        province: '',
      })

      // Redirect to order details or list
      // window.location.href = `/pharmacist/orders/${response.orderId}`
    } catch (error) {

      toast.error('Không thể tạo đơn hàng', {
        description: 'Vui lòng kiểm tra lại thông tin và thử lại',
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
            }}
          >
            Tạo đơn hàng
          </h1>
          <p className='text-gray-600'>Tạo và quản lý đơn hàng cho khách hàng</p>
        </div>
        {prescriptionId && (
          <Badge variant='outline' className='border-blue-200 text-blue-700'>
            <FileText className='w-3 h-3 mr-1' />
            Từ đơn thuốc #{prescriptionId}
          </Badge>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT COLUMN - Product Search & Cart */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Product Search */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <Search className='w-5 h-5 mr-2' />
                Tìm kiếm sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearchWidget onProductAdd={handleProductAdd} onProductInfo={handleProductInfo} />
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center justify-between'>
                <div className='flex items-center'>
                  <h4 className='font-medium text-blue-900 flex items-center gap-2'>
                    <Package className='w-5 h-5 mr-2' />
                    GIỎ HÀNG
                  </h4>
                  {orderItems.length > 0 && (
                    <Badge className='ml-2 bg-blue-600 text-white'>{orderItems.length} sản phẩm</Badge>
                  )}
                </div>
                {orderItems.length > 1 && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={checkDrugInteractions}
                    className='border-amber-300 text-amber-700 hover:bg-amber-50'
                  >
                    <Shield className='w-4 h-4 mr-1' />
                    Kiểm tra tương tác
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className='text-center py-12 text-gray-500'>
                  <Package className='w-16 h-16 mx-auto mb-3 text-gray-300' />
                  <p>Chưa có sản phẩm nào trong giỏ hàng</p>
                  <p className='text-sm mt-1'>Sử dụng thanh tìm kiếm phía trên để thêm sản phẩm</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {orderItems.map((item) => (
                    <Card key={item.id} className='p-4 border border-gray-200 hover:border-blue-200 transition-colors'>
                      <div className='flex gap-4'>
                        {/* Product Image */}
                        <ImageWithFallback
                          src={item.product.image}
                          alt={item.product.name}
                          className='w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0'
                        />

                        {/* Product Info */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-gray-900 line-clamp-1 mb-1'>{item.product.name}</h4>
                              <div className='flex items-center gap-2'>
                                <span className='text-blue-600'>{item.product.price.toLocaleString('vi-VN')}đ</span>
                                {item.product.type === 'rx' && (
                                  <Badge variant='destructive' className='text-xs'>
                                    Kê đơn
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => removeItem(item.id)}
                              className='text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1'
                            >
                              <X className='w-4 h-4' />
                            </Button>
                          </div>

                          {/* Quantity Controls */}
                          <div className='flex items-center gap-3'>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className='h-8 w-8 p-0'
                              >
                                <Minus className='w-3 h-3' />
                              </Button>

                              <Input
                                type='number'
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                className='w-16 h-8 text-center border-blue-200 focus:border-blue-500'
                                min='0'
                              />

                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className='h-8 w-8 p-0'
                              >
                                <Plus className='w-3 h-3' />
                              </Button>
                            </div>

                            <div className='text-gray-900'>
                              = {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                            </div>

                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => openNoteModal(item.id, item.product.name, item.notes)}
                              className='ml-auto border-blue-200 text-blue-700 hover:bg-blue-50'
                            >
                              <Edit className='w-3 h-3 mr-1' />
                              Ghi chú
                            </Button>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <Alert className='mt-3 border-blue-200 bg-blue-50'>
                              <AlertDescription className='text-sm text-blue-900'>
                                <FileText className='w-3 h-3 inline mr-1' />
                                {item.notes}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Warnings */}
                          {item.warnings.length > 0 && (
                            <Alert className='mt-3 border-amber-200 bg-amber-50'>
                              <AlertDescription className='text-sm text-amber-900'>
                                <AlertTriangle className='w-3 h-3 inline mr-1' />
                                {item.warnings.join(', ')}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Order Summary */}
                  <Card className='p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Tạm tính:</span>
                        <span>{calculateSubtotal().toLocaleString('vi-VN')}đ</span>
                      </div>
                      {calculateDiscount() > 0 && (
                        <div className='flex justify-between text-sm text-green-600'>
                          <span>Chiết khấu dược sĩ:</span>
                          <span>-{calculateDiscount().toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className='flex justify-between text-sm text-gray-600'>
                        <span>Phí vận chuyển:</span>
                        <span>{calculateDeliveryFee().toLocaleString('vi-VN')}đ</span>
                      </div>
                      <Separator className='my-2' />
                      <div className='flex justify-between'>
                        <span className='text-gray-900'>Tổng cộng:</span>
                        <span className='text-blue-600'>{calculateTotal().toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </Card>

                  {/* Order Notes */}
                  <div>
                    <Label htmlFor='orderNotes' className='text-gray-900 mb-2 block text-sm'>
                      Ghi chú đơn hàng
                    </Label>
                    <Textarea
                      id='orderNotes'
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder='Thêm ghi chú về đơn hàng...'
                      className='border-2 border-blue-200 focus:border-blue-500 text-sm'
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Customer Info & Actions */}
        <div className='space-y-6'>
          {/* Customer Info */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <User className='w-5 h-5 mr-2' />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Số điện thoại khách hàng'
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchCustomer()
                    }
                  }}
                  className='border-2 border-blue-200 focus:border-blue-500 h-10'
                  disabled={isSearchingCustomer}
                />
                <Button
                  size='icon'
                  variant='outline'
                  className='flex-shrink-0 h-10 w-10'
                  onClick={handleSearchCustomer}
                  disabled={isSearchingCustomer}
                >
                  {isSearchingCustomer ? <Loader2 className='w-4 h-4 animate-spin' /> : <Search className='w-4 h-4' />}
                </Button>
              </div>

              {customerInfo.name && (
                <div className='p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100'>
                  <div className='space-y-3'>
                    <div>
                      <div className='text-gray-900'>{customerInfo.name}</div>
                      <div className='text-sm text-gray-600'>{customerInfo.email}</div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge variant={customerInfo.tier === 'vip' ? 'default' : 'secondary'} className='bg-blue-600'>
                        Khách {customerInfo.tier.toUpperCase()}
                      </Badge>
                      <span className='text-xs text-gray-600'>
                        Đã mua: {customerInfo.totalPurchase.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {customerInfo.prescriptionId && (
                      <div className='text-xs text-blue-600 flex items-center'>
                        <FileText className='w-3 h-3 mr-1' />
                        Đơn thuốc: #{customerInfo.prescriptionId}
                      </div>
                    )}

                    <div className='grid grid-cols-3 gap-2 pt-2'>
                      <Button size='sm' variant='outline' className='text-xs px-2'>
                        <Phone className='w-3 h-3 mr-1' />
                        Gọi
                      </Button>
                      <Button size='sm' variant='outline' className='text-xs px-2'>
                        <MessageCircle className='w-3 h-3 mr-1' />
                        Chat
                      </Button>
                      <Button size='sm' variant='outline' className='text-xs px-2'>
                        <History className='w-3 h-3 mr-1' />
                        Lịch sử
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <MapPin className='w-5 h-5 mr-2' />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label htmlFor='firstName' className='text-xs text-gray-600 mb-1.5 block'>
                    Họ *
                  </Label>
                  <Input
                    id='firstName'
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder='Họ'
                    className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                  />
                </div>
                <div>
                  <Label htmlFor='lastName' className='text-xs text-gray-600 mb-1.5 block'>
                    Tên *
                  </Label>
                  <Input
                    id='lastName'
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder='Tên'
                    className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='phone' className='text-xs text-gray-600 mb-1.5 block'>
                  Số điện thoại *
                </Label>
                <Input
                  id='phone'
                  value={shippingAddress.phone || customerInfo.phone}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder='Số điện thoại'
                  className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                />
              </div>

              <div>
                <Label htmlFor='email' className='text-xs text-gray-600 mb-1.5 block'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={shippingAddress.email || customerInfo.email}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder='Email'
                  className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                />
              </div>

              <div>
                <Label htmlFor='address' className='text-xs text-gray-600 mb-1.5 block'>
                  Địa chỉ *
                </Label>
                <Input
                  id='address'
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder='Số nhà, tên đường'
                  className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                />
              </div>

              <div>
                <Label htmlFor='ward' className='text-xs text-gray-600 mb-1.5 block'>
                  Phường/Xã *
                </Label>
                <Input
                  id='ward'
                  value={shippingAddress.ward}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, ward: e.target.value }))}
                  placeholder='Phường/Xã'
                  className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label htmlFor='district' className='text-xs text-gray-600 mb-1.5 block'>
                    Quận/Huyện *
                  </Label>
                  <Input
                    id='district'
                    value={shippingAddress.district}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, district: e.target.value }))}
                    placeholder='Quận/Huyện'
                    className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                  />
                </div>
                <div>
                  <Label htmlFor='province' className='text-xs text-gray-600 mb-1.5 block'>
                    Tỉnh/TP *
                  </Label>
                  <Input
                    id='province'
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, province: e.target.value }))}
                    placeholder='Tỉnh/Thành phố'
                    className='border-2 border-blue-200 focus:border-blue-500 text-sm h-10'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <Truck className='w-5 h-5 mr-2' />
                Giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {deliveryOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedDelivery === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedDelivery(option.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <input
                          type='radio'
                          checked={selectedDelivery === option.id}
                          onChange={() => setSelectedDelivery(option.id)}
                          className='text-blue-600'
                        />
                        <Icon className='w-4 h-4 text-gray-600' />
                        <div>
                          <div className='text-sm text-gray-900'>{option.label}</div>
                          <div className='text-xs text-gray-500'>{option.time}</div>
                        </div>
                      </div>
                      <div className='text-sm text-gray-900'>
                        {option.price === 0 ? 'Miễn phí' : `${option.price.toLocaleString('vi-VN')}đ`}
                      </div>
                    </div>
                    {option.recommended && (
                      <Badge variant='outline' className='mt-2 ml-9 border-blue-200 text-blue-700 text-xs'>
                        Khuyến nghị
                      </Badge>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <CreditCard className='w-5 h-5 mr-2' />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedPayment === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <div className='flex items-center gap-3'>
                      <input
                        type='radio'
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className='text-blue-600'
                      />
                      <Icon className='w-4 h-4 text-gray-600' />
                      <span className='text-sm text-gray-900'>{method.label}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Pharmacist Notes */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader>
              <CardTitle className='text-blue-900 flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Ghi chú dược sĩ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                placeholder='- Hướng dẫn sử dụng&#10;- Lưu ý đặc biệt&#10;- Theo dõi tác dụng phụ&#10;- Cảnh báo tương tác thuốc&#10;- Chế độ ăn uống khi dùng thuốc'
                className='border-2 border-blue-200 focus:border-blue-500 text-sm'
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Button
              onClick={handleCreateOrder}
              className='w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg'
              disabled={orderItems.length === 0 || isCreatingOrder}
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang tạo đơn hàng...
                </>
              ) : (
                <>
                  <Package className='w-4 h-4 mr-2' />
                  Tạo đơn hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Drug Interaction Checker Modal */}
      <DrugInteractionChecker
        drugs={orderItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          dosage: item.product.unit,
        }))}
        isOpen={showInteractionChecker}
        onClose={() => setShowInteractionChecker(false)}
        onAccept={(notes) => {
          if (notes) {
            setPharmacistNotes((prev) => prev + (prev ? '\n' : '') + notes)
          }
          toast.success('Đã xác nhận kiểm tra tương tác thuốc')
        }}
      />

      {/* Product Note Modal */}
      <ProductNoteModal
        isOpen={noteModalState.isOpen}
        onClose={closeNoteModal}
        onSave={saveNote}
        productName={noteModalState.productName}
        initialNote={noteModalState.currentNote}
      />
    </div>
  )
}
