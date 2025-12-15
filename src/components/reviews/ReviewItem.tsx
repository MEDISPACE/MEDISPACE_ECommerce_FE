import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { RatingStars } from '../shared/RatingStars'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { ThumbsUp, Edit, Trash2, BadgeCheck } from 'lucide-react'
import type { Review } from '~/types/review'
import { ReviewStatus } from '~/types/review'
import { formatDate } from '../../utils/dateUtils'

interface ReviewItemProps {
    review: Review
    onEdit?: () => void
    onDelete?: () => void
    onHelpful?: () => void
    isOwner?: boolean
}

export function ReviewItem({ review, onEdit, onDelete, onHelpful, isOwner }: ReviewItemProps) {
    const getStatusBadge = () => {
        switch (review.status) {
            case ReviewStatus.Pending:
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>
            case ReviewStatus.Approved:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã duyệt</Badge>
            case ReviewStatus.Rejected:
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Bị từ chối</Badge>
            default:
                return null
        }
    }

    return (
        <Card className="border-blue-300 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                        <Avatar>
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{review.userName}</p>
                                {review.isVerifiedPurchase && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        <BadgeCheck className="w-3 h-3 mr-1" />
                                        Đã mua hàng
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <RatingStars rating={review.rating} size="sm" showRating={false} />
                                <span className="text-xs text-gray-500">
                                    {formatDate(review.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge (for owner view) */}
                    {isOwner && getStatusBadge()}
                </div>

                {/* Title */}
                {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                )}

                {/* Comment */}
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {review.images.map((image, index) => (
                            <ImageWithFallback
                                key={index}
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        ))}
                    </div>
                )}

                {/* Moderation Notes (if rejected) */}
                {review.status === ReviewStatus.Rejected && review.moderationNotes && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                        <p className="text-sm text-red-700">
                            <strong>Lý do từ chối:</strong> {review.moderationNotes}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-blue-300">
                    {/* Helpful Button */}
                    {!isOwner && onHelpful && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onHelpful}
                            className="text-gray-600 hover:text-blue-600"
                        >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Hữu ích ({review.helpfulCount})
                        </Button>
                    )}

                    {/* Owner Actions */}
                    {isOwner && (
                        <>
                            {onEdit && review.status !== ReviewStatus.Rejected && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onEdit}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Sửa
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDelete}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Xóa
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
