import { useState, useEffect } from 'react'
import { categoryService } from '../../services/categoryService'
import type { Category } from '../../types/product'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await categoryService.getCategories()

        // Transform flat categories into hierarchical structure
        const mainCategories = data.filter((cat) => cat.level === 1)
        const subCategories = data.filter((cat) => cat.level === 2)

        // Add subcategories to main categories
        const hierarchicalCategories = mainCategories.map((mainCat) => ({
          ...mainCat,
          subcategories: subCategories.filter((subCat) => subCat.path?.startsWith((mainCat.path || '') + '/'))
        }))

        setCategories(hierarchicalCategories)
        setError(null)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Không thể tải danh mục sản phẩm')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}
