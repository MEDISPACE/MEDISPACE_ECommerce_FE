import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

interface UseCarouselProps {
  itemsCount: number
  autoScroll?: boolean
  scrollDelay?: number
}

interface UseCarouselReturn {
  currentSlide: number
  maxSlides: number
  carouselRef: React.RefObject<HTMLDivElement | null>
  nextSlide: () => void
  prevSlide: () => void
  goToSlide: (index: number) => void
  getItemsPerSlide: () => number
}

/**
 * Custom hook for managing carousel functionality
 * Handles responsive grid calculations and navigation
 */
export const useCarousel = ({
  itemsCount,
  autoScroll = false,
  scrollDelay = 5000,
}: UseCarouselProps): UseCarouselReturn => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Calculate items per slide based on screen width
  const getItemsPerSlide = useCallback(() => {
    if (typeof window === 'undefined') return 4
    const screenWidth = window.innerWidth
    if (screenWidth >= 1280) return 4 // xl
    if (screenWidth >= 1024) return 3 // lg
    if (screenWidth >= 768) return 2 // md
    return 1 // sm and below
  }, [])

  // Calculate maximum slides
  const maxSlides = useMemo(() => {
    const itemsPerSlide = getItemsPerSlide()
    return Math.ceil(itemsCount / itemsPerSlide)
  }, [itemsCount, getItemsPerSlide])

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % maxSlides)
  }, [maxSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + maxSlides) % maxSlides)
  }, [maxSlides])

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < maxSlides) {
        setCurrentSlide(index)
      }
    },
    [maxSlides],
  )

  // Auto-scroll effect
  useEffect(() => {
    if (!carouselRef.current || !autoScroll) return

    const scrollAmount = carouselRef.current.scrollWidth / maxSlides
    carouselRef.current.scrollTo({
      left: scrollAmount * currentSlide,
      behavior: 'smooth',
    })
  }, [currentSlide, maxSlides, autoScroll])

  // Auto-advance carousel
  useEffect(() => {
    if (!autoScroll || maxSlides <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, scrollDelay)

    return () => clearInterval(interval)
  }, [autoScroll, scrollDelay, maxSlides, nextSlide])

  // Reset to first slide when items count changes
  useEffect(() => {
    setCurrentSlide(0)
  }, [itemsCount])

  return {
    currentSlide,
    maxSlides,
    carouselRef,
    nextSlide,
    prevSlide,
    goToSlide,
    getItemsPerSlide,
  }
}
