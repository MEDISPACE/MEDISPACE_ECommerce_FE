/**
 * Search Service — gọi Typesense search API qua BE proxy
 * Endpoints: GET /search/suggest | /search/products | /search/articles
 */

import { apiClient } from './apiClient'

export interface SearchSuggestHit {
  document: {
    mongoId: string
    name: string
    title?: string
    slug: string
    excerpt?: string
    featuredImage?: string
    price?: number
    rating?: number
    brandName?: string
    categoryName?: string
    requiresPrescription?: boolean
    logo?: string
    productCount?: number
    level?: number
    icon?: string
  }
  highlight?: {
    name?: { snippet?: string }
  }
}

export interface SearchSuggestResult {
  products: SearchSuggestHit[]
  brands: SearchSuggestHit[]
  categories: SearchSuggestHit[]
  articles: SearchArticlesHit[]
  querySuggestions: string[]
}

export interface SearchProductsHit {
  document: {
    mongoId: string
    name: string
    slug: string
    featuredImage?: string
    price?: number
    rating?: number
    categoryId?: string
    categoryName?: string
    brandId?: string
    brandName?: string
    requiresPrescription?: boolean
    inStock?: boolean
  }
  highlight?: {
    name?: { snippet?: string }
    shortDescription?: { snippet?: string }
  }
}

export interface FacetCount {
  fieldName: string
  counts: { value: string; count: number }[]
}

export interface SearchProductsResult {
  source: 'typesense' | 'mongodb_fallback'
  hits: SearchProductsHit[]
  found: number
  page: number
  facet_counts?: FacetCount[]
}

export interface SearchArticlesHit {
  document: {
    mongoId?: string
    _id?: string
    title: string
    slug: string
    excerpt?: string
    featuredImage?: string
    viewCount?: number
    publishedAt?: number
  }
  highlight?: {
    title?: { snippet?: string }
    excerpt?: { snippet?: string }
  }
}

export interface SearchProductsParams {
  q?: string
  page?: number
  limit?: number
  categoryId?: string
  includeSubcategories?: boolean
  brandId?: string
  brandIds?: string
  requiresPrescription?: boolean
  inStock?: boolean
  priceMin?: number
  priceMax?: number
  ratingMin?: number
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'relevance'
}

export const searchService = {
  /**
   * Autocomplete multi-collection — gọi khi user đang gõ (>= 2 ký tự)
   * Trả về products, brands, categories
   */
  async suggest(q: string): Promise<SearchSuggestResult> {
    try {
      const response = await apiClient.get<SearchSuggestResult>('/search/suggest', {
        params: { q },
      })
      return response.data || { products: [], brands: [], categories: [], articles: [], querySuggestions: [] }
    } catch {
      return { products: [], brands: [], categories: [], articles: [], querySuggestions: [] }
    }
  },

  /**
   * Full-text search sản phẩm với filter và facet counts
   */
  async searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
    try {
      const response = await apiClient.get<SearchProductsResult>('/search/products', {
        params,
      })
      return response.data
    } catch {
      return { source: 'mongodb_fallback', hits: [], found: 0, page: 1, facet_counts: [] }
    }
  },

  /**
   * Full-text search bài viết sức khỏe
   */
  async searchArticles(params: { q: string; page?: number; limit?: number; categoryId?: string }) {
    try {
      const response = await apiClient.get('/search/articles', { params })
      return response.data as { hits: SearchArticlesHit[]; found: number; page: number }
    } catch {
      return { hits: [], found: 0, page: 1 }
    }
  },

  /**
   * Kiểm tra trạng thái Typesense
   */
  async getStatus() {
    try {
      const response = await apiClient.get<{ typesense: boolean; message: string }>('/search/status')
      return response.data
    } catch {
      return { typesense: false, message: 'Search service unavailable' }
    }
  },
}

export default searchService
