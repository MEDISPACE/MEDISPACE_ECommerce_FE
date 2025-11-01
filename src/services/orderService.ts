import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'
import type { Order, CreateOrderRequest } from '../types/order'
import type { OrderStatus, PaymentStatus, PaymentMethod } from '../types/order'

// Backend response types
interface BackendOrderItem {
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
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
  shipping: number
  discount: number
  total: number
  shippingAddress: BackendShippingAddress
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  updatedAt: string
  shippingMethod: string
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
    const response = await apiClient.get<{ result: { orders: BackendOrder[], pagination: PaginationInfo } }>(API_ENDPOINTS.ORDERS.BASE)
    return response.data.result.orders.map(this.transformOrderFromBackend)
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const response = await apiClient.get<{ result: BackendOrder }>(API_ENDPOINTS.ORDERS.BY_ID(orderId))
    return this.transformOrderFromBackend(response.data.result)
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const requestBody = {
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes
    }
    const response = await apiClient.post<{ result: { order: BackendOrder } }>(API_ENDPOINTS.ORDERS.CREATE, requestBody)
    return this.transformOrderFromBackend(response.data.result.order)
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<{ result: BackendOrder }>(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), { status })
    return this.transformOrderFromBackend(response.data.result)
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await apiClient.patch<{ result: BackendOrder }>(API_ENDPOINTS.ORDERS.CANCEL(orderId))
    return this.transformOrderFromBackend(response.data.result)
  }

  // Transform backend order format to frontend format
  private transformOrderFromBackend(backendOrder: BackendOrder): Order {
    return {
      id: backendOrder._id,
      orderNumber: backendOrder.orderNumber,
      userId: backendOrder.userId,
      items: backendOrder.items?.map((item: BackendOrderItem) => ({
        id: item.productId,
        productId: item.productId,
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
          originalPrice: item.unitPrice
        },
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice,
      })) || [],
      subtotal: backendOrder.subtotal,
      discount: backendOrder.discount,
      tax: 0,
      shipping: backendOrder.shipping,
      total: backendOrder.total,
      shippingAddress: {
        firstName: backendOrder.shippingAddress.firstName,
        lastName: backendOrder.shippingAddress.lastName,
        address: backendOrder.shippingAddress.address,
        ward: backendOrder.shippingAddress.ward,
        district: backendOrder.shippingAddress.district,
        city: backendOrder.shippingAddress.province, // Map province to city
        postalCode: backendOrder.shippingAddress.postalCode,
        phone: backendOrder.shippingAddress.phone,
        email: backendOrder.shippingAddress.email
      },
      shippingMethod: backendOrder.shippingMethod,
      shippingCost: backendOrder.shipping,
      paymentMethod: backendOrder.paymentMethod as PaymentMethod,
      paymentStatus: backendOrder.paymentStatus as PaymentStatus,
      status: backendOrder.status as OrderStatus,
      requiresPrescription: backendOrder.items?.some((item: BackendOrderItem) => item.prescriptionRequired) || false,
      notes: backendOrder.notes,
      createdAt: backendOrder.createdAt,
      updatedAt: backendOrder.updatedAt,
    }
  }
}

export const orderService = new OrderService()
export default orderService
