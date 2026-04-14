import { useState } from 'react'
import { PageTransition } from '~/components/shared/PageTransition'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Loader2, Star, Edit, Trash2, Package, Clock, CheckCircle, XCircle, Zap } from 'lucide-react'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { RatingStars } from '~/components/shared/RatingStars'
import { WriteReviewDialog } from '~/components/reviews/WriteReviewDialog'
import { useUserReviews, useReviewActions } from '~/hooks/product/useReviews'
import { ReviewStatus } from '~/types/review'
import type { Review } from '~/types/review'
import { formatDate } from '~/utils/dateUtils'
import { Link } from 'react-router'

export function AccountReviewsPage() {
  const { reviews, loading, refetch } = useUserReviews()
  const { updateReview, deleteReview } = useReviewActions()

  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Check if review can be edited (within 24 hours for approved reviews)
  const canEditReview = (review: Review): boolean => {
    // Rejected reviews cannot be edited
    if (review.status === ReviewStatus.Rejected) {
      return false
    }

    // Pending reviews can always be edited
    if (review.status === ReviewStatus.Pending) {
      return true
    }

    // Approved reviews: check 24-hour window
    if (review.status === ReviewStatus.Approved) {
      const createdAt = new Date(review.createdAt)
      const now = new Date()
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      return hoursSinceCreation < 24
    }

    return false
  }

  // Filter reviews by status
  const filteredReviews = reviews.filter((review) => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'pending') return review.status === ReviewStatus.Pending
    if (selectedTab === 'approved') return review.status === ReviewStatus.Approved
    if (selectedTab === 'rejected') return review.status === ReviewStatus.Rejected
    return true
  })

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    setShowEditDialog(true)
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return

    try {
      await deleteReview(reviewId)
      refetch()
    } catch (error) {
      // Error handled by hook
    }
  }

  const getStatusBadge = (review: Review) => {
    if (review.status === ReviewStatus.Pending) {
      return (
        <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
          <Clock className='w-3 h-3 mr-1' />
          Đang chờ duyệt
        </Badge>
      )
    }

    if (review.status === ReviewStatus.Approved) {
      return (
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã đăng
          </Badge>
          {review.autoApproved && (
            <Badge variant='outline' className='bg-blue-50 text-blue-600 border-blue-200 text-xs'>
              <Zap className='w-3 h-3 mr-1' />
              Auto
            </Badge>
          )}
        </div>
      )
    }

    return (
      <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
        <XCircle className='w-3 h-3 mr-1' />
        Bị từ chối
      </Badge>
    )
  }

  const getStatusCount = (status: ReviewStatus) => {
    return reviews.filter((r) => r.status === status).length
  }

  return (
    <PageTransition>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-2xl font-bold text-blue-800 mb-2'>Đánh giá của tôi</h1>
          <p className='text-gray-600'>Quản lý các đánh giá bạn đã viết</p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className='space-y-6'>
          <TabsList className='inline-flex w-full overflow-x-auto bg-blue-100 p-1 rounded-lg shadow-sm scrollbar-hide'>
            <TabsTrigger
              value='all'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>Tất cả ({reviews.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Chờ duyệt ({getStatusCount(ReviewStatus.Pending)})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='approved'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Đã đăng ({getStatusCount(ReviewStatus.Approved)})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='rejected'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Bị từ chối ({getStatusCount(ReviewStatus.Rejected)})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className='space-y-4'>
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
              </div>
            ) : filteredReviews.length === 0 ? (
              <Card className='border-blue-200'>
                <CardContent className='p-12 text-center'>
                  <Package className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                  <p className='text-gray-500 mb-2'>
                    {selectedTab === 'all'
                      ? 'Bạn chưa có đánh giá nào'
                      : `Không có đánh giá ${selectedTab === 'pending' ? 'chờ duyệt' : selectedTab === 'approved' ? 'đã đăng' : 'bị từ chối'}`}
                  </p>
                  <p className='text-sm text-gray-400'>
                    Hãy mua sắm và đánh giá sản phẩm để chia sẻ trải nghiệm của bạn!
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReviews.map((review) => (
                <Card key={review._id} className='hover:shadow-md transition-shadow border-blue-200'>
                  <CardContent className='p-6'>
                    {/* Product Info */}
                    <div className='flex items-start gap-4 mb-4'>
                      {review.productImage && (
                        <Link to={`/products/${review.productSlug || review.productId}`}>
                          <ImageWithFallback
                            src={review.productImage}
                            alt={review.productName || 'Product'}
                            className='w-20 h-20 object-cover rounded border'
                          />
                        </Link>
                      )}
                      <div className='flex-1'>
                        <Link
                          to={`/products/${review.productSlug || review.productId}`}
                          className='font-semibold text-gray-900 hover:text-blue-600 transition-colors'
                        >
                          {review.productName || 'Sản phẩm'}
                        </Link>
                        <div className='flex items-center gap-2 mt-1'>
                          {getStatusBadge(review)}
                          <span className='text-xs text-gray-500'>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className='mb-4'>
                      <RatingStars rating={review.rating} size='sm' showRating={false} />
                      {review.title && <h4 className='font-semibold text-gray-900 mt-2'>{review.title}</h4>}
                      <p className='text-gray-700 mt-2 whitespace-pre-wrap'>{review.comment}</p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className='flex gap-2 mt-3 flex-wrap'>
                          {review.images.map((image, index) => (
                            <ImageWithFallback
                              key={index}
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className='w-16 h-16 object-cover rounded'
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Moderation Notes */}
                    {review.status === ReviewStatus.Rejected && review.moderationNotes && (
                      <div className='bg-red-50 border border-red-200 rounded p-3 mb-4'>
                        <p className='text-sm text-red-700'>
                          <strong>Lý do từ chối:</strong> {review.moderationNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className='flex items-center gap-2 pt-4 border-t'>
                      {canEditReview(review) ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEdit(review)}
                          className='text-blue-600 hover:text-blue-700'
                        >
                          <Edit className='w-4 h-4 mr-1' />
                          Sửa
                        </Button>
                      ) : (
                        review.status === ReviewStatus.Approved && (
                          <Button
                            variant='outline'
                            size='sm'
                            disabled
                            className='text-gray-400 cursor-not-allowed'
                            title='Chỉ có thể chỉnh sửa trong vòng 24 giờ sau khi đăng'
                          >
                            <Edit className='w-4 h-4 mr-1' />
                            Đã hết hạn sửa
                          </Button>
                        )
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(review._id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Xóa
                      </Button>
                      {review.helpfulCount > 0 && (
                        <span className='text-sm text-gray-500 ml-auto'>{review.helpfulCount} người thấy hữu ích</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Review Dialog */}
        {editingReview && (
          <WriteReviewDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            product={{
              id: editingReview.productId,
              name: editingReview.productName || 'Sản phẩm',
              image: editingReview.productImage || '',
            }}
            orderId={editingReview.orderId}
            existingReview={editingReview}
            onSubmit={async (data) => {
              const result = await updateReview(editingReview._id, data)
              refetch()
              setEditingReview(null)
              return result
            }}
          />
        )}
      </div>
    </PageTransition>
  )
}
