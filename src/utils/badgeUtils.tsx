import React, { type ReactElement } from 'react'
import { Badge } from '../components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Package,
  Activity,
  Pause,
  Shield,
  Stethoscope,
  User,
} from 'lucide-react'

/**
 * BADGE CONFIG TYPE
 */
export interface BadgeConfig {
  label: string
  className: string
  icon?: React.ElementType
}

/**
 * USER ROLE BADGES
 */
export const USER_ROLE_BADGES: Record<string, BadgeConfig> = {
  admin: {
    label: 'Admin',
    className: 'bg-blue-100 text-[#0066CC] border-blue-200',
    icon: Shield,
  },
  pharmacist: {
    label: 'Dược sĩ',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Stethoscope,
  },
  customer: {
    label: 'Khách hàng',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: User,
  },
} as const

/**
 * GENERIC STATUS BADGES
 */
export const STATUS_BADGES: Record<string, BadgeConfig> = {
  active: {
    label: 'Hoạt động',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Không hoạt động',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
  discontinued: {
    label: 'Ngừng kinh doanh',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: XCircle,
  },
  out_of_stock: {
    label: 'Hết hàng',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
  },
  suspended: {
    label: 'Đã khóa',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  on_leave: {
    label: 'Nghỉ phép',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Pause,
  },
} as const

/**
 * PRESCRIPTION STATUS BADGES
 */
export const PRESCRIPTION_STATUS_BADGES: Record<string, BadgeConfig> = {
  // Backend returns PascalCase: Pending, Verified, Rejected, Expired
  Pending: {
    label: 'Chờ xử lý',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  Verified: {
    label: 'Đã duyệt',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  Rejected: {
    label: 'Từ chối',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  Expired: {
    label: 'Hết hạn',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
  },
  // Backward compatibility (lowercase)
  pending: {
    label: 'Chờ xử lý',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  verified: {
    label: 'Đã duyệt',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Từ chối',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  expired: {
    label: 'Hết hạn',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
  },
} as const

/**
 * ORDER STATUS BADGES
 */
export const ORDER_STATUS_BADGES: Record<string, BadgeConfig> = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
  processing: {
    label: 'Đang xử lý',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Activity,
  },
  shipping: {
    label: 'Đang giao',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
  },
  delivered: {
    label: 'Đã giao',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  refunded: {
    label: 'Đã hoàn tiền',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
} as const

/**
 * PAYMENT STATUS BADGES
 */
export const PAYMENT_STATUS_BADGES: Record<string, BadgeConfig> = {
  pending: {
    label: 'Chờ thanh toán',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  paid: {
    label: 'Đã thanh toán',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  failed: {
    label: 'Thất bại',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  refunded: {
    label: 'Đã hoàn tiền',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
} as const

/**
 * PRODUCT TYPE BADGES (Rx vs OTC)
 */
export const PRODUCT_TYPE_BADGES: Record<string, BadgeConfig> = {
  Rx: {
    label: 'Rx',
    className: 'bg-red-500 text-white border-red-600',
  },
  OTC: {
    label: 'OTC',
    className: 'bg-green-500 text-white border-green-600',
  },
} as const

/**
 * VERIFICATION BADGES
 */
export const VERIFICATION_BADGES: Record<string, BadgeConfig> = {
  verified: {
    label: 'Đã xác thực',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  unverified: {
    label: 'Chưa xác thực',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
} as const

/**
 * CHAT STATUS BADGES
 */
export const CHAT_STATUS_BADGES: Record<string, BadgeConfig> = {
  active: {
    label: 'Đang hoạt động',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  waiting: {
    label: 'Đang chờ',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  resolved: {
    label: 'Đã giải quyết',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle,
  },
  closed: {
    label: 'Đã đóng',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
} as const

/**
 * PRIORITY BADGES
 */
export const PRIORITY_BADGES: Record<string, BadgeConfig> = {
  low: {
    label: 'Thấp',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  normal: {
    label: 'Bình thường',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  high: {
    label: 'Cao',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertCircle,
  },
  urgent: {
    label: 'Khẩn cấp',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
  },
} as const

/**
 * CONTENT STATUS BADGES
 */
export const CONTENT_STATUS_BADGES: Record<string, BadgeConfig> = {
  draft: {
    label: 'Nháp',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  published: {
    label: 'Đã xuất bản',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  archived: {
    label: 'Lưu trữ',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
} as const

/**
 * GENERIC BADGE RENDERER
 * Renders a badge based on config
 */
export function renderBadge(
  config: BadgeConfig | undefined,
  options?: {
    showIcon?: boolean
    customLabel?: string
    customClassName?: string
  },
): ReactElement | null {
  if (!config) return null

  const { showIcon = true, customLabel, customClassName } = options || {}
  const Icon = config.icon

  return (
    <Badge className={customClassName || config.className}>
      {showIcon && Icon && <Icon className='w-3 h-3 mr-1' />}
      {customLabel || config.label}
    </Badge>
  )
}

/**
 * ROLE BADGE HELPER
 */
export function getRoleBadge(role: string, options?: { showIcon?: boolean }): ReactElement {
  const config = USER_ROLE_BADGES[role]
  return renderBadge(config, options) || <Badge variant='outline'>{role}</Badge>
}

/**
 * STATUS BADGE HELPER
 */
export function getStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * PRESCRIPTION STATUS BADGE HELPER
 */
export function getPrescriptionStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = PRESCRIPTION_STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * ORDER STATUS BADGE HELPER
 */
export function getOrderStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = ORDER_STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * PAYMENT STATUS BADGE HELPER
 */
export function getPaymentStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = PAYMENT_STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * PRODUCT TYPE BADGE HELPER (Rx/OTC)
 */
export function getProductTypeBadge(type: string, options?: { customLabel?: string }): ReactElement {
  const config = PRODUCT_TYPE_BADGES[type]
  return renderBadge(config, options) || <Badge variant='outline'>{type}</Badge>
}

/**
 * PRESCRIPTION REQUIREMENT BADGE HELPER
 */
export function getPrescriptionBadge(requiresPrescription: boolean): ReactElement {
  const type = requiresPrescription ? 'Rx' : 'OTC'
  return getProductTypeBadge(type)
}

/**
 * VERIFICATION BADGE HELPER
 */
export function getVerificationBadge(isVerified: boolean, options?: { showIcon?: boolean }): ReactElement {
  const key = isVerified ? 'verified' : 'unverified'
  const config = VERIFICATION_BADGES[key]
  return renderBadge(config, options) || <Badge variant='outline'>{isVerified ? 'Verified' : 'Unverified'}</Badge>
}

/**
 * CHAT STATUS BADGE HELPER
 */
export function getChatStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = CHAT_STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * CONTENT STATUS BADGE HELPER
 */
export function getContentStatusBadge(status: string, options?: { showIcon?: boolean }): ReactElement {
  const config = CONTENT_STATUS_BADGES[status]
  return renderBadge(config, options) || <Badge variant='outline'>{status}</Badge>
}

/**
 * PRIORITY BADGE HELPER
 */
export function getPriorityBadge(priority: string, options?: { showIcon?: boolean }): ReactElement {
  const config = PRIORITY_BADGES[priority]
  return renderBadge(config, options) || <Badge variant='outline'>{priority}</Badge>
}

/**
 * CUSTOM BADGE HELPER - For one-off badges
 */
export function createCustomBadge(
  label: string,
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default',
  Icon?: React.ElementType,
): ReactElement {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  return (
    <Badge className={variantClasses[variant]}>
      {Icon && <Icon className='w-3 h-3 mr-1' />}
      {label}
    </Badge>
  )
}
