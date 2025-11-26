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
    const response = await apiClient.get<{ result: DashboardStats }>('/admin/dashboard/stats')
    return response.data.result
}

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit?: number): Promise<RecentActivity[]> => {
    const response = await apiClient.get<{ result: RecentActivity[] }>('/admin/dashboard/recent-activities', {
        params: { limit }
    })
    return response.data.result
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

// Export all as default object
const adminService = {
    getDashboardStats,
    getRecentActivities,
    getAllUsers,
    getUserStats,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    verifyUserEmail,
    getProductStats,
    getLowStockProducts
}

export default adminService
