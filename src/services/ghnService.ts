import apiClient from './apiClient'

interface CalculateFeePayload {
    to_district_id: number
    to_ward_code: string
    weight: number // gram
    insurance_value?: number
    service_type_id?: number // 2: Standard
}

export const ghnService = {
    getProvinces: async () => {
        const response = await apiClient.get('/ghn/provinces')
        return response.data.data
    },

    getDistricts: async (provinceId: number) => {
        const response = await apiClient.get(`/ghn/districts?province_id=${provinceId}`)
        return response.data.data
    },

    getWards: async (districtId: number) => {
        const response = await apiClient.get(`/ghn/wards?district_id=${districtId}`)
        return response.data.data
    },

    calculateFee: async (payload: CalculateFeePayload) => {
        const response = await apiClient.post('/ghn/calculate-fee', payload)
        return response.data.data
    }
}
