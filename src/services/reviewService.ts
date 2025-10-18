/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Replace with real API calls when backend implements reviews API
class ReviewService {
  // Mock data for development - replace with real API calls
  private mockReviews: any[] = [
    {
      id: '1',
      productId: 'prod1',
      userId: 'user1',
      userName: 'John Doe',
      rating: 5,
      title: 'Great product!',
      comment: 'Very effective pain relief medication. Highly recommended.',
      images: [],
      isVerifiedPurchase: true,
      helpful: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  async getReviews(productId: string): Promise<any[]> {
    // TODO: Replace with real API call
    return this.mockReviews.filter((review: any) => review.productId === productId)
  }

  async getReviewById(reviewId: string): Promise<any | null> {
    // TODO: Replace with real API call
    return this.mockReviews.find((review: any) => review.id === reviewId) || null
  }

  async createReview(reviewData: any): Promise<any> {
    // TODO: Replace with real API call
    const newReview: any = {
      id: Date.now().toString(),
      productId: reviewData.productId,
      userId: 'current_user', // TODO: Get from auth context
      userName: 'Current User', // TODO: Get from auth context
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      images: reviewData.images || [],
      isVerifiedPurchase: true, // TODO: Check if user purchased this product
      helpful: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.mockReviews.push(newReview)
    return newReview
  }

  async updateReview(reviewId: string, reviewData: any): Promise<any> {
    // TODO: Replace with real API call
    const review = this.mockReviews.find((r: any) => r.id === reviewId)
    if (review) {
      Object.assign(review, reviewData, { updatedAt: new Date().toISOString() })
      return review
    }
    throw new Error('Review not found')
  }

  async deleteReview(reviewId: string): Promise<void> {
    // TODO: Replace with real API call
    const index = this.mockReviews.findIndex((r: any) => r.id === reviewId)
    if (index !== -1) {
      this.mockReviews.splice(index, 1)
    } else {
      throw new Error('Review not found')
    }
  }

  async markHelpful(reviewId: string): Promise<any> {
    // TODO: Replace with real API call
    const review = this.mockReviews.find((r: any) => r.id === reviewId)
    if (review) {
      review.helpful += 1
      review.updatedAt = new Date().toISOString()
      return review
    }
    throw new Error('Review not found')
  }

  async getProductRating(productId: string): Promise<{ average: number; count: number }> {
    // TODO: Replace with real API call
    const productReviews = this.mockReviews.filter((r: any) => r.productId === productId)
    if (productReviews.length === 0) {
      return { average: 0, count: 0 }
    }
    const average = productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / productReviews.length
    return { average: Math.round(average * 10) / 10, count: productReviews.length }
  }
}

export const reviewService = new ReviewService()
export default reviewService
