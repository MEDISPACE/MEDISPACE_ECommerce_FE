// Review related types for MEDISPACE

// Review status enum matching backend
export enum ReviewStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

// Main review interface
export interface Review {
  _id: string // Changed from 'id' to match backend
  productId: string
  userId: string
  orderId: string // NEW - required for verification
  userName: string
  userAvatar?: string // NEW - for display
  rating: number // 1-5
  title: string
  comment: string
  images: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number // Changed from 'helpful'
  helpfulVotes?: string[] // NEW - track who voted

  // Hybrid Moderation
  autoApproved?: boolean // True if auto-approved by system
  flagged?: boolean // True if flagged for review
  flagReason?: 'spam' | 'inappropriate' | 'fake' | 'sensitive' | 'other'
  flaggedBy?: string
  flaggedAt?: string

  status: ReviewStatus // NEW - moderation status
  moderatedBy?: string // NEW - admin who moderated
  moderatedAt?: string // NEW - moderation timestamp
  moderationNotes?: string // NEW - rejection reason
  createdAt: string
  updatedAt: string
  // Populated fields (from API joins)
  productName?: string
  productImage?: string
  productSlug?: string
}

// Create review request
export interface CreateReviewData {
  productId: string
  orderId: string // NEW - required
  rating: number
  title: string
  comment: string
  images?: string[]
}

// Update review request
export interface UpdateReviewData {
  rating?: number
  title?: string
  comment?: string
  images?: string[]
}

// Legacy alias for backward compatibility
export type CreateReviewRequest = CreateReviewData

// Review filter options
export interface ReviewFilter {
  rating?: number
  verifiedOnly?: boolean
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'highest' | 'lowest'
  page?: number
  limit?: number
}

// Review stats from backend
export interface ReviewStats {
  total: number // Changed from totalReviews
  averageRating: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  percentages: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

// Admin review stats (for dashboard)
export interface AdminReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  autoApproved: number
  flagged: number
}

// Paginated reviews response
export interface ReviewsResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserReviewsParams {
  page?: number
  limit?: number
  status?: ReviewStatus
}

export interface UserReviewsResponse extends ReviewsResponse {
  statusCounts: {
    all: number
    pending: number
    approved: number
    rejected: number
  }
}
