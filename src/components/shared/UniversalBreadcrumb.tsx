import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useBreadcrumbContext } from '~/contexts/BreadcrumbContext'

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

/**
 * UniversalBreadcrumb - Sets breadcrumb items via context
 *
 * The actual breadcrumb UI is rendered inside Header component for proper sticky behavior.
 * This component just pushes the items to context when mounted.
 */
export function UniversalBreadcrumb({ items }: UniversalBreadcrumbProps) {
  const { setItems, clearItems } = useBreadcrumbContext()
  const location = useLocation()

  // Hide breadcrumb on pharmacist & admin routes
  const isPharmacistRoute = location.pathname.startsWith('/pharmacist')
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    // Don't set items for admin/pharmacist routes
    if (isPharmacistRoute || isAdminRoute) {
      clearItems()
      return
    }

    // Set breadcrumb items
    setItems(items)

    // Clear on unmount
    return () => {
      clearItems()
    }
  }, [items, setItems, clearItems, isPharmacistRoute, isAdminRoute])

  // This component doesn't render anything - Header handles the UI
  return null
}
