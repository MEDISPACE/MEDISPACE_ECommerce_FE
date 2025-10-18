import { Link, useLocation } from 'react-router'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  count?: number
}

interface UniversalBreadcrumbProps {
  items: BreadcrumbItem[]
  showHomeLink?: boolean
  className?: string
  style?: React.CSSProperties
}

export function UniversalBreadcrumb({ items, showHomeLink = true, className = '', style }: UniversalBreadcrumbProps) {
  const location = useLocation()

  // Hide breadcrumb on pharmacist & admin routes (Option 3: Layer 1 - Auto-hide)
  // These pages have sidebar navigation, so breadcrumbs are redundant
  const isPharmacistRoute = location.pathname.startsWith('/pharmacist')
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isPharmacistRoute || isAdminRoute) {
    return null
  }

  if (items.length === 0) return null

  return (
    <div className='sticky-breadcrumb' data-breadcrumb='true' style={style}>
      <div className='max-w-7xl mx-auto px-4 py-3'>
        <nav className={`flex items-center text-sm text-gray-600 ${className}`} aria-label='Breadcrumb'>
          {showHomeLink && (
            <>
              <Link to='/' className='flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors'>
                <Home className='w-4 h-4' />
                <span>Trang chủ</span>
              </Link>
              {items.length > 0 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}
            </>
          )}

          {items.map((item, index) => (
            <div key={index} className='flex items-center'>
              {item.href ? (
                <Link
                  to={item.href}
                  className='text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2'
                >
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className='text-gray-900 font-medium flex items-center gap-2'>
                  <span>{item.label}</span>
                </div>
              )}

              {index < items.length - 1 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
