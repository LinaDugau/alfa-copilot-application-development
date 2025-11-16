import { Link, useNavigate } from 'react-router-dom' 
import { useTheme } from '../contexts/ThemeContext'

export default function NotFound() {
  const { isDark } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Страница не найдена</p>
      <Link
        to="/smart-assistant" 
        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
      >
        Вернуться в чат
      </Link>
    </div>
  )
}