import { useState, useEffect } from 'react'
import { productService } from '~/services/productService'
import type { Product } from '~/types/product'

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
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!slug) {
        setProduct(null)
        setRelatedProducts([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch product by slug
        const productData = await productService.getProductBySlug(slug)
        setProduct(productData)

        if (productData) {
          // Fetch related products
          const related = await productService.getRelatedProducts(productData._id || productData.id!)
          setRelatedProducts(related)
        } else {
          setRelatedProducts([])
          setError('Product not found')
        }
      } catch (err) {
        setError('Failed to load product details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductDetail()
  }, [slug])

  return {
    product,
    isLoading,
    relatedProducts,
    error,
  }
}
