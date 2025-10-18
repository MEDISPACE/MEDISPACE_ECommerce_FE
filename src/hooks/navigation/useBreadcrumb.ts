import { useMemo } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface Product {
  name: string
  category?: string
  categorySlug?: string
  isPrescription?: boolean
}

interface UseBreadcrumbProps {
  product?: Product
  basePath?: string
}

/**
 * Custom hook for generating breadcrumb navigation
 * Creates contextual breadcrumbs based on product category and type
 */
export const useBreadcrumb = ({ product, basePath = '/products' }: UseBreadcrumbProps): BreadcrumbItem[] => {
  return useMemo(() => {
    if (!product) return []

    const items: BreadcrumbItem[] = [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: basePath },
    ]

    // Add category if available
    if (product.category && product.categorySlug) {
      items.push({
        label: product.category,
        href: `${basePath}/category/${product.categorySlug}`,
      })
    }

    // Add prescription type for medical products
    if (product.isPrescription !== undefined) {
      if (product.isPrescription) {
        items.push({
          label: 'Thuốc kê đơn',
          href: `${basePath}/prescription`,
        })
      } else {
        items.push({
          label: 'Thuốc không kê đơn',
          href: `${basePath}/otc`,
        })
      }
    }

    // Add product name as final breadcrumb (not clickable)
    items.push({
      label: product.name,
      href: '#',
    })

    return items
  }, [product, basePath])
}

/**
 * Hook for category-specific breadcrumbs
 */
export const useCategoryBreadcrumb = (
  category: string,
  categorySlug: string,
  basePath = '/products',
): BreadcrumbItem[] => {
  return useMemo(
    () => [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: basePath },
      { label: category, href: `${basePath}/category/${categorySlug}` },
    ],
    [category, categorySlug, basePath],
  )
}

/**
 * Hook for search results breadcrumbs
 */
export const useSearchBreadcrumb = (searchQuery: string, basePath = '/products'): BreadcrumbItem[] => {
  return useMemo(
    () => [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: basePath },
      { label: `Kết quả tìm kiếm: "${searchQuery}"`, href: '#' },
    ],
    [searchQuery, basePath],
  )
}
