import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowLeft, Bell, Lock, FileText, HelpCircle, LogOut, Moon, Sun, ChevronRight } from 'lucide-react'
import { EncryptedStorage } from '@/utils/encrypted-storage'
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission 
} from '@/utils/notification-utils'

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled'

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  useEffect(() => {
    const loadNotificationsSetting = async () => {
      try {
        const saved = await EncryptedStorage.getItem(NOTIFICATIONS_ENABLED_KEY)
        const enabled = saved === 'true' || saved === true
        setNotificationsEnabled(enabled)
        
        if (isNotificationSupported()) {
          setNotificationPermission(getNotificationPermission())
        }
      } catch (error) {
        console.error('[Settings] Error loading notifications setting:', error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }
    
    loadNotificationsSetting()
  }, [])

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      if (isNotificationSupported()) {
        const permission = await requestNotificationPermission()
        setNotificationPermission(permission)
        
        if (permission === 'granted') {
          setNotificationsEnabled(true)
          await EncryptedStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true')
        } else {
          setNotificationsEnabled(false)
          await EncryptedStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false')
        }
      } else {
        setNotificationsEnabled(false)
        await EncryptedStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false')
      }
    } else {
      setNotificationsEnabled(false)
      await EncryptedStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/phone')
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Назад"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Настройки</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar/Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">Х</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ООО «ХХ»</h2>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-accent' : 'bg-muted'}`}>
                {isDark ? <Moon size={20} className="text-foreground" /> : <Sun size={20} className="text-foreground" />}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{isDark ? 'Темная тема' : 'Светлая тема'}</h3>
                <p className="text-sm text-muted-foreground">Переключите режим отображения</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input type="checkbox" checked={isDark} onChange={toggleTheme} className="sr-only peer" />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Уведомления</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoadingNotifications 
                    ? 'Загрузка...' 
                    : !isNotificationSupported()
                    ? 'Не поддерживается в этом браузере'
                    : notificationPermission === 'denied'
                    ? 'Разрешение отклонено'
                    : notificationPermission === 'granted'
                    ? 'Push-уведомления включены'
                    : 'Настройте push-уведомления'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input 
                type="checkbox" 
                checked={notificationsEnabled && notificationPermission === 'granted'} 
                onChange={(e) => handleNotificationsToggle(e.target.checked)} 
                disabled={isLoadingNotifications || !isNotificationSupported() || notificationPermission === 'denied'}
                className="sr-only peer disabled:opacity-50" 
              />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
            </label>
          </div>

          {/* Other Settings */}
          {[
            { icon: Lock, title: 'Безопасность', subtitle: 'Пароли и двухфакторка' },
            { icon: FileText, title: 'Документы', subtitle: 'Архив и шаблоны' },
            { icon: HelpCircle, title: 'Поддержка', subtitle: 'Чат и FAQ' },
          ].map(({ icon: Icon, title, subtitle }, i) => (
            <button key={i} className="flex items-center justify-between w-full p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors" onClick={() => { /* TODO: navigate */ }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-tertiary flex-shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border p-4">
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-4 bg-card rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut size={20} />
          <span className="font-semibold">Выйти</span>
        </button>
      </div>
    </div>
  )
}