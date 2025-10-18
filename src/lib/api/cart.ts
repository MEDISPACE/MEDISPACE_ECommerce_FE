// API services for shopping cart
import { apiClient } from '~/services/apiClient'
import type { AddToCartRequest } from '~/types/cart'

class CartAPI {
  // Get current cart
  async getCart() {
    const response = await apiClient.get('/cart')
    return response.data
  }

  // Add item to cart
  async addToCart(item: AddToCartRequest) {
    const response = await apiClient.post('/cart/items', item)
    return response.data
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, quantity: number) {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity })
    return response.data
  }

  // Remove item from cart
  async removeFromCart(itemId: string) {
    const response = await apiClient.delete(`/cart/items/${itemId}`)
    return response.data
  }

  // Clear entire cart
  async clearCart() {
    const response = await apiClient.delete('/cart')
    return response.data
  }

  // Apply coupon
  async applyCoupon(code: string) {
    const response = await apiClient.post('/cart/coupon', { code })
    return response.data
  }
}

export const cartAPI = new CartAPI()
export default cartAPI
