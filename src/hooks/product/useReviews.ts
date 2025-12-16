import { useState, useEffect } from 'react'
import { useAuth } from '~/contexts/AuthContext'
import reviewService from '~/services/reviewService'
import type { Review, ReviewStats, CreateReviewData, UpdateReviewData } from '~/types/review'
import { toast } from 'sonner'

/**
 * Hook for product reviews
 */
export function useProductReviews(productId: string) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [stats, setStats] = useState<ReviewStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')

    // Fetch reviews
    const fetchReviews = async () => {
        try {
            setLoading(true)
            const [reviewsData, statsData] = await Promise.all([
                reviewService.getProductReviews(productId, page, 10, sortBy),
                reviewService.getProductReviewStats(productId)
            ])

            setReviews(reviewsData.reviews)
            setTotalPages(reviewsData.pagination.totalPages)
            setStats(statsData)
        } catch (error) {
            console.error('Failed to fetch reviews:', error)
            toast.error('Không thể tải đánh giá')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (productId) {
            fetchReviews()
        }
    }, [productId, page, sortBy])

    return {
        reviews,
        stats,
        loading,
        page,
        totalPages,
        sortBy,
        setPage,
        setSortBy,
        refetch: fetchReviews
    }
}

/**
 * Hook for user's reviews
 */
export function useUserReviews() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUserReviews = async () => {
        if (!user) return

        try {
            setLoading(true)
            const data = await reviewService.getUserReviews()
            setReviews(data)
        } catch (error) {
            console.error('Failed to fetch user reviews:', error)
            toast.error('Không thể tải đánh giá của bạn')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUserReviews()
    }, [user])

    return {
        reviews,
        loading,
        refetch: fetchUserReviews
    }
}

/**
 * Hook for review actions
 */
export function useReviewActions() {
    const [loading, setLoading] = useState(false)

    const createReview = async (data: CreateReviewData) => {
        try {
            setLoading(true)
            const review = await reviewService.createReview(data)
            // Note: Toast is handled by parent component (WriteReviewDialog)
            // to show different messages for auto-approved vs pending reviews
            return review
        } catch (error: any) {
            console.error('Failed to create review:', error)
            toast.error(error.response?.data?.message || 'Không thể gửi đánh giá')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const updateReview = async (reviewId: string, data: UpdateReviewData) => {
        try {
            setLoading(true)
            const review = await reviewService.updateReview(reviewId, data)
            // Note: Toast is handled by parent component (WriteReviewDialog)
            return review
        } catch (error: any) {
            console.error('Failed to update review:', error)
            toast.error(error.response?.data?.message || 'Không thể cập nhật đánh giá')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const deleteReview = async (reviewId: string) => {
        try {
            setLoading(true)
            await reviewService.deleteReview(reviewId)
            toast.success('Đánh giá đã được xóa!')
        } catch (error: any) {
            console.error('Failed to delete review:', error)
            toast.error(error.response?.data?.message || 'Không thể xóa đánh giá')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const markHelpful = async (reviewId: string) => {
        try {
            await reviewService.markReviewHelpful(reviewId)
            toast.success('Cảm ơn phản hồi của bạn!')
        } catch (error: any) {
            console.error('Failed to mark helpful:', error)
            toast.error(error.response?.data?.message || 'Không thể đánh dấu hữu ích')
            throw error
        }
    }

    return {
        createReview,
        updateReview,
        deleteReview,
        markHelpful,
        loading
    }
}
