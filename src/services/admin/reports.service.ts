import apiClient from '../apiClient'

// ==================== TYPES ====================

export interface ReportsAnalytics {
  revenue: {
    total: number
    today: number
    month: number
    year: number
    growth: number
    monthlyTrends: Array<{
      month: string
      revenue: number
    }>
    byPaymentMethod?: Record<string, number>
  }
  orders: {
    total: number
    growth: number
    pending: number
    processing: number
    completed: number
    cancelled: number
    todayCount: number
    statusBreakdown: Record<string, number>
  }
  users: {
    total: number
    growth: number
    newUsers: number
    returningUsers: number
    customers: number
    pharmacists: number
    admins: number
    verified: number
  }
  products: {
    total: number
    growth: number
    active: number
    outOfStock: number
    lowStock: number
    totalValue: number
    topProducts: Array<{
      _id: string
      name: string
      sales: number
      revenue: number
      category?: string
      categoryName?: string
      growth?: number
    }>
    salesByCategory: Array<{
      category: string
      categoryName: string
      value: number
      amount: number
      count: number
      // Backend fields (mapped in transform)
      percentage?: number
      totalRevenue?: number
      totalSales?: number
      productCount?: number
    }>
    stockStatus?: {
      total: number
      active: number
      outOfStock: number
      lowStock: number
    }
    trends?: {
      newProducts: number
      discontinuedProducts: number
      growthRate: number
    }
  }
  metrics: {
    avgOrderValue: number
    conversionRate: number
    customerRetention: number
  }
}

export interface RevenueAnalytics {
  total: number
  today: number
  month: number
  year: number
  growth: number
  monthlyTrends: Array<{
    month: string
    revenue: number
    orderCount: number
  }>
  quarterlyTrends?: Array<{
    quarter: string
    revenue: number
  }>
  byPaymentMethod: Record<string, number>
  avgOrderValue: number
}

export interface ProductAnalytics {
  topProducts: Array<{
    _id: string
    name: string
    sku: string
    sales: number
    revenue: number
    category: string
    categoryName: string
    growth: number
  }>
  salesByCategory: Array<{
    category: string
    categoryName: string
    productCount: number
    totalSales: number
    totalRevenue: number
    percentage: number
  }>
  stockStatus: {
    total: number
    active: number
    outOfStock: number
    lowStock: number
  }
  trends: {
    newProducts: number
    discontinuedProducts: number
    growthRate: number
  }
}

export interface CustomerAnalytics {
  total: number
  newCustomers: number
  returningCustomers: number
  retentionRate: number
  lifetimeValue: number
  byLocation: Array<{
    province: string
    count: number
    percentage: number
  }>
  bySegment: {
    active: number
    inactive: number
    vip: number
  }
  growth: {
    daily: number
    weekly: number
    monthly: number
  }
}

// ==================== API FUNCTIONS ====================

/**
 * Get comprehensive reports analytics
 */
export const getReportsAnalytics = async (
  timeRange: string = 'month',
  startDate?: string,
  endDate?: string,
): Promise<ReportsAnalytics> => {
  const params: Record<string, string> = { timeRange }
  if (timeRange === 'custom' && startDate) params.startDate = startDate
  if (timeRange === 'custom' && endDate) params.endDate = endDate

  const response = await apiClient.get<{ result: any }>('/admin/reports/analytics', {
    params,
  })
  const raw = response.data.result

  // Transform backend products shape to match FE expected format
  const productsData = raw.products || {}
  const stockStatus = productsData.stockStatus || {}
  const trends = productsData.trends || {}

  // Map salesByCategory fields: backend uses percentage/totalRevenue/productCount
  // FE components use value/amount/count
  const salesByCategory = (productsData.salesByCategory || []).map((cat: any) => ({
    category: cat.category,
    categoryName: cat.categoryName || cat.category || 'Chưa phân loại',
    value: cat.percentage ?? cat.value ?? 0,
    amount: cat.totalRevenue ?? cat.amount ?? 0,
    count: cat.productCount ?? cat.count ?? 0,
    percentage: cat.percentage,
    totalRevenue: cat.totalRevenue,
    totalSales: cat.totalSales,
    productCount: cat.productCount,
  }))

  return {
    ...raw,
    products: {
      total: stockStatus.total ?? productsData.total ?? 0,
      growth: trends.growthRate ?? productsData.growth ?? 0,
      active: stockStatus.active ?? productsData.active ?? 0,
      outOfStock: stockStatus.outOfStock ?? productsData.outOfStock ?? 0,
      lowStock: stockStatus.lowStock ?? productsData.lowStock ?? 0,
      totalValue: productsData.totalValue ?? 0,
      topProducts: productsData.topProducts || [],
      salesByCategory,
      stockStatus,
      trends,
    },
  } as ReportsAnalytics
}

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (timeRange: string = 'month'): Promise<RevenueAnalytics> => {
  const response = await apiClient.get<{ result: RevenueAnalytics }>('/admin/reports/revenue', {
    params: { timeRange },
  })
  return response.data.result
}

/**
 * Get product analytics
 */
export const getProductAnalytics = async (timeRange: string = 'month'): Promise<ProductAnalytics> => {
  const response = await apiClient.get<{ result: ProductAnalytics }>('/admin/reports/products', {
    params: { timeRange },
  })
  return response.data.result
}

/**
 * Get customer analytics
 */
export const getCustomerAnalytics = async (timeRange: string = 'month'): Promise<CustomerAnalytics> => {
  const response = await apiClient.get<{ result: CustomerAnalytics }>('/admin/reports/customers', {
    params: { timeRange },
  })
  return response.data.result
}

// Export all as default object
const reportsService = {
  getReportsAnalytics,
  getRevenueAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
}

export default reportsService
