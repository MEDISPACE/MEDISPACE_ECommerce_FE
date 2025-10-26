import { apiClient } from './apiClient'
import type { User } from '../types/user'
import type { LoginRequest, RegisterRequest, RegisterResponse, AuthResponse, ApiErrorResponse } from '../types/api'
import type { AxiosError } from 'axios'
import { API_ENDPOINTS } from '../constants'

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      throw axiosError.response?.data || { message: 'Login failed' }
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, userData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      throw axiosError.response?.data || { message: 'Registration failed' }
    }
  }

  async logout(): Promise<void> {
    try {
      // No need to send refresh token in body since it's in cookie
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      this.clearTokens()
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      // No need to send refresh token in body since it's in cookie
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Token refresh failed' }
    }
  }

  async verifyEmail(emailVerifyToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        emailVerifyToken,
      })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Email verification failed' }
    }
  }

  async resendVerifyEmail(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFY_EMAIL)
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Failed to resend verification email' }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Failed to send reset password email' }
    }
  }

  async resetPassword(forgotPasswordToken: string, password: string, confirmPassword: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        forgotPasswordToken,
        password,
        confirm_password: confirmPassword,
      })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Password reset failed' }
    }
  }

  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.USERS.ME)
      return response.data.user
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to get user profile' }
    }
  }

  saveTokens(accessToken: string): void {
    localStorage.setItem('medispace_access_token', accessToken)
    // Refresh token is now stored in httpOnly cookie by the server
  }

  clearTokens(): void {
    localStorage.removeItem('medispace_access_token')
    localStorage.removeItem('medispace_user_data')
  }

  getAccessToken(): string | null {
    return localStorage.getItem('medispace_access_token')
  }

  getRefreshToken(): string | null {
    // Refresh token is now in httpOnly cookie, not accessible from JavaScript
    return null
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }
}

export const authService = new AuthService()
export default authService
