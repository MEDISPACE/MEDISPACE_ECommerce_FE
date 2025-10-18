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
  handleSearch: (e: React.FormEvent) => void
  resetFilters: () => void
}

export function useProductListing({
  products,
  defaultResultsPerPage = 12,
}: UseProductListingOptions): UseProductListingReturn {
  const [searchParams, setSearchParams] = useSearchParams()

  // States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [resultsPerPage, setResultsPerPage] = useState(defaultResultsPerPage)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const [filters, setFilters] = useState<ProductFilter>({
    categories: [],
    brands: [],
    priceRange: [0, 1000000],
    rating: 0,
    inStock: undefined,
    isPrescription: undefined,
  })

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.categorySlug)) {
        return false
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      // Price filter
      const productPrice = product.salePrice || product.originalPrice || 0
      if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
        return false
      }

      // Rating filter
      if (filters.rating > 0 && product.rating < filters.rating) {
        return false
      }

      // Stock filter
      if (filters.inStock === true && !product.inStock) {
        return false
      }

      // Prescription filter
      if (filters.isPrescription === true && !product.isPrescription) {
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
          return (a.salePrice || a.originalPrice || 0) - (b.salePrice || b.originalPrice || 0)
        case 'price-desc':
          return (b.salePrice || b.originalPrice || 0) - (a.salePrice || a.originalPrice || 0)
        case 'rating':
          return b.rating - a.rating
        case 'bestseller':
          return b.reviewCount - a.reviewCount
        case 'newest':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [filteredProducts, sortBy])

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + resultsPerPage)

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      setSearchParams({ q: searchQuery })
    } else {
      setSearchParams({})
    }
    setCurrentPage(1)
  }

  // Reset filters
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
