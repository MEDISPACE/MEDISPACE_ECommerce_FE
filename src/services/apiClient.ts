import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_ENDPOINTS } from '../constants'

// API base URL - Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for cross-origin requests
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('medispace_access_token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        } else {
          // Only warn for protected endpoints that require authentication
          const protectedEndpoints = ['/cart', '/orders', '/profile', '/admin', '/wishlist', '/users/me']
          const isProtectedEndpoint = protectedEndpoints.some(endpoint => config.url?.includes(endpoint))

          if (isProtectedEndpoint) {

          }
        }
        return config
      },
      (error: unknown) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Only log errors that are NOT 401 or are 401 but already retried
        if (error.response?.status !== 401 || originalRequest._retry) {

        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/refresh-token')) {
          originalRequest._retry = true

          try {
            // Wait for ongoing refresh or start a new one
            const accessToken = await this.refreshToken()

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearAuthState()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  /**
   * Handle token refresh with promise queue to prevent race conditions
   * Multiple requests will wait for the same refresh promise
   */
  public async refreshToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    // Start a new refresh
    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      const accessToken = await this.refreshPromise
      return accessToken
    } finally {
      // Reset refresh state
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      // Use a fresh axios instance to avoid interceptor loops
      // Refresh token is in httpOnly cookie, browser sends it automatically
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
        {},
        { withCredentials: true }
      )

      const { accessToken } = response.data.result
      localStorage.setItem('medispace_access_token', accessToken)
      return accessToken
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearAuthState()
      throw error
    }
  }

  /**
   * Clear all authentication state
   */
  private clearAuthState(): void {
    localStorage.removeItem('medispace_access_token')
    localStorage.removeItem('medispace_user_data')
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config)
  }
}

export const apiClient = new ApiClient()
export default apiClient

