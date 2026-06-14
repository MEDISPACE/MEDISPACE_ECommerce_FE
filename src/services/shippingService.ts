import apiClient from './apiClient'

export interface ShippingRateOption {
  id: string
  provider: 'ghn' | 'ghtk' | 'ahamove'
  serviceCode: string
  name: string
  description: string
  price: number
  estimatedDays: string
  supportsCod?: boolean
}

interface ShippingRatesResponse {
  message: string
  result: ShippingRateOption[]
}

export const shippingService = {
  getRates: async (payload: {
    toAddress: string
    toWard?: string
    toDistrict: string
    toProvince: string
    toDistrictId?: number
    toWardCode?: string
    weight: number
    orderValue: number
  }): Promise<ShippingRateOption[]> => {
    try {
      const response = await apiClient.post<ShippingRatesResponse>('/shipping/rates', payload)
      return response.data.result || []
    } catch (error) {
      return []
    }
  },
}
