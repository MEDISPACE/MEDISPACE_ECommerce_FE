import { useState } from 'react'
import { ReviewItem } from './ReviewItem'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Loader2 } from 'lucide-react'
import type { Review } from '~/types/review'
import { useAuth } from '~/contexts/AuthContext'

interface ReviewListProps {
    reviews: Review[]
    loading?: boolean
    page: number
    totalPages: number
    sortBy: string
    onPageChange: (page: number) => void
    onSortChange: (sort: string) => void
    onEdit?: (review: Review) => void
    onDelete?: (reviewId: string) => void
    onHelpful?: (reviewId: string) => void
}

export function ReviewList({
    reviews,
    loading,
    page,
    totalPages,
    sortBy,
    onPageChange,
    onSortChange,
    onEdit,
    onDelete,
    onHelpful
}: ReviewListProps) {
    const { user } = useAuth()

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có đánh giá nào</p>
                <p className="text-sm text-gray-400 mt-2">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Hiển thị {reviews.length} đánh giá
                </p>
                <Select value={sortBy} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                        <SelectItem value="highest">Đánh giá cao nhất</SelectItem>
                        <SelectItem value="lowest">Đánh giá thấp nhất</SelectItem>
                        <SelectItem value="helpful">Hữu ích nhất</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <ReviewItem
                        key={review._id}
                        review={review}
                        isOwner={user?._id === review.userId}
                        onEdit={onEdit ? () => onEdit(review) : undefined}
                        onDelete={onDelete ? () => onDelete(review._id) : undefined}
                        onHelpful={onHelpful ? () => onHelpful(review._id) : undefined}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        Trước
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Button
                                key={p}
                                variant={p === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(p)}
                                className={p === page ? 'bg-blue-600 text-white' : ''}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Sau
                    </Button>
                </div>
            )}
        </div>
    )
}
