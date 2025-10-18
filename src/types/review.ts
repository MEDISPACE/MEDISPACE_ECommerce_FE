// Review related types for MEDISPACE
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  images: string[]
  isVerifiedPurchase: boolean
  helpful: number
  createdAt: string
  updatedAt: string
}

export interface CreateReviewRequest {
  productId: string
  rating: number
  title: string
  comment: string
  images?: string[]
}

export interface ReviewFilter {
  rating?: number
  verifiedOnly?: boolean
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating'
  page?: number
  limit?: number
}

export interface ReviewStats {
  productId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
