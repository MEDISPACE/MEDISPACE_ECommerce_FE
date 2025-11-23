import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'
import type { PharmacistProfile } from './dashboard.service'

// ==================== TYPES ====================

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: number
  avatar?: string
  lisenseNumber?: string
}

export interface UpdatePasswordData {
  oldPassword: string
  newPassword: string
}

export interface WorkingStats {
  totalPrescriptionsProcessed: number
  totalOrdersProcessed: number
  averageProcessingTime: number
  customerSatisfactionRate: number
  activeHoursThisWeek: number
  prescriptionsThisMonth: number
  ordersThisMonth: number
}

export interface UpdateOnlineStatusData {
  isOnline: boolean
}

// ==================== SETTINGS SERVICE ====================

export const settingsService = {
  /**
   * Get pharmacist profile
   */
  getProfile: async (): Promise<PharmacistProfile> => {
    const response: AxiosResponse<{ message: string; result: PharmacistProfile }> =
      await apiClient.get('/pharmacist/profile')
    return response.data.result
  },

  /**
   * Update pharmacist profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<PharmacistProfile> => {
    const response: AxiosResponse<{ message: string; result: PharmacistProfile }> = await apiClient.patch(
      '/pharmacist/profile',
      data,
    )
    return response.data.result
  },

  /**
   * Update password
   */
  updatePassword: async (data: UpdatePasswordData): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await apiClient.patch('/pharmacist/password', data)
    return response.data
  },

  /**
   * Get working statistics
   */
  getWorkingStats: async (startDate?: string, endDate?: string): Promise<WorkingStats> => {
    const response: AxiosResponse<{ message: string; result: WorkingStats }> = await apiClient.get(
      '/pharmacist/stats/working',
      { params: { startDate, endDate } },
    )
    return response.data.result
  },

  /**
   * Update online status
   */
  updateOnlineStatus: async (data: UpdateOnlineStatusData): Promise<PharmacistProfile> => {
    const response: AxiosResponse<{ message: string; result: PharmacistProfile }> = await apiClient.patch(
      '/pharmacist/online-status',
      data,
    )
    return response.data.result
  },
}
