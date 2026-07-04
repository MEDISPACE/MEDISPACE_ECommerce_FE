// Use interfaces from dashboard.service.ts
export type {
  DashboardStats,
  RecentActivity,
  Prescription,
  Order,
  PatientInfo,
  PatientHistory,
  PharmacistProfile,
} from './dashboard.service'

// Use interfaces from patient.service.ts
export type {
  PatientMedicalInfo,
  UpdateMedicalInfoData,
  AddAllergyData,
  PatientNote,
  CreateNoteData,
  PatientMedication,
  DrugInteraction,
  DrugInteractionCheck,
} from './patient.service'

// Use interfaces from prescription.service.ts
export type {
  UploadPrescriptionData,
  VerifyPrescriptionData,
  PrescriptionListParams,
  PrescriptionStats,
} from './prescription.service'

// Define unified types used in components
import type { PatientInfo } from './dashboard.service'
import type { PatientMedicalInfo } from './patient.service'

export interface PatientSearchResult {
  customerId: string
  fullName: string
  phoneNumber: string
  email?: string
  avatar?: string
  addresses?: any[]
}

export interface MedicalInfo {
  bloodType?: string
  allergies: string[]
  chronicDiseases: string[]
  currentMedications: Array<{
    name: string
    dosage?: string
    frequency?: string
    startDate?: string
    endDate?: string
  }>
}
