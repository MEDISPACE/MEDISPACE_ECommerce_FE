import { useState } from 'react'
import { ShoppingCart, Pill, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { ProductRef } from '~/types/chat'
import { useCart } from '~/contexts/CartContext'

interface ProductCardProps {
  product: ProductRef
  isOwnMessage?: boolean
}

export function ProductCard({ product, isOwnMessage }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.requiresPrescription) return
    setIsAdding(true)
    try {
      await addToCart(
        {
          _id: product.productId,
          name: product.name,
        } as any,
        1,
        product.unit
      )
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm w-[160px] border flex-shrink-0 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
        isOwnMessage ? 'border-white/30 bg-white/10' : 'border-slate-100 bg-white'
      }`}
    >
      <a href={`/products/${product.slug}`} target='_blank' rel='noopener noreferrer' className='flex-1 flex flex-col'>
        {/* Product image */}
        <div className='relative w-full h-24 bg-slate-50 overflow-hidden flex items-center justify-center p-2'>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className='object-contain w-full h-full transition-transform hover:scale-105' />
          ) : (
            <Pill className='w-8 h-8 text-slate-300' />
          )}
          {product.requiresPrescription && (
            <Badge className='absolute top-1 left-1 bg-amber-500 text-white text-[8px] px-1 py-0.5 font-bold uppercase tracking-wider rounded-md'>Kê đơn</Badge>
          )}
        </div>

        {/* Info */}
        <div className={`p-2.5 flex-1 flex flex-col justify-between ${isOwnMessage ? 'text-white' : 'text-slate-800'}`}>
          <div>
            <p className='text-xs font-semibold leading-tight line-clamp-2 mb-1 hover:text-[#0A2463] transition-colors' title={product.name}>{product.name}</p>
            <p className={`text-[10px] mb-1 font-medium ${isOwnMessage ? 'text-white/70' : 'text-slate-400'}`}>{product.unit}</p>
          </div>
          <p className={`text-sm font-bold mt-1 ${isOwnMessage ? 'text-[#BFDBFE]' : 'text-[#0A2463]'}`}>{formattedPrice}</p>
        </div>
      </a>

      {/* CTA */}
      <div className='px-2 pb-2.5 pt-1'>
        <Button
          size='sm'
          disabled={isAdding || Boolean(product.requiresPrescription)}
          onClick={handleAddToCart}
          className={`w-full text-[10px] h-7 gap-1 font-semibold transition-all duration-200 active:scale-95 ${
            isOwnMessage
              ? 'bg-white text-[#0A2463] hover:bg-[#F0F6FF]'
              : 'bg-[#0A2463] hover:bg-[#1E40AF] text-white shadow-sm hover:shadow'
          }`}
        >
          {isAdding ? (
            <Loader2 className='w-3 h-3 animate-spin' />
          ) : (
            <ShoppingCart className='w-3 h-3' />
          )}
          Thêm vào giỏ
        </Button>
      </div>
    </div>
  )
}
