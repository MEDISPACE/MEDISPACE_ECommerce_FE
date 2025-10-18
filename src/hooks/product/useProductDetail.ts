import { useState, useEffect, useMemo } from 'react'
import { mockProducts } from '~/utils/mockData'

interface Product {
  id: string
  name: string
  slug: string
  category?: string
  categorySlug?: string
  isPrescription?: boolean
  images: string[]
  // ...other product properties
}

interface UseProductDetailProps {
  slug?: string
}

interface UseProductDetailReturn {
  product: Product | null
  isLoading: boolean
  relatedProducts: Product[]
  error: string | null
}

/**
 * Hook for managing product detail data and related products
 * Handles loading states and related product filtering
 */
export const useProductDetail = ({ slug }: UseProductDetailProps): UseProductDetailReturn => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Find product by slug
  const product = useMemo(() => {
    if (!slug) return null
    return mockProducts.find((p) => p.slug === slug) || null
  }, [slug])

  // Related products based on category
  const relatedProducts = useMemo(() => {
    if (!product) return []
    return mockProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 12)
  }, [product])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (!product && slug) {
        setError('Product not found')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [product, slug])

  return {
    product,
    isLoading,
    relatedProducts,
    error,
  }
}
