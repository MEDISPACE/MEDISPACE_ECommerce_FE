// Order related types for MEDISPACE
import type { Product } from './product'
import type { User } from './user'

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Returned = 'returned',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  VNPay = 'vnpay',
  Momo = 'momo',
  Banking = 'banking',
  Credit = 'credit',
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
  total: number
  prescriptionId?: string
  prescriptionVerified?: boolean
  notes?: string
}

export interface ShippingAddress {
  id?: string
  firstName: string
  lastName: string
  company?: string
  address: string
  ward: string
  district: string
  city: string
  postalCode?: string
  phone: string
  email?: string
  isDefault?: boolean
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  user?: User

  // Items & pricing
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number

  // Coupon
  couponCode?: string
  couponDiscount?: number

  // Shipping
  shippingAddress: ShippingAddress
  shippingMethod: string
  shippingCost: number
  trackingNumber?: string

  // Payment
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paidAt?: string

  // Status
  status: OrderStatus
  notes?: string
  cancelReason?: string

  // Medical specific
  requiresPrescription: boolean
  prescriptionVerified?: boolean
  pharmacistApproved?: boolean
  pharmacistNotes?: string

  // Timestamps
  createdAt: string
  updatedAt: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
    prescriptionId?: string
    notes?: string
  }[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  couponCode?: string
  notes?: string
}

export interface OrderFilter {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface OrderTracking {
  orderId: string
  status: OrderStatus
  trackingNumber?: string
  timeline: OrderTrackingEvent[]
}

export interface OrderTrackingEvent {
  id: string
  status: OrderStatus
  description: string
  location?: string
  timestamp: string
}
