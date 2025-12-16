import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Star, CheckCircle, XCircle, Clock, RefreshCw, TrendingUp, ChevronLeft, ChevronRight, X, MoreVertical } from 'lucide-react'
import reviewService from '~/services/reviewService'
import { toast } from 'sonner'
import { ReviewStatus } from '~/types/review'

export function ReviewManagementPage() {
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const queryClient = useQueryClient()

    // Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-review-stats'],
        queryFn: () => reviewService.getAdminReviewStats()
    })

    // Fetch reviews
    const { data: reviewsData, isLoading: reviewsLoading, refetch } = useQuery({
        queryKey: ['admin-reviews', statusFilter, page, dateFrom, dateTo],
        queryFn: () => reviewService.getAdminReviews({
            status: statusFilter === 'all' ? undefined : statusFilter,
            page,
            limit,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined
        })
    })

    // Moderate mutation
    const moderateMutation = useMutation({
        mutationFn: ({ reviewId, status, notes }: { reviewId: string; status: string; notes?: string }) =>
            reviewService.moderateReview(reviewId, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
            queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] })
            toast.success('Đã kiểm duyệt đánh giá thành công')
        },
        onError: () => {
            toast.error('Không thể kiểm duyệt đánh giá')
        }
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case ReviewStatus.Approved:
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>
            case ReviewStatus.Rejected:
                return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>
            case ReviewStatus.Pending:
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const reviews = reviewsData?.reviews || []
    const pagination = reviewsData?.pagination || { page: 1, totalPages: 1, total: 0 }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066CC] to-[#4A90E2]">
                        Quản lý đánh giá
                    </h1>
                    <p className="text-gray-600 mt-2">Kiểm duyệt và quản lý đánh giá sản phẩm</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={handleRefresh}>
                        <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white backdrop-blur-lg border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">Tổng đánh giá</p>
                                    <p className="text-2xl font-semibold text-blue-600">{stats.total || 0}</p>
                                </div>
                                <Star className="w-8 h-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white backdrop-blur-lg border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">Chờ duyệt</p>
                                    <p className="text-2xl font-semibold text-yellow-600">{stats.pending || 0}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white backdrop-blur-lg border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">Đã duyệt</p>
                                    <p className="text-2xl font-semibold text-green-600">{stats.approved || 0}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white backdrop-blur-lg border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">Auto-approved</p>
                                    <p className="text-2xl font-semibold text-blue-600">
                                        {stats.autoApprovedPercentage || 0}%
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="bg-white backdrop-blur-lg border-blue-100">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-48 border-2 border-blue-200">
                                    <SelectValue placeholder="Lọc theo trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value={ReviewStatus.Pending}>Chờ duyệt</SelectItem>
                                    <SelectItem value={ReviewStatus.Approved}>Đã duyệt</SelectItem>
                                    <SelectItem value={ReviewStatus.Rejected}>Bị từ chối</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2 items-center">
                                <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày:</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-2 border-blue-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2 items-center">
                                <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày:</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-2 border-blue-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {(dateFrom || dateTo) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDateFrom('')
                                    setDateTo('')
                                }}
                                className="gap-2 border-2 border-blue-200 hover:bg-blue-50"
                            >
                                <X className="w-4 h-4" />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Reviews Table */}
            <Card className="bg-white backdrop-blur-lg border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-600" />
                        Danh sách đánh giá ({pagination.total})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {reviewsLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Người dùng</TableHead>
                                            <TableHead>Đánh giá</TableHead>
                                            <TableHead>Nội dung</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.map((review: any) => (
                                            <TableRow key={review._id}>
                                                <TableCell className="font-medium">
                                                    {review.productName || 'N/A'}
                                                </TableCell>
                                                <TableCell>{review.userName || 'Anonymous'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {review.comment}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(review.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                disabled={moderateMutation.isPending}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                                                            {review.status !== ReviewStatus.Approved && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleApprove(review._id)}
                                                                    className="text-green-600 cursor-pointer"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Duyệt
                                                                </DropdownMenuItem>
                                                            )}
                                                            {review.status !== ReviewStatus.Rejected && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleReject(review._id)}
                                                                    className="text-red-600 cursor-pointer"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Từ chối
                                                                </DropdownMenuItem>
                                                            )}
                                                            {review.status !== ReviewStatus.Pending && (
                                                                <DropdownMenuItem
                                                                    onClick={() => moderateMutation.mutate({
                                                                        reviewId: review._id,
                                                                        status: ReviewStatus.Pending
                                                                    })}
                                                                    className="text-yellow-600 cursor-pointer"
                                                                >
                                                                    <Clock className="w-4 h-4 mr-2" />
                                                                    Đưa về chờ duyệt
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-gray-600">
                                    Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} của{' '}
                                    {pagination.total} đánh giá
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        Trang {page} / {pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page >= pagination.totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
