import { useState, useEffect } from 'react'

// Common breakpoints following Tailwind CSS
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  // Max-width queries
  'max-sm': '(max-width: 639px)',
  'max-md': '(max-width: 767px)',
  'max-lg': '(max-width: 1023px)',
  'max-xl': '(max-width: 1279px)',
  'max-2xl': '(max-width: 1535px)',
} as const

type BreakpointKey = keyof typeof BREAKPOINTS

export const useMediaQuery = (query: string | BreakpointKey): boolean => {
  // Get the actual query string
  const mediaQuery = query in BREAKPOINTS ? BREAKPOINTS[query as BreakpointKey] : query

  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(mediaQuery)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Listen for changes
    mediaQueryList.addEventListener('change', handleChange)

    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [mediaQuery])

  return matches
}

// Convenience hooks for common breakpoints
export const useIsMobile = () => useMediaQuery('max-md')
export const useIsTablet = () => {
  const isMd = useMediaQuery('md')
  const isMaxLg = useMediaQuery('max-lg')
  return isMd && isMaxLg
}
export const useIsDesktop = () => useMediaQuery('lg')

// Responsive hooks for specific use cases
export const useIsMobileMenu = () => useMediaQuery('max-lg')
export const useIsLargeScreen = () => useMediaQuery('xl')
