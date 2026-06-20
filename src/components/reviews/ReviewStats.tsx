import { Card, CardContent } from '../ui/card'
import { RatingStars } from '../shared/RatingStars'
import { Progress } from '../ui/progress'
import { Star } from 'lucide-react'
import type { ReviewStats as ReviewStatsType } from '~/types/review'

interface ReviewStatsProps {
  stats: ReviewStatsType | null
  loading?: boolean
}

export function ReviewStats({ stats, loading }: ReviewStatsProps) {
  if (loading || !stats) {
    return (
      <Card className='border-[#BFDBFE] shadow-sm'>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-20 bg-gray-200 rounded'></div>
            <div className='space-y-2'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='h-6 bg-gray-200 rounded'></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.total === 0) {
    return (
      <Card className='border-[#BFDBFE] shadow-sm'>
        <CardContent className='p-6 text-center'>
          <Star className='w-12 h-12 mx-auto text-gray-300 mb-2' />
          <p className='text-gray-500'>Chưa có đánh giá</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-[#BFDBFE] shadow-sm'>
      <CardContent className='p-6'>
        {/* Average Rating */}
        <div className='text-center mb-6'>
          <div className='text-5xl font-bold text-gray-900 mb-2'>{stats.averageRating.toFixed(1)}</div>
          <RatingStars rating={stats.averageRating} size='lg' showRating={false} />
          <p className='text-sm text-gray-600 mt-2'>Dựa trên {stats.total} đánh giá</p>
        </div>

        {/* Rating Distribution */}
        <div className='space-y-2'>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className='flex items-center gap-3'>
              <div className='flex items-center gap-1 w-16'>
                <span className='text-sm font-medium'>{rating}</span>
                <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
              </div>
              <Progress value={stats.percentages[rating as keyof typeof stats.percentages]} className='flex-1 h-2' />
              <span className='text-sm text-gray-600 w-12 text-right'>
                {stats.distribution[rating as keyof typeof stats.distribution]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
