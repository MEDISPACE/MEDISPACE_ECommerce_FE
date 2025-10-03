import React, { useState } from 'react'
import { Package } from 'lucide-react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

export function ImageWithFallback({ src, alt, className = '', fallbackSrc }: ImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [imageError, setImageError] = useState(false)

  const handleError = () => {
    if (fallbackSrc && !imageError) {
      setImageSrc(fallbackSrc)
      setImageError(true)
    } else {
      setImageError(true)
    }
  }

  if (imageError && !fallbackSrc) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <Package className='h-8 w-8 text-gray-400' />
      </div>
    )
  }

  return <img src={imageSrc} alt={alt} className={className} onError={handleError} />
}
