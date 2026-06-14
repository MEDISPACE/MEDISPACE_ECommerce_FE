import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'
import type { Order, CreateOrderRequest } from '../types/order'
import type { OrderStatus, PaymentStatus, PaymentMethod } from '../types/order'

// Backend response types
interface BackendOrderItem {
  productId: string
  categoryId?: string
  name: string
  sku: string
  unit: string // Unit selected by user: "Viên", "Hộp", "Vỉ"...
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAllocation?: number
  pointsAllocation?: number
  couponAllocations?: Array<{
    code: string
    type: string
    amount: number
  }>
  prescriptionRequired: boolean
  image?: string
}

interface BackendShippingAddress {
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

interface BackendOrder {
  _id: string
  userId: string
  orderNumber: string
  items: BackendOrderItem[]
  subtotal: number
  shippingFee: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  appliedCoupons?: Array<{
    code: string
    name?: string
    type: string
    discountAmount: number
    eligibleSubtotal?: number
    applicableProductIds?: string[]
    applicableCategoryIds?: string[]
  }>
  pointsRedeemed?: number
  pointsRedeemAmount?: number
  shippingDiscountAmount?: number
  shippingAddress: BackendShippingAddress
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  createdAt: string
  updatedAt: string
  shippingMethod?: string
  estimatedDeliveryDate?: string
  notes?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// TODO: Replace with real API calls when backend implements orders API
class OrderService {
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<{
      message: string
      result: { orders: BackendOrder[]; pagination: PaginationInfo }
    }>(API_ENDPOINTS.ORDERS.BASE)
    return response.data.result.orders.map(this.transformOrderFromBackend)
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const response = await apiClient.get<{ message: string; result: BackendOrder }>(API_ENDPOINTS.ORDERS.BY_ID(orderId))
    return this.transformOrderFromBackend(response.data.result)
  }

  async createOrder(orderData: CreateOrderRequest): Promise<{ order: Order; paymentUrl?: string; paymentUrlError?: boolean }> {
    const requestBody = {
      selectedItems: orderData.items, // Map 'items' from frontend to 'selectedItems' for backend
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      shippingMethod: (orderData as any).shippingMethod, // Pass shipping method
      shippingFee: (orderData as any).shippingFee, // Pass calculated shipping fee
      estimatedDeliveryDate: (orderData as any).estimatedDeliveryDate, // Pass estimated delivery date
      notes: orderData.notes,
      isDirectBuy: orderData.isDirectBuy,
      couponCodes: (orderData as any).couponCodes,
      pointsToRedeem: (orderData as any).pointsToRedeem,
      prescriptionId: orderData.prescriptionId,
    }
    const response = await apiClient.post<{ message: string; result: { order: BackendOrder; paymentUrl?: string; paymentUrlError?: boolean } }>(
      API_ENDPOINTS.ORDERS.CREATE,
      requestBody,
      { headers: { 'X-Idempotency-Key': crypto.randomUUID() } },
    )
    return {
      order: this.transformOrderFromBackend(response.data.result.order),
      paymentUrl: response.data.result.paymentUrl,
      paymentUrlError: response.data.result.paymentUrlError,
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<{ message: string; result: BackendOrder }>(
      API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      { status },
    )
    return this.transformOrderFromBackend(response.data.result)
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await apiClient.put<{ message: string; result: BackendOrder }>(
      API_ENDPOINTS.ORDERS.CANCEL(orderId),
      { status: 'cancelled' },
    )
    return this.transformOrderFromBackend(response.data.result)
  }

  async getPaymentUrl(orderId: string): Promise<string> {
    const response = await apiClient.post<{ message: string; result: { paymentUrl: string } }>(
      API_ENDPOINTS.ORDERS.PAYMENT_URL(orderId),
    )
    return response.data.result.paymentUrl
  }

  // Transform backend order format to frontend format
  private transformOrderFromBackend(backendOrder: BackendOrder): Order {
    return {
      id: backendOrder._id,
      orderNumber: backendOrder.orderNumber,
      userId: backendOrder.userId,
      items:
        backendOrder.items?.map((item: BackendOrderItem) => ({
          id: item.productId,
          productId: item.productId,
          categoryId: item.categoryId,
          product: {
            _id: item.productId,
            id: item.productId,
            name: item.name,
            slug: '',
            sku: item.sku,
            shortDescription: '',
            categoryId: '',
            stockQuantity: item.quantity,
            maxOrderQuantity: 100,
            status: 'active' as const,
            isActive: true,
            requiresPrescription: item.prescriptionRequired,
            featuredImage: item.image,
            createdAt: '',
            updatedAt: '',
            createdBy: '',
            description: '',
            image: item.image,
            images: item.image ? [item.image] : [],
            price: item.unitPrice,
            originalPrice: item.unitPrice,
            unit: item.unit, // Pass unit from order item
            priceVariants: [], // Empty array to satisfy Product type
          },
          unit: item.unit, // Also at item level for direct access
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice,
          discountAllocation: item.discountAllocation || 0,
          pointsAllocation: item.pointsAllocation || 0,
          couponAllocations: item.couponAllocations || [],
        })) || [],
      subtotal: backendOrder.subtotal,
      discount: backendOrder.discountAmount,
      appliedCoupons: backendOrder.appliedCoupons || [],
      pointsRedeemed: backendOrder.pointsRedeemed || 0,
      pointsRedeemAmount: backendOrder.pointsRedeemAmount || 0,
      shippingDiscountAmount: backendOrder.shippingDiscountAmount || 0,
      tax: backendOrder.taxAmount,
      shipping: backendOrder.shippingFee,
      total: backendOrder.totalAmount,
      shippingAddress: {
        firstName: backendOrder.shippingAddress?.firstName ?? '',
        lastName: backendOrder.shippingAddress?.lastName ?? '',
        address: backendOrder.shippingAddress?.address ?? '',
        ward: backendOrder.shippingAddress?.ward ?? '',
        district: backendOrder.shippingAddress?.district ?? '',
        province: backendOrder.shippingAddress?.province ?? '',
        postalCode: backendOrder.shippingAddress?.postalCode,
        phone: backendOrder.shippingAddress?.phone ?? '',
        email: backendOrder.shippingAddress?.email ?? '',
      },
      shippingMethod: backendOrder.shippingMethod || 'standard',
      shippingCost: backendOrder.shippingFee,
      estimatedDeliveryDate: backendOrder.estimatedDeliveryDate,
      paymentMethod: backendOrder.paymentMethod as PaymentMethod,
      paymentStatus: backendOrder.paymentStatus as PaymentStatus,
      status: backendOrder.orderStatus as OrderStatus,
      requiresPrescription: backendOrder.items?.some((item: BackendOrderItem) => item.prescriptionRequired) || false,
      notes: backendOrder.notes,
      createdAt: backendOrder.createdAt,
      updatedAt: backendOrder.updatedAt,
    }
  }
}

export const orderService = new OrderService()
export default orderService
