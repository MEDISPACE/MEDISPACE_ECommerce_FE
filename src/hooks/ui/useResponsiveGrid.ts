import { useState, useEffect, useCallback } from 'react'

interface UseResponsiveGridProps {
  breakpoints?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
}

interface UseResponsiveGridReturn {
  itemsPerRow: number
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

/**
 * Custom hook for responsive grid calculations
 * Determines how many items should display per row based on screen size
 */
export const useResponsiveGrid = ({
  breakpoints = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 5,
  },
}: UseResponsiveGridProps = {}): UseResponsiveGridReturn => {
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')
  const [itemsPerRow, setItemsPerRow] = useState(breakpoints.lg || 3)

  const updateScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth

    let newScreenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    let newItemsPerRow: number

    if (width >= 1536) {
      newScreenSize = '2xl'
      newItemsPerRow = breakpoints['2xl'] || 5
    } else if (width >= 1280) {
      newScreenSize = 'xl'
      newItemsPerRow = breakpoints.xl || 4
    } else if (width >= 1024) {
      newScreenSize = 'lg'
      newItemsPerRow = breakpoints.lg || 3
    } else if (width >= 768) {
      newScreenSize = 'md'
      newItemsPerRow = breakpoints.md || 2
    } else {
      newScreenSize = 'sm'
      newItemsPerRow = breakpoints.sm || 1
    }

    setScreenSize(newScreenSize)
    setItemsPerRow(newItemsPerRow)
  }, [breakpoints])

  useEffect(() => {
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [updateScreenSize])

  const isMobile = screenSize === 'sm'
  const isTablet = screenSize === 'md'
  const isDesktop = ['lg', 'xl', '2xl'].includes(screenSize)

  return {
    itemsPerRow,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
  }
}

/**
 * Hook specifically for product grid layouts
 */
export const useProductGrid = (): UseResponsiveGridReturn => {
  return useResponsiveGrid({
    breakpoints: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 5,
    },
  })
}

/**
 * Hook for carousel items calculation
 */
export const useCarouselGrid = (): UseResponsiveGridReturn => {
  return useResponsiveGrid({
    breakpoints: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4, // Limit to 4 even on larger screens for better UX
    },
  })
}
