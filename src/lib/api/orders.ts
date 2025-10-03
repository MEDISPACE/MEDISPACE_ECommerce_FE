// API services for orders
import { apiClient } from '../../services/apiClient'
import type { Order, CreateOrderRequest, OrderFilter } from '../../types/order'

class OrdersAPI {
  // Get user orders
  async getOrders(filter?: OrderFilter) {
    const response = await apiClient.get('/orders', { params: filter })
    return response.data
  }

  // Get order by ID
  async getOrder(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}`)
    return response.data
  }

  // Create new order
  async createOrder(orderData: CreateOrderRequest) {
    const response = await apiClient.post('/orders', orderData)
    return response.data
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string) {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason })
    return response.data
  }

  // Track order
  async trackOrder(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}/tracking`)
    return response.data
  }

  // Reorder
  async reorder(orderId: string) {
    const response = await apiClient.post(`/orders/${orderId}/reorder`)
    return response.data
  }
}

export const ordersAPI = new OrdersAPI()
export default ordersAPI
