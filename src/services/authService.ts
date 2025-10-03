import { apiClient } from './apiClient'
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiErrorResponse } from '../types/user'
import type { AxiosError } from 'axios'

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', credentials)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      throw axiosError.response?.data || { message: 'Login failed' }
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/register', userData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      throw axiosError.response?.data || { message: 'Registration failed' }
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('medispace_refresh_token')
      if (refreshToken) {
        await apiClient.post('/users/logout', { refreshToken })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      this.clearTokens()
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('medispace_refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post<AuthResponse>('/users/refresh-token', {
        refreshToken,
      })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Token refresh failed' }
    }
  }

  async verifyEmail(emailVerifyToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/verify-email', {
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
      await apiClient.post('/users/resend-verify-email')
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Failed to resend verification email' }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/users/forgot-password', { email })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Failed to send reset password email' }
    }
  }

  async resetPassword(forgotPasswordToken: string, password: string, confirmPassword: string): Promise<void> {
    try {
      await apiClient.post('/users/reset-password', {
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
      const response = await apiClient.get<{ user: User }>('/users/me')
      return response.data.user
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Failed to get user profile' }
    }
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('medispace_access_token', accessToken)
    localStorage.setItem('medispace_refresh_token', refreshToken)
  }

  clearTokens(): void {
    localStorage.removeItem('medispace_access_token')
    localStorage.removeItem('medispace_refresh_token')
    localStorage.removeItem('medispace_user_data')
  }

  getAccessToken(): string | null {
    return localStorage.getItem('medispace_access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('medispace_refresh_token')
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }
}

export const authService = new AuthService()
export default authService
