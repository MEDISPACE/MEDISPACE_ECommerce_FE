import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Loader2, Pill, ShoppingCart } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { ProductRef } from '~/types/chat'
import { useCart } from '~/contexts/CartContext'

interface ProductCardProps {
  product: ProductRef
  isOwnMessage?: boolean
  variant?: 'compact' | 'attachment' | 'grid'
}

export function ProductCard({ product, variant = 'compact' }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price)

  const handleAddToCart = async (e: MouseEvent<HTMLButtonElement>) => {
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
        product.unit,
      )
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      data-chat-product-card
      className={`flex-shrink-0 overflow-hidden rounded-xl border border-white/60 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md ${
        variant === 'attachment' ? 'w-[260px] max-w-full' : variant === 'grid' ? 'w-full min-w-0' : 'w-[196px]'
      }`}
    >
      <Link to={`/products/${product.slug}`} className='group block' aria-label={`Xem chi tiet ${product.name}`}>
        <div className='relative flex h-24 w-full items-center justify-center overflow-hidden bg-slate-50 p-2.5'>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className='h-full w-full object-contain transition-transform duration-200 group-hover:scale-105'
            />
          ) : (
            <Pill className='h-8 w-8 text-slate-300' />
          )}

          <span className='absolute right-2 top-2 rounded-full bg-white/95 p-1 text-[#0A2463] opacity-0 shadow-sm transition-opacity group-hover:opacity-100'>
            <ArrowRight className='h-3.5 w-3.5' />
          </span>

          {product.requiresPrescription && (
            <Badge
              data-chat-product-badge
              className='absolute left-2 top-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white'
            >
              Kê đơn
            </Badge>
          )}
        </div>

        <div className='flex min-h-[86px] flex-col justify-between p-2.5'>
          <div className='min-w-0'>
            <p
              data-chat-product-title
              className='mb-1 line-clamp-2 text-xs font-semibold leading-tight text-slate-900 transition-colors group-hover:text-[#0A2463]'
              title={product.name}
            >
              {product.name}
            </p>
            <p data-chat-product-muted className='text-[10px] font-medium text-slate-500'>
              {product.unit}
            </p>
          </div>
          <p data-chat-product-price className='mt-2 text-sm font-bold text-[#0A2463]'>
            {formattedPrice}
          </p>
        </div>
      </Link>

      <div className='px-2.5 pb-2.5'>
        <Button
          data-chat-product-cta
          size='sm'
          disabled={isAdding || Boolean(product.requiresPrescription)}
          onClick={handleAddToCart}
          className='h-8 w-full gap-1 rounded-lg bg-[#0A2463] text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1E40AF] active:scale-95 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100'
        >
          {isAdding ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <ShoppingCart className='h-3.5 w-3.5' />}
          {product.requiresPrescription ? 'Cần đơn thuốc' : 'Thêm vào giỏ'}
        </Button>
      </div>
    </div>
  )
}
