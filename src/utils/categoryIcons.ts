import type { LucideIcon } from 'lucide-react'
import { Droplets, Leaf, MonitorCheck, Package, Pill, User } from 'lucide-react'

type CategoryIconSource = {
  slug?: string
  name?: string
}

const normalizeText = (value?: string) =>
  value
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase() ?? ''

export const getCategoryIcon = (category: CategoryIconSource): LucideIcon => {
  const slug = normalizeText(category.slug)
  const name = normalizeText(category.name)

  if (slug.includes('cham-soc-ca-nhan') || name.includes('cham soc ca nhan')) return User
  if (slug.includes('duoc-my-pham') || name.includes('duoc my pham')) return Droplets
  if (slug.includes('thiet-bi-y-te') || name.includes('thiet bi y te')) return MonitorCheck
  if (slug === 'thuoc' || name === 'thuoc') return Pill
  if (slug.includes('thuc-pham-chuc-nang') || name.includes('thuc pham chuc nang')) return Leaf

  return Package
}
