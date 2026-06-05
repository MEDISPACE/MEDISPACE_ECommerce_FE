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
  PartiallyRefunded = 'partially_refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  VNPay = 'vnpay',
  Banking = 'banking',
  Credit = 'credit',
}

export interface OrderItem {
  id: string
  productId: string
  categoryId?: string
  product: Product
  quantity: number
  price: number
  total: number
  prescriptionId?: string
  prescriptionVerified?: boolean
  notes?: string
  discountAllocation?: number
  pointsAllocation?: number
  couponAllocations?: {
    code: string
    type: string
    amount: number
  }[]
}

export interface ShippingAddress {
  id?: string
  firstName: string
  lastName: string
  company?: string
  address: string
  ward: string
  district: string
  province: string
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
  appliedCoupons?: AppliedCoupon[]
  pointsRedeemed?: number
  pointsRedeemAmount?: number
  shippingDiscountAmount?: number

  // Shipping
  shippingAddress: ShippingAddress
  shippingMethod: string
  shippingCost: number
  trackingNumber?: string
  estimatedDeliveryDate?: string

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

export interface AppliedCoupon {
  code: string
  name?: string
  type: string
  discountAmount: number
  eligibleSubtotal?: number
  applicableProductIds?: string[]
  applicableCategoryIds?: string[]
}

export interface CreateOrderRequest {
  items?: {
    productId: string
    quantity: number
    prescriptionId?: string
    notes?: string
  }[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  couponCode?: string
  couponCodes?: string[]
  pointsToRedeem?: number
  notes?: string
  isDirectBuy?: boolean
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
