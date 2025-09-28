import React, { createContext, useContext, useState, useEffect } from 'react'

type ReactNode = React.ReactNode

interface User {
  id: string
  email: string
  name: string
  role?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
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
        const token = localStorage.getItem('medispace_auth_token')
        const userData = localStorage.getItem('medispace_user_data')

        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('medispace_auth_token')
        localStorage.removeItem('medispace_user_data')
      } finally {
        setLoading(false)
      }
    }

    // Small delay to prevent immediate flashing
    const timeoutId = setTimeout(checkAuth, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)

      // Demo credentials
      if (email === 'demo@medispace.com' && password === '123456') {
        const demoUser = {
          id: 'demo-user-1',
          email: 'demo@medispace.com',
          name: 'Demo User',
          role: 'customer',
        }

        const demoToken = 'demo-token-123'

        localStorage.setItem('medispace_auth_token', demoToken)
        localStorage.setItem('medispace_user_data', JSON.stringify(demoUser))

        setUser(demoUser)
        setIsAuthenticated(true)

        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('medispace_auth_token')
    localStorage.removeItem('medispace_user_data')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
