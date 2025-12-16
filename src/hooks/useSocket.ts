import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Message } from '../types/chat'
import { authService } from '../services/authService'

interface UseSocketOptions {
    onNewMessage?: (message: Message) => void
    onMessageRead?: (data: { conversationId: string; userId: string }) => void
    onUserTyping?: (data: { userId: string; conversationId: string }) => void
    onUserStopTyping?: (data: { userId: string; conversationId: string }) => void
    onUserOnline?: (data: { userId: string }) => void
    onUserOffline?: (data: { userId: string }) => void
    onError?: (error: { message: string }) => void
}

export const useSocket = (options: UseSocketOptions = {}) => {
    const socketRef = useRef<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    // Connect to socket
    const connect = useCallback(() => {
        if (socketRef.current?.connected) {
            return
        }

        const token = authService.getAccessToken()
        if (!token) {
            console.warn('No access token available for socket connection')
            return
        }

        setIsConnecting(true)

        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        })

        // Connection events
        socketRef.current.on('connect', () => {
            console.log('Socket connected')
            setIsConnected(true)
            setIsConnecting(false)
        })

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected')
            setIsConnected(false)
        })

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            setIsConnecting(false)
            options.onError?.({ message: 'Failed to connect to chat server' })
        })

        // Chat events
        socketRef.current.on('message:new', (message: Message) => {
            options.onNewMessage?.(message)
        })

        socketRef.current.on('messages:read', (data: { conversationId: string; userId: string }) => {
            options.onMessageRead?.(data)
        })

        socketRef.current.on('typing:user', (data: { userId: string; conversationId: string }) => {
            options.onUserTyping?.(data)
        })

        socketRef.current.on('typing:stop', (data: { userId: string; conversationId: string }) => {
            options.onUserStopTyping?.(data)
        })

        socketRef.current.on('user:online', (data: { userId: string }) => {
            options.onUserOnline?.(data)
        })

        socketRef.current.on('user:offline', (data: { userId: string }) => {
            options.onUserOffline?.(data)
        })

        socketRef.current.on('error', (error: { message: string }) => {
            options.onError?.(error)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty deps - options are captured from closure

    // Disconnect from socket
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            try {
                socketRef.current.removeAllListeners()
                socketRef.current.disconnect()
            } catch (error) {
                // Suppress warnings in React Strict Mode
            }
            socketRef.current = null
            setIsConnected(false)
            setIsConnecting(false)
        }
    }, [])

    // Join conversation room
    const joinConversation = useCallback((conversationId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('conversation:join', conversationId)
        }
    }, [])

    // Leave conversation room
    const leaveConversation = useCallback((conversationId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('conversation:leave', conversationId)
        }
    }, [])

    // Send message via socket
    const sendMessage = useCallback(
        (data: { conversationId?: string; pharmacistId?: string; content: string; type?: 'text' | 'image'; imageUrl?: string }) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('message:send', data)
            }
        },
        []
    )

    // Start typing indicator
    const startTyping = useCallback((conversationId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing:start', conversationId)
        }
    }, [])

    // Stop typing indicator
    const stopTyping = useCallback((conversationId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing:stop', conversationId)
        }
    }, [])

    // Mark messages as read
    const markAsRead = useCallback((conversationId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('messages:read', { conversationId })
        }
    }, [])

    // Auto-connect on mount
    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    return {
        socket: socketRef.current,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead
    }
}
