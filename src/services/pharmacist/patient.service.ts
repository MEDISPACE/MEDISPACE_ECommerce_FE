import { apiClient } from '../apiClient'
import type { AxiosResponse } from 'axios'

// ==================== TYPES ====================

export interface PatientMedicalInfo {
  _id: string
  customerId: string
  bloodType?: string
  allergies: string[]
  chronicDiseases: string[]
  currentMedications: Array<{
    name: string
    dosage: string
    frequency: string
    startDate: string
    endDate?: string
  }>
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateMedicalInfoData {
  bloodType?: string
  chronicDiseases?: string[]
  notes?: string
}

export interface AddAllergyData {
  allergen: string
}

export interface PatientNote {
  _id: string
  patientId: string
  pharmacistId: string
  note: string
  noteType: 'General' | 'Medical' | 'Prescription' | 'Order'
  relatedId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteData {
  note: string
  noteType: 'General' | 'Medical' | 'Prescription' | 'Order'
  relatedId?: string
}

export interface PatientMedication {
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
}

export interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'Low' | 'Moderate' | 'High' | 'Severe'
  description: string
  recommendation: string
}

export interface DrugInteractionCheck {
  hasInteractions: boolean
  interactions: DrugInteraction[]
}

// ==================== PATIENT SERVICE ====================

export const patientService = {
  /**
   * Get patient medical information
   */
  getMedicalInfo: async (patientId: string): Promise<PatientMedicalInfo> => {
    const response: AxiosResponse<{ message: string; result: PatientMedicalInfo }> = await apiClient.get(
      `/pharmacist/patients/${patientId}/medical-info`,
    )
    return response.data.result
  },

  /**
   * Update patient medical information
   */
  updateMedicalInfo: async (patientId: string, data: UpdateMedicalInfoData): Promise<PatientMedicalInfo> => {
    const response: AxiosResponse<{ message: string; result: PatientMedicalInfo }> = await apiClient.put(
      `/pharmacist/patients/${patientId}/medical-info`,
      data,
    )
    return response.data.result
  },

  /**
   * Add allergy to patient medical info
   */
  addAllergy: async (patientId: string, data: AddAllergyData): Promise<PatientMedicalInfo> => {
    const response: AxiosResponse<{ message: string; result: PatientMedicalInfo }> = await apiClient.post(
      `/pharmacist/patients/${patientId}/allergies`,
      data,
    )
    return response.data.result
  },

  /**
   * Get all notes for a patient
   */
  getNotes: async (patientId: string): Promise<PatientNote[]> => {
    const response: AxiosResponse<{ message: string; result: PatientNote[] }> = await apiClient.get(
      `/pharmacist/patients/${patientId}/notes`,
    )
    return response.data.result
  },

  /**
   * Create a new note for a patient
   */
  createNote: async (patientId: string, data: CreateNoteData): Promise<PatientNote> => {
    const response: AxiosResponse<{ message: string; result: PatientNote }> = await apiClient.post(
      `/pharmacist/patients/${patientId}/notes`,
      data,
    )
    return response.data.result
  },

  /**
   * Get current medications for a patient
   */
  getMedications: async (patientId: string): Promise<PatientMedication[]> => {
    const response: AxiosResponse<{ message: string; result: PatientMedication[] }> = await apiClient.get(
      `/pharmacist/patients/${patientId}/medications`,
    )
    return response.data.result
  },

  /**
   * Check for drug interactions
   * Note: This endpoint requires patientId in path
   */
  checkInteractions: async (patientId: string, drugName: string): Promise<DrugInteractionCheck> => {
    const response: AxiosResponse<{ message: string; result: DrugInteractionCheck }> = await apiClient.post(
      `/pharmacist/patients/${patientId}/check-interactions`,
      { drug_name: drugName },
    )
    return response.data.result
  },
}
