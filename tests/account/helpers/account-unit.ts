export type FileLike = { type: string; size: number; name?: string }

const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

export function validateProfileForm(input: { firstName?: string; lastName?: string; phone?: string; email?: string; dob?: string }) {
  if (!input.firstName?.trim() || !input.lastName?.trim()) return false
  if (input.phone && !/^(0|\+84)\d{9,10}$/.test(input.phone)) return false
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return false
  if (input.dob && new Date(input.dob).getTime() > Date.now()) return false
  return true
}

export function formatUserDisplayName(user: { firstName?: string; lastName?: string; name?: string }) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || ''
}

export function validateImageUpload(file: FileLike, maxSize = maxImageSize) {
  return imageTypes.includes(file.type) && file.size <= maxSize
}

export const avatarUpload = validateImageUpload
export const validateReturnPhoto = validateImageUpload
export const validateReviewPhoto = validateImageUpload
export const validatePrescriptionUpload = validateImageUpload

export function mapApiResponseToForm(user: any) {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: user.phoneNumber ?? user.phone ?? '',
    dob: user.dateOfBirth ?? user.dob ?? '',
    gender: user.gender ?? '',
  }
}

export function mapFormToApiPayload(form: any) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phoneNumber: form.phone.trim(),
    dateOfBirth: form.dob,
    gender: form.gender,
  }
}

export function filterOrders<T extends { status: string }>(orders: T[], status: string) {
  return status === 'all' ? orders : orders.filter((order) => order.status === status)
}

export function canCancelOrder(order: { status: string }) {
  return ['pending', 'pending_payment', 'confirmed'].includes(order.status)
}

export function canReorder(order: { status: string }) {
  return ['completed', 'delivered'].includes(order.status)
}

export function canReviewOrder(order: { status: string; deliveredAt?: string }) {
  return order.status === 'delivered' && Boolean(order.deliveredAt)
}

export function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    pending_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    returned: 'Đã trả hàng',
  }
  return labels[status] ?? 'Không xác định'
}

export function calculateOrderTotal(order: { items: { total?: number; unitPrice?: number; quantity?: number }[]; shipping?: number; discount?: number }) {
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.total ?? (item.unitPrice ?? 0) * (item.quantity ?? 0)), 0)
  return itemsTotal + (order.shipping ?? 0) - (order.discount ?? 0)
}

export function sortOrders<T extends { createdAt: string }>(orders: T[]) {
  return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function mapApiOrderToUI(order: any) {
  return {
    id: order._id ?? order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: order.orderStatus ?? order.status,
    items: order.items ?? [],
    shipping: order.shippingFee ?? order.shipping ?? 0,
    discount: order.discountAmount ?? order.discount ?? 0,
    total: order.totalAmount ?? order.total ?? 0,
  }
}

export function isReturnEligible(order: { status: string; deliveredAt?: string; returned?: boolean }, now = new Date('2026-06-23T00:00:00.000Z'), windowDays = 7) {
  if (order.returned || order.status !== 'delivered' || !order.deliveredAt) return false
  const days = Math.floor((now.getTime() - new Date(order.deliveredAt).getTime()) / 86400000)
  return days <= windowDays
}

export function validateReturnForm(form: { reason?: string; items?: { quantity: number; orderedQuantity: number }[]; evidence?: string[] }) {
  if (!form.reason) return false
  if (!form.items?.length) return false
  if (form.items.some((item) => item.quantity < 1 || item.quantity > item.orderedQuantity)) return false
  if (!form.evidence?.length) return false
  return true
}

export function calculateRefundAmount(item: { unitPrice: number; quantity: number; discountAllocation?: number; pointsAllocation?: number }, returnQuantity: number) {
  const ratio = item.quantity ? returnQuantity / item.quantity : 0
  return Math.max(0, item.unitPrice * returnQuantity - Math.round((item.discountAllocation ?? 0) * ratio) - Math.round((item.pointsAllocation ?? 0) * ratio))
}

export function canReview(order: { status: string; alreadyReviewed?: boolean; purchased?: boolean }) {
  return order.status === 'delivered' && !order.alreadyReviewed && order.purchased !== false
}

export function validateReviewForm(form: { rating?: number; text?: string }, min = 10, max = 1000) {
  return Boolean(form.rating && form.rating > 0 && form.text && form.text.length >= min && form.text.length <= max)
}

export function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN')
}

