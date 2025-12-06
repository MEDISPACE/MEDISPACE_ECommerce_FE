import apiClient from '../apiClient'

// ==================== TYPES ====================

export interface PharmacistReportsAnalytics {
    prescriptions: {
        processed: number
        growth: number
        pending: number
        verified: number
        rejected: number
        avgProcessingTime: number
        daily: Array<{
            day: string
            count: number
            verified: number
            rejected: number
        }>
    }
    orders: {
        created: number
        growth: number
        total: number
        completed: number
        revenue: number
    }
    consultations: {
        total: number
        growth: number
        avgResponseTime: string
        activeChats: number
        resolved: number
    }
    revenue: {
        total: number
        growth: number
        daily: number
        weekly: number
        monthly: number
    }
    satisfaction: {
        rating: number
        totalReviews: number
        distribution: Record<number, number>
    }
    categories: {
        drugCategories: Array<{
            name: string
            count: number
            percent: number
        }>
        timeSlots: Array<{
            time: string
            count: number
            percent: number
        }>
    }
    performance: {
        completionRate: number
        avgResponseTime: string
        satisfactionRate: number
        efficiency: number
    }
}

export interface PrescriptionAnalytics {
    total: number
    processed: number
    pending: number
    verified: number
    rejected: number
    growth: number
    avgProcessingTime: number
    daily: Array<{
        date: string
        count: number
        verified: number
        rejected: number
    }>
    byStatus: Record<string, number>
    trends: {
        weekOverWeek: number
        monthOverMonth: number
    }
}

export interface ConsultationStats {
    total: number
    active: number
    resolved: number
    avgResponseTime: string
    avgDuration: string
    satisfactionRating: number
    byTimeSlot: Array<{
        time: string
        count: number
    }>
    commonTopics: Array<{
        topic: string
        count: number
    }>
}

export interface CategoryAnalytics {
    drugCategories: Array<{
        name: string
        prescriptionCount: number
        orderCount: number
        percentage: number
    }>
    timeSlots: Array<{
        time: string
        activityCount: number
        percentage: number
        avgResponseTime: string
    }>
    prescriptionTypes: Array<{
        type: string
        count: number
        percentage: number
    }>
}

export interface PerformanceMetrics {
    completionRate: number
    onTimeRate: number
    avgResponseTime: string
    avgProcessingTime: string
    satisfactionScore: number
    efficiency: number
    productivity: {
        prescriptionsPerDay: number
        ordersPerDay: number
        consultationsPerDay: number
    }
    improvements: Array<{
        area: string
        suggestion: string
        priority: 'high' | 'medium' | 'low'
    }>
}

// ==================== API FUNCTIONS ====================

/**
 * Get comprehensive pharmacist reports analytics
 */
export const getReportsAnalytics = async (timeRange: string = 'week'): Promise<PharmacistReportsAnalytics> => {
    const response = await apiClient.get<{ result: PharmacistReportsAnalytics }>('/pharmacist/reports/analytics', {
        params: { timeRange }
    })
    return response.data.result
}

/**
 * Get prescription analytics
 */
export const getPrescriptionAnalytics = async (timeRange: string = 'week'): Promise<PrescriptionAnalytics> => {
    const response = await apiClient.get<{ result: PrescriptionAnalytics }>('/pharmacist/reports/prescriptions', {
        params: { timeRange }
    })
    return response.data.result
}

/**
 * Get consultation statistics
 */
export const getConsultationStats = async (timeRange: string = 'week'): Promise<ConsultationStats> => {
    const response = await apiClient.get<{ result: ConsultationStats }>('/pharmacist/reports/consultations', {
        params: { timeRange }
    })
    return response.data.result
}

/**
 * Get category analytics
 */
export const getCategoryAnalytics = async (timeRange: string = 'week'): Promise<CategoryAnalytics> => {
    const response = await apiClient.get<{ result: CategoryAnalytics }>('/pharmacist/reports/categories', {
        params: { timeRange }
    })
    return response.data.result
}

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (timeRange: string = 'week'): Promise<PerformanceMetrics> => {
    const response = await apiClient.get<{ result: PerformanceMetrics }>('/pharmacist/reports/performance', {
        params: { timeRange }
    })
    return response.data.result
}

// Export all as default object
const reportsService = {
    getReportsAnalytics,
    getPrescriptionAnalytics,
    getConsultationStats,
    getCategoryAnalytics,
    getPerformanceMetrics
}

export default reportsService
