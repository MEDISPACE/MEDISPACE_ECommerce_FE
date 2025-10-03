import React from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { formatCurrency } from '~/utils/formatCurrency'
import type { CartItem as CartItemType } from '~/types/cart'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(item.id)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  return (
    <div className='flex items-center space-x-4 py-4 border-b border-gray-200'>
      {/* Product Image */}
      <div className='w-16 h-16 flex-shrink-0'>
        <img
          src={item.product.images[0] || '/placeholder-product.jpg'}
          alt={item.product.name}
          className='w-full h-full object-cover rounded-lg'
        />
      </div>

      {/* Product Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-medium text-gray-900 truncate'>{item.product.name}</h3>
        <p className='text-sm text-gray-500'>{item.product.category}</p>
        <div className='flex items-center space-x-2 mt-1'>
          <span className='text-sm font-semibold text-gray-900'>{formatCurrency(item.product.price)}</span>
          {item.product.originalPrice && item.product.originalPrice > item.product.price && (
            <span className='text-xs text-gray-500 line-through'>{formatCurrency(item.product.originalPrice)}</span>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          className='w-8 h-8 p-0'
          onClick={() => handleQuantityChange(item.quantity - 1)}
        >
          <Minus className='w-3 h-3' />
        </Button>
        <span className='w-8 text-center text-sm font-medium'>{item.quantity}</span>
        <Button
          variant='outline'
          size='sm'
          className='w-8 h-8 p-0'
          onClick={() => handleQuantityChange(item.quantity + 1)}
        >
          <Plus className='w-3 h-3' />
        </Button>
      </div>

      {/* Total Price */}
      <div className='text-right'>
        <p className='text-sm font-semibold text-gray-900'>{formatCurrency(item.product.price * item.quantity)}</p>
      </div>

      {/* Remove Button */}
      <Button
        variant='ghost'
        size='sm'
        className='text-red-600 hover:text-red-700 hover:bg-red-50'
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className='w-4 h-4' />
      </Button>
    </div>
  )
}
