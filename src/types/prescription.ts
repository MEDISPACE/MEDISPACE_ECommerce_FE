// Prescription related types for MEDISPACE (Medical specific)
import type { User } from './user'
import type { Product } from './product'

export enum PrescriptionStatus {
  Pending = 'pending',
  UnderReview = 'under_review',
  Approved = 'approved',
  Rejected = 'rejected',
  Expired = 'expired',
}

export interface Prescription {
  id: string
  userId: string
  user?: User

  // Prescription details
  prescriptionNumber?: string
  doctorName: string
  doctorLicense?: string
  hospitalName?: string
  issueDate: string
  expiryDate?: string

  // Images
  images: string[]
  originalFilenames: string[]

  // Medications
  medications: PrescriptionMedication[]

  // Verification
  status: PrescriptionStatus
  pharmacistId?: string
  pharmacistNotes?: string
  verifiedAt?: string
  rejectionReason?: string

  // Usage
  usageCount: number
  maxUsage?: number

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface PrescriptionMedication {
  id: string
  productId?: string
  product?: Product
  medicationName: string
  dosage: string
  quantity: number
  instructions: string
  duration?: string
  frequency?: string
  notes?: string
}

export interface PrescriptionUpload {
  doctorName: string
  doctorLicense?: string
  hospitalName?: string
  issueDate: string
  expiryDate?: string
  medications: {
    medicationName: string
    dosage: string
    quantity: number
    instructions: string
    duration?: string
    frequency?: string
    notes?: string
  }[]
  images: File[]
  notes?: string
}

export interface PrescriptionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  drugInteractions?: DrugInteraction[]
  ageRestrictions?: string[]
  contraindications?: string[]
}

export interface DrugInteraction {
  medication1: string
  medication2: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommendation: string
}

export interface PrescriptionFilter {
  status?: PrescriptionStatus
  dateFrom?: string
  dateTo?: string
  doctorName?: string
  page?: number
  limit?: number
}
