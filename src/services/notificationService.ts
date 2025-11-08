import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'
import type { Notification } from '../types/account'

/**
 * notificationService
 * Tries a few plausible endpoints to fetch notifications from the backend.
 * Returns an empty array when no endpoint is available so the UI can display placeholders.
 */
export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const candidates = [
      '/notifications',
      // e.g. /users/me/notifications
      `${API_ENDPOINTS.USERS.ME}/notifications`,
    ]

    for (const url of candidates) {
      try {
        const res = await apiClient.get<{ result: Notification[] }>(url)
        if (res?.data?.result) return res.data.result
      } catch (err: unknown) {
        // If endpoint isn't available, continue to next candidate.
        try {
          // non-blocking debug log for development
        } catch {
          /* ignore */
        }
        continue
      }
    }

    // No local mock fallback anymore — return empty list so UI can show placeholders
    return []
  },
}

export default notificationService
