import type { AxiosError } from 'axios'
import apiClient from './apiClient'

// ==================== TYPES ====================

export interface DashboardStats {
  revenue: {
    today: number
    month: number
    year: number
    growth: number
  }
  orders: {
    total: number
    pending: number
    processing: number
    completed: number
    cancelled: number
    todayCount: number
  }
  users: {
    total: number
    newToday: number
    customers: number
    pharmacists: number
    admins: number
    verified: number
  }
  products: {
    total: number
    active: number
    outOfStock: number
    lowStock: number
    totalValue: number
  }
  prescriptions: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export interface RecentActivity {
  id: string
  type: 'user_registration' | 'order_created' | 'prescription_uploaded' | 'prescription_approved' | 'order_completed'
  message: string
  time: string
  severity: 'info' | 'success' | 'warning' | 'error'
  metadata?: Record<string, any>
}

export interface UserListParams {
  page?: number
  limit?: number
  role?: string
  status?: string
  verified?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserStats {
  total: number
  customers: number
  pharmacists: number
  admins: number
  active: number
  verified: number
}

export interface PharmacistStats {
  total: number
  active: number
  verified: number
  onLeave: number
  totalPrescriptions: number
  totalConsultations: number
  avgRating: number
}

export interface ProductStats {
  total: number
  active: number
  outOfStock: number
  lowStock: number
  totalValue: number
  byCategory: Array<{
    category: string
    count: number
  }>
}

export interface LowStockProduct {
  _id: string
  name: string
  sku: string
  stockQuantity: number
  price: number
  categoryId: string
}

// ==================== API FUNCTIONS ====================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // console.log('Fetching dashboard stats...')
    const response = await apiClient.get<{ result: DashboardStats }>('/admin/dashboard/stats')
    // console.log('Dashboard stats loaded successfully:', response.data.result)
    return response.data.result
  } catch (error) {
    const status = (error as AxiosError).response?.status
    if (status !== 401 && status !== 403) {
      console.error('Error fetching dashboard stats:', error)
    }
    throw error
  }
}

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit?: number): Promise<RecentActivity[]> => {
  try {
    const response = await apiClient.get<{ result: RecentActivity[] }>('/admin/dashboard/recent-activities', {
      params: { limit },
    })
    return response.data.result
  } catch (error) {
    const status = (error as AxiosError).response?.status
    if (status !== 401 && status !== 403) {
      console.error('Error fetching recent activities:', error)
    }
    throw error
  }
}

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (params: UserListParams) => {
  const response = await apiClient.get('/admin/users', { params })
  return response.data
}

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<UserStats> => {
  const response = await apiClient.get<{ result: UserStats }>('/admin/users/stats')
  return response.data.result
}

/**
 * Get pharmacist statistics
 */
export const getPharmacistStats = async (): Promise<PharmacistStats> => {
  const response = await apiClient.get<{ result: PharmacistStats }>('/admin/users/pharmacists/stats')
  return response.data.result
}

/**
 * Create new user (Admin only)
 */
export const createUser = async (userData: any) => {
  const response = await apiClient.post('/admin/users', userData)
  return response.data
}

/**
 * Update user (Admin only)
 */
export const updateUser = async (userId: string, userData: any) => {
  const response = await apiClient.patch(`/admin/users/${userId}`, userData)
  return response.data
}

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`)
  return response.data
}

/**
 * Reset user password (Admin only)
 */
export const resetUserPassword = async (userId: string) => {
  const response = await apiClient.patch(`/admin/users/${userId}/reset-password`)
  return response.data
}

/**
 * Verify user email manually (Admin only)
 */
export const verifyUserEmail = async (userId: string) => {
  const response = await apiClient.patch(`/admin/users/${userId}/verify-email`)
  return response.data
}

/**
 * Get product statistics
 */
export const getProductStats = async (): Promise<ProductStats> => {
  const response = await apiClient.get<{ result: ProductStats }>('/admin/products/stats')
  return response.data.result
}

/**
 * Get low stock products
 */
export const getLowStockProducts = async (): Promise<LowStockProduct[]> => {
  const response = await apiClient.get<{ result: LowStockProduct[] }>('/admin/products/low-stock')
  return response.data.result
}

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders
 */
export const getAllOrders = async (params: {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) => {
  const response = await apiClient.get<{ result: any }>('/admin/orders', { params })
  return response.data.result
}

/**
 * Get order statistics
 */
export const getOrderStats = async (params?: {
  status?: string
  paymentStatus?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) => {
  const response = await apiClient.get<{ result: any }>('/admin/orders/stats', { params })
  return response.data.result
}

/**
 * Get order details
 */
export const getOrderDetails = async (orderId: string) => {
  const response = await apiClient.get<{ result: any }>(`/admin/orders/${orderId}`)
  return response.data.result
}

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  data: {
    status?: string
    paymentStatus?: string
    notes?: string
    trackingNumber?: string
  },
) => {
  const response = await apiClient.patch<{ result: any }>(`/admin/orders/${orderId}/status`, data)
  return response.data.result
}

// ==================== PRESCRIPTION MANAGEMENT ====================

/**
 * Get all prescriptions
 */
export const getAllPrescriptions = async (params: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) => {
  const response = await apiClient.get<{ result: any }>('/admin/prescriptions', { params })
  return response.data.result
}

/**
 * Get prescription statistics
 */
export const getPrescriptionStats = async () => {
  const response = await apiClient.get<{ result: any }>('/admin/prescriptions/stats')
  return response.data.result
}

/**
 * Update prescription status
 */
export const updatePrescriptionStatus = async (
  prescriptionId: string,
  data: {
    status: string
    notes?: string
  },
) => {
  const response = await apiClient.patch<{ result: any }>(`/admin/prescriptions/${prescriptionId}/status`, data)
  return response.data.result
}

/**
 * Bulk update prescriptions
 */
export const bulkUpdatePrescriptions = async (prescriptionIds: string[], status: string) => {
  const response = await apiClient.patch<{ result: any }>('/admin/prescriptions/bulk-update', {
    prescriptionIds,
    status,
  })
  return response.data.result
}

// ==================== CATEGORY MANAGEMENT ====================

/**
 * Get category tree (Admin)
 */
export const getCategoryTree = async () => {
  const response = await apiClient.get<{ result: any }>('/categories/admin-tree')
  return response.data.result
}

/**
 * Create category
 */
export const createCategory = async (data: any) => {
  const response = await apiClient.post<{ result: any }>('/categories', data)
  return response.data.result
}

/**
 * Update category
 */
export const updateCategory = async (id: string, data: any) => {
  const response = await apiClient.patch<{ result: any }>(`/categories/${id}`, data)
  return response.data.result
}

/**
 * Delete category
 */
export const deleteCategory = async (id: string) => {
  const response = await apiClient.delete(`/categories/${id}`)
  return response.data
}

/**
 * Toggle category status
 */
export const toggleCategoryStatus = async (id: string, isActive: boolean) => {
  const response = await apiClient.patch<{ result: any }>(`/categories/${id}/toggle-status`, { isActive })
  return response.data.result
}

// Export all as default object
const adminService = {
  getDashboardStats,
  getRecentActivities,
  getAllUsers,
  getUserStats,
  getPharmacistStats,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  verifyUserEmail,
  getProductStats,
  getLowStockProducts,
  getAllOrders,
  getOrderStats,
  getOrderDetails,
  updateOrderStatus,
  getAllPrescriptions,
  getPrescriptionStats,
  updatePrescriptionStatus,
  bulkUpdatePrescriptions,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
}

export default adminService
