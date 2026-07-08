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
      activeIngredient?: string | null
      dosage: string | null
      quantity: number | null
      unit: string | null
      instructions: string | null
      productId?: string
      matchedName?: string
      slug?: string
      image?: string | null
      price?: number | null
      stockQuantity?: number
      requiresPrescription?: boolean
      confidence?: string
      needsReview?: boolean
      source?: string
      sourcePage?: number
      reviewReason?: string
      equivalentProducts?: Array<{
        productId: string
        name: string
        slug: string
        image?: string | null
        price?: number | null
        unit?: string
        stockQuantity?: number
        requiresPrescription?: boolean
        activeIngredients?: string
        strength?: string
        dosageForm?: string
        reason?: string
      }>
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
  quality?: {
    score?: number
    level?: string
    flags?: string[]
    conflicts?: unknown[]
    canEarlyReturn?: boolean
    imageQuality?: {
      level?: string
      flags?: string[]
      width?: number
      height?: number
      blurScore?: number
      brightness?: number
      contrast?: number
    }
    pages?: Array<{
      page?: number
      success?: boolean
      quality?: unknown
      imageQuality?: {
        level?: string
        flags?: string[]
        width?: number
        height?: number
        blurScore?: number
        brightness?: number
        contrast?: number
      }
    }>
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
  async scanPrescription(
    imageUrl: string | string[],
    mode?: 'traditional' | 'vision' | 'parallel' | 'parallel_benchmark',
  ): Promise<OCRScanResult> {
    // Override timeout: OCR vision fallback can run longer than the default API timeout.
    const payload = Array.isArray(imageUrl) ? { imageUrls: imageUrl, mode } : { imageUrl, mode }
    const pageCount = Array.isArray(imageUrl) ? Math.max(imageUrl.length, 1) : 1
    const response = await apiClient.post<{ message: string; result: OCRScanResult }>(
      '/prescriptions/scan',
      payload,
      { timeout: Math.min(220000 * pageCount, 660000) },
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
      productId?: string
      matchedName?: string
      slug?: string
      image?: string | null
      price?: number | null
      stockQuantity?: number
      requiresPrescription?: boolean
      activeIngredient?: string | null
      dosage: string
      quantity: number
      unit?: string
      instructions: string
      confidence?: string
      needsReview?: boolean
      source?: string
      reviewReason?: string
      equivalentProducts?: Array<{
        productId: string
        name: string
        slug: string
        image?: string | null
        price?: number | null
        unit?: string
        stockQuantity?: number
        requiresPrescription?: boolean
        activeIngredients?: string
        strength?: string
        dosageForm?: string
        reason?: string
      }>
    }[]
    images?: string[]
    // OCR metadata
    ocrRawText?: string
    ocrConfidence?: string
    ocrExtractionMethod?: string
    ocrQuality?: Record<string, unknown>
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
