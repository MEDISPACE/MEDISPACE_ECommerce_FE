/**
 * REVIEW SERVICE - Handles Review API calls
 *
 * This service manages all review-related API interactions.
 */

import type {
  Review,
  CreateReviewData,
  UpdateReviewData,
  ReviewStats,
  ReviewsResponse,
  UserReviewsParams,
  UserReviewsResponse,
} from '../types/review'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

function paginateUserReviewsFallback(reviews: Review[], params: UserReviewsParams): UserReviewsResponse {
  const page = params.page || 1
  const limit = params.limit || 10
  const filteredReviews = params.status ? reviews.filter((review) => review.status === params.status) : reviews
  const start = (page - 1) * limit

  return {
    reviews: filteredReviews.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filteredReviews.length,
      totalPages: Math.ceil(filteredReviews.length / limit),
    },
    statusCounts: {
      all: reviews.length,
      pending: reviews.filter((review) => review.status === 'pending').length,
      approved: reviews.filter((review) => review.status === 'approved').length,
      rejected: reviews.filter((review) => review.status === 'rejected').length,
    },
  }
}

export const reviewService = {
  /**
   * Get reviews for a product (public)
   */
  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10,
    sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' = 'newest',
  ): Promise<ReviewsResponse> {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId), {
      params: { page, limit, sortBy },
    })

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    return { reviews: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }
  },

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.STATS(productId))

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    return {
      total: 0,
      averageRating: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
  },

  /**
   * Get current user's reviews (authenticated)
   */
  async getUserReviews<T extends UserReviewsParams | undefined = undefined>(
    params?: T,
  ): Promise<T extends UserReviewsParams ? UserReviewsResponse : Review[]> {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.USER, { params })

    if (response && response.data) {
      const data = response.data as any
      if (data.data?.reviews) return data.data as T extends UserReviewsParams ? UserReviewsResponse : Review[]
      if (Array.isArray(data.data)) {
        return (params ? paginateUserReviewsFallback(data.data, params) : data.data) as T extends UserReviewsParams
          ? UserReviewsResponse
          : Review[]
      }
      if (data.reviews) return data as T extends UserReviewsParams ? UserReviewsResponse : Review[]
      if (Array.isArray(data)) {
        return (params ? paginateUserReviewsFallback(data, params) : data) as T extends UserReviewsParams
          ? UserReviewsResponse
          : Review[]
      }
    }

    if (params) {
      return {
        reviews: [],
        pagination: { page: params.page || 1, limit: params.limit || 10, total: 0, totalPages: 0 },
        statusCounts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      } as unknown as T extends UserReviewsParams ? UserReviewsResponse : Review[]
    }

    return [] as unknown as T extends UserReviewsParams ? UserReviewsResponse : Review[]
  },

  /**
   * Create a new review (authenticated)
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await apiClient.post(API_ENDPOINTS.REVIEWS.BASE, data)

    if (response && response.data) {
      const responseData = response.data as any
      if (responseData.data) return responseData.data
      return responseData
    }

    throw new Error('Failed to create review')
  },

  /**
   * Update an existing review (authenticated)
   */
  async updateReview(reviewId: string, data: UpdateReviewData): Promise<Review> {
    const response = await apiClient.put(API_ENDPOINTS.REVIEWS.BY_ID(reviewId), data)

    if (response && response.data) {
      const responseData = response.data as any
      if (responseData.data) return responseData.data
      return responseData
    }

    throw new Error('Failed to update review')
  },

  /**
   * Delete a review (authenticated)
   */
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.REVIEWS.BY_ID(reviewId))

    if (response && response.data) {
      return response.data as { message: string }
    }

    return { message: 'Review deleted successfully' }
  },

  /**
   * Mark a review as helpful (authenticated)
   */
  async markReviewHelpful(reviewId: string): Promise<Review> {
    const response = await apiClient.post(API_ENDPOINTS.REVIEWS.HELPFUL(reviewId))

    if (response && response.data) {
      const responseData = response.data as any
      if (responseData.data) return responseData.data
      return responseData
    }

    throw new Error('Failed to mark review as helpful')
  },

  /**
   * Get all reviews for admin (with filtering)
   */
  async getAdminReviews(filters?: {
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const response = await apiClient.get('/reviews/admin', { params: filters })

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    return { reviews: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
  },

  /**
   * Get admin dashboard statistics
   */
  async getAdminReviewStats() {
    const response = await apiClient.get('/reviews/admin/stats')

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      autoApproved: 0,
      autoApprovedPercentage: 0,
      averageRating: 0,
    }
  },

  /**
   * Moderate a review (approve/reject)
   */
  async moderateReview(reviewId: string, status: string, notes?: string) {
    const response = await apiClient.patch(`/reviews/${reviewId}/moderate`, { status, notes })

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    throw new Error('Failed to moderate review')
  },

  /**
   * Bulk moderate reviews
   */
  async bulkModerate(reviewIds: string[], action: 'approve' | 'reject') {
    const response = await apiClient.post('/reviews/admin/bulk-moderate', { reviewIds, action })

    if (response && response.data) {
      const data = response.data as any
      if (data.data) return data.data
      return data
    }

    throw new Error('Failed to bulk moderate reviews')
  },
}

export default reviewService
