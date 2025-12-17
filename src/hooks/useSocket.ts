import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { authService } from '../services/authService'
import apiClient from '../services/apiClient'
import type { Message } from '../types/chat'

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

    // Keep reference to latest options to avoid stale closures in event handlers
    const optionsRef = useRef(options)
    useEffect(() => {
        optionsRef.current = options
    })

    // Connect to socket
    const connect = useCallback(() => {
        if (socketRef.current?.connected) {
            return
        }

        const token = authService.getAccessToken()
        if (!token) {

            return
        }

        setIsConnecting(true)

        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        })

        // Connection events
        socketRef.current.on('connect', () => {

            setIsConnected(true)
            setIsConnecting(false)

            // Force join personal room
            socketRef.current?.emit('user:join')
        })

        socketRef.current.on('disconnect', (reason) => {

            setIsConnected(false)

            // If disconnected due to auth error, try to reconnect with fresh token
            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect with fresh token
                setTimeout(() => {
                    const freshToken = authService.getAccessToken()
                    if (freshToken && socketRef.current) {
                        socketRef.current.auth = { token: freshToken }
                        socketRef.current.connect()
                    }
                }, 1000)
            }
        })

        socketRef.current.on('connect_error', (error) => {

            setIsConnecting(false)

            // If authentication error, try to reconnect with fresh token
            if (error.message.includes('Authentication') || error.message.includes('jwt expired')) {


                // Call API refresh token
                apiClient.refreshToken()
                    .then(freshToken => {
                        if (freshToken && socketRef.current) {
                            socketRef.current.auth = { token: freshToken }
                            socketRef.current.connect()
                        }
                    })
                    .catch(err => {
                        optionsRef.current.onError?.({ message: 'Session expired. Please login again.' })
                    })
            } else {
                optionsRef.current.onError?.({ message: 'Failed to connect to chat server' })
            }
        })

        // Chat events - use optionsRef to call latest callbacks
        socketRef.current.on('message:new', (message: Message) => {

            optionsRef.current.onNewMessage?.(message)
        })

        socketRef.current.on('messages:read', (data: { conversationId: string; userId: string }) => {
            optionsRef.current.onMessageRead?.(data)
        })

        socketRef.current.on('typing:user', (data: { userId: string; conversationId: string }) => {
            optionsRef.current.onUserTyping?.(data)
        })

        socketRef.current.on('typing:stop', (data: { userId: string; conversationId: string }) => {
            optionsRef.current.onUserStopTyping?.(data)
        })

        socketRef.current.on('user:online', (data: { userId: string }) => {
            optionsRef.current.onUserOnline?.(data)
        })

        socketRef.current.on('user:offline', (data: { userId: string }) => {
            optionsRef.current.onUserOffline?.(data)
        })

        socketRef.current.on('error', (error: { message: string }) => {
            optionsRef.current.onError?.(error)
        })
         
    }, []) // Empty deps - but we use optionsRef so it's fine

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
