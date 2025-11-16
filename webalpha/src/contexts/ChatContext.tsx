import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { EncryptedStorage } from '@/utils/encrypted-storage'

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const CHATS_KEY = 'business_copilot_chats'
const CURRENT_CHAT_KEY = 'business_copilot_current_chat'
const MESSAGES_KEY_PREFIX = 'business_copilot_messages_'

interface ChatContextType {
  chats: Chat[]
  currentChatId: string | null
  currentChat: Chat | undefined
  isLoading: boolean
  createNewChat: () => Promise<string>
  selectChat: (chatId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  loadMessages: (chatId: string) => Promise<Message[]>
  saveMessages: (chatId: string, messages: Message[]) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadChats = useCallback(async () => {
    console.log('[ChatContext] Loading chats...')
    try {
      const chatsData = await EncryptedStorage.getItem(CHATS_KEY)
      const currentChat = await EncryptedStorage.getItem(CURRENT_CHAT_KEY)

      console.log('[ChatContext] Chats data:', chatsData ? 'found' : 'not found')
      console.log('[ChatContext] Current chat:', currentChat)

      if (chatsData) {
        try {
          let parsedChats: Chat[]
          if (typeof chatsData === 'string') {
            parsedChats = JSON.parse(chatsData)
          } else if (Array.isArray(chatsData)) {
            parsedChats = chatsData
          } else {
            console.error('[ChatContext] Invalid chats data format:', typeof chatsData)
            parsedChats = []
          }
          
          if (Array.isArray(parsedChats)) {
            console.log(`[ChatContext] Loaded ${parsedChats.length} chats`)
            setChats(parsedChats)
          } else {
            console.error('[ChatContext] Parsed chats is not an array')
          }
        } catch (parseError) {
          console.error('[ChatContext] Error parsing chats data:', parseError)
        }
      } else {
        console.log('[ChatContext] No chats data found')
      }

      if (currentChat) {
        let chatId: string
        if (typeof currentChat === 'string') {
          chatId = currentChat
        } else {
          try {
            chatId = JSON.parse(currentChat as any)
          } catch {
            chatId = currentChat as any
          }
        }
        console.log('[ChatContext] Setting current chat ID:', chatId)
        setCurrentChatId(chatId)
      }
    } catch (error) {
      console.error('[ChatContext] Error loading chats:', error)
      try {
        console.log('[ChatContext] Trying fallback localStorage...')
        const fallbackChats = localStorage.getItem(CHATS_KEY)
        const fallbackCurrent = localStorage.getItem(CURRENT_CHAT_KEY)
        if (fallbackChats) {
          const parsed = JSON.parse(fallbackChats)
          if (Array.isArray(parsed)) {
            console.log(`[ChatContext] Fallback: Loaded ${parsed.length} chats`)
            setChats(parsed)
          }
        }
        if (fallbackCurrent) {
          console.log('[ChatContext] Fallback: Setting current chat ID:', fallbackCurrent)
          setCurrentChatId(fallbackCurrent)
        }
      } catch (fallbackError) {
        console.error('[ChatContext] Error loading from fallback storage:', fallbackError)
      }
    } finally {
      setIsLoading(false)
      console.log('[ChatContext] Finished loading chats')
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const createNewChat = useCallback(async (): Promise<string> => {
    console.log('[ChatContext] Creating new chat...')
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    let currentChats: Chat[] = []
    try {
      const chatsData = await EncryptedStorage.getItem(CHATS_KEY)
      if (chatsData) {
        if (typeof chatsData === 'string') {
          currentChats = JSON.parse(chatsData)
        } else if (Array.isArray(chatsData)) {
          currentChats = chatsData
        }
      }
    } catch (error) {
      console.error('[ChatContext] Error loading chats for new chat creation:', error)
      setChats((prevChats) => {
        currentChats = prevChats
        return prevChats
      })
    }
    
    console.log(`[ChatContext] Current chats count from storage: ${currentChats.length}`)
    
    const updatedChats = [newChat, ...currentChats]
    
    try {
      const chatsJson = JSON.stringify(updatedChats)
      console.log(`[ChatContext] Saving ${updatedChats.length} chats to storage...`)
      await EncryptedStorage.setItem(CHATS_KEY, chatsJson)
      console.log('[ChatContext] Chats saved successfully')
    } catch (error) {
      console.error('[ChatContext] Error saving chats:', error)
      throw error
    }
    
    setChats(updatedChats)
    
    try {
      console.log('[ChatContext] Saving current chat ID:', newChat.id)
      await EncryptedStorage.setItem(CURRENT_CHAT_KEY, newChat.id)
      setCurrentChatId(newChat.id)
      console.log('[ChatContext] Current chat saved successfully')
    } catch (error) {
      console.error('[ChatContext] Error saving current chat:', error)
      setCurrentChatId(newChat.id) 
    }

    return newChat.id
  }, [])

  const selectChat = useCallback(async (chatId: string) => {
    await EncryptedStorage.setItem(CURRENT_CHAT_KEY, chatId)
    setCurrentChatId(chatId)
  }, [])

  const deleteChat = useCallback(async (chatId: string) => {
    let newCurrentChatId: string | null = null
    
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((c) => c.id !== chatId)
      
      EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats)).catch((error) => {
        console.error('Error saving chats:', error)
      })

      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          newCurrentChatId = updatedChats[0].id
        } else {
          newCurrentChatId = null
        }
      }

      return updatedChats
    })
    
    if (newCurrentChatId !== null) {
      await EncryptedStorage.setItem(CURRENT_CHAT_KEY, newCurrentChatId)
      setCurrentChatId(newCurrentChatId)
    } else if (currentChatId === chatId) {
      await EncryptedStorage.removeItem(CURRENT_CHAT_KEY)
      setCurrentChatId(null)
    }
    
    await EncryptedStorage.removeItem(`${MESSAGES_KEY_PREFIX}${chatId}`)
  }, [currentChatId])

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((c) =>
        c.id === chatId ? { ...c, title, updatedAt: Date.now() } : c
      )
      EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats)).catch((error) => {
        console.error('Error saving chats:', error)
      })
      return updatedChats
    })
  }, [])

  const loadMessages = useCallback(async (chatId: string): Promise<Message[]> => {
    try {
      const messagesData = await EncryptedStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`)
      if (!messagesData) return []
      
      if (typeof messagesData === 'string') {
        return JSON.parse(messagesData)
      } else if (Array.isArray(messagesData)) {
        return messagesData
      } else {
        console.error('[ChatContext] Invalid messages data format')
        return []
      }
    } catch (error) {
      console.error('[ChatContext] Error loading messages:', error)
      return []
    }
  }, [])

  const saveMessages = useCallback(async (chatId: string, messages: Message[]) => {
    try {
      await EncryptedStorage.setItem(`${MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(messages))

      setChats((prevChats) => {
        const updatedChats = prevChats.map((c) =>
          c.id === chatId ? { ...c, updatedAt: Date.now() } : c
        )
        EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats)).catch((error) => {
          console.error('Error saving chats:', error)
        })
        return updatedChats
      })
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }, [])

  const currentChat = useMemo(() => chats.find((c) => c.id === currentChatId), [chats, currentChatId])

  const value = useMemo(
    () => ({
      chats,
      currentChatId,
      currentChat,
      isLoading,
      createNewChat,
      selectChat,
      deleteChat,
      updateChatTitle,
      loadMessages,
      saveMessages,
    }),
    [chats, currentChatId, currentChat, isLoading, createNewChat, selectChat, deleteChat, updateChatTitle, loadMessages, saveMessages]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}