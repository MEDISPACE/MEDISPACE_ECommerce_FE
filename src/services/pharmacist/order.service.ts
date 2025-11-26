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
  status?: string // Backend expects 'status' field
  orderStatus?: string // Keep for backward compatibility
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

export interface CreateOrderData {
  customerId: string
  prescriptionId?: string
  items: Array<{
    productId: string
    quantity: number
    notes?: string
  }>
  shippingAddress: {
    firstName: string
    lastName: string
    phone: string
    email: string
    address: string
    ward: string
    district: string
    province: string
    postalCode?: string
  }
  deliveryMethod: string // 'standard', 'fast', 'express'
  paymentMethod: string // 'cod', 'transfer', 'ewallet'
  orderNotes?: string
  pharmacistNotes?: string
}

export interface CreateOrderResponse {
  order: Order
  orderId: string
  orderNumber: string
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

  /**
   * Create order (for pharmacist)
   */
  createOrder: async (data: CreateOrderData): Promise<CreateOrderResponse> => {
    const response: AxiosResponse<{ message: string; result: CreateOrderResponse }> = await apiClient.post(
      '/pharmacist/orders',
      data,
    )
    return response.data.result
  },
}
