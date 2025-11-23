import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// ==================== TYPES ====================

export interface DashboardStats {
  pendingPrescriptions: number
  prescriptionsToday: {
    total: number
    verified: number
    rejected: number
  }
  ordersToday: number
  totalRevenue: number
  activeChats: number
}

export interface RecentActivity {
  prescriptions: Prescription[]
  orders: Order[]
}

export interface Prescription {
  _id: string
  prescriptionNumber: string
  customerId: string
  doctorName: string
  hospitalName?: string
  prescriptionDate: string
  images: string[]
  medications: Array<{
    productName: string
    dosage: string
    quantity: number
    instructions: string
  }>
  status: 'Pending' | 'Verified' | 'Rejected' | 'Expired'
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
  validUntil?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  _id: string
  userId: string
  orderNumber: string
  items: Array<{
    productId: string
    name: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
    prescriptionRequired: boolean
    image?: string
  }>
  itemCount: number
  shippingAddress: {
    firstName: string
    lastName: string
    phone: string
    email: string
    address: string
    ward: string
    district: string
    province: string
    postalCode?: string
  }
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  subtotal: number
  taxAmount: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  notes?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
}

export interface PatientInfo {
  _id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: number
  avatar?: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface PatientHistory {
  prescriptions: Prescription[]
  orders: Order[]
  totalOrders: number
  totalSpent: number
}

export interface PharmacistProfile {
  _id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: number
  avatar?: string
  lisenseNumber?: string
  role: string
  status: string
  isOnline?: boolean
  createdAt: string
  updatedAt: string
}

// ==================== DASHBOARD SERVICE ====================

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response: AxiosResponse<{ message: string; result: DashboardStats }> =
      await apiClient.get('/pharmacist/dashboard/stats')
    return response.data.result
  },

  /**
   * Get recent activities (prescriptions & orders)
   */
  getRecentActivities: async (limit = 5): Promise<RecentActivity> => {
    const response: AxiosResponse<{ message: string; result: RecentActivity }> = await apiClient.get(
      '/pharmacist/dashboard/recent-activities',
      {
        params: { limit },
      },
    )
    return response.data.result
  },

  /**
   * Search patient by phone number
   */
  searchPatient: async (phone: string): Promise<PatientInfo> => {
    const response: AxiosResponse<{ message: string; result: PatientInfo }> = await apiClient.get(
      '/pharmacist/patients/search',
      {
        params: { phone },
      },
    )
    return response.data.result
  },

  /**
   * Get patient history (prescriptions & orders)
   */
  getPatientHistory: async (customerId: string): Promise<PatientHistory> => {
    const response: AxiosResponse<{ message: string; result: PatientHistory }> = await apiClient.get(
      `/pharmacist/patients/${customerId}/history`,
    )
    return response.data.result
  },

  /**
   * Get pharmacist profile
   */
  getProfile: async (): Promise<PharmacistProfile> => {
    const response: AxiosResponse<{ message: string; result: PharmacistProfile }> =
      await apiClient.get('/pharmacist/profile')
    return response.data.result
  },
}
