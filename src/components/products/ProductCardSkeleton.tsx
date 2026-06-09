import { Card, CardContent } from '../ui/card'

interface ProductCardSkeletonProps {
  variant?: 'grid' | 'list'
}

export function ProductCardSkeleton({ variant = 'grid' }: ProductCardSkeletonProps) {
  // ==================== LIST VARIANT SKELETON ====================
  if (variant === 'list') {
    return (
      <Card className="border border-blue-100 overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image Skeleton */}
            <div className="w-32 h-32 rounded-xl animate-shimmer bg-gray-100 shrink-0" />

            {/* Content Skeleton */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Title */}
                <div className="h-5 bg-gray-200 rounded animate-shimmer w-3/4 mb-2" />
                {/* Brand */}
                <div className="h-4 bg-gray-200 rounded animate-shimmer w-1/4 mb-4" />
                {/* Packaging */}
                <div className="h-3 bg-gray-200 rounded animate-shimmer w-1/3 mb-2" />
              </div>

              {/* Price & Actions Row */}
              <div className="flex items-center justify-between gap-4 mt-auto">
                {/* Price */}
                <div className="space-y-1">
                  <div className="h-6 bg-gray-200 rounded animate-shimmer w-28" />
                  <div className="h-3 bg-gray-200 rounded animate-shimmer w-16" />
                </div>
                {/* Button */}
                <div className="h-9 bg-gray-200 rounded animate-shimmer w-28" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==================== GRID VARIANT SKELETON ====================
  return (
    <Card className="border border-blue-100 overflow-hidden bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Skeleton */}
        <div className="aspect-square w-full animate-shimmer bg-gray-100" />

        {/* Content Skeleton */}
        <div className="p-3 flex flex-col flex-1">
          {/* Title */}
          <div className="h-4 bg-gray-200 rounded animate-shimmer w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-shimmer w-2/3 mb-4" />

          {/* Price */}
          <div className="h-5 bg-gray-200 rounded animate-shimmer w-1/2 mb-3" />

          {/* Packaging */}
          <div className="h-3 bg-gray-200 rounded animate-shimmer w-1/3 mb-4" />

          {/* Button */}
          <div className="mt-auto h-8 bg-gray-200 rounded animate-shimmer w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
