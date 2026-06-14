import { useQuery } from '@tanstack/react-query'
import { categoryService } from '../../services/categoryService'
import type { Category } from '../../types/product'

function buildCategoryHierarchy(data: Category[]): Category[] {
  // Level 0 = Main categories, Level 1 = subcategories, Level 2 = sub-subcategories.
  const mainCategories = data.filter((cat) => cat.level === 0)
  const subCategories = data.filter((cat) => cat.level === 1)
  const subSubCategories = data.filter((cat) => cat.level === 2)

  return mainCategories.map((mainCat) => {
    const mainCatId = mainCat._id?.toString()
    const subs = subCategories.filter((subCat) => subCat.parentId?.toString() === mainCatId)

    return {
      ...mainCat,
      subcategories: subs.map((subCat) => {
        const subCatId = subCat._id?.toString()
        return {
          ...subCat,
          subcategories: subSubCategories.filter((subSubCat) => subSubCat.parentId?.toString() === subCatId),
        }
      }),
    }
  })
}

export function useCategories() {
  const query = useQuery({
    queryKey: ['categories', 'hierarchy'],
    queryFn: async () => buildCategoryHierarchy(await categoryService.getCategories()),
  })

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Không thể tải danh mục sản phẩm' : null,
    refetch: query.refetch,
  }
}