export function sortReviews<T extends { createdAt: string }>(reviews: T[]) {
  return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function isPrescriptionValid(prescription: { expiresAt: string }) {
  return new Date(prescription.expiresAt).getTime() >= Date.now()
}

export function isPrescriptionExpiringSoon(prescription: { expiresAt: string }, now = new Date()) {
  const diffDays = (new Date(prescription.expiresAt).getTime() - now.getTime()) / 86400000
  return diffDays >= 0 && diffDays < 7
}

export function canUsePrescription(prescription: { usedCount: number; maxUses: number; status: string }) {
  return prescription.status === 'approved' && prescription.usedCount < prescription.maxUses
}

export function formatPrescriptionStatus(status: string) {
  return ({ pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', completed: 'Hoàn thành', expired: 'Hết hạn' } as Record<string, string>)[status] ?? 'Không xác định'
}

export function validateAddressForm(form: { address?: string; phone?: string; province?: string; district?: string; ward?: string }) {
  if (!form.address?.trim()) return false
  if (!form.phone || !/^(0|\+84)\d{9,10}$/.test(form.phone)) return false
  return Boolean(form.province && form.district && form.ward)
}

export function canDeleteAddress(addresses: { id: string; isDefault?: boolean }[], addressId: string) {
  if (addresses.length <= 1) return false
  const address = addresses.find((item) => item.id === addressId)
  return Boolean(address && (!address.isDefault || addresses.length > 1))
}

export function formatAddressDisplay(address: { address: string; ward: string; district: string; province: string }) {
  return `${address.address}, ${address.ward}, ${address.district}, ${address.province}`
}

export function isAddressLimit(addresses: unknown[], max = 5) {
  return addresses.length >= max
}

export function maskCardNumber(last4: string) {
  return `**** **** **** ${last4}`
}

export function isCardExpired(expiry: string, now = new Date()) {
  const [month, year] = expiry.split('/').map(Number)
  const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59)
  return expiryDate.getTime() < now.getTime()
}

export function isCardExpiringSoon(expiry: string, now = new Date()) {
  const [month, year] = expiry.split('/').map(Number)
  const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59)
  const diffDays = (expiryDate.getTime() - now.getTime()) / 86400000
  return diffDays >= 0 && diffDays < 30
}

export function formatCardType(type: string) {
  return ({ visa: 'Visa', mastercard: 'Mastercard', mc: 'Mastercard', jcb: 'JCB' } as Record<string, string>)[type.toLowerCase()] ?? 'Thẻ'
}

export function canDeletePaymentMethod(methods: unknown[]) {
  return methods.length > 1
}

export function mapApiCardToUI(card: any) {
  return { id: card.id, brand: formatCardType(card.brand), maskedNumber: maskCardNumber(card.last4), expiryDate: card.expiryDate, isDefault: Boolean(card.isDefault) }
}

export function isInWishlist(wishlist: { id: string }[], productId: string) {
  return wishlist.some((item) => item.id === productId)
}

export function toggleWishlist(wishlist: { id: string }[], product: { id: string }) {
  return isInWishlist(wishlist, product.id) ? wishlist.filter((item) => item.id !== product.id) : [...wishlist, product]
}

export function filterWishlist<T extends { inStock: boolean }>(items: T[], availability: 'all' | 'in-stock' | 'out-of-stock') {
  if (availability === 'all') return items
  return items.filter((item) => item.inStock === (availability === 'in-stock'))
}

export function sortWishlist<T extends { addedAt: string; price: number }>(items: T[], by: 'date' | 'price') {
  return [...items].sort((a, b) => by === 'date' ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() : a.price - b.price)
}

export function wishlistItemDeleted<T extends { deleted?: boolean }>(items: T[]) {
  return items.filter((item) => !item.deleted)
}

export function calculatePointsEarned(total: number, pointsPerVnd = 1000, multiplier = 1) {
  return Math.floor(total / pointsPerVnd) * multiplier
}

export function calculatePointsExpiry(earnDate: string, days = 365) {
  const date = new Date(earnDate)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function isPointsExpiringSoon(expiryDate: string, now = new Date()) {
  const diffDays = (new Date(expiryDate).getTime() - now.getTime()) / 86400000
  return diffDays >= 0 && diffDays < 7
}

export function filterHistory<T extends { type: string }>(items: T[], type: string) {
  return type === 'all' ? items : items.filter((item) => item.type === type)
}

export function sortHistory<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getTierLevel(points: number) {
  if (points >= 50000) return 'platinum'
  if (points >= 10000) return 'gold'
  if (points >= 2000) return 'silver'
  return 'member'
}

export function formatPointsChange(points: number) {
  return `${points > 0 ? '+' : ''}${points}`
}

export function validatePasswordStrength(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

export function validatePasswordMatch(password: string, confirm: string) {
  return password === confirm
}

export function isCurrentPasswordRequired(user: { provider?: string; hasPassword?: boolean }) {
  return user.hasPassword !== false && !user.provider
}

export function mapSettingsApiToForm(settings: any) {
  return { language: settings.language ?? 'vi', theme: settings.theme ?? 'system', emailNotifications: Boolean(settings.emailNotifications) }
}

export function mapFormToSettingsPayload(form: any) {
  return { language: form.language, theme: form.theme, emailNotifications: form.emailNotifications }
}

export function validateSettings(settings: { language: string; theme: string }) {
  return ['vi', 'en'].includes(settings.language) && ['light', 'dark', 'system'].includes(settings.theme)
}

export function getDefaultSettings() {
  return { language: 'vi', theme: 'system', emailNotifications: true }
}
