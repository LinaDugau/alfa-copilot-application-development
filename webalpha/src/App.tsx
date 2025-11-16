import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import PhoneInput from './components/Auth/PhoneInput'
import Verification from './components/Auth/Verification'
import SmartAssistant from './components/SmartAssistant'
import Settings from './components/Settings'
import NotFound from './components/NotFound'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/chats') {
      navigate('/smart-assistant', { replace: true })
    }
  }, [isAuthenticated, location.pathname, navigate])

  useEffect(() => {
    if (isAuthenticated && location.pathname.startsWith('/auth')) {
      navigate('/smart-assistant')
    }
  }, [isAuthenticated, location.pathname, navigate])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background">Loading...</div>
  }

  const isAuthRoute = location.pathname.startsWith('/auth')

  if (!isAuthenticated && !isAuthRoute) {
    return <PhoneInput />
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/smart-assistant" element={<SmartAssistant />} />
        <Route path="/chats" element={<SmartAssistant />} /> {/* Перенаправляем на SmartAssistant */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth/phone" element={<PhoneInput />} />
        <Route path="/auth/verification" element={<Verification />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ChatProvider>
    </AuthProvider>
  )
}