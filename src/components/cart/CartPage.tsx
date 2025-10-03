import React, { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ShoppingBag, Truck, Shield, Clock } from 'lucide-react'
import { Button } from '~/components/ui/button'
import CartItem from './CartItem'
import { formatCurrency } from '~/utils/formatCurrency'
import type { CartItem as CartItemType } from '~/types/cart'

// Mock cart data
const mockCartItems: CartItemType[] = [
  {
    id: '1',
    productId: '1',
    quantity: 2,
    price: 25000,
    total: 50000,
    prescriptionRequired: false,
    addedAt: new Date().toISOString(),
    product: {
      id: '1',
      slug: 'paracetamol-500mg',
      name: 'Paracetamol 500mg',
      description: 'Thuốc giảm đau, hạ sốt hiệu quả',
      price: 25000,
      originalPrice: 30000,
      images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400'],
      thumbnail: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200',
      category: 'Giảm đau',
      brand: 'Traphaco',
      sku: 'PAR-500-30',
      stock: 100,
      isInStock: true,
      requiresPrescription: false,
      form: 'tablet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
]

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemType[]>(mockCartItems)

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const handleRemoveItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal >= 500000 ? 0 : 30000
  const total = subtotal + shipping

  if (cartItems.length === 0) {
    return (
      <div className='container mx-auto px-4 py-16 text-center'>
        <ShoppingBag className='w-16 h-16 text-gray-400 mx-auto mb-4' />
        <h2 className='text-2xl font-semibold text-gray-900 mb-2'>Giỏ hàng trống</h2>
        <p className='text-gray-600 mb-8'>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
        <Link to='/products'>
          <Button className='bg-gradient-to-r from-blue-600 to-cyan-500'>Tiếp tục mua sắm</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='flex items-center space-x-4 mb-8'>
        <Link to='/products'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Tiếp tục mua sắm
          </Button>
        </Link>
        <h1 className='text-3xl font-bold text-gray-900'>Giỏ hàng ({cartItems.length} sản phẩm)</h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Cart Items */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Sản phẩm trong giỏ</h2>

            <div className='space-y-4'>
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg border border-gray-200 p-6 sticky top-4'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Tóm tắt đơn hàng</h2>

            <div className='space-y-3 mb-6'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Tạm tính</span>
                <span className='font-medium'>{formatCurrency(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Phí vận chuyển</span>
                <span className='font-medium'>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
              </div>
              <div className='border-t border-gray-200 pt-3'>
                <div className='flex justify-between text-lg font-semibold'>
                  <span>Tổng cộng</span>
                  <span className='text-blue-600'>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Button className='w-full mb-4 bg-gradient-to-r from-blue-600 to-cyan-500'>Tiến hành thanh toán</Button>

            {/* Trust Indicators */}
            <div className='space-y-3 text-sm text-gray-600'>
              <div className='flex items-center space-x-2'>
                <Truck className='w-4 h-4 text-green-600' />
                <span>Miễn phí giao hàng cho đơn từ 500.000đ</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Shield className='w-4 h-4 text-blue-600' />
                <span>Thuốc chính hãng, đảm bảo chất lượng</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Clock className='w-4 h-4 text-purple-600' />
                <span>Giao hàng nhanh trong 1-2 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
