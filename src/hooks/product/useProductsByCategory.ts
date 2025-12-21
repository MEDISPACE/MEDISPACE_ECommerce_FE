import { useState, useEffect } from 'react'
import { productService } from '../../services/productService'
import type { Product } from '../../types/product'

export function useProductsByCategory(categoryId: string | undefined, limit: number = 4) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoryId) {
      setProducts([])
      return
    }

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const products = await productService.getProducts({
          categoryId,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        setProducts(products || [])
        setError(null)
      } catch (err) {
        setError('Không thể tải sản phẩm')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId, limit])

  return { products, loading, error }
}
