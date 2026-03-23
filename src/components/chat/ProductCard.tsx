import { ShoppingCart, Pill, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { ProductRef } from '~/types/chat'

interface ProductCardProps {
    product: ProductRef
    isOwnMessage?: boolean
}

export function ProductCard({ product, isOwnMessage }: ProductCardProps) {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(product.price)

    return (
        <div className={`rounded-xl overflow-hidden shadow-md w-[220px] border ${
            isOwnMessage ? 'border-white/30 bg-white/10' : 'border-blue-100 bg-white'
        }`}>
            {/* Product image */}
            <div className="relative w-full h-32 bg-gray-100 overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-contain w-full h-full"
                    />
                ) : (
                    <Pill className="w-12 h-12 text-gray-300" />
                )}
                {product.requiresPrescription && (
                    <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                        Kê đơn
                    </Badge>
                )}
            </div>

            {/* Info */}
            <div className={`p-3 ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
                    {product.name}
                </p>
                <p className={`text-xs mb-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                    {product.unit}
                </p>
                <p className={`text-base font-bold ${isOwnMessage ? 'text-cyan-200' : 'text-blue-600'}`}>
                    {formattedPrice}
                </p>
            </div>

            {/* CTA */}
            <div className="px-3 pb-3">
                <a
                    href={`/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                >
                    <Button
                        size="sm"
                        className={`w-full text-xs h-8 gap-1.5 ${
                            isOwnMessage
                                ? 'bg-white text-blue-600 hover:bg-blue-50'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                        }`}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Mua ngay
                        <ExternalLink className="w-3 h-3 opacity-70" />
                    </Button>
                </a>
            </div>
        </div>
    )
}
