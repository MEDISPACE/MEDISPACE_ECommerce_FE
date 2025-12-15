/**
 * REVIEW SERVICE - Handles Review API calls
 *
 * This service manages all review-related API interactions.
 */

import type { Review, CreateReviewData, UpdateReviewData, ReviewStats, ReviewsResponse } from '../types/review'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

export const reviewService = {
    /**
     * Get reviews for a product (public)
     */
    async getProductReviews(
        productId: string,
        page = 1,
        limit = 10,
        sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' = 'newest'
    ): Promise<ReviewsResponse> {
        const response = await apiClient.get(API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId), {
            params: { page, limit, sortBy }
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
            percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
    },

    /**
     * Get current user's reviews (authenticated)
     */
    async getUserReviews(): Promise<Review[]> {
        const response = await apiClient.get(API_ENDPOINTS.REVIEWS.USER)

        if (response && response.data) {
            const data = response.data as any
            if (Array.isArray(data.data)) return data.data
            if (Array.isArray(data)) return data
        }

        return []
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
            averageRating: 0
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
