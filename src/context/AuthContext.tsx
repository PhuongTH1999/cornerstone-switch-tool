import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import API_BASE_URL from '../config/api'

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'guest'
  created_at?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('cornerstone_user')
    const accessToken = localStorage.getItem('cornerstone_access_token')

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('cornerstone_user')
        localStorage.removeItem('cornerstone_access_token')
      }
    } else {
      // Auto-login with mock user
      const mockUser: User = {
        id: 'admin-user',
        username: 'admin',
        email: 'admin@cornerstone.local',
        role: 'admin',
      }
      setUser(mockUser)
      localStorage.setItem('cornerstone_user', JSON.stringify(mockUser))
      localStorage.setItem('cornerstone_access_token', 'mock-token-dev')
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setError(null)
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      })

      const { user: userData, access_token, refresh_token } = response.data

      // Store tokens and user info
      localStorage.setItem('cornerstone_user', JSON.stringify(userData))
      localStorage.setItem('cornerstone_access_token', access_token)
      localStorage.setItem('cornerstone_refresh_token', refresh_token)

      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setUser(userData)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      throw new Error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem('cornerstone_user')
    localStorage.removeItem('cornerstone_access_token')
    localStorage.removeItem('cornerstone_refresh_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  // Restore auth header on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('cornerstone_access_token')
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
