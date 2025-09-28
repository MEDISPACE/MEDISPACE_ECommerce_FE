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
  address: string
  ward: string
  city: string
  isDefault: boolean
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
  address?: Address
  medicalProfile?: MedicalProfile
  lisenseNumber?: string
  isOnline?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirm_password: string
  phoneNumber?: string
  gender?: number
}

export interface AuthResponse {
  message: string
  result?: {
    accessToken: string
    refreshToken: string
  }
  userId?: {
    accessToken: string
    refreshToken: string
  }
}

export interface ApiErrorResponse {
  message: string
  errors?: {
    [key: string]: {
      msg: string
      type: string
      value?: unknown
      path: string
      location: string
    }
  }
}
