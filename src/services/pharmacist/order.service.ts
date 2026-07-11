import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// Import Order type from dashboard service
import type { Order } from './dashboard.service'

// ==================== TYPES ====================

export interface OrderListParams {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  search?: string
  scope?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrderListResponse {
  orders: Order[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalOrders?: number
    page?: number
    limit?: number
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
  returnedOrders?: number
  totalRevenue: number
  averageOrderValue: number
  revenueOrderCount?: number
  ordersByStatus?: Array<{ _id: string; count: number }>
  ordersByPayment?: Array<{ _id: string; count: number }>
  workflow?: {
    queueTotal: number
    mineTotal: number
    mineActiveTotal: number
    completedTotal: number
    returnsTotal: number
    mineRevenue: number
    mineRevenueOrderCount: number
    mineAverageOrderValue: number
  }
}

export interface CreateOrderData {
  customerId?: string
  prescriptionId?: string
  idempotencyKey?: string
  items: Array<{
    productId: string
    quantity: number
    unit?: string
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
    provinceId?: number
    districtId?: number
    wardCode?: string
    postalCode?: string
  }
  deliveryMethod: string
  paymentMethod: string
  orderNotes?: string
  pharmacistNotes?: string
  safetyReviewConfirmed?: boolean
}

export interface CreateOrderResponse {
  order: Order
  orderId: string
  orderNumber: string
  paymentUrl?: string
  paymentUrlError?: boolean
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
  getStatistics: async (startDate?: string, endDate?: string, scope?: string): Promise<OrderStatistics> => {
    const response: AxiosResponse<{ message: string; result: OrderStatistics }> = await apiClient.get(
      '/pharmacist/orders/statistics',
      {
        params: { startDate, endDate, scope },
      },
    )
    return response.data.result
  },

  /**
   * Create order (for pharmacist)
   */
  createOrder: async (data: CreateOrderData): Promise<CreateOrderResponse> => {
    const { idempotencyKey, ...payload } = data
    const response: AxiosResponse<{ message: string; result: CreateOrderResponse }> = await apiClient.post(
      '/pharmacist/orders',
      payload,
      idempotencyKey ? { headers: { 'x-idempotency-key': idempotencyKey } } : undefined,
    )
    return response.data.result
  },
}
