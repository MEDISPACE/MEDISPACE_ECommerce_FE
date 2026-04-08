// API services for prescriptions (Medical specific)
import { apiClient } from '~/services/apiClient'

// OCR Scan response type
export interface OCRScanResult {
  success: boolean
  message: string
  rawText: string
  data: {
    patientName: string | null
    patientAge: string | null
    patientGender: string | null
    doctorName: string | null
    hospitalName: string | null
    prescriptionDate: string | null
    diagnosis: string | null
    medications: Array<{
      productName: string
      dosage: string | null
      quantity: number | null
      unit: string | null
      instructions: string | null
    }>
    specialNotes: string | null
    confidence: string
    _extraction_method?: string
  }
  timing?: {
    station1_PaddleOCR_seconds: number
    station2_VietOCR_seconds: number
    station3_Extractor_seconds: number
    total_pipeline_seconds: number
  }
}

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

  // ★ SCAN prescription image via OCR Service (qua proxy BE)
  async scanPrescription(imageUrl: string): Promise<OCRScanResult> {
    // Override timeout: OCR + LLM fallback có thể mất tới ~50s
    const response = await apiClient.post<{ message: string; result: OCRScanResult }>(
      '/prescriptions/scan',
      { imageUrl },
      { timeout: 150000 }
    )
    return response.data.result
  }

  // Submit prescription for approval
  async submitPrescription(data: {
    // Thông tin bệnh nhân
    patientName?: string
    patientAge?: string
    patientGender?: string
    diagnosis?: string
    specialNotes?: string
    // Thông tin khám
    doctorName: string
    hospitalName: string
    prescriptionDate: string
    medications: {
      productName: string
      dosage: string
      quantity: number
      unit?: string
      instructions: string
    }[]
    images?: string[]
    // OCR metadata
    ocrRawText?: string
    ocrConfidence?: string
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
