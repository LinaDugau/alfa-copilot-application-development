import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EncryptedStorage } from '../utils/encrypted-storage'

const AUTH_KEY = '@auth_completed'

interface AuthContextType {
  isAuthenticated: boolean | null
  isLoading: boolean
  completeAuth: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const loadAuthState = useCallback(async () => {
    try {
      const value = await EncryptedStorage.getItem(AUTH_KEY)
      setIsAuthenticated(value === 'true')
    } catch (error) {
      console.error('Error loading auth state:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuthState()
  }, [loadAuthState])

  useEffect(() => {
    if (isLoading || isAuthenticated === null) return

    const inAuthGroup = location.pathname.startsWith('/auth')

    if (!isAuthenticated && !inAuthGroup) {
      navigate('/auth/phone')
    } else if (isAuthenticated && inAuthGroup) {
      navigate('/smart-assistant')  
    }
  }, [isAuthenticated, location.pathname, isLoading, navigate])

  const completeAuth = useCallback(async () => {
    try {
      await EncryptedStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      navigate('/smart-assistant')  
    } catch (error) {
      console.error('Error saving auth state:', error)
    }
  }, [navigate])

  const logout = useCallback(async () => {
    try {
      await EncryptedStorage.removeItem(AUTH_KEY)
      setIsAuthenticated(false)
      navigate('/auth/phone')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }, [navigate])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      completeAuth,
      logout,
    }),
    [isAuthenticated, isLoading, completeAuth, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}