import apiClient from './apiClient'

export interface ShippingOption {
  id: number
  name: string
  price: number
  description: string
  estimatedDays: string
  leadTimeUnix: number
}

interface GHNResponse<T> {
  message: string
  result: T
}

export const ghnService = {
  getProvinces: async () => {
    try {
      const response = await apiClient.get<GHNResponse<any>>('/ghn/provinces')
      return response.data.result || []
    } catch (error) {
      return []
    }
  },

  getDistricts: async (provinceId: number) => {
    try {
      const response = await apiClient.get<GHNResponse<any>>(`/ghn/districts?province_id=${provinceId}`)
      return response.data.result || []
    } catch (error) {
      return []
    }
  },

  getWards: async (districtId: number) => {
    try {
      const response = await apiClient.get<GHNResponse<any>>(`/ghn/wards?district_id=${districtId}`)
      return response.data.result || []
    } catch (error) {
      return []
    }
  },

  calculateFee: async (payload: any) => {
    try {
      const response = await apiClient.post<GHNResponse<any>>('/ghn/calculate-fee', payload)
      return response.data.result || null
    } catch (error) {
      return null
    }
  },

  getShippingOptions: async (payload: {
    to_district_id: number
    to_ward_code: string
    weight: number
  }): Promise<ShippingOption[]> => {
    try {
      const response = await apiClient.post<GHNResponse<ShippingOption[]>>('/ghn/shipping-options', payload)
      return response.data.result || []
    } catch (error) {
      return []
    }
  },
}
