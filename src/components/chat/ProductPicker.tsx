import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, X, Pill, Package } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import apiClient from '~/services/apiClient'
import type { ProductRef } from '~/types/chat'

interface ProductPickerProps {
    onSelect: (product: ProductRef) => void
    onClose: () => void
}

interface ProductSearchResult {
    _id: string
    name: string
    slug: string
    featuredImage?: string
    priceVariants: Array<{ price: number; unit: string; isDefault: boolean }>
    requiresPrescription: boolean
    stockQuantity: number
}

export function ProductPicker({ onSelect, onClose }: ProductPickerProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ProductSearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return }
        try {
            setIsLoading(true)
            const res = await apiClient.get('/products', {
                params: { search: q, limit: 8, page: 1, status: 'active' }
            })
            setResults(res.data?.result?.products || res.data?.data?.products || [])
        } catch {
            setResults([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer)
        const timer = setTimeout(() => search(query), 350)
        setDebounceTimer(timer)
        return () => clearTimeout(timer)
    }, [query]) // eslint-disable-line

    const getDefaultVariant = (product: ProductSearchResult) => {
        return product.priceVariants.find(v => v.isDefault) || product.priceVariants[0]
    }

    const handleSelect = (product: ProductSearchResult) => {
        const variant = getDefaultVariant(product)
        onSelect({
            productId: product._id,
            name: product.name,
            slug: product.slug,
            price: variant?.price || 0,
            unit: variant?.unit || 'Sản phẩm',
            imageUrl: product.featuredImage,
            requiresPrescription: product.requiresPrescription
        })
        onClose()
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    return (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden"
            style={{ maxHeight: '380px' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-cyan-500">
                <div className="flex items-center gap-2 text-white">
                    <Pill className="w-4 h-4" />
                    <span className="text-sm font-semibold">Gửi sản phẩm</span>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Tìm sản phẩm... (VD: paracetamol, vitamin C)"
                        className="pl-9 h-9 text-sm border-gray-200"
                    />
                </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-500">Đang tìm...</span>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        {query ? (
                            <>
                                <Package className="w-8 h-8 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">Không tìm thấy sản phẩm "{query}"</p>
                            </>
                        ) : (
                            <>
                                <Pill className="w-8 h-8 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">Nhập tên thuốc hoặc tên sản phẩm để tìm kiếm</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {results.map(product => {
                            const variant = getDefaultVariant(product)
                            return (
                                <button
                                    key={product._id}
                                    onClick={() => handleSelect(product)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left group"
                                >
                                    {/* Image */}
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {product.featuredImage ? (
                                            <img src={product.featuredImage} alt={product.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Pill className="w-6 h-6 text-gray-300" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-1.5 mb-0.5">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                            {product.requiresPrescription && (
                                                <Badge className="bg-orange-100 text-orange-600 text-[10px] px-1 py-0 flex-shrink-0">Kê đơn</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-1">{variant?.unit}</p>
                                        <p className="text-sm font-semibold text-blue-600">{formatPrice(variant?.price || 0)}</p>
                                    </div>

                                    {/* Send indicator */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex-shrink-0">
                                        Gửi
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
