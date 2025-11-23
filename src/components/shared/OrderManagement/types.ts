export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type UserRole = 'admin' | 'pharmacist'

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  products: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  date: string
}

export interface OrderStats {
  total: number
  pending: number
  processing: number
  delivered: number
  cancelled: number
  revenue: number
  avgOrder: number
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
