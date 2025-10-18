// import { apiClient } from './apiClient'
// import { API_ENDPOINTS } from '../constants'
import type { Order, CreateOrderRequest } from '../types/order'
import { OrderStatus, PaymentStatus, PaymentMethod } from '../types/order'

// TODO: Replace with real API calls when backend implements orders API
class OrderService {
  // Mock data for development - replace with real API calls
  private mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      userId: 'user1',
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
        },
      ],
      subtotal: 30000,
      discount: 0,
      tax: 0,
      shipping: 30000,
      total: 60000,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        ward: 'Hang Bai',
        district: 'Hoan Kiem',
        city: 'Hanoi',
        phone: '0123456789',
      },
      shippingMethod: 'standard',
      shippingCost: 30000,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.Pending,
      status: OrderStatus.Pending,
      requiresPrescription: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  async getOrders(): Promise<Order[]> {
    // TODO: Replace with real API call
    // const response = await apiClient.get<Order[]>(API_ENDPOINTS.ORDERS.GET_ALL)
    // return response.data
    return this.mockOrders
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    // TODO: Replace with real API call
    // const response = await apiClient.get<Order>(`${API_ENDPOINTS.ORDERS.GET_BY_ID}/${orderId}`)
    // return response.data
    return this.mockOrders.find((order) => order.id === orderId) || null
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // TODO: Replace with real API call
    // const response = await apiClient.post<Order>(API_ENDPOINTS.ORDERS.CREATE, orderData)
    // return response.data
    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${Date.now()}`,
      userId: 'current_user', // TODO: Get from auth context
      items: [], // TODO: Map from orderData.items with full product data
      subtotal: 0, // TODO: Calculate from items
      discount: 0,
      tax: 0,
      shipping: 30000,
      total: 0, // TODO: Calculate total
      shippingAddress: orderData.shippingAddress,
      shippingMethod: 'standard',
      shippingCost: 30000,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: PaymentStatus.Pending,
      status: OrderStatus.Pending,
      requiresPrescription: false, // TODO: Check if any item requires prescription
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.mockOrders.push(newOrder)
    return newOrder
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    // TODO: Replace with real API call
    // const response = await apiClient.patch<Order>(`${API_ENDPOINTS.ORDERS.UPDATE_STATUS}/${orderId}`, { status })
    // return response.data
    const order = this.mockOrders.find((o) => o.id === orderId)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      return order
    }
    throw new Error('Order not found')
  }

  async cancelOrder(orderId: string): Promise<Order> {
    // TODO: Replace with real API call
    // const response = await apiClient.patch<Order>(`${API_ENDPOINTS.ORDERS.CANCEL}/${orderId}`)
    // return response.data
    return this.updateOrderStatus(orderId, OrderStatus.Cancelled)
  }
}

export const orderService = new OrderService()
export default orderService
