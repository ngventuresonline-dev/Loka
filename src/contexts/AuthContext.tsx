'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, getCurrentUser, logout as authLogout } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isLoggedIn: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = () => {
    // Only run on client side
    if (typeof window === 'undefined') return
    try {
      const currentUser = getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    // Check authentication on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        refreshUser()
        const currentUser = getCurrentUser()
        console.log('[AuthContext] Initialized with user:', currentUser ? { id: currentUser.id, email: currentUser.email, userType: currentUser.userType } : null)
      } catch (error) {
        console.error('[AuthContext] Error initializing:', error)
      }
    }
    setLoading(false)
  }, [])

  const logout = () => {
    authLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isLoggedIn: !loading && user !== null,
        logout,
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
