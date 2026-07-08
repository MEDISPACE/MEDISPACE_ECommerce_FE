import { apiClient } from './apiClient'

// Types
export interface ReturnItem {
  productId: string
  unit: string
  quantity: number
  returnReason: ReturnReason
  reasonDetail?: string
}

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

export interface BankInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
  branch?: string
}

export interface CreateReturnRequestPayload {
  orderId: string
  items: ReturnItem[]
  reason: ReturnReason
  reasonDetail: string
  evidence: string[]
  type?: ReturnType
  refundMethod?: RefundMethod
  bankInfo?: BankInfo
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

export interface ReturnRequestItem {
  productId: string
  productName: string
  productImage?: string
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

export interface ReturnRequest {
  _id: string
  requestNumber: string
  orderId: string
  orderNumber: string
  userId: string
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
  returnShippingInfo?: {
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
  returnDeadline?: string
  createdAt: string
  updatedAt: string
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

// Return reason labels in Vietnamese
export const returnReasonLabels: Record<ReturnReason, string> = {
  [ReturnReason.DEFECTIVE]: 'Sản phẩm lỗi/hư hỏng',
  [ReturnReason.WRONG_ITEM]: 'Giao sai hàng',
  [ReturnReason.EXPIRED]: 'Hết hạn sử dụng',
  [ReturnReason.DAMAGED_SHIPPING]: 'Hư hại trong vận chuyển',
  [ReturnReason.WRONG_PRESCRIPTION]: 'Không đúng đơn thuốc',
  [ReturnReason.ALLERGIC_REACTION]: 'Phản ứng dị ứng',
  [ReturnReason.CHANGED_MIND]: 'Đổi ý (chưa mở seal)',
  [ReturnReason.QUALITY_ISSUE]: 'Vấn đề chất lượng',
  [ReturnReason.OTHER]: 'Lý do khác',
}

// Return status labels in Vietnamese
export const returnStatusLabels: Record<ReturnStatus, string> = {
  [ReturnStatus.PENDING]: 'Chờ xử lý',
  [ReturnStatus.REVIEWING]: 'Đang xem xét',
  [ReturnStatus.APPROVED]: 'Đã duyệt, chờ sắp xếp thu hồi',
  [ReturnStatus.REJECTED]: 'Từ chối',
  [ReturnStatus.AWAITING_RETURN]: 'Đang thu hồi hàng trả',
  [ReturnStatus.RECEIVED]: 'Đã nhận hàng trả',
  [ReturnStatus.REFUND_PROCESSING]: 'Đang hoàn tiền',
  [ReturnStatus.COMPLETED]: 'Hoàn tất',
  [ReturnStatus.CANCELLED]: 'Đã hủy',
}

// Return status colors
export const returnStatusColors: Record<ReturnStatus, string> = {
  [ReturnStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ReturnStatus.REVIEWING]: 'bg-[#E8EDF5] text-blue-800',
  [ReturnStatus.APPROVED]: 'bg-green-100 text-green-800',
  [ReturnStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ReturnStatus.AWAITING_RETURN]: 'bg-orange-100 text-orange-800',
  [ReturnStatus.RECEIVED]: 'bg-[#E8EDF5] text-[#0A2463]',
  [ReturnStatus.REFUND_PROCESSING]: 'bg-[#E8EDF5] text-[#0A2463]',
  [ReturnStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800',
  [ReturnStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
}

// API Response interfaces
interface ApiResponse<T> {
  message: string
  result: T
}

interface PaginatedResult<T> {
  requests: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ReturnRequestService {
  /**
   * Create a new return request
   */
  async createReturnRequest(payload: CreateReturnRequestPayload): Promise<ReturnRequest> {
    const response = await apiClient.post<ApiResponse<ReturnRequest>>('/returns', payload)
    return response.data.result
  }

  /**
   * Get user's return requests
   */
  async getMyReturnRequests(params?: {
    page?: number
    limit?: number
    status?: ReturnStatus
    search?: string
  }): Promise<PaginatedResult<ReturnRequest>> {
    const response = await apiClient.get<ApiResponse<PaginatedResult<ReturnRequest>>>('/returns', { params })
    return response.data.result
  }

  /**
   * Get return request by ID
   */
  async getReturnRequestById(requestId: string): Promise<ReturnRequest> {
    const response = await apiClient.get<ApiResponse<ReturnRequest>>(`/returns/${requestId}`)
    return response.data.result
  }

  /**
   * Cancel return request
   */
  async cancelReturnRequest(requestId: string): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>(`/returns/${requestId}/cancel`)
    return response.data
  }

  // ========== Admin/Pharmacist APIs ==========

  /**
   * Get all return requests (admin/pharmacist)
   */
  async getAllReturnRequests(params?: {
    page?: number
    limit?: number
    status?: ReturnStatus
    search?: string
  }): Promise<PaginatedResult<ReturnRequest>> {
    const response = await apiClient.get<ApiResponse<PaginatedResult<ReturnRequest>>>('/returns/admin/all', { params })
    return response.data.result
  }

  /**
   * Get return request statistics
   */
  async getReturnRequestStats(): Promise<ReturnRequestStats> {
    const response = await apiClient.get<ApiResponse<ReturnRequestStats>>('/returns/admin/stats')
    return response.data.result
  }

  /**
   * Get return request by ID (admin)
   */
  async getReturnRequestByIdAdmin(requestId: string): Promise<ReturnRequest> {
    const response = await apiClient.get<ApiResponse<ReturnRequest>>(`/returns/admin/${requestId}`)
    return response.data.result
  }

  /**
   * Review return request (approve/reject)
   */
  async reviewReturnRequest(
    requestId: string,
    payload: {
      status: 'approved' | 'rejected'
      approvedAmount?: number
      reviewNotes?: string
      rejectionReason?: string
    },
  ): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(`/returns/admin/${requestId}/review`, payload)
    return response.data.result
  }

  /**
   * Arrange return pickup/shipping. Backend generates return tracking number automatically.
   */
  async arrangeReturnShipping(
    requestId: string,
    payload: { carrier?: string; notes?: string },
  ): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(
      `/returns/admin/${requestId}/arrange-return`,
      payload,
    )
    return response.data.result
  }

  async updateMockReturnTracking(
    requestId: string,
    payload: {
      status: 'arranged' | 'picked_up' | 'in_transit' | 'delivered_to_store' | 'failed' | 'cancelled'
      message?: string
      location?: string
    },
  ): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(
      `/returns/admin/${requestId}/tracking/mock`,
      payload,
    )
    return response.data.result
  }

  /**
   * Receive return items
   */
  async receiveReturnItems(
    requestId: string,
    payload: {
      condition: 'good' | 'damaged' | 'opened' | 'unusable'
      conditionNotes?: string
    },
  ): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(`/returns/admin/${requestId}/receive`, payload)
    return response.data.result
  }

  /**
   * Process refund
   */
  async processRefund(
    requestId: string,
    payload: {
      refundedAmount: number
      refundTransactionId?: string
      refundNotes?: string
    },
  ): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(`/returns/admin/${requestId}/refund`, payload)
    return response.data.result
  }

  /**
   * Complete return request
   */
  async completeReturnRequest(requestId: string): Promise<ReturnRequest> {
    const response = await apiClient.patch<ApiResponse<ReturnRequest>>(`/returns/admin/${requestId}/complete`)
    return response.data.result
  }
}

export const returnRequestService = new ReturnRequestService()
export default returnRequestService
