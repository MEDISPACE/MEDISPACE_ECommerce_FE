// API services for prescriptions (Medical specific)
import { apiClient } from '~/services/apiClient'
import type { PrescriptionUpload } from '~/types/prescription'

class PrescriptionsAPI {
  // Get user prescriptions
  async getPrescriptions() {
    const response = await apiClient.get('/prescriptions')
    return response.data
  }

  // Get prescription by ID
  async getPrescription(prescriptionId: string) {
    const response = await apiClient.get(`/prescriptions/${prescriptionId}`)
    return response.data
  }

  // Upload prescription image
  async uploadPrescription(formData: FormData) {
    const response = await apiClient.post('/prescriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // Submit prescription for approval (matching backend UploadPrescriptionReqBody)
  async submitPrescription(data: {
    doctorName: string
    hospitalName: string
    prescriptionDate: string
    medications: {
      productName: string
      dosage: string
      quantity: number
      instructions: string
    }[]
    images?: string[]
  }): Promise<{
    message: string
    result: {
      _id: string
      prescriptionNumber: string
    }
  }> {
    const response = await apiClient.post('/prescriptions', data)
    return response.data as {
      message: string
      result: {
        _id: string
        prescriptionNumber: string
      }
    }
  }

  // Get prescription status
  async getPrescriptionStatus(prescriptionId: string) {
    const response = await apiClient.get(`/prescriptions/${prescriptionId}/status`)
    return response.data
  }

  // Delete prescription
  async deletePrescription(prescriptionId: string) {
    const response = await apiClient.delete(`/prescriptions/${prescriptionId}`)
    return response.data
  }
}

export const prescriptionsAPI = new PrescriptionsAPI()
export default prescriptionsAPI
