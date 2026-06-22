import { apiClient } from './apiClient'
import type { Notification, NotificationFilter, NotificationPreferences } from '../types/account'

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
    filter: NotificationFilter = 'all'
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

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get<{ result: NotificationPreferences }>('/notifications/preferences')
    return res.data.result
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await apiClient.patch<{ result: NotificationPreferences }>('/notifications/preferences', preferences)
    return res.data.result
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
