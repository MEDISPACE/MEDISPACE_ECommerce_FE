// Cart related types for MEDISPACE
import type { Product } from './product'

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
  total: number
  prescriptionRequired: boolean
  prescriptionId?: string
  notes?: string
  addedAt: string
}

export interface Cart {
  id: string
  userId?: string
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  couponCode?: string
  couponDiscount?: number
  createdAt: string
  updatedAt: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
  prescriptionId?: string
  notes?: string
}

export interface UpdateCartItemRequest {
  quantity: number
  notes?: string
}

export interface ApplyCouponRequest {
  code: string
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  usageLimit?: number
  usedCount: number
  isActive: boolean
}
