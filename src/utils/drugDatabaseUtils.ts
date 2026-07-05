import type { PriceVariant, Product } from '../types/product'

export const DEFAULT_LOW_STOCK_THRESHOLD = 30

export function sanitizeSearchTerm(value: string): string {
  return value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildSearchQuery(value: string, fields = ['name', 'activeIngredients', 'brand']): Record<string, unknown> {
  const search = sanitizeSearchTerm(value)
  if (!search) return {}
  return { $or: fields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })) }
}

export function buildFilterQuery(filters: {
  category?: string
  rxType?: 'rx' | 'otc' | 'all'
  stock?: 'out' | 'low' | 'in' | 'all'
  threshold?: number
}) {
  const query: Record<string, unknown> = {}
  if (filters.category && filters.category !== 'all') query.categoryId = filters.category
  if (filters.rxType === 'rx') query.requiresPrescription = true
  if (filters.rxType === 'otc') query.requiresPrescription = false
  if (filters.stock === 'out') query.stockQuantity = { $eq: 0 }
  if (filters.stock === 'low') query.stockQuantity = { $gt: 0, $lte: filters.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD }
  if (filters.stock === 'in') query.stockQuantity = { $gt: filters.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD }
  return query
}

export function paginateQuery(page: number, limit: number) {
  const safePage = Math.max(1, page || 1)
  const safeLimit = Math.max(1, limit || 1)
  return { skip: (safePage - 1) * safeLimit, limit: safeLimit }
}

export function formatCurrency(value: number): string {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

export function getDisplayPrice(product: Pick<Product, 'priceVariants' | 'price' | 'unit'>): { price: number; unit: string; label: string } {
  const variants = product.priceVariants || []
  const variant = [...variants].sort((a, b) => (a.price || 0) - (b.price || 0))[0]
  const price = variant?.price ?? product.price ?? 0
  const unit = variant?.unit || product.unit || 'Sản phẩm'
  return { price, unit, label: `${formatCurrency(price)} / ${unit}` }
}

export function formatPriceVariants(variants?: PriceVariant[]) {
  if (!variants?.length) return [{ unit: 'Sản phẩm', price: 0, label: 'Chưa có giá', isDefault: true, quantityPerUnit: 1 }]
  return [...variants]
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .map((variant) => ({ ...variant, label: `${formatCurrency(variant.price)} / ${variant.unit}` }))
}

export function getPriceForUnit(variants: PriceVariant[] | undefined, unit: string): number | null {
  return variants?.find((variant) => variant.unit.toLowerCase() === unit.toLowerCase())?.price ?? null
}

export function getStockStatus(stockQuantity?: number | null, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  const stock = Number(stockQuantity || 0)
  if (stock <= 0) return 'out_of_stock'
  if (stock <= threshold) return 'low_stock'
  return 'in_stock'
}

export function formatStockDisplay(stockQuantity?: number | null, unit = 'đơn vị', threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  const status = getStockStatus(stockQuantity, threshold)
  if (status === 'out_of_stock') return 'Hết hàng'
  if (status === 'low_stock') return 'Sắp hết hàng'
  return `Còn ${Number(stockQuantity).toLocaleString('vi-VN')} ${unit}`
}

export function stockFilter(mode: 'out' | 'low' | 'in' | 'all', threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  return (product: Pick<Product, 'stockQuantity'>) => {
    if (mode === 'all') return true
    const stock = product.stockQuantity || 0
    if (mode === 'out') return stock === 0
    if (mode === 'low') return stock > 0 && stock <= threshold
    return stock > threshold
  }
}

export function isRxProduct(product?: Partial<Product> & { rxType?: string } | null): boolean {
  if (!product) return false
  if (product.rxType) return product.rxType.toLowerCase() === 'rx'
  return Boolean(product.requiresPrescription)
}

export function getRxBadgeConfig(product: Partial<Product> & { rxType?: string }) {
  return isRxProduct(product)
    ? { label: 'Rx - Kê đơn', className: 'bg-red-500 text-white' }
    : { label: 'OTC - Không kê đơn', className: 'bg-green-500 text-white' }
}

export function filterByRxType<T extends Partial<Product> & { rxType?: string }>(products: T[], type: 'rx' | 'otc' | 'all') {
  if (type === 'all') return products
  return products.filter((product) => (type === 'rx' ? isRxProduct(product) : !isRxProduct(product)))
}

export function formatActiveIngredient(value?: string | string[] | null): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || 'Không có thông tin'
  return value?.trim() || 'Không có thông tin'
}

export function formatDosageForm(value?: string | null): string {
  const labels: Record<string, string> = {
    tablet: 'Viên nén',
    capsule: 'Viên nang',
    syrup: 'Siro',
    injection: 'Thuốc tiêm',
    cream: 'Kem bôi',
    drops: 'Thuốc nhỏ',
    other: 'Khác',
  }
  return value ? labels[value] || value : 'Không có thông tin'
}

export function formatManufacturer(value?: string | null): string {
  return value?.trim() || 'Không có thông tin'
}

export function formatLastUpdated(value?: string | Date | null, now = new Date()): string {
  if (!value) return 'Chưa rõ thời điểm cập nhật'
  const date = new Date(value)
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return 'Vừa cập nhật'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function isDataComplete(product: Partial<Product>) {
  const details = product.details || {}
  const checks: Record<string, unknown> = {
    activeIngredients: details.activeIngredients,
    dosageForm: details.dosageForm,
    packSize: details.packSize,
    manufacturer: details.manufacturer,
    indications: details.indications,
    dosageInstructions: details.dosageInstructions,
    storageInstructions: details.storageInstructions,
  }
  const missingFields = Object.entries(checks)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key)
  return { complete: missingFields.length === 0, missingFields }
}

export function truncateDescription(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  const cut = value.slice(0, maxLength).replace(/\s+\S*$/, '').trim()
  return `${cut || value.slice(0, maxLength).trim()}...`
}
