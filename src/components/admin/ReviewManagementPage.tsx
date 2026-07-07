import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  X,
  MoreVertical,
  Eye,
  Image as ImageIcon,
  Package,
  User,
} from 'lucide-react'
import reviewService from '~/services/reviewService'
import { toast } from 'sonner'
import { ReviewStatus, type Review } from '~/types/review'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { PaginationComponent } from '../shared/PaginationComponent'

export function ReviewManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: () => reviewService.getAdminReviewStats(),
  })

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-reviews', statusFilter, page, dateFrom, dateTo],
    queryFn: () =>
      reviewService.getAdminReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  // Moderate mutation
  const moderateMutation = useMutation({
    mutationFn: ({ reviewId, status, notes }: { reviewId: string; status: string; notes?: string }) =>
      reviewService.moderateReview(reviewId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] })
      toast.success('Đã kiểm duyệt đánh giá thành công')
      setIsDetailOpen(false)
    },
    onError: () => {
      toast.error('Không thể kiểm duyệt đánh giá')
    },
  })

  const handleApprove = (reviewId: string) => {
    moderateMutation.mutate({ reviewId, status: ReviewStatus.Approved })
  }

  const handleReject = (reviewId: string) => {
    moderateMutation.mutate({ reviewId, status: ReviewStatus.Rejected, notes: 'Rejected by admin' })
  }

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] })
  }

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review)
    setIsDetailOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReviewStatus.Approved:
        return (
          <Badge className='bg-green-100 text-green-700 hover:bg-green-200'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã duyệt
          </Badge>
        )
      case ReviewStatus.Rejected:
        return (
          <Badge className='bg-red-100 text-red-700 hover:bg-red-200'>
            <XCircle className='w-3 h-3 mr-1' />
            Từ chối
          </Badge>
        )
      case ReviewStatus.Pending:
        return (
          <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-200'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ duyệt
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const reviews = reviewsData?.reviews || []
  const pagination = reviewsData?.pagination || { page: 1, totalPages: 1, total: 0 }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0A2463] to-[#1E40AF]'>
            Quản lý đánh giá
          </h1>
          <p className='text-gray-600 mt-2'>Kiểm duyệt và quản lý đánh giá sản phẩm</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' className='gap-2' onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600 font-medium uppercase'>Tổng đánh giá</p>
                  <p className='text-2xl font-bold text-[#1E40AF] mt-1'>{stats.total || 0}</p>
                </div>
                <div className='p-2 bg-[#F0F6FF] rounded-lg'>
                  <Star className='w-6 h-6 text-blue-500' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600 font-medium uppercase'>Chờ duyệt</p>
                  <p className='text-2xl font-bold text-yellow-600 mt-1'>{stats.pending || 0}</p>
                </div>
                <div className='p-2 bg-yellow-50 rounded-lg'>
                  <Clock className='w-6 h-6 text-yellow-500' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600 font-medium uppercase'>Đã duyệt</p>
                  <p className='text-2xl font-bold text-green-600 mt-1'>{stats.approved || 0}</p>
                </div>
                <div className='p-2 bg-green-50 rounded-lg'>
                  <CheckCircle className='w-6 h-6 text-green-500' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600 font-medium uppercase'>Auto-approved</p>
                  <p className='text-2xl font-bold text-[#1E40AF] mt-1'>{stats.autoApprovedPercentage || 0}%</p>
                </div>
                <div className='p-2 bg-[#F0F6FF] rounded-lg'>
                  <TrendingUp className='w-6 h-6 text-[#1E40AF]' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 items-start md:items-center'>
            <div className='flex flex-col sm:flex-row gap-4 flex-1 w-full'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48 border-[#E8EDF5] focus:ring-blue-200'>
                  <SelectValue placeholder='Lọc theo trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value={ReviewStatus.Pending}>Chờ duyệt</SelectItem>
                  <SelectItem value={ReviewStatus.Approved}>Đã duyệt</SelectItem>
                  <SelectItem value={ReviewStatus.Rejected}>Bị từ chối</SelectItem>
                </SelectContent>
              </Select>

              <div className='flex gap-2 items-center flex-1'>
                <span className='text-sm text-gray-500 whitespace-nowrap'>Từ:</span>
                <input
                  type='date'
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className='border border-[#E8EDF5] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-auto'
                />
                <span className='text-sm text-gray-500 whitespace-nowrap'>Đến:</span>
                <input
                  type='date'
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className='border border-[#E8EDF5] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-auto'
                />
              </div>
            </div>

            {(dateFrom || dateTo || statusFilter !== 'all') && (
              <Button
                variant='ghost'
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setStatusFilter('all')
                }}
                className='gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50'
              >
                <X className='w-4 h-4' />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5] shadow-sm overflow-hidden'>
        <CardHeader className='bg-gray-50/50 border-b border-gray-100 py-4'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Star className='w-5 h-5 text-[#1E40AF]' />
            Danh sách đánh giá
            <span className='text-sm font-normal text-gray-500 ml-2'>({pagination.total} đánh giá)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {reviewsLoading ? (
            <div className='flex flex-col justify-center items-center h-64 gap-3'>
              <RefreshCw className='w-8 h-8 animate-spin text-[#1E40AF]' />
              <p className='text-gray-500 text-sm'>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto px-6'>
                <Table>
                  <TableHeader>
                    <TableRow className='!border-b-2 !border-[#BFDBFE] hover:!bg-gray-50'>
                      <TableHead className='w-[300px]'>Sản phẩm</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead className='w-[120px]'>Đánh giá</TableHead>
                      <TableHead className='w-[300px]'>Nội dung</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className='text-right'>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='h-48 text-center text-gray-500'>
                          Không tìm thấy đánh giá nào phù hợp
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((review: Review) => (
                        <TableRow
                          key={review._id}
                          className='group border-b border-[#BFDBFE] hover:bg-[#F0F6FF]/30 transition-colors'
                        >
                          <TableCell>
                            <div className='flex gap-3 items-start'>
                              <div className='w-10 h-10 flex-shrink-0 rounded bg-gray-100 overflow-hidden border border-gray-200'>
                                <ImageWithFallback
                                  src={review.productImage || ''}
                                  alt=''
                                  className='w-full h-full object-cover'
                                />
                              </div>
                              <div className='min-w-0'>
                                <p
                                  className='font-medium text-blue-900 text-sm line-clamp-2'
                                  title={review.productName}
                                >
                                  {review.productName || 'Sản phẩm không xác định'}
                                </p>
                                <p className='text-xs text-gray-500 mt-0.5 font-mono truncate'>
                                  ID: {review.productId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='font-medium text-sm'>{review.userName || 'Anonymous'}</div>
                            {review.isVerifiedPurchase && (
                              <Badge
                                variant='outline'
                                className='text-[10px] px-1 py-0 h-4 border-green-200 text-green-700 bg-green-50 mt-1'
                              >
                                Đã mua hàng
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-0.5'>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  fill={i < review.rating ? 'currentColor' : 'none'}
                                  className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className='text-xs text-gray-500 font-medium ml-1'>({review.rating}/5)</span>
                          </TableCell>
                          <TableCell>
                            <p className='font-medium text-sm text-gray-900 mb-1'>{review.title}</p>
                            <p className='text-sm text-gray-600 line-clamp-2'>{review.comment}</p>
                            {review.images && review.images.length > 0 && (
                              <div className='flex gap-1 mt-2'>
                                {review.images.slice(0, 3).map((img: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className='w-6 h-6 rounded bg-gray-100 border border-gray-200 overflow-hidden'
                                  >
                                    <ImageWithFallback src={img} alt='' className='w-full h-full object-cover' />
                                  </div>
                                ))}
                                {review.images.length > 3 && (
                                  <span className='text-xs text-gray-500 self-end ml-1'>
                                    +{review.images.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(review.status)}</TableCell>
                          <TableCell className='text-sm text-gray-500'>
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className='text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0 hover:bg-[#E8EDF5] hover:text-[#1E40AF]'
                                  disabled={moderateMutation.isPending}
                                >
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-48 bg-white border-[#E8EDF5] shadow-lg'>
                                <DropdownMenuItem
                                  onClick={() => handleViewDetail(review)}
                                  className='cursor-pointer hover:bg-[#F0F6FF] focus:bg-[#F0F6FF]'
                                >
                                  <Eye className='w-4 h-4 mr-2 text-blue-500' />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                {review.status !== ReviewStatus.Approved && (
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(review._id)}
                                    className='cursor-pointer text-green-600 hover:bg-green-50 focus:bg-green-50 focus:text-green-700'
                                  >
                                    <CheckCircle className='w-4 h-4 mr-2' />
                                    Duyệt bài
                                  </DropdownMenuItem>
                                )}
                                {review.status !== ReviewStatus.Rejected && (
                                  <DropdownMenuItem
                                    onClick={() => handleReject(review._id)}
                                    className='cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700'
                                  >
                                    <XCircle className='w-4 h-4 mr-2' />
                                    Từ chối
                                  </DropdownMenuItem>
                                )}
                                {review.status !== ReviewStatus.Pending && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      moderateMutation.mutate({
                                        reviewId: review._id,
                                        status: ReviewStatus.Pending,
                                      })
                                    }
                                    className='cursor-pointer text-yellow-600 hover:bg-yellow-50 focus:bg-yellow-50 focus:text-yellow-700'
                                  >
                                    <Clock className='w-4 h-4 mr-2' />
                                    Xem xét lại
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='mx-6 mt-6 flex items-center justify-between border-t border-blue-400 pt-4 pb-6'>
                  <div className='text-sm text-gray-600'>
                    Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} trong tổng số{' '}
                    {pagination.total} đánh giá
                  </div>
                  <PaginationComponent currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-[#BFDBFE]'>
          <DialogHeader className='pb-4 border-b border-[#E8EDF5] shrink-0'>
            <DialogTitle className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0A2463] to-[#1E40AF]'>
              Chi tiết đánh giá
            </DialogTitle>
            <DialogDescription className='text-gray-600'>
              ID:{' '}
              <span className='font-mono bg-[#F0F6FF] px-2 py-0.5 rounded text-[#0A2463] border border-[#E8EDF5]'>
                {selectedReview?._id}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className='space-y-6 pt-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-400'>
              {/* Product & User Info - Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-2 border-[#E8EDF5] shadow-sm'>
                {/* Product */}
                <div className='space-y-3'>
                  <h4 className='text-xs font-bold text-[#1E40AF] uppercase tracking-wider flex items-center gap-2'>
                    <Package className='w-4 h-4' />
                    Sản phẩm
                  </h4>
                  <div className='flex gap-4'>
                    <div className='w-16 h-16 rounded-lg bg-white border-2 border-[#E8EDF5] overflow-hidden shadow-sm flex-shrink-0'>
                      <ImageWithFallback
                        src={selectedReview.productImage || ''}
                        alt=''
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900 line-clamp-2 hover:text-[#1E40AF] transition-colors'>
                        {selectedReview.productName}
                      </p>
                      <p className='text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block'>
                        SKU: {selectedReview.productId.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User */}
                <div className='space-y-3 md:border-l-2 md:border-[#E8EDF5] md:pl-6'>
                  <h4 className='text-xs font-bold text-[#1E40AF] uppercase tracking-wider flex items-center gap-2'>
                    <User className='w-4 h-4' />
                    Người dùng
                  </h4>
                  <div className='flex gap-3 items-center'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2463] to-[#1E40AF] flex items-center justify-center text-white font-bold text-lg shadow-md'>
                      {selectedReview.userName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className='font-semibold text-gray-900'>{selectedReview.userName}</p>
                      <div className='flex items-center gap-2'>
                        {selectedReview.isVerifiedPurchase ? (
                          <Badge variant='outline' className='text-[10px] bg-green-50 text-green-700 border-green-200'>
                            <CheckCircle className='w-3 h-3 mr-1' /> Verified Purchase
                          </Badge>
                        ) : (
                          <span className='text-xs text-gray-400'>Chưa xác thực mua hàng</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className='space-y-4'>
                <div className='bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-1'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill={i < selectedReview.rating ? 'currentColor' : 'none'}
                          className={`w-6 h-6 ${i < selectedReview.rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className='font-bold text-xl ml-2 text-gray-800'>{selectedReview.rating}.0</span>
                    </div>
                    <span className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
                      {new Date(selectedReview.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-gray-900 mb-3'>{selectedReview.title}</h3>
                  <p className='text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100'>
                    {selectedReview.comment}
                  </p>
                </div>

                {/* Images */}
                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-gray-600 flex items-center gap-2'>
                      <ImageIcon className='w-4 h-4' /> Hình ảnh đính kèm ({selectedReview.images.length})
                    </h4>
                    <div className='grid grid-cols-4 gap-2'>
                      {selectedReview.images.map((img, idx) => (
                        <div
                          key={idx}
                          className='aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity'
                        >
                          <ImageWithFallback src={img} alt='' className='w-full h-full object-cover' />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Moderation Info */}
              <div className='border-t border-gray-100 pt-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>Trạng thái:</span>
                    {getStatusBadge(selectedReview.status)}
                  </div>
                  {selectedReview.autoApproved && (
                    <Badge variant='outline' className='border-[#BFDBFE] text-[#1E40AF] bg-[#F0F6FF]'>
                      Auto-approved System
                    </Badge>
                  )}
                </div>
                {selectedReview.status === ReviewStatus.Rejected && selectedReview.moderationNotes && (
                  <div className='bg-red-50 text-red-800 p-3 rounded-md text-sm'>
                    <span className='font-semibold'>Lý do từ chối:</span> {selectedReview.moderationNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className='flex flex-row justify-end gap-3 pt-4 border-t-2 border-[#E8EDF5] shrink-0 bg-white'>
            <Button
              variant='outline'
              onClick={() => setIsDetailOpen(false)}
              className='!border-gray-300 hover:!bg-gray-100'
            >
              Đóng
            </Button>
            {selectedReview?.status !== ReviewStatus.Approved && (
              <Button
                onClick={() => handleApprove(selectedReview!._id)}
                className='!bg-green-600 hover:!bg-green-700 !text-white shadow-md'
                disabled={moderateMutation.isPending}
              >
                <CheckCircle className='w-4 h-4 mr-2' />
                Duyệt ngay
              </Button>
            )}
            {selectedReview?.status !== ReviewStatus.Rejected && (
              <Button
                variant='destructive'
                onClick={() => handleReject(selectedReview!._id)}
                disabled={moderateMutation.isPending}
                className='!bg-red-600 hover:!bg-red-700 !text-white shadow-md'
              >
                <XCircle className='w-4 h-4 mr-2' />
                Từ chối
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
