import { useState, useCallback, useEffect } from 'react'

interface UseImageLightboxProps {
  images: string[]
  initialIndex?: number
}

interface UseImageLightboxReturn {
  isOpen: boolean
  currentIndex: number
  open: (index?: number) => void
  close: () => void
  nextImage: () => void
  prevImage: () => void
  goToImage: (index: number) => void
}

/**
 * Custom hook for managing image lightbox functionality
 * Provides keyboard navigation and state management for image galleries
 */
export const useImageLightbox = ({ images, initialIndex = 0 }: UseImageLightboxProps): UseImageLightboxReturn => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const open = useCallback(
    (index: number = currentIndex) => {
      setCurrentIndex(index)
      setIsOpen(true)
    },
    [currentIndex],
  )

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const nextImage = useCallback(() => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const prevImage = useCallback(() => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < images.length) {
        setCurrentIndex(index)
      }
    },
    [images.length],
  )

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          prevImage()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextImage()
          break
        case 'Escape':
          e.preventDefault()
          close()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, nextImage, prevImage, close])

  return {
    isOpen,
    currentIndex,
    open,
    close,
    nextImage,
    prevImage,
    goToImage,
  }
}
