import type { RoleConfig, UserRole } from './types'

export const roleConfigs: Record<UserRole, RoleConfig> = {
  admin: {
    title: 'Quản lý đơn hàng',
    description: 'Theo dõi và quản lý tất cả đơn hàng',
    themeColor: 'blue',
    gradientFrom: '#0A2463',
    gradientTo: '#1E40AF',
    showExportButton: true,
    canCancel: true,
    canRefund: true,
    statsToShow: ['total', 'pending', 'processing', 'delivered', 'cancelled', 'revenue'],
  },
  pharmacist: {
    title: 'Quản lý đơn hàng',
    description: 'Xử lý đơn hàng và xác nhận đơn thuốc',
    themeColor: 'cyan',
    gradientFrom: '#0A2463',
    gradientTo: '#1E40AF',
    showExportButton: true,
    canCancel: false,
    canRefund: false,
    statsToShow: ['total', 'pending', 'processing', 'delivered', 'cancelled', 'revenue'],
  },
}

export const getConfig = (role: UserRole): RoleConfig => {
  return roleConfigs[role] || roleConfigs.admin
}
