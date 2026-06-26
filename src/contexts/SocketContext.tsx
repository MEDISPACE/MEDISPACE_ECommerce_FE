import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { authService } from '../services/authService'
import apiClient from '../services/apiClient'
import { AuthContext } from './AuthContext'
import type { Message, ProductRef } from '../types/chat'
import type { CommunityMessage, CommunityVideoEventRegistration } from '../types/community'
import { toast } from 'sonner'
import { COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS } from '~/constants/communityVideoEvents'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocketCallbacks {
  onNewMessage?: (message: Message) => void
  onMessageRead?: (data: { conversationId: string; userId: string }) => void
  onUserTyping?: (data: { userId: string; conversationId: string }) => void
  onUserStopTyping?: (data: { userId: string; conversationId: string }) => void
  onUserOnline?: (data: { userId: string }) => void
  onUserOffline?: (data: { userId: string }) => void
  onConversationAssigned?: (data: { conversationId: string; pharmacistId: string }) => void
  onConversationClosed?: (data: { conversationId: string; closedBy: string; closedAt: string }) => void
  onConversationTransferred?: (data: {
    conversationId: string
    newPharmacistId: string
    oldPharmacistId?: string
    transferredAt: string
  }) => void
  onConversationNew?: (data: { conversationId: string }) => void
  onCommunityMessageNew?: (message: CommunityMessage) => void
  onCommunityMessageUpdated?: (message: CommunityMessage) => void
  onCommunityMessageHidden?: (message: CommunityMessage) => void
  onCommunityMessageDeleted?: (message: CommunityMessage) => void
  onCommunityMessageReaction?: (data: Record<string, unknown>) => void
  onCommunityThreadReply?: (data: { threadId: string; message: CommunityMessage }) => void
  onCommunityMemberUpdated?: (data: Record<string, unknown>) => void
  onCommunityMemberJoined?: (data: Record<string, unknown>) => void
  onCommunityMemberLeft?: (data: Record<string, unknown>) => void
  onCommunityRoomRead?: (data: Record<string, unknown>) => void
  onCommunityModerationQueued?: (data: Record<string, unknown>) => void
  onCommunityVideoEventUpdated?: (data: Record<string, unknown>) => void
  onCommunityVideoEventRegistered?: (registration: CommunityVideoEventRegistration) => void
  onNewNotification?: (notification: Record<string, unknown>) => void
  onError?: (error: { message: string }) => void
  onMessageStreamStart?: (data: { conversationId: string }) => void
  onMessageStreamChunk?: (data: { conversationId: string; content: string }) => void
  onMessageStreamDone?: (data: { conversationId: string }) => void
  onMessageStreamError?: (data: { conversationId: string; message: string }) => void
}

interface SocketContextType {
  isConnected: boolean
  isConnecting: boolean
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendMessage: (data: {
    conversationId?: string
    pharmacistId?: string
    content?: string
    type?: 'text' | 'image' | 'product'
    imageUrl?: string
    productRef?: ProductRef
  }) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  markAsRead: (conversationId: string) => void
  joinCommunityRoom: (roomId: string, onAck?: (payload: { ok: boolean; roomId?: string; message?: string }) => void) => void
  leaveCommunityRoom: (roomId: string) => void
  joinCommunityVideoEvent: (eventId: string, onAck?: (payload: { ok: boolean; eventId?: string; message?: string }) => void) => void
  leaveCommunityVideoEvent: (eventId: string) => void
  requestHuman: (conversationId: string) => void
  // Subscribe/unsubscribe pattern to allow multiple components to listen
  subscribe: (id: string, callbacks: SocketCallbacks) => void
  unsubscribe: (id: string) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextType | null>(null)
const AUTH_TOKEN_REFRESHED_EVENT = 'medispace:auth-token-refreshed'

const isSocketAuthError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('authentication') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('unauthorized') ||
    normalized.includes('invalid access token') ||
    normalized.includes('jwt expired')
  )
}

