import { Fragment, useEffect, useState } from 'react'
import { PageTransition } from '~/components/shared/PageTransition'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Edit, Trash2, Package, Clock, CheckCircle, XCircle, Zap } from 'lucide-react'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { RatingStars } from '~/components/shared/RatingStars'
import { WriteReviewDialog } from '~/components/reviews/WriteReviewDialog'
import { useUserReviews, useReviewActions } from '~/hooks/product/useReviews'
import { ReviewStatus } from '~/types/review'
import type { Review } from '~/types/review'
import { formatDate } from '~/utils/dateUtils'
import { Link } from 'react-router'

const REVIEWS_PER_PAGE = 10

export function AccountReviewsPage() {
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const selectedStatus =
    selectedTab === 'pending'
      ? ReviewStatus.Pending
      : selectedTab === 'approved'
        ? ReviewStatus.Approved
        : selectedTab === 'rejected'
          ? ReviewStatus.Rejected
          : undefined

  const { reviews, pagination, statusCounts, loading, refetch } = useUserReviews({
    page: currentPage,
    limit: REVIEWS_PER_PAGE,
    status: selectedStatus,
  })
  const { updateReview, deleteReview } = useReviewActions()
  const totalPages = pagination.totalPages || 0

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

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTab])

  useEffect(() => {
    if (!loading && reviews.length === 0 && currentPage > 1) {
      setCurrentPage((page) => Math.max(page - 1, 1))
    }
  }, [currentPage, loading, reviews.length])

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    setShowEditDialog(true)
  }

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview(reviewId)
      refetch()
    } catch {
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
            <Badge variant='outline' className='bg-[#F0F6FF] text-[#1E40AF] border-[#BFDBFE] text-xs'>
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
    if (status === ReviewStatus.Pending) return statusCounts.pending
    if (status === ReviewStatus.Approved) return statusCounts.approved
    return statusCounts.rejected
  }

  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
    return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), Math.max(totalPages, 1)))
  }

  return (
    <PageTransition>
      <div
        className='space-y-6 bg-white text-gray-900 [color-scheme:light] forced-color-adjust-none'
        data-testid='reviews-page'
      >
        {/* Header */}
        <div>
          <h1 className='text-2xl font-bold text-blue-800 mb-2'>Đánh giá của tôi</h1>
          <p className='text-gray-600'>Quản lý các đánh giá bạn đã viết</p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className='space-y-6'>
          <TabsList className='inline-flex w-full overflow-x-auto bg-[#E8EDF5] p-1 rounded-lg shadow-sm scrollbar-hide [color-scheme:light] forced-color-adjust-none'>
            <TabsTrigger
              value='all'
              data-testid='reviews-tab-all'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>Tất cả ({statusCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              data-testid='reviews-tab-pending'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Chờ duyệt ({getStatusCount(ReviewStatus.Pending)})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='approved'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Đã đăng ({getStatusCount(ReviewStatus.Approved)})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='rejected'
              className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
            >
              <span className='whitespace-nowrap flex items-center gap-1'>
                Bị từ chối ({getStatusCount(ReviewStatus.Rejected)})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value={selectedTab}
            className='space-y-4'
            data-testid={selectedTab === 'pending' ? 'pending-reviews-list' : 'submitted-reviews-list'}
          >
            {loading ? (
              <div className='space-y-4' aria-label='Đang tải đánh giá'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className='border-[#BFDBFE] bg-white'>
                    <CardContent className='p-6'>
                      <div className='animate-pulse space-y-4'>
                        <div className='flex gap-4'>
                          <div className='h-20 w-20 rounded border border-[#E8EDF5] bg-[#E8EDF5]' />
                          <div className='flex-1 space-y-3'>
                            <div className='h-4 w-3/4 rounded bg-[#E8EDF5]' />
                            <div className='h-3 w-36 rounded bg-[#E8EDF5]' />
                            <div className='h-3 w-24 rounded bg-[#E8EDF5]' />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='h-4 w-28 rounded bg-[#E8EDF5]' />
                          <div className='h-3 w-full rounded bg-[#E8EDF5]' />
                          <div className='h-3 w-2/3 rounded bg-[#E8EDF5]' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <Card className='border-[#BFDBFE] bg-white text-gray-900 [color-scheme:light] forced-color-adjust-none'>
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
              <>
                <div className='flex items-center justify-between gap-3 rounded-lg border border-[#E8EDF5] bg-[#F8FAFB] px-4 py-3 text-sm text-gray-600'>
                  <span>
                    Hiển thị {reviews.length} / {pagination.total} đánh giá
                  </span>
                  <span className='font-medium text-[#1E40AF]'>
                    Trang {pagination.page} / {Math.max(totalPages, 1)}
                  </span>
                </div>

                {reviews.map((review) => (
                  <Card
                    key={review._id}
                    className='border-[#BFDBFE] bg-white text-gray-900 hover:shadow-md transition-shadow [color-scheme:light] forced-color-adjust-none'
                  >
                    <CardContent className='p-6'>
                      {/* Product Info */}
                      <div className='flex items-start gap-4 mb-4'>
                        {review.productImage && (
                          <Link to={`/products/${review.productSlug || review.productId}`}>
                            <ImageWithFallback
                              src={review.productImage}
                              alt={review.productName || 'Product'}
                              className='w-20 h-20 object-cover rounded border border-[#BFDBFE] bg-white [color-scheme:light] forced-color-adjust-none'
                            />
                          </Link>
                        )}
                        <div className='flex-1'>
                          <Link
                            to={`/products/${review.productSlug || review.productId}`}
                            className='font-semibold text-gray-900 hover:text-[#1E40AF] transition-colors'
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
                                className='w-16 h-16 object-cover rounded border border-[#E8EDF5] bg-white [color-scheme:light] forced-color-adjust-none'
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
                      <div className='flex items-center gap-2 pt-4 border-t border-[#E8EDF5]'>
                        {canEditReview(review) ? (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEdit(review)}
                            data-testid='write-review-btn'
                            className='border-[#BFDBFE] bg-white text-[#1E40AF] hover:text-[#0A2463]'
                          >
                            <Edit className='w-4 h-4 mr-1' data-testid='edit-review-btn' />
                            Sửa
                          </Button>
                        ) : (
                          review.status === ReviewStatus.Approved && (
                            <Button
                              variant='outline'
                              size='sm'
                              disabled
                              className='border-[#E8EDF5] bg-white text-gray-400 cursor-not-allowed'
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
                          onClick={() => setDeletingReviewId(review._id)}
                          data-testid='delete-review-btn'
                          className='border-[#FECACA] bg-white text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4 mr-1' />
                          Xóa
                        </Button>
                        {review.helpfulCount > 0 && (
                          <span className='text-sm text-gray-500 ml-auto'>
                            {review.helpfulCount} người thấy hữu ích
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {totalPages > 1 && (
                  <Pagination className='pt-2'>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href='#'
                          aria-disabled={currentPage <= 1}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                          onClick={(event) => {
                            event.preventDefault()
                            goToPage(currentPage - 1)
                          }}
                        />
                      </PaginationItem>
                      {getVisiblePages().map((page, index, pages) => (
                        <Fragment key={page}>
                          {index > 0 && page - pages[index - 1] > 1 ? (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : null}
                          <PaginationItem>
                            <PaginationLink
                              href='#'
                              isActive={page === currentPage}
                              className={
                                page === currentPage
                                  ? 'border-[#1E40AF] bg-[#0A2463] text-white hover:bg-[#0A2463] hover:text-white'
                                  : ''
                              }
                              onClick={(event) => {
                                event.preventDefault()
                                goToPage(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </Fragment>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href='#'
                          aria-disabled={currentPage >= totalPages}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                          onClick={(event) => {
                            event.preventDefault()
                            goToPage(currentPage + 1)
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
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

        <AlertDialog open={Boolean(deletingReviewId)} onOpenChange={(open) => !open && setDeletingReviewId(null)}>
          <AlertDialogContent data-testid='delete-review-dialog'>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
              <AlertDialogDescription>
                Đánh giá sau khi xóa sẽ không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className='bg-red-600 text-white hover:bg-red-700'
                data-testid='confirm-delete-review'
                onClick={async () => {
                  if (!deletingReviewId) return
                  await handleDelete(deletingReviewId)
                  setDeletingReviewId(null)
                }}
              >
                Xóa đánh giá
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  )
}
