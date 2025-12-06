import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// Import Prescription type from dashboard service
import type { Prescription } from './dashboard.service'

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
      '/prescriptions',
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
          status: params.status,
        }
        : undefined

      console.log('Calling /prescriptions/pending with params:', queryParams)

      // Use /prescriptions/pending endpoint which is designed for pharmacists to see all prescriptions
      const response: AxiosResponse<{ message: string; result: { prescriptions: Prescription[]; pagination: any } }> =
        await apiClient.get('/prescriptions/pending', {
          params: queryParams,
        })

      console.log('Response from /prescriptions/pending:', response.data)

      // Handle new response format with pagination
      if (response.data.result && response.data.result.prescriptions) {
        return response.data.result.prescriptions
      }

      return []
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown; status?: number }; message?: string }
      console.error('prescriptionService.getAll error:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      })
      throw error
    }
  },

  /**
   * Get pending prescriptions
   */
  getPending: async (): Promise<Prescription[]> => {
    const response: AxiosResponse<{ message: string; result: Prescription[] }> =
      await apiClient.get('/prescriptions/pending')
    return response.data.result
  },

  /**
   * Get prescription by ID
   */
  getById: async (id: string): Promise<Prescription> => {
    const response: AxiosResponse<{ message: string; result: Prescription }> = await apiClient.get(
      `/prescriptions/${id}`,
    )
    return response.data.result
  },

  /**
   * Verify or reject a prescription
   */
  verify: async (id: string, data: VerifyPrescriptionData): Promise<Prescription> => {
    const response: AxiosResponse<{ message: string; result: Prescription }> = await apiClient.put(
      `/prescriptions/${id}/verify`,
      data,
    )
    return response.data.result
  },

  /**
   * Get prescription statistics
   */
  getStats: async (): Promise<PrescriptionStats> => {
    try {
      console.log('Calling /prescriptions/stats')
      const response: AxiosResponse<{ message: string; result: PrescriptionStats }> =
        await apiClient.get('/prescriptions/stats')

      console.log('Response from /prescriptions/stats:', response.data)
      return response.data.result
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown; status?: number }; message?: string }
      console.error('prescriptionService.getStats error:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      })
      throw error
    }
  },
}
