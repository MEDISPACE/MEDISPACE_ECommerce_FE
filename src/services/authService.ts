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
      throw axiosError.response?.data || { message: 'Đăng nhập thất bại. Vui lòng thử lại.' }
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, userData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      throw axiosError.response?.data || { message: 'Đăng ký thất bại. Vui lòng thử lại.' }
    }
  }

  async logout(): Promise<void> {
    try {
      // No need to send refresh token in body since it's in cookie
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch {
      // Ignore logout errors
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
      throw axiosError.response?.data || { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
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
      throw axiosError.response?.data || { message: 'Xác thực email thất bại. Token có thể đã hết hạn.' }
    }
  }

  async resendVerifyEmail(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFY_EMAIL)
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Không thể gửi lại email xác thực. Vui lòng thử lại.' }
    }
  }

  async verifyForgotPasswordToken(forgotPasswordToken: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_FORGOT_PASSWORD, { forgotPasswordToken })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Token không hợp lệ hoặc đã hết hạn.' }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.' }
    }
  }

  async resetPassword(forgotPasswordToken: string, password: string, confirmPassword: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        forgotPasswordToken,
        password,
        confirmPassword: confirmPassword,
      })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.' }
    }
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      await apiClient.put(API_ENDPOINTS.USERS.CHANGE_PASSWORD, {
        currentPassword,
        password: newPassword,
        confirmPassword,
      })
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' }
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<{ message: string; user: User }>(
        API_ENDPOINTS.USERS.UPDATE_ME,
        profileData,
      )
      return response.data.user
    } catch (error) {
      const axiosError = error as AxiosError<AuthResponse>
      throw axiosError.response?.data || { message: 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.' }
    }
  }

  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<{ message: string; user: User }>(API_ENDPOINTS.USERS.ME)
      return response.data.user
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      throw axiosError.response?.data || { message: 'Không thể tải thông tin tài khoản.' }
    }
  }

  saveTokens(accessToken: string): void {
    localStorage.setItem('medispace_access_token', accessToken)
    localStorage.setItem('medispace_session_hint', '1')
    // Refresh token is now stored in httpOnly cookie by the server
  }

  clearTokens(): void {
    localStorage.removeItem('medispace_access_token')
    localStorage.removeItem('medispace_user_data')
    localStorage.removeItem('medispace_session_hint')
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
