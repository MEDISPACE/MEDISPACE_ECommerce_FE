export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
export type UserRole = 'admin' | 'pharmacist'
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

export interface Order {
  id: string
  orderNumber?: string
  customerName: string
  customerPhone: string
  products: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  returnStatus?: OrderReturnStatus
  latestReturnRequestId?: string
  returnUpdatedAt?: string
  date: string
  requiresPrescription?: boolean
  shippingAddress?: string
  items?: number
  paymentMethod?: string
  pharmacistName?: string
  pharmacistPhone?: string
  pharmacistSource?: 'assigned' | 'created' | 'unassigned'
}

export interface OrderStats {
  total: number
  pending: number
  processing: number
  delivered: number
  returned: number
  cancelled: number
  revenue: number
  avgOrder: number
  revenueOrderCount?: number
  scopeLabel?: string
}

export interface RoleConfig {
  title: string
  description: string
  themeColor: string
  gradientFrom: string
  gradientTo: string
  showExportButton: boolean
  canCancel: boolean
  canRefund: boolean
  statsToShow: string[]
}
