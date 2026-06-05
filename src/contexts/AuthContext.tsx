import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { logger } from '../utils/logger'
import type { User } from '../types/user'
import type { RegisterRequest, RegisterResponse } from '../types/api'

type ReactNode = React.ReactNode

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  // Returns the user object on success, or null on failure
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>
  register: (userData: RegisterRequest) => Promise<boolean>
  logout: () => void
  loading: boolean
  setUser: (user: User | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getAccessToken()
        const userData = localStorage.getItem('medispace_user_data')

        if (token) {
          if (userData) {
            const parsedUser = JSON.parse(userData) as User
            setUser(parsedUser)
            setIsAuthenticated(true)
          }

          try {
            const currentUser = await authService.getMe()
            setUser(currentUser)
            setIsAuthenticated(true)
            localStorage.setItem('medispace_user_data', JSON.stringify(currentUser))
          } catch {
            logger.warn('Failed to fetch current user from API, clearing cached session')
            authService.clearTokens()
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          try {
            const refreshResponse = await authService.refreshToken()
            const accessToken = refreshResponse.result?.accessToken
            if (!accessToken) {
              throw new Error('Refresh did not return an access token')
            }
            authService.saveTokens(accessToken)
            const currentUser = await authService.getMe()
            setUser(currentUser)
            setIsAuthenticated(true)
            localStorage.setItem('medispace_user_data', JSON.stringify(currentUser))
          } catch {
            authService.clearTokens()
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      } catch {
        authService.clearTokens()
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    // Small delay to prevent immediate flashing
    const timeoutId = setTimeout(checkAuth, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User | null> => {
    try {
      setLoading(true)

      const response = await authService.login({ email, password, rememberMe })

      if (response.result) {
        const { accessToken } = response.result
        authService.saveTokens(accessToken)

        // Get user profile after login
        try {
          const userProfile = await authService.getMe()
          setUser(userProfile)
          setIsAuthenticated(true)
          localStorage.setItem('medispace_user_data', JSON.stringify(userProfile))
          // Dispatch custom event for cart reload
          window.dispatchEvent(new CustomEvent('auth-changed'))
          return userProfile
        } catch (profileError) {
          authService.clearTokens()
          return null
        }
      }

      return null
    } catch (error) {
      return null
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true)

      const response: RegisterResponse = await authService.register(userData)

      if (response.userId) {
        return true
      }

      return false
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('medispace_user_data', JSON.stringify(updatedUser))
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Logout failed
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      // Dispatch custom event for cart reload
      window.dispatchEvent(new CustomEvent('auth-changed'))
      // Replace instead of push so Back does not revisit a protected page/login flash.
      window.location.replace('/')
    }
  }

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
    setUser,
    setIsAuthenticated,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
