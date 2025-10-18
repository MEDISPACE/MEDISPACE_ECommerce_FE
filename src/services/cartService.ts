// import { apiClient } from './apiClient'
// import { API_ENDPOINTS } from '../constants'
import type { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../types/cart'

// TODO: Replace with real API calls when backend implements cart API
class CartService {
  // Mock data for development - replace with real API calls
  private mockCart: Cart = {
    id: 'cart1',
    userId: 'current_user',
    items: [
      {
        id: 'item1',
        productId: 'prod1',
        product: {
          _id: 'prod1',
          name: 'Paracetamol 500mg',
          slug: 'paracetamol-500mg',
          sku: 'PARA500',
          shortDescription: 'Pain relief medication',
          categoryId: 'cat1',
          brandId: 'brand1',
          stockQuantity: 100,
          maxOrderQuantity: 10,
          status: 'active',
          isActive: true,
          requiresPrescription: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
        },
        quantity: 2,
        price: 15000,
        total: 30000,
        prescriptionRequired: false,
        addedAt: new Date().toISOString(),
      },
    ],
    subtotal: 30000,
    discount: 0,
    tax: 0,
    shipping: 30000,
    total: 60000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  async getCart(): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET)
    // return response.data
    return this.mockCart
  }

  async addToCart(item: AddToCartRequest): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.post<Cart>(API_ENDPOINTS.CART.ADD_ITEM, item)
    // return response.data

    // Mock implementation
    const existingItem = this.mockCart.items.find((i) => i.productId === item.productId)
    if (existingItem) {
      existingItem.quantity += item.quantity
      existingItem.total = existingItem.quantity * existingItem.price
    } else {
      // In real implementation, fetch product data from API
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: item.productId,
        product: {
          _id: item.productId,
          name: 'Mock Product', // TODO: Fetch real product data
          slug: 'mock-product',
          sku: 'MOCK',
          shortDescription: 'Mock product description',
          categoryId: 'cat1',
          stockQuantity: 100,
          maxOrderQuantity: 10,
          status: 'active',
          isActive: true,
          requiresPrescription: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
        },
        quantity: item.quantity,
        price: 15000, // TODO: Fetch real price
        total: item.quantity * 15000,
        prescriptionRequired: false, // TODO: Check from product data
        addedAt: new Date().toISOString(),
      }
      this.mockCart.items.push(newItem)
    }

    this.updateCartTotals()
    return this.mockCart
  }

  async updateCartItem(itemId: string, updates: UpdateCartItemRequest): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.put<Cart>(`${API_ENDPOINTS.CART.UPDATE_ITEM}/${itemId}`, updates)
    // return response.data

    const item = this.mockCart.items.find((i) => i.id === itemId)
    if (item) {
      if (updates.quantity !== undefined) {
        item.quantity = updates.quantity
        item.total = item.quantity * item.price
      }
      this.updateCartTotals()
    }
    return this.mockCart
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.delete<Cart>(`${API_ENDPOINTS.CART.REMOVE_ITEM}/${itemId}`)
    // return response.data

    const index = this.mockCart.items.findIndex((i) => i.id === itemId)
    if (index !== -1) {
      this.mockCart.items.splice(index, 1)
      this.updateCartTotals()
    }
    return this.mockCart
  }

  async clearCart(): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.delete<Cart>(API_ENDPOINTS.CART.CLEAR)
    // return response.data

    this.mockCart.items = []
    this.updateCartTotals()
    return this.mockCart
  }

  async applyCoupon(code: string): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.post<Cart>(API_ENDPOINTS.CART.APPLY_COUPON, { code })
    // return response.data

    // Mock coupon application
    if (code === 'DISCOUNT10') {
      this.mockCart.discount = Math.round(this.mockCart.subtotal * 0.1)
      this.updateCartTotals()
    }
    return this.mockCart
  }

  async removeCoupon(): Promise<Cart> {
    // TODO: Replace with real API call
    // const response = await apiClient.delete<Cart>(API_ENDPOINTS.CART.REMOVE_COUPON)
    // return response.data

    this.mockCart.discount = 0
    this.updateCartTotals()
    return this.mockCart
  }

  private updateCartTotals(): void {
    this.mockCart.subtotal = this.mockCart.items.reduce((sum, item) => sum + item.total, 0)
    this.mockCart.total = this.mockCart.subtotal - this.mockCart.discount + this.mockCart.tax + this.mockCart.shipping
    this.mockCart.updatedAt = new Date().toISOString()
  }
}

export const cartService = new CartService()
export default cartService
