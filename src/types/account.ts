import type { Product } from './product'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  avatar?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum'
  loyaltyPoints: number
  totalSaved: number
  joinDate: string
  medicalInfo?: {
    bloodType?: string
    allergies?: string[]
    chronicConditions?: string[]
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
  }
}

export interface Order {
  id: string
  customerId: string
  orderNumber: string
  status:
    | 'pending'
    | 'pending_payment'
    | 'confirmed'
    | 'processing'
    | 'preparing'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'returned'
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  appliedCoupons?: AppliedCoupon[]
  pointsRedeemed?: number
  pointsRedeemAmount?: number
  shippingDiscountAmount?: number
  total: number
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  returnStatus?: OrderReturnStatus
  returnRequestIds?: string[]
  latestReturnRequestId?: string
  returnUpdatedAt?: string
  createdAt: string
  updatedAt: string
  estimatedDelivery?: string
  trackingNumber?: string
  deliveryMethod: string
  notes?: string
  prescriptionId?: string
  timeline: OrderTimeline[]
}

export type OrderReturnStatus =
  | 'none'
  | 'requested'
  | 'approved'
  | 'awaiting_return'
  | 'received'
  | 'refund_processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface AppliedCoupon {
  code: string
  name?: string
  type: string
  discountAmount: number
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  brand: string
  unit: string
  quantity: number
  unitPrice: number
  subtotal: number
  discountAllocation?: number
  pointsAllocation?: number
  netRefundAmount?: number
  isPrescription: boolean
}

export interface OrderTimeline {
  id: string
  status: string
  statusText: string
  timestamp: string
  description?: string
  isCompleted: boolean
}

export interface Address {
  id: string
  userId: string
  type: 'home' | 'office' | 'other'
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  ward: string
  district: string
  city: string
  postalCode?: string
  isDefault: boolean
  label?: string
}

export interface Prescription {
  id: string
  customerId: string
  prescriptionNumber: string
  doctorName: string
  hospital: string
  prescriptionDate: string
  images: string[]
  medicines: PrescriptionMedicine[]
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'expired'
  pharmacistId?: string
  pharmacistNotes?: string
  patientName?: string
  contactPhone: string
  notes?: string
  createdAt: string
  updatedAt: string
  orderId?: string
  rejectionReason?: string
}

export interface PrescriptionMedicine {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  quantity?: number
}

export interface SearchFilters {
  query: string
  category?: string
  brand?: string
  priceMin?: number
  priceMax?: number
  prescriptionType?: 'all' | 'prescription' | 'otc'
  rating?: number
  inStock?: boolean
  onSale?: boolean
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'bestseller' | 'rating'
}

export interface SearchResult {
  products: Product[]
  totalCount: number
  suggestions?: string[]
  relatedSearches?: string[]
  didYouMean?: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
  expiresAt?: string
}

export type NotificationType =
  | 'order'
  | 'payment'
  | 'shipping'
  | 'prescription'
  | 'promotion'
  | 'reminder'
  | 'system'
  | 'review'
  | 'return'
  | 'security'
  | 'community'

export type NotificationFilter = 'all' | 'unread' | NotificationType

export interface NotificationPreferences {
  channels: {
    inApp: boolean
    email: boolean
    push: boolean
    sms: boolean
  }
  types: Record<NotificationType, boolean>
}
