import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// Import Prescription type from dashboard service
import type { Prescription } from './dashboard.service'
import { API_ENDPOINTS } from '../../constants'

// ==================== TYPES ====================

export interface UploadPrescriptionData {
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
}

export interface VerifyPrescriptionData {
  status: 'verified' | 'rejected' // lowercase for consistency
  notes?: string
}

export interface PrescriptionListParams {
  page?: number
  limit?: number
  status?: string
}

export interface PrescriptionStats {
  pending: number
  verified: number
  rejected: number
  expired: number
  total: number
}

// ==================== PRESCRIPTION SERVICE ====================

export const prescriptionService = {
  /**
   * Upload a new prescription
   */
  upload: async (data: UploadPrescriptionData): Promise<Prescription> => {
    const response: AxiosResponse<{ message: string; result: Prescription }> = await apiClient.post(
      API_ENDPOINTS.PRESCRIPTIONS.BASE,
      data,
    )
    return response.data.result
  },

  /**
   * Get all prescriptions with pagination
   */
  getAll: async (params?: PrescriptionListParams): Promise<Prescription[]> => {
    try {
      // Convert params to ensure integers
      const queryParams = params
        ? {
            page: params.page ? Number(params.page) : undefined,
            limit: params.limit ? Number(params.limit) : undefined,
            status: params.status ?? 'all',
          }
        : { status: 'all' }

      // Use /prescriptions/pending endpoint which is designed for pharmacists to see all prescriptions
      const response: AxiosResponse<{ message: string; result: { prescriptions: Prescription[]; pagination: any } }> =
        await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.PENDING, {
          params: queryParams,
        })

      // Handle new response format with pagination
      if (response.data.result && response.data.result.prescriptions) {
        return response.data.result.prescriptions
      }

      return []
    } catch (error: unknown) {
      throw error
    }
  },

  /**
   * Get pending prescriptions
   */
  getPending: async (): Promise<Prescription[]> => {
    const response: AxiosResponse<{ message: string; result: { prescriptions: Prescription[]; pagination: any } }> =
      await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.PENDING, { params: { status: 'pending' } })
    return response.data.result?.prescriptions || []
  },

  /**
   * Get prescription by ID
   */
  getById: async (id: string): Promise<Prescription> => {
    const response: AxiosResponse<{ message: string; result: Prescription }> = await apiClient.get(
      API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id),
    )
    return response.data.result
  },

  /**
   * Verify or reject a prescription
   */
  verify: async (id: string, data: VerifyPrescriptionData): Promise<Prescription> => {
    const response: AxiosResponse<{ message: string; result: Prescription }> = await apiClient.put(
      API_ENDPOINTS.PRESCRIPTIONS.VERIFY(id),
      data,
    )
    return response.data.result
  },

  /**
   * Get prescription statistics
   */
  getStats: async (): Promise<PrescriptionStats> => {
    try {
      const response: AxiosResponse<{ message: string; result: PrescriptionStats }> = await apiClient.get(
        API_ENDPOINTS.PRESCRIPTIONS.STATS,
      )

      return response.data.result
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown; status?: number }; message?: string }

      throw error
    }
  },
}
