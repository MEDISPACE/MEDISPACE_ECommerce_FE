import { useEffect, useId } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationService } from '../services/notificationService'
import { useSocketContext } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { UserStatus } from '../types/user'
import type { NotificationFilter, NotificationPreferences } from '../types/account'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const
export const UNREAD_COUNT_QUERY_KEY = ['notifications-unread-count'] as const
export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['notification-preferences'] as const

/**
 * Main hook: fetch notification list + real-time socket integration
 */
export function useNotifications(
  filter: NotificationFilter = 'all',
  page = 1
) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const { subscribe, unsubscribe } = useSocketContext()
  const subscriberId = useId()
  const canUseNotifications = isAuthenticated && !!authService.getAccessToken() && user?.status === UserStatus.Verified

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, filter, page],
    queryFn: () => notificationService.getNotifications(page, 20, filter),
    enabled: canUseNotifications,
    retry: (failureCount, error: any) => ![401, 403].includes(error?.response?.status) && failureCount < 2,
    staleTime: 1000 * 30, // 30s
  })

  // Mark single as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
      toast.success('Đã đánh dấu tất cả là đã đọc')
    },
  })

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
      toast.success('Đã xóa thông báo')
    },
  })

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!canUseNotifications) return

    subscribe(subscriberId, {
      onNewNotification: (notification) => {
        // Invalidate queries to refresh counts and lists
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
      },
    })

    return () => {
      unsubscribe(subscriberId)
    }
  }, [canUseNotifications, subscriberId, subscribe, unsubscribe, queryClient])

  return {
    ...query,
    notifications: query.data?.notifications ?? [],
    pagination: query.data?.pagination,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAll: markAllAsReadMutation.isPending,
  }
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const canUseNotifications = isAuthenticated && !!authService.getAccessToken() && user?.status === UserStatus.Verified

  const query = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: () => notificationService.getPreferences(),
    enabled: canUseNotifications,
    staleTime: 1000 * 60,
  })

  const updateMutation = useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) => notificationService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY })
      toast.success('Đã cập nhật cài đặt thông báo')
    },
    onError: () => toast.error('Không thể cập nhật cài đặt thông báo'),
  })

  return {
    ...query,
    preferences: query.data,
    updatePreferences: updateMutation.mutate,
    isUpdatingPreferences: updateMutation.isPending,
  }
}

/**
 * Lightweight hook: just the unread count (for bell badge)
 * Polls every 60s as fallback if socket push is missed
 */
export function useUnreadNotificationCount() {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const { subscribe, unsubscribe } = useSocketContext()
  const subscriberId = useId()
  const canUseNotifications = isAuthenticated && !!authService.getAccessToken() && user?.status === UserStatus.Verified

  const query = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => notificationService.getUnreadCount(),
    enabled: canUseNotifications,
    retry: (failureCount, error: any) => ![401, 403].includes(error?.response?.status) && failureCount < 2,
    staleTime: 1000 * 60, // 60s
    refetchInterval: 1000 * 60, // poll every 60s as socket fallback
  })

  // Also listen to socket for instant count update
  useEffect(() => {
    if (!canUseNotifications) return

    subscribe(subscriberId, {
      onNewNotification: () => {
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
      },
    })

    return () => {
      unsubscribe(subscriberId)
    }
  }, [canUseNotifications, subscriberId, subscribe, unsubscribe, queryClient])

  return query.data ?? 0
}
