// API services for products
import { apiClient } from '../../services/apiClient'
import type { ProductFilter } from '../../types/product'

class ProductsAPI {
  // Get all products with filtering
  async getProducts(filter?: ProductFilter) {
    const response = await apiClient.get('/products', { params: filter })
    return response.data
  }

  // Get product by slug
  async getProduct(slug: string) {
    const response = await apiClient.get(`/products/${slug}`)
    return response.data
  }

  // Get product categories
  async getCategories() {
    const response = await apiClient.get('/categories')
    return response.data
  }

  // Search products
  async searchProducts(query: string) {
    const response = await apiClient.get('/products/search', { params: { q: query } })
    return response.data
  }
}

export const productsAPI = new ProductsAPI()
export default productsAPI
