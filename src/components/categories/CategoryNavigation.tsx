import { UniversalBreadcrumb, type BreadcrumbItem } from '../shared/UniversalBreadcrumb'

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
