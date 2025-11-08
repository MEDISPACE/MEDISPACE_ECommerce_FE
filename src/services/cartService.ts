import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'
import type { Cart, AddToCartRequest, UpdateCartItemRequest, CheckoutData } from '../types/cart'

class CartService {
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<{ message: string; result: Cart }>(API_ENDPOINTS.CART.GET)
    return response.data.result
  }

  async addToCart(item: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<{ message: string; result: Cart }>(API_ENDPOINTS.CART.ADD_ITEM, item)
    return response.data.result
  }

  async updateCartItem(productId: string, updates: UpdateCartItemRequest): Promise<Cart> {
    const response = await apiClient.put<{ message: string; result: Cart }>(API_ENDPOINTS.CART.UPDATE_ITEM(productId), updates)
    return response.data.result
  }

  async removeFromCart(productId: string): Promise<Cart> {
    const response = await apiClient.delete<{ message: string; result: Cart }>(API_ENDPOINTS.CART.REMOVE_ITEM(productId))
    return response.data.result
  }

  async clearCart(): Promise<Cart> {
    const response = await apiClient.delete<{ message: string; result: Cart }>(API_ENDPOINTS.CART.CLEAR)
    return response.data.result
  }

  async getCheckoutData(): Promise<CheckoutData> {
    const response = await apiClient.get<{ message: string; result: CheckoutData }>(API_ENDPOINTS.CART.CHECKOUT)
    return response.data.result
  }
}

export const cartService = new CartService()
export default cartService
