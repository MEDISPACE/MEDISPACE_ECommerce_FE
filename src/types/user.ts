export enum UserRole {
  Customer = 0,
  Pharmacist = 1,
  Admin = 2,
}

export enum UserStatus {
  Unverified = 0,
  Verified = 1,
  Banned = 2,
}

export enum UserGender {
  Male = 0,
  Female = 1,
}

export interface Address {
  id?: string
  name: string
  phone: string
  province: string
  district: string
  ward: string
  address: string
  type: 'home' | 'office' | 'other'
  isDefault: boolean
  provinceId?: number
  districtId?: number
  wardCode?: string
}

export interface MedicalProfile {
  bloodType?: string
  height?: number
  weight?: number
  allergies?: string[]
  chronicConditions?: string[]
}

export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  phoneNumber?: string
  dateOfBirth?: string
  gender?: UserGender
  avatar?: string
  addresses?: Address[]
  medicalProfile?: MedicalProfile
  lisenseNumber?: string
  isOnline?: boolean
  forcePasswordChange?: boolean
  emailVerifyToken?: string
  forgotPasswordToken?: string
  createdAt?: string
  updatedAt?: string
}

// Request/Response types matching backend
export interface LoginRequest {
  email: string
  password: string
}

// Note: API types moved to types/api.ts to avoid conflicts
// These are kept for backward compatibility
