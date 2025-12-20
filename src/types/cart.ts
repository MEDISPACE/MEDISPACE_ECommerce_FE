// Cart related types for MEDISPACE

export interface CartItem {
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  prescriptionRequired: boolean
  image?: string
  unit?: string // Selected unit from priceVariants (e.g., "Hộp", "Viên")
  priceVariants?: Array<{
    unit: string
    price: number
    originalPrice?: number
    isDefault?: boolean
  }>
}

export interface Cart {
  _id: string
  userId?: string
  sessionId?: string
  items: CartItem[]
  itemCount: number
  uniqueProductCount: number
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingFee: number
  loyaltyDiscount: number
  totalAmount: number
  appliedCoupons?: AppliedCoupon[]
  loyaltyPointsUsed?: number
  requiresPrescription: boolean
  status: string
  abandonmentReason?: string
  createdAt: string
  updatedAt: string
  lastActivityAt?: string
  expiresAt?: string
}

export interface AppliedCoupon {
  code: string
  discountAmount: number
  type: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
  unit?: string // Selected unit from priceVariants
  price?: number // Unit price for the selected variant
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CheckoutData {
  cart: Cart
  shippingFee: number
  taxAmount: number
  discountAmount: number
  finalAmount: number
}