export const useSocketContext = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const authReconnectPromiseRef = useRef<Promise<void> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Map of subscriber id → callbacks
  const subscribersRef = useRef<Map<string, SocketCallbacks>>(new Map())

  const subscribe = useCallback((id: string, callbacks: SocketCallbacks) => {
    subscribersRef.current.set(id, callbacks)
  }, [])

  const unsubscribe = useCallback((id: string) => {
    subscribersRef.current.delete(id)
  }, [])

  // Broadcast event to all subscribers
  const broadcast = <K extends keyof SocketCallbacks>(
    event: K,
    payload: Parameters<NonNullable<SocketCallbacks[K]>>[0],
  ) => {
    subscribersRef.current.forEach((cbs) => {
      try {
        ;(cbs[event] as ((p: typeof payload) => void) | undefined)?.(payload)
      } catch (error) {
        console.error('[SocketContext] subscriber callback failed', { event, error })
      }
    })
  }

  const refreshAndReconnect = useCallback(() => {
    if (authReconnectPromiseRef.current) return authReconnectPromiseRef.current

    setIsConnecting(true)
    authReconnectPromiseRef.current = apiClient
      .refreshToken()
      .then((fresh) => {
        const socket = socketRef.current
        if (!fresh || !socket) return

        socket.auth = { token: fresh }
        if (!socket.connected) {
          socket.connect()
        }
      })
      .catch(() => {
        setIsConnected(false)
        setIsConnecting(false)
        broadcast('onError', { message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
      })
      .finally(() => {
        authReconnectPromiseRef.current = null
      })

    return authReconnectPromiseRef.current
  }, [])

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const token = authService.getAccessToken()
    if (!token) return

    setIsConnecting(true)

    if (socketRef.current) {
      socketRef.current.auth = { token }
      socketRef.current.connect()
      return
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    const s = socketRef.current

    s.on('connect', () => {
      setIsConnected(true)
      setIsConnecting(false)
      s.emit('user:join')
    })

    s.on('disconnect', (reason) => {
      setIsConnected(false)
      setIsConnecting(false)
      if (reason === 'io server disconnect') {
        window.setTimeout(() => refreshAndReconnect(), 1000)
      }
    })

    s.on('connect_error', (error) => {
      setIsConnecting(false)
      if (isSocketAuthError(error.message)) {
        refreshAndReconnect()
      } else {
        broadcast('onError', { message: 'Không thể kết nối đến máy chủ chat' })
      }
    })

    // Chat events – fan-out to all subscribers
    s.on('message:new', (msg: Message) => broadcast('onNewMessage', msg))
    s.on('messages:read', (data: { conversationId: string; userId: string }) => broadcast('onMessageRead', data))
    s.on('typing:user', (data: { userId: string; conversationId: string }) => broadcast('onUserTyping', data))
    s.on('typing:stop', (data: { userId: string; conversationId: string }) => broadcast('onUserStopTyping', data))
    s.on('user:online', (data: { userId: string }) => broadcast('onUserOnline', data))
    s.on('user:offline', (data: { userId: string }) => broadcast('onUserOffline', data))
    s.on('conversation:assigned', (data: { conversationId: string; pharmacistId: string }) =>
      broadcast('onConversationAssigned', data),
    )
    s.on('conversation:closed', (data: { conversationId: string; closedBy: string; closedAt: string }) =>
      broadcast('onConversationClosed', data),
    )
    s.on(
      'conversation:transferred',
      (data: { conversationId: string; newPharmacistId: string; oldPharmacistId?: string; transferredAt: string }) =>
        broadcast('onConversationTransferred', data),
    )
    s.on('conversation:new', (data: { conversationId: string }) => broadcast('onConversationNew', data))
    s.on('community:message:new', (message: CommunityMessage) => broadcast('onCommunityMessageNew', message))
    s.on('community:message:updated', (message: CommunityMessage) => broadcast('onCommunityMessageUpdated', message))
    s.on('community:message:hidden', (message: CommunityMessage) => broadcast('onCommunityMessageHidden', message))
    s.on('community:message:deleted', (message: CommunityMessage) => broadcast('onCommunityMessageDeleted', message))
    s.on('community:message:reaction', (data: Record<string, unknown>) => broadcast('onCommunityMessageReaction', data))
    s.on('community:thread:reply', (data: { threadId: string; message: CommunityMessage }) =>
      broadcast('onCommunityThreadReply', data),
    )
    s.on('community:member:updated', (data: Record<string, unknown>) => broadcast('onCommunityMemberUpdated', data))
    s.on('community:member:joined', (data: Record<string, unknown>) => broadcast('onCommunityMemberJoined', data))
    s.on('community:member:left', (data: Record<string, unknown>) => broadcast('onCommunityMemberLeft', data))
    s.on('community:room:read', (data: Record<string, unknown>) => broadcast('onCommunityRoomRead', data))
    s.on('community:moderation:queued', (data: Record<string, unknown>) =>
      broadcast('onCommunityModerationQueued', data),
    )
    const broadcastVideoEventUpdated = (data: Record<string, unknown>) => broadcast('onCommunityVideoEventUpdated', data)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.CREATED, broadcastVideoEventUpdated)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.UPDATED, broadcastVideoEventUpdated)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.CANCELLED, broadcastVideoEventUpdated)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.LIVE, broadcastVideoEventUpdated)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.ENDED, broadcastVideoEventUpdated)
    s.on(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.REGISTERED, (registration: CommunityVideoEventRegistration) =>
      broadcast('onCommunityVideoEventRegistered', registration),
    )
    s.on('notification:new', (notification: Record<string, unknown>) => {
      broadcast('onNewNotification', notification)
      const title = notification?.title as string | undefined
      const message = notification?.message as string | undefined
      if (title) {
        toast.info(title, { description: message, duration: 5000 })
      }
    })
    s.on('error', (err: { message: string }) => broadcast('onError', err))
    s.on('message:stream:start', (data: { conversationId: string }) => broadcast('onMessageStreamStart', data))
    s.on('message:stream:chunk', (data: { conversationId: string; content: string }) => broadcast('onMessageStreamChunk', data))
    s.on('message:stream:done', (data: { conversationId: string }) => broadcast('onMessageStreamDone', data))
    s.on('message:stream:error', (data: { conversationId: string; message: string }) =>
      broadcast('onMessageStreamError', data),
    )
  }, [refreshAndReconnect])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [])

  // ── Socket actions ────────────────────────────────────────────────────────
  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('conversation:join', conversationId)
  }, [])

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('conversation:leave', conversationId)
  }, [])

  const sendMessage = useCallback(
    (data: {
      conversationId?: string
      pharmacistId?: string
      content?: string
      type?: 'text' | 'image' | 'product'
      imageUrl?: string
      productRef?: ProductRef
    }) => {
      socketRef.current?.connected && socketRef.current.emit('message:send', data)
    },
    [],
  )

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('typing:start', conversationId)
  }, [])

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('typing:stop', conversationId)
  }, [])

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('messages:read', { conversationId })
  }, [])

  const joinCommunityRoom = useCallback(
    (roomId: string, onAck?: (payload: { ok: boolean; roomId?: string; message?: string }) => void) => {
      if (!socketRef.current?.connected) {
        onAck?.({ ok: false, message: 'Realtime chưa kết nối.' })
        return
      }
      if (onAck) {
        socketRef.current.emit('community:room:join', roomId, onAck)
      } else {
        socketRef.current.emit('community:room:join', roomId)
      }
    },
    [],
  )

  const leaveCommunityRoom = useCallback((roomId: string) => {
    socketRef.current?.connected && socketRef.current.emit('community:room:leave', roomId)
  }, [])

  const joinCommunityVideoEvent = useCallback(
    (eventId: string, onAck?: (payload: { ok: boolean; eventId?: string; message?: string }) => void) => {
      if (!socketRef.current?.connected) {
        onAck?.({ ok: false, message: 'Realtime chưa kết nối.' })
        return
      }
      if (onAck) socketRef.current.emit(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.JOIN_ROOM, eventId, onAck)
      else socketRef.current.emit(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.JOIN_ROOM, eventId)
    },
    [],
  )

  const leaveCommunityVideoEvent = useCallback((eventId: string) => {
    socketRef.current?.connected && socketRef.current.emit(COMMUNITY_VIDEO_EVENT_SOCKET_EVENTS.LEAVE_ROOM, eventId)
  }, [])

  const requestHuman = useCallback((conversationId: string) => {
    socketRef.current?.connected && socketRef.current.emit('conversation:request_human', { conversationId })
  }, [])

  // Connect khi user đăng nhập, disconnect khi logout
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }
    return () => {
      // cleanup chỉ khi unmount hẳn
    }
  }, [isAuthenticated]) // eslint-disable-line

  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      if (!isAuthenticated) return

      const accessToken = (event as CustomEvent<{ accessToken?: string }>).detail?.accessToken
      const token = accessToken || authService.getAccessToken()
      if (!token) return

      if (socketRef.current) {
        socketRef.current.auth = { token }
      }

      if (authReconnectPromiseRef.current) return

      if (!socketRef.current?.connected) {
        connect()
      }
    }

    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefreshed)
    return () => window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefreshed)
  }, [connect, isAuthenticated])

  // Cleanup khi unmount
  useEffect(() => {
    return () => disconnect()
  }, []) // eslint-disable-line

  const value = useMemo(
    () => ({
      isConnected,
      isConnecting,
      joinConversation,
      leaveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      markAsRead,
      joinCommunityRoom,
      leaveCommunityRoom,
      joinCommunityVideoEvent,
      leaveCommunityVideoEvent,
      subscribe,
      unsubscribe,
      requestHuman,
    }),
    [
      isConnected,
      isConnecting,
      joinConversation,
      leaveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      markAsRead,
      joinCommunityRoom,
      leaveCommunityRoom,
      joinCommunityVideoEvent,
      leaveCommunityVideoEvent,
      subscribe,
      unsubscribe,
      requestHuman,
    ],
  )

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
