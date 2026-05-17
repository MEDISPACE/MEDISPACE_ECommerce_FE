import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Product, ProductFilter } from '~/types/product'
import { getProductPrice } from '~/utils/priceUtils'
import { useDebounce } from '../useDebounce'

interface UseProductListingOptions {
  products: Product[]
  defaultResultsPerPage?: number
}

interface UseProductListingReturn {
  // States
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  sortBy: string
  setSortBy: (sort: string) => void
  resultsPerPage: number
  setResultsPerPage: (count: number) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: ProductFilter
  setFilters: (filters: ProductFilter) => void

  // Computed values
  filteredProducts: Product[]
  sortedProducts: Product[]
  paginatedProducts: Product[]
  totalPages: number

  // Actions
  handleSearch: (query: string) => void
  resetFilters: () => void
}

export function useProductListing({
  products,
  defaultResultsPerPage = 20,
}: UseProductListingOptions): UseProductListingReturn {
  const [searchParams] = useSearchParams()

  // Read category from URL query params
  const categoryFromUrl = searchParams.get('category')

  // States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [resultsPerPage, setResultsPerPage] = useState(defaultResultsPerPage)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState<ProductFilter>(() => ({
    categories: categoryFromUrl ? [categoryFromUrl] : [],
    brands: [],
    priceRange: [0, 1000000],
    rating: 0,
    inStock: undefined,
    isPrescription: undefined,
  }))

  // Debounce search query to prevent excessive filtering while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Helper function to check if product belongs to selected category (including children)
  const matchesCategoryFilter = (product: Product, selectedCategories: string[]): boolean => {
    if (!selectedCategories || selectedCategories.length === 0) return true
    if (!product.category) return false

    const productCategorySlug = product.category.slug || ''
    const productCategoryPath = product.category.path || ''

    // Check if the product's category matches any of the selected categories
    // This includes: exact match OR the category path contains the selected slug
    return selectedCategories.some((selectedSlug) => {
      // Exact match with product's category slug
      if (productCategorySlug === selectedSlug) return true

      // Check if product's category path contains the selected category
      // e.g., path "/thuoc/thuoc-tieu-hoa-gan-mat/thuoc-tieu-hoa" contains "thuoc"
      if (productCategoryPath.includes(`/${selectedSlug}/`) || productCategoryPath.includes(`/${selectedSlug}`)) {
        return true
      }

      return false
    })
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query filter - using debounced value
      if (
        debouncedSearchQuery &&
        !product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
        !(product.shortDescription?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ?? false) &&
        !(product.brand?.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ?? false)
      ) {
        return false
      }

      // Category filter - now supports parent-child hierarchy
      if (!matchesCategoryFilter(product, filters.categories || [])) {
        return false
      }

      // Brand filter
      if ((filters.brands?.length || 0) > 0 && !(filters.brands || []).includes(product.brand?._id || '')) {
        return false
      }

      // Price filter
      const productPrice = getProductPrice(product)
      if (productPrice < (filters.priceRange?.[0] || 0) || productPrice > (filters.priceRange?.[1] || 1000000)) {
        return false
      }

      // Rating filter
      if ((filters.rating || 0) > 0 && (product.rating || 0) < (filters.rating || 0)) {
        return false
      }

      // Stock filter
      if (filters.inStock === true && product.stockQuantity <= 0) {
        return false
      }

      // Prescription filter
      if (filters.isPrescription === true && !product.requiresPrescription) {
        return false
      }

      return true
    })
  }, [products, debouncedSearchQuery, filters])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return getProductPrice(a) - getProductPrice(b)
        case 'price-desc':
          return getProductPrice(b) - getProductPrice(a)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'bestseller':
          return (b.reviewCount || 0) - (a.reviewCount || 0)
        case 'newest':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [filteredProducts, sortBy])

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / resultsPerPage)
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)

  // Actions
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 1000000],
      rating: 0,
      inStock: undefined,
      isPrescription: undefined,
    })
    setCurrentPage(1)
  }

  return {
    // States
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    resultsPerPage,
    setResultsPerPage,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,

    // Computed values
    filteredProducts,
    sortedProducts,
    paginatedProducts,
    totalPages,

    // Actions
    handleSearch,
    resetFilters,
  }
}
