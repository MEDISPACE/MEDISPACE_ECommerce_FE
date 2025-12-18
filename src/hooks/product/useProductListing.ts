import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Product, ProductFilter } from '~/types/product'

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


  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(product.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) &&
        !(product.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      ) {
        return false
      }

      // Category filter
      if ((filters.categories?.length || 0) > 0 && !(filters.categories || []).includes(product.category?.slug || '')) {
        return false
      }

      // Brand filter
      if ((filters.brands?.length || 0) > 0 && !(filters.brands || []).includes(product.brand?.name || '')) {
        return false
      }

      // Price filter
      const productPrice = product.price || 0
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
  }, [products, searchQuery, filters])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
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
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage,
  )

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
