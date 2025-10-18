/**
 * PRODUCT SERVICE - Handles both Mock Data and Real API
 *
 * This service abstracts data fetching so components don't need to know
 * whether they're using mock data or real API calls.
 */

import type { Product, ProductFilter } from '../types/product'
import { mockProducts } from '../utils/mockData'
import { USE_MOCK_PRODUCTS, MOCK_CONFIG } from '../utils/constants'
import { apiClient } from './apiClient'

// Helper functions to get featured and prescription products
const getFeaturedProducts = () => mockProducts.filter((p) => p.onSale || p.isOnSale).slice(0, 12)
const getPrescriptionProducts = () => mockProducts.filter((p) => p.isPrescription || p.needsConsultation)

// Simulate API delay for realistic testing
const simulateDelay = () => {
  if (USE_MOCK_PRODUCTS && MOCK_CONFIG.SIMULATE_DELAY) {
    const delay = Math.random() * (MOCK_CONFIG.MAX_DELAY - MOCK_CONFIG.MIN_DELAY) + MOCK_CONFIG.MIN_DELAY
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
  return Promise.resolve()
}

// Simulate occasional errors for testing
const simulateError = () => {
  if (USE_MOCK_PRODUCTS && MOCK_CONFIG.SIMULATE_ERRORS) {
    if (Math.random() < MOCK_CONFIG.ERROR_RATE) {
      throw new Error('Simulated API Error - Please try again')
    }
  }
}

export const productService = {
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters?: Partial<ProductFilter>): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      let products = mockProducts

      // Apply filters if provided
      if (filters) {
        if (filters.categories?.length) {
          products = products.filter((p) =>
            filters.categories!.includes(typeof p.category === 'string' ? p.category : p.category?.name || ''),
          )
        }
        if (filters.brands?.length) {
          products = products.filter((p) =>
            filters.brands!.includes(typeof p.brand === 'string' ? p.brand : p.brand?.name || ''),
          )
        }
        if (filters.priceRange) {
          const [min, max] = filters.priceRange
          products = products.filter((p) => p.salePrice != null && p.salePrice >= min && p.salePrice <= max)
        }
        if (filters.rating) {
          products = products.filter((p) => (p.rating || 0) >= filters.rating!)
        }
        if (filters.inStock !== undefined) {
          products = products.filter((p) => p.inStock === filters.inStock)
        }
      }

      return products
    } else {
      // Real API call
      const response = await apiClient.get('/products', { params: filters })
      return response.data as Product[]
    }
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 12): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      return getFeaturedProducts().slice(0, limit)
    } else {
      const response = await apiClient.get('/products/featured', { params: { limit } })
      return response.data as Product[]
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      const product = mockProducts.find((p) => p.id === id)
      return product || null
    } else {
      try {
        const response = await apiClient.get(`/products/${id}`)
        return response.data as Product
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'status' in error.response &&
          error.response.status === 404
        ) {
          return null
        }
        throw error
      }
    }
  },

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      const product = mockProducts.find((p) => p.slug === slug)
      return product || null
    } else {
      try {
        const response = await apiClient.get(`/products/slug/${slug}`)
        return response.data as Product
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'status' in error.response &&
          error.response.status === 404
        ) {
          return null
        }
        throw error
      }
    }
  },

  /**
   * Search products by query
   */
  async searchProducts(query: string, filters?: Partial<ProductFilter>): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      let products = mockProducts

      // Search in name, description, tags, ingredients
      if (query.trim()) {
        const searchTerm = query.toLowerCase()
        products = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm) ||
            (product.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm)) ||
            product.ingredients?.some((ingredient) => ingredient.toLowerCase().includes(searchTerm)) ||
            false ||
            (typeof product.brand === 'string' ? product.brand : product.brand?.name || '')
              .toLowerCase()
              .includes(searchTerm),
        )
      }

      // Apply additional filters
      if (filters) {
        const filteredProducts = await this.getProducts(filters)
        products = products.filter((p) => filteredProducts.some((fp) => fp.id === p.id))
      }

      return products
    } else {
      const response = await apiClient.get('/products/search', {
        params: { q: query, ...filters },
      })
      return response.data as Product[]
    }
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      return mockProducts.filter((p) => {
        const productCategorySlug =
          (p as { categorySlug?: string }).categorySlug || (typeof p.category === 'object' && p.category?.slug)
        return productCategorySlug === categorySlug
      })
    } else {
      const response = await apiClient.get(`/products/category/${categorySlug}`)
      return response.data as Product[]
    }
  },

  /**
   * Get prescription products (require prescription)
   */
  async getPrescriptionProducts(): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      return getPrescriptionProducts()
    } else {
      const response = await apiClient.get('/products/prescription')
      return response.data as Product[]
    }
  },

  /**
   * Get related products (same category, different brand, etc.)
   */
  async getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
    await simulateDelay()
    simulateError()

    if (USE_MOCK_PRODUCTS) {
      const currentProduct = await this.getProductById(productId)
      if (!currentProduct) return []

      const related = mockProducts
        .filter(
          (p) => p.id !== productId && (p.category === currentProduct.category || p.brand === currentProduct.brand),
        )
        .slice(0, limit)

      return related
    } else {
      const response = await apiClient.get(`/products/${productId}/related`, { params: { limit } })
      return response.data as Product[]
    }
  },
}

export default productService
