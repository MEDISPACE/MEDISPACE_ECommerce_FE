import { Link } from 'react-router'
import { UniversalBreadcrumb, type BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { Button } from '../ui/button'

interface CategoryNavigationItem {
  label: string
  href?: string
  count?: number
}

interface CategoryNavigationProps {
  items: CategoryNavigationItem[]
  showHomeLink?: boolean
  className?: string
}

export function CategoryNavigation({ items, showHomeLink = true, className = '' }: CategoryNavigationProps) {
  // Add categories link to breadcrumb path for category pages
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Danh mục', href: '/categories' },
    ...items.map((item) => ({
      label: item.label,
      href: item.href,
      count: item.count,
    })),
  ]

  return <UniversalBreadcrumb items={breadcrumbItems} showHomeLink={showHomeLink} className={className} />
}

// Quick action component for category pages
interface CategoryQuickActionsProps {
  showConsultation?: boolean
  showComparison?: boolean
  showHealthGuide?: boolean
  className?: string
}

export function CategoryQuickActions({
  showConsultation = true,
  showComparison = true,
  showHealthGuide = true,
  className = '',
}: CategoryQuickActionsProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showConsultation && (
        <Link to='/contact'>
          <Button variant='outline' size='sm' className='border-blue-200 text-blue-600 hover:!bg-[#eff6ff] hover:border-blue-400 transition-all duration-300'>
            Tư vấn miễn phí
          </Button>
        </Link>
      )}

      {showComparison && (
        <Link to='/compare'>
          <Button variant='outline' size='sm' className='border-blue-200 text-blue-600 hover:!bg-[#eff6ff] hover:border-blue-400 transition-all duration-300'>
            So sánh sản phẩm
          </Button>
        </Link>
      )}

      {showHealthGuide && (
        <Link to='/health-corner'>
          <Button variant='outline' size='sm' className='border-blue-200 text-blue-600 hover:!bg-[#eff6ff] hover:border-blue-400 transition-all duration-300'>
            Hướng dẫn sử dụng
          </Button>
        </Link>
      )}
    </div>
  )
}
