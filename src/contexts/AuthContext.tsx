import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import type { User } from '../types/user'
import type { RegisterRequest, RegisterResponse } from '../types/api'

type ReactNode = React.ReactNode

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  // Returns the user object on success, or null on failure
  login: (email: string, password: string) => Promise<User | null>
  register: (userData: RegisterRequest) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

        if (token && userData) {
          const parsedUser = JSON.parse(userData) as User
          // console.log('Parsed user from localStorage:', parsedUser) // Debug log
          setUser(parsedUser)
          setIsAuthenticated(true)

          // Optionally verify token by fetching user profile
          try {
            const currentUser = await authService.getMe()
            // console.log('Current user from API:', currentUser) // Debug log
            setUser(currentUser)
            localStorage.setItem('medispace_user_data', JSON.stringify(currentUser))
          } catch {
            console.log('Failed to fetch current user, using cached data')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        authService.clearTokens()
      } finally {
        setLoading(false)
      }
    }

    // Small delay to prevent immediate flashing
    const timeoutId = setTimeout(checkAuth, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      setLoading(true)

      const response = await authService.login({ email, password })

      if (response.result) {
        const { accessToken, refreshToken } = response.result
        authService.saveTokens(accessToken, refreshToken)

        // Get user profile after login
        try {
          const userProfile = await authService.getMe()
          console.log('User profile fetched:', userProfile) // Debug log
          setUser(userProfile)
          setIsAuthenticated(true)
          localStorage.setItem('medispace_user_data', JSON.stringify(userProfile))
          return userProfile
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError)
          authService.clearTokens()
          return null
        }
      }

      return null
    } catch (error) {
      console.error('Login failed:', error)
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
        // Registration successful, but user needs to login to get tokens
        // The userId is just a confirmation, not tokens
        return true
      }

      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (_error) {
      console.error('Logout failed:', _error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
