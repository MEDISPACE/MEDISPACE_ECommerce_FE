import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// Import Order type from dashboard service
import type { Order } from './dashboard.service'

// ==================== TYPES ====================

export interface OrderListParams {
  page?: number
  limit?: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrderListResponse {
  orders: Order[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface UpdateOrderStatusData {
  orderStatus: string
  paymentStatus?: string
  trackingNumber?: string
  notes?: string
}

export interface OrderStatistics {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  averageOrderValue: number
}

// ==================== ORDER SERVICE ====================

export const orderService = {
  /**
   * Get all orders with pagination and filters
   */
  getOrders: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const response: AxiosResponse<{ message: string; result: OrderListResponse }> = await apiClient.get(
      '/pharmacist/orders',
      { params },
    )
    return response.data.result
  },

  /**
   * Get order details by ID
   */
  getOrderDetails: async (orderId: string): Promise<Order> => {
    const response: AxiosResponse<{ message: string; result: Order }> = await apiClient.get(
      `/pharmacist/orders/${orderId}`,
    )
    return response.data.result
  },

  /**
   * Update order status
   */
  updateStatus: async (orderId: string, data: UpdateOrderStatusData): Promise<Order> => {
    const response: AxiosResponse<{ message: string; result: Order }> = await apiClient.patch(
      `/pharmacist/orders/${orderId}/status`,
      data,
    )
    return response.data.result
  },

  /**
   * Get order statistics
   */
  getStatistics: async (startDate?: string, endDate?: string): Promise<OrderStatistics> => {
    const response: AxiosResponse<{ message: string; result: OrderStatistics }> = await apiClient.get(
      '/pharmacist/orders/statistics',
      {
        params: { startDate, endDate },
      },
    )
    return response.data.result
  },
}
