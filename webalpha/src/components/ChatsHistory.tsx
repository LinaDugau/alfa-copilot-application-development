import { useState, useEffect, useMemo } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ChatsHistory() {
  const navigate = useNavigate()
  const { chats, currentChatId, selectChat, deleteChat, createNewChat, isLoading, loadMessages } = useChat()
  const { isDark } = useTheme()
  const [chatsWithMessages, setChatsWithMessages] = useState<string[]>([])

  const handleSelectChat = async (chatId: string) => {
    await selectChat(chatId)
    navigate('/smart-assistant')
  }

  const handleDeleteChat = (chatId: string, title: string) => {
    if (confirm(`Удалить чат "${title}"?`)) {
      deleteChat(chatId)
    }
  }

  const handleNewChat = async () => {
    await createNewChat()
    navigate('/smart-assistant')
  }

  useEffect(() => {
    const checkChatsWithMessages = async () => {
      const chatIdsWithMessages: string[] = []

      for (const chat of chats) {
        const messages = await loadMessages(chat.id)
        if (messages.length > 0) {
          chatIdsWithMessages.push(chat.id)
        }
      }

      setChatsWithMessages(chatIdsWithMessages)
    }

    if (!isLoading && chats.length > 0) {
      checkChatsWithMessages()
    }
  }, [chats, isLoading, loadMessages])

  const filteredChats = useMemo(() => {
    if (isLoading || chatsWithMessages.length === 0) return []
    return chats.filter((chat) => chatsWithMessages.includes(chat.id))
  }, [chats, chatsWithMessages, isLoading])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <button onClick={handleNewChat} className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-lg">
          <Plus size={20} />
          <span>Новый чат</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <MessageSquare size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Нет чатов</h3>
            <p className="text-sm text-muted-foreground">Создайте новый чат, чтобы начать разговор</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-muted ${
                currentChatId === chat.id ? 'bg-accent border-primary' : ''
              }`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted`}>
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`truncate font-medium ${currentChatId === chat.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {chat.title}
                </h4>
                <p className="text-sm text-muted-foreground">{formatDate(chat.updatedAt)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id, chat.title) }}>
                <Trash2 size={18} className="text-muted-foreground" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}