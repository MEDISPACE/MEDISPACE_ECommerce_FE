import {
  // Status & State
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  // User & People
  User,
  Users,
  UserCheck,
  Shield,
  Stethoscope,
  // Communication
  MessageSquare,
  Send,
  // Documents & Files
  FileText,
  Download,
  Upload,
  Eye,
  // Products & Commerce
  Package,
  ShoppingCart,
  Pill,
  Heart,
  Star,
  // Actions & Navigation
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  // Dates & Time
  TrendingUp,
  TrendingDown,
  Activity,
  // Medical Specific
  Syringe,
  ThermometerSun,
  Microscope,
  // Misc
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react'

/**
 * USER ROLE ICONS
 */
export const USER_ROLE_ICONS: Record<string, LucideIcon> = {
  admin: Shield,
  pharmacist: Stethoscope,
  customer: User,
  guest: User,
} as const

/**
 * STATUS ICONS - Generic status indicators
 */
export const STATUS_ICONS: Record<string, LucideIcon> = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock,
  processing: Activity,
  approved: CheckCircle,
  rejected: XCircle,
  fulfilled: Package,
  cancelled: XCircle,
  suspended: Pause,
  completed: CheckCircle,
  failed: XCircle,
  on_leave: Pause,
} as const

/**
 * PRESCRIPTION STATUS ICONS
 */
export const PRESCRIPTION_STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  processing: Activity,
  approved: CheckCircle,
  rejected: XCircle,
  fulfilled: Package,
} as const

/**
 * ORDER STATUS ICONS
 */
export const ORDER_STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Activity,
  shipping: Package,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: TrendingDown,
} as const

/**
 * PRIORITY ICONS
 */
export const PRIORITY_ICONS: Record<string, LucideIcon> = {
  urgent: AlertTriangle,
  high: TrendingUp,
  normal: Activity,
  low: TrendingDown,
} as const

/**
 * CHAT/CONVERSATION STATUS ICONS
 */
export const CHAT_STATUS_ICONS: Record<string, LucideIcon> = {
  active: MessageSquare,
  waiting: Clock,
  resolved: CheckCircle,
  closed: XCircle,
} as const

/**
 * PAYMENT STATUS ICONS
 */
export const PAYMENT_STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  paid: CheckCircle,
  failed: XCircle,
  refunded: TrendingDown,
  processing: Activity,
} as const

/**
 * PRODUCT TYPE ICONS
 */
export const PRODUCT_TYPE_ICONS: Record<string, LucideIcon> = {
  Rx: Syringe, // Prescription required
  OTC: Pill, // Over-the-counter
  supplement: ThermometerSun,
  device: Microscope,
} as const

/**
 * STATS CARD ICONS - For dashboard statistics
 */
export const STATS_ICONS = {
  // User related
  totalUsers: Users,
  customers: User,
  pharmacists: Stethoscope,
  admins: Shield,
  verified: UserCheck,

  // Product related
  totalProducts: Package,
  categories: FileText,
  prescriptionRequired: Syringe,
  otc: Pill,
  featured: Star,

  // Order related
  totalOrders: ShoppingCart,
  pending: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  revenue: TrendingUp,

  // Prescription related
  totalPrescriptions: FileText,
  approved: CheckCircle,
  rejected: XCircle,
  urgent: AlertTriangle,

  // General
  activity: Activity,
  trending: TrendingUp,
  documents: FileText,
} as const

/**
 * NOTIFICATION ICONS
 */
export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  info: Bell,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  order: ShoppingCart,
  prescription: FileText,
  message: MessageSquare,
  system: Settings,
} as const

/**
 * ACTION ICONS - Common actions
 */
export const ACTION_ICONS = {
  add: Plus,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  more: MoreVertical,
  send: Send,
  like: Heart,
} as const

/**
 * Helper function to get icon by key with fallback
 */
export function getIconByKey(
  map: Record<string, LucideIcon>,
  key: string,
  fallback: LucideIcon = Activity,
): LucideIcon {
  return map[key] || fallback
}

/**
 * Helper function to get role icon
 */
export function getRoleIcon(role: string): LucideIcon {
  return getIconByKey(USER_ROLE_ICONS, role, User)
}

/**
 * Helper function to get status icon
 */
export function getStatusIcon(status: string): LucideIcon {
  return getIconByKey(STATUS_ICONS, status, Activity)
}

/**
 * Helper function to get priority icon
 */
export function getPriorityIcon(priority: string): LucideIcon {
  return getIconByKey(PRIORITY_ICONS, priority, Activity)
}

/**
 * Helper function to get product type icon
 */
export function getProductTypeIcon(type: string): LucideIcon {
  return getIconByKey(PRODUCT_TYPE_ICONS, type, Pill)
}
