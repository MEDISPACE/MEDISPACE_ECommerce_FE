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
        // Level 0 = Main categories (Thuốc, TPCN, Dược mỹ phẩm, etc.)
        // Level 1 = Subcategories
        // Level 2 = Sub-subcategories
        const mainCategories = data.filter((cat) => cat.level === 0)
        const subCategories = data.filter((cat) => cat.level === 1)
        const subSubCategories = data.filter((cat) => cat.level === 2)

        // Build 3-level hierarchy
        const hierarchicalCategories = mainCategories.map((mainCat) => {
          const subs = subCategories.filter((subCat) => subCat.path?.startsWith((mainCat.path || '') + '/'))

          return {
            ...mainCat,
            subcategories: subs.map((subCat) => ({
              ...subCat,
              subcategories: subSubCategories.filter((subSubCat) =>
                subSubCat.path?.startsWith((subCat.path || '') + '/')
              )
            }))
          }
        })

        setCategories(hierarchicalCategories)
        setError(null)
      } catch (err) {
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
