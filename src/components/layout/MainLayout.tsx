import { useEffect, useState } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import type { BreadcrumbItem } from '~/components/shared/UniversalBreadcrumb'

interface MainLayoutProps {
  children: React.ReactNode
  breadcrumbItems?: BreadcrumbItem[]
  showBreadcrumb?: boolean
}

export function MainLayout({ children, breadcrumbItems = [], showBreadcrumb = false }: MainLayoutProps) {
  const hasBreadcrumb = showBreadcrumb && breadcrumbItems.length > 0
  const [headerHeight, setHeaderHeight] = useState<number>(156) // Default fallback

  useEffect(() => {
    let isMounted = true
    let measureTimeout: ReturnType<typeof setTimeout> | null = null
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null

    const measureHeader = () => {
      if (!isMounted) return

      try {
        const header = document.querySelector('header')
        if (!header) return

        const height = header.offsetHeight

        // Skip measurement if header hasn't rendered yet (height = 0)
        if (height === 0) return

        // Sanity check - header should be between 100-300px
        if (height < 100 || height > 300) {
        }

        setHeaderHeight((prev) => {
          if (prev !== height && isMounted) {
            document.documentElement.style.setProperty('--header-height', `${height}px`)
            return height
          }
          return prev
        })
      } catch (err) {}
    }

    // Initial measurements
    measureHeader()
    measureTimeout = setTimeout(measureHeader, 200)

    // Window resize handler (debounced)
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(measureHeader, 150)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      isMounted = false
      if (measureTimeout) clearTimeout(measureTimeout)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className='min-h-screen bg-white flex flex-col'>
      {/* Header: sticky top-0 z-50 - Always visible at top */}
      <Header />

      {/* Breadcrumb: Dynamic sticky position - Sticks right below header */}
      {/* JavaScript measures header height and updates position automatically */}
      {/* Perfect dual-sticky setup - both always visible when scrolling! */}
      {hasBreadcrumb && <UniversalBreadcrumb items={breadcrumbItems} style={{ top: `${headerHeight}px` }} />}

      {/* Main Content Area */}
      <main
        className='flex-1'
        style={{
          backgroundColor: '#F0F6FF',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
