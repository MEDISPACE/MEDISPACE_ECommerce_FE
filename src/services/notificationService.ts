import { apiClient } from './apiClient'
import type { Notification } from '../types/account'

export interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: NotificationPagination
}

export const notificationService = {
  /**
   * Get paginated notifications
   */
  async getNotifications(
    page = 1,
    limit = 20,
    filter: 'all' | 'unread' | 'order' | 'prescription' | 'promotion' | 'system' | 'reminder' = 'all'
  ): Promise<NotificationsResponse> {
    const res = await apiClient.get<{ result: Notification[]; pagination: NotificationPagination }>(
      `/notifications?page=${page}&limit=${limit}&filter=${filter}`
    )
    return {
      notifications: res?.data?.result ?? [],
      pagination: res?.data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 },
    }
  },

  /**
   * Get unread count (for bell badge)
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ result: { count: number } }>('/notifications/unread-count')
      return res?.data?.result?.count ?? 0
    } catch {
      return 0
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },

  /**
   * Delete a notification permanently
   */
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`)
  },
}

export default notificationService
