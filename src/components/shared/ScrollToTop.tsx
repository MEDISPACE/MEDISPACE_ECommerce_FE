import { useEffect } from 'react'
import { useLocation } from 'react-router'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Temporarily disable smooth scroll for instant navigation
      const htmlElement = document.documentElement
      const originalScrollBehavior = htmlElement.style.scrollBehavior

      // Force instant scroll
      htmlElement.style.scrollBehavior = 'auto'

      // Scroll to top using multiple methods for maximum compatibility
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })

      // Fallback: Direct property assignment
      window.scrollTo(0, 0)

      // Extra fallback: scroll document element directly
      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }

      // Extra fallback: scroll body directly
      if (document.body) {
        document.body.scrollTop = 0
      }

      // Restore smooth scroll after a longer delay for better reliability
      setTimeout(() => {
        htmlElement.style.scrollBehavior = originalScrollBehavior
      }, 50)
    })
  }, [pathname])

  return null
}
