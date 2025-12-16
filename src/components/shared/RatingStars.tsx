import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showRating?: boolean;
  reviewCount?: number;
  clickable?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  showRating = true,
  reviewCount,
  clickable = false,
  onRatingChange
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const handleStarClick = (starRating: number) => {
    if (clickable && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= rating;
          const isHalfFilled = starRating - 0.5 <= rating && starRating > rating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(starRating)}
              className={`${clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
              disabled={!clickable}
            >
              <Star
                className={`${sizeClasses[size]} ${isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalfFilled
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
              />
            </button>
          );
        })}
      </div>

      {showRating && (
        <div className={`${textSizeClasses[size]} text-gray-600 flex items-center gap-1`}>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {reviewCount && (
            <span className="text-gray-400">({reviewCount})</span>
          )}
        </div>
      )}
    </div>
  );
}