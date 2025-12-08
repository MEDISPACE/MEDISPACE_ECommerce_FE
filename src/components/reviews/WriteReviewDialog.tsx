import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { RatingStars } from '../shared/RatingStars'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { MultipleImageUploadField } from '../shared/MultipleImageUploadField'
import { Loader2 } from 'lucide-react'
import type { CreateReviewData, Review } from '~/types/review'

interface WriteReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: {
        id: string
        name: string
        image: string
    }
    orderId: string
    existingReview?: Review
    onSubmit: (data: CreateReviewData) => Promise<void>
}

export function WriteReviewDialog({
    open,
    onOpenChange,
    product,
    orderId,
    existingReview,
    onSubmit
}: WriteReviewDialogProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0)
    const [title, setTitle] = useState(existingReview?.title || '')
    const [comment, setComment] = useState(existingReview?.comment || '')
    const [images, setImages] = useState<string[]>(existingReview?.images || [])
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (rating === 0) {
            newErrors.rating = 'Vui lòng chọn đánh giá'
        }

        if (comment.trim().length < 10) {
            newErrors.comment = 'Đánh giá phải có ít nhất 10 ký tự'
        }

        if (comment.length > 2000) {
            newErrors.comment = 'Đánh giá không được quá 2000 ký tự'
        }

        if (title.length > 200) {
            newErrors.title = 'Tiêu đề không được quá 200 ký tự'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        try {
            setLoading(true)
            await onSubmit({
                productId: product.id,
                orderId,
                rating,
                title,
                comment,
                images: images.length > 0 ? images : undefined
            })
            onOpenChange(false)
            // Reset form
            setRating(0)
            setTitle('')
            setComment('')
            setImages([])
            setErrors({})
        } catch (error) {
            // Error handled by parent
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent">
                        {existingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                    </DialogTitle>
                    <DialogDescription>
                        Chia sẻ trải nghiệm của bạn về sản phẩm này
                    </DialogDescription>
                </DialogHeader>

                {/* Product Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">Đã mua hàng xác thực</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rating */}
                    <div>
                        <Label className="mb-2 block">Đánh giá của bạn *</Label>
                        <div>
                            <RatingStars
                                rating={rating}
                                size="lg"
                                clickable
                                onRatingChange={setRating}
                            />
                        </div>
                        {errors.rating && (
                            <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <Label htmlFor="title" className="mb-2 block">Tiêu đề đánh giá</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tóm tắt đánh giá của bạn"
                            maxLength={200}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <Label htmlFor="comment" className="mb-2 block">Nội dung đánh giá *</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với sản phẩm này..."
                            rows={5}
                            maxLength={2000}
                        />
                        <div className="flex justify-between mt-1">
                            <div>
                                {errors.comment && (
                                    <p className="text-sm text-red-500">{errors.comment}</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                {comment.length}/2000
                            </p>
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <MultipleImageUploadField
                            label="Hình ảnh (tùy chọn)"
                            value={images}
                            onChange={setImages}
                            maxFiles={5}
                            maxSizeMB={2}
                            description="Thêm tối đa 5 ảnh để minh họa đánh giá của bạn"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {existingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
