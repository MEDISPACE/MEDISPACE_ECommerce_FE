import type { User, Address } from './user'

// API Request/Response types matching backend exactly
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirm_password: string
  phoneNumber: string
  gender: number
}

export interface RegisterResponse {
  message: string
  userId: string
}

export interface AuthResponse {
  message: string
  result?: {
    accessToken: string
  }
  user?: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  forgotPasswordToken: string
  password: string
  confirm_password: string
}

export interface UpdateMeRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: number
  avatar?: string
  address?: Address
  lisenseNumber?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  password: string
  confirmPassword: string
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<
    string,
    {
      msg: string
      type: string
      value?: unknown
      path: string
      location: string
    }
  >
}

export interface ApiSuccessResponse<T = unknown> {
  message: string
  result?: T
}
