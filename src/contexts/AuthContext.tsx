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
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }

  useEffect(() => {
    // Check authentication on mount
    refreshUser()
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
