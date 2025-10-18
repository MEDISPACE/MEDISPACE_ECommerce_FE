import { useMemo } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface UseBreadcrumbGenerationOptions {
  searchQuery?: string
  category?: string
  basePath?: string
  baseLabel?: string
}

export function useBreadcrumbGeneration({
  searchQuery,
  category,
  basePath = '/products',
  baseLabel = 'Tìm kiếm & Danh sách sản phẩm',
}: UseBreadcrumbGenerationOptions = {}): BreadcrumbItem[] {
  return useMemo(() => {
    const items: BreadcrumbItem[] = [{ label: baseLabel, href: basePath }]

    // Add category breadcrumb if available
    if (category) {
      items.push({ label: `Danh mục: ${category}` })
    }

    // Add search query breadcrumb if available
    if (searchQuery) {
      items.push({ label: `Kết quả: "${searchQuery}"` })
    }

    return items
  }, [searchQuery, category, basePath, baseLabel])
}
