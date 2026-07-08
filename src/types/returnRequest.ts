// Return Request Types for MEDISPACE

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  EXPIRED = 'expired',
  DAMAGED_SHIPPING = 'damaged_shipping',
  WRONG_PRESCRIPTION = 'wrong_prescription',
  ALLERGIC_REACTION = 'allergic_reaction',
  CHANGED_MIND = 'changed_mind',
  QUALITY_ISSUE = 'quality_issue',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AWAITING_RETURN = 'awaiting_return',
  RECEIVED = 'received',
  REFUND_PROCESSING = 'refund_processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReturnType {
  REFUND = 'refund',
  EXCHANGE = 'exchange',
}

export enum RefundMethod {
  ORIGINAL = 'original',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

export interface ReturnRequestItem {
  productId: string
  productName: string
  productImage?: string // Product image URL
  sku: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAllocation?: number
  pointsAllocation?: number
  netRefundAmount?: number
  isPrescriptionProduct: boolean
  returnReason: ReturnReason
  reasonDetail?: string
}

export interface BankInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
  branch?: string
}

export interface ReturnShippingInfo {
  trackingNumber?: string
  carrier?: string
  carrierTrackingCode?: string
  trackingUrl?: string
  trackingStatus?: 'arranged' | 'picked_up' | 'in_transit' | 'delivered_to_store' | 'failed' | 'cancelled'
  trackingEvents?: Array<{
    status: string
    message?: string
    location?: string
    updatedBy?: string
    occurredAt: string
  }>
  shippedAt?: string
  arrangedAt?: string
  arrangedBy?: string
  pickupNotes?: string
  receivedAt?: string
  condition?: 'good' | 'damaged' | 'opened' | 'unusable'
  conditionNotes?: string
}

export interface PaymentTransaction {
  _id: string
  orderId: string
  orderNumber: string
  provider: string
  paymentMethod: string
  amount: number
  currency: string
  status: 'pending' | 'pending_collection' | 'paid' | 'failed' | 'cancelled' | 'expired'
  providerOrderCode?: string | number
  providerTransactionId?: string
  providerResponseCode?: string
  providerMessage?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface RefundTransaction {
  _id: string
  orderId: string
  orderNumber: string
  returnRequestId: string
  paymentTransactionId?: string
  provider: string
  refundMethod: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  providerTransactionId?: string
  adminNote?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReturnRequest {
  _id: string
  requestNumber: string
  orderId: string
  orderNumber: string
  userId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  items: ReturnRequestItem[]
  reason: ReturnReason
  reasonDetail: string
  evidence: string[]
  type: ReturnType
  refundMethod?: RefundMethod
  bankInfo?: BankInfo
  requestedAmount: number
  approvedAmount?: number
  refundedAmount?: number
  status: ReturnStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  rejectionReason?: string
  refundTransactionId?: string
  refundLedgerId?: string
  paymentTransaction?: PaymentTransaction | null
  refundTransactions?: RefundTransaction[]
  refundedAt?: string
  refundNotes?: string
  returnShippingInfo?: ReturnShippingInfo
  returnDeadline?: string
  createdAt: string
  updatedAt: string
}

export interface CreateReturnRequestPayload {
  orderId: string
  items: {
    productId: string
    unit: string
    quantity: number
    returnReason: ReturnReason
    reasonDetail?: string
  }[]
  reason: ReturnReason
  reasonDetail: string
  evidence: string[]
  type?: ReturnType
  refundMethod?: RefundMethod
  bankInfo?: BankInfo
}

export interface ReturnRequestStats {
  total: number
  pending: number
  reviewing: number
  approved: number
  awaitingReturn?: number
  rejected: number
  received: number
  refundProcessing?: number
  completed: number
  totalRefunded: number
}
