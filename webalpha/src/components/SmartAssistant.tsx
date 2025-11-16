import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChat, Message } from '@/contexts/ChatContext'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Menu, 
  Paperclip, 
  Send, 
  X, 
  Briefcase, 
  TrendingUp, 
  Users, 
  UserCheck, 
  Palette, 
  Scale, 
  Calculator, 
  Mic, 
  Plus,
  Settings,
  MessageSquare,
  Trash2,
  Copy,
  Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { extractTextFromFile } from '@/utils/file-utils'
import { askLLMStream } from '@/utils/llm'
import { systemPrompt } from '@/utils/prompt'
import { ROLE_PROFILES } from '@/utils/roles'
import { estimateTokens } from '@/utils/token-utils'
import { transcribeAudioWithWebSpeech } from '@/utils/speech-recognition'
import { useTheme } from '@/contexts/ThemeContext'
import { EncryptedStorage } from '@/utils/encrypted-storage'
import { showLLMResponseNotification } from '@/utils/notification-utils'

const MAX_TOKENS = 3500
const MAX_MESSAGES = 10

const ASSISTANT_CATEGORIES = [
  {
    id: "consultant",
    title: "Консультант",
    description:
      "Консультант поможет решить любые бизнес-вопросы: отредактировать письмо, придумать идею и создать эффективный бизнес-план",
    icon: Briefcase,
    questions: [
      "Как составить эффективный бизнес-план?",
      "Помоги отредактировать деловое письмо",
      "Предложи идеи для развития бизнеса",
    ],
  },
  {
    id: "marketing",
    title: "Маркетолог",
    description:
      "Маркетолог разработает стратегию продвижения, контент-план и рекламные тексты, которые привлекут клиентов и увеличат продажи",
    icon: TrendingUp,
    questions: [
      "Как увеличить продажи через соцсети?",
      "Какие рекламные каналы эффективнее для малого бизнеса?",
      "Как составить маркетинговый план на квартал?",
    ],
  },
  {
    id: "sales",
    title: "Клиентский менеджер",
    description:
      "Клиентский менеджер напишет скрипты продаж, подготовит сильные офферы, поможет ответить на отзывы и снять возражения клиентов",
    icon: Users,
    questions: [
      "Создай скрипт продаж для моего продукта",
      "Как снять возражение клиента о высокой цене?",
      "Помоги составить ответ на негативный отзыв",
    ],
  },
  {
    id: "hr",
    title: "HR-менеджер",
    description:
      "HR-менеджер составит текст вакансии, сформулирует вопросы для собеседований и предложит стратегию роста сотрудников",
    icon: UserCheck,
    questions: [
      "Помоги составить текст вакансии для менеджера",
      "Какие вопросы задать на собеседовании?",
      "Как создать систему мотивации сотрудников?",
    ],
  },
  {
    id: "designer",
    title: "Дизайнер",
    description:
      "Дизайнер создаст уникальные изображения нужного размера для рекламы, брендинга и соцсетей",
    icon: Palette,
    questions: [
      "Предложи цветовую палитру для бренда кофейни",
      "Какие тренды в дизайне соцсетей актуальны сейчас?",
      "Создай концепт для рекламного баннера",
    ],
  },
  {
    id: "lawyer",
    title: "Юрист",
    description: "Юрист ответит на юридические вопросы и разъяснит законы",
    icon: Scale,
    questions: [
      "Какие документы нужны для регистрации ООО?",
      "Как правильно составить договор с контрагентом?",
      "Что делать при нарушении условий договора?",
    ],
  },
  {
    id: "accountant",
    title: "Бухгалтер",
    description:
      "Бухгалтер проконсультирует по финансам, налогам и отчётности",
    icon: Calculator,
    questions: [
      "Какую систему налогообложения выбрать для ИП?",
      "Как правильно вести учёт расходов?",
      "Когда нужно сдавать налоговые декларации?",
    ],
  },
]

interface AttachedFile {
  file: File
  name: string
}

const markdownComponents: Components = {
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-2 text-foreground" {...props} />,
  h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1 text-foreground" {...props} />,
  h5: ({ node, ...props }) => <h5 className="text-sm font-bold mt-2 mb-1 text-foreground" {...props} />,
  h6: ({ node, ...props }) => <h6 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />,
  
  p: ({ node, ...props }) => <p className="mb-2 text-foreground leading-relaxed" {...props} />,
  
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2 text-foreground" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2 text-foreground" {...props} />,
  li: ({ node, ...props }) => <li className="ml-2 text-foreground" {...props} />,
  
  a: ({ node, ...props }) => (
    <a 
      className="text-primary underline hover:text-primary/80 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props} 
    />
  ),
  
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match
    
    if (isInline) {
      return (
        <code 
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border" 
          {...(props as any)}
        >
          {children}
        </code>
      )
    }
    
    return (
      <pre className="bg-muted rounded-lg p-3 my-3 overflow-x-auto border border-border">
        <code className={`text-sm font-mono text-foreground block ${className || ''}`} {...(props as any)}>
          {children}
        </code>
      </pre>
    )
  },
  
  pre: ({ node, ...props }) => <div {...props} />,
  
  blockquote: ({ node, ...props }) => (
    <blockquote 
      className="border-l-4 border-primary/50 pl-4 my-3 italic text-muted-foreground bg-muted/30 py-2 rounded-r" 
      {...props} 
    />
  ),
  
  hr: ({ node, ...props }) => <hr className="my-4 border-border" {...props} />,
  
  strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-foreground" {...props} />,
  
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border rounded-lg" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
  tbody: ({ node, ...props }) => <tbody {...props} />,
  tr: ({ node, ...props }) => <tr className="border-b border-border hover:bg-muted/50 transition-colors" {...props} />,
  th: ({ node, ...props }) => (
    <th 
      className="border border-border px-4 py-2 text-left font-semibold text-foreground bg-muted" 
      {...props} 
    />
  ),
  td: ({ node, ...props }) => (
    <td 
      className="border border-border px-4 py-2 text-foreground" 
      {...props} 
    />
  ),
  
  img: ({ node, ...props }) => (
    <img 
      className="max-w-full h-auto rounded-lg my-3" 
      {...props} 
    />
  ),
}

export default function SmartAssistant() {
  const navigate = useNavigate()
  const { currentChatId, currentChat, createNewChat, loadMessages, saveMessages, updateChatTitle, chats, selectChat, deleteChat, isLoading: chatsLoading } = useChat()
  const { isDark } = useTheme()
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(prev => !prev)
    }
  }
  const [chatsWithMessages, setChatsWithMessages] = useState<string[]>([])
  const [messages, setMessages] = useState<
    Array<{
      id: string
      role: 'user' | 'assistant'
      parts: Array<{ type: 'text'; text: string }>
    }>
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const currentCategory = useMemo(() => {
    if (messages.length === 0) {
      const randomIndex = Math.floor(Math.random() * ASSISTANT_CATEGORIES.length)
      return ASSISTANT_CATEGORIES[randomIndex]
    }
    return null
  }, [messages.length])

  const initializeChat = useCallback(async () => {
    if (chatsLoading) {
      return
    }
    
    if (!isInitialized) {
      await createNewChat()
      setIsInitialized(true)
    }
  }, [chatsLoading, createNewChat, isInitialized])

  useEffect(() => {
    if (!chatsLoading && !isInitialized) {
      initializeChat()
    }
  }, [initializeChat, chatsLoading, isInitialized])

  const loadChatMessages = useCallback(async () => {
    if (!currentChatId) return

    const storedMessages = await loadMessages(currentChatId)
    if (storedMessages.length > 0) {
      const formattedMessages = storedMessages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: msg.content }],
      }))
      setMessages(formattedMessages)
    } else {
      setMessages([])
    }
  }, [currentChatId, loadMessages])

  useEffect(() => {
    if (isInitialized && currentChatId) {
      loadChatMessages()
    }
  }, [currentChatId, isInitialized, loadChatMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePickDocument = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachedFiles((prev) => [...prev, { file, name: file.name }])
      e.target.value = ''
    }
  }, [])

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVoiceInput = async () => {
    setIsRecording(!isRecording)
    setIsTranscribing(true)
    try {
      const transcript = await transcribeAudioWithWebSpeech()
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    } catch (error) {
      console.error('Speech error:', error)
    } finally {
      setIsRecording(false)
      setIsTranscribing(false)
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return
    if (!currentChatId) return

    const messageText = input.trim()

    let displayMessage = messageText
    if (attachedFiles.length > 0) {
      const fileList = attachedFiles.map((f) => f.name).join(", ")
      displayMessage = messageText ?
        `${messageText}\n\n📎 Файлы: ${fileList}` :
        `📎 Файлы: ${fileList}`
    }

    let aiMessageContent = messageText
    if (attachedFiles.length > 0) {
      const fileContents: string[] = []

      for (const { file } of attachedFiles) {
        try {
          const content = await extractTextFromFile(file)
          fileContents.push(`\n\n--- Содержимое файла "${file.name}" ---\n${content}\n--- Конец файла ---`)
        } catch (error) {
          fileContents.push(`\n\n[Ошибка чтения файла "${file.name}"]`)
        }
      }

      aiMessageContent = messageText + fileContents.join("\n")
    }

    const userMessageId = Date.now().toString()
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: displayMessage, 
      timestamp: Date.now(),
    }

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", parts: [{ type: "text", text: displayMessage }] },
    ])

    const currentMessages = await loadMessages(currentChatId)
    const updatedMessages = [...currentMessages, userMessage]
    await saveMessages(currentChatId, updatedMessages)

    if (updatedMessages.length === 1) {
      const title = displayMessage.slice(0, 50) + (displayMessage.length > 50 ? "..." : "")
      await updateChatTitle(currentChatId, title)
    }

    setInput("")
    setAttachedFiles([])
    setIsLoading(true)  

    const roleId = detectRole(aiMessageContent)
    const roleProfile = ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES]

    const systemContent = `${systemPrompt}

    Твоя выбранная роль: **${roleProfile.title}**.
    Используй стиль роли:
    ${roleProfile.style}
    `

    let tokensUsed = estimateTokens(systemContent)

    const recentMessages = messages.slice(-MAX_MESSAGES)

    const dialogueMessages = recentMessages.map(m => ({
      role: m.role,
      content: m.parts[0].text,
    }))

    const trimmedDialogue: any[] = []
    for (const msg of dialogueMessages.reverse()) {
      const msgTokens = estimateTokens(msg.content)
      if (tokensUsed + msgTokens > MAX_TOKENS) break
      trimmedDialogue.unshift(msg)
      tokensUsed += msgTokens
    }

    const userMessageTokens = estimateTokens(aiMessageContent)
    if (tokensUsed + userMessageTokens > MAX_TOKENS * 1.1) {
      trimmedDialogue.splice(0, trimmedDialogue.length - 2)
    }

    const dialogue = [
      { role: "system", content: systemContent },
      ...trimmedDialogue,
      { role: "user", content: aiMessageContent },
    ]

    let fullAnswer = ''
    const tempId = `temp-${Date.now()}`

    setMessages(prev => [...prev, { id: tempId, role: 'assistant' as const, parts: [{ type: 'text' as const, text: '' }] }])

    try {
      const result = await askLLMStream(dialogue, (chunk: string) => {
        fullAnswer += chunk
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, parts: [{ type: 'text' as const, text: fullAnswer }] }
            : msg
        ))
      })
      fullAnswer = result || fullAnswer
    } catch (error) {
      console.error('Error in askLLMStream:', error)
      fullAnswer = error instanceof Error ? error.message : 'Ошибка: не удалось получить ответ от ИИ.'
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, parts: [{ type: 'text' as const, text: fullAnswer }] }
          : msg
      ))
    }

    setIsLoading(false)

    const messageId = Date.now().toString()
    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: fullAnswer.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => prev.map(msg =>
      msg.id === tempId
        ? { ...msg, id: messageId, parts: [{ type: 'text' as const, text: fullAnswer.trim() }] }
        : msg
    ))

    const finalMessages = await loadMessages(currentChatId)
    await saveMessages(currentChatId, [...finalMessages, assistantMessage])

    try {
      const notificationsEnabled = await EncryptedStorage.getItem('notifications_enabled')
      if (notificationsEnabled === 'true') {
        const chatTitle = currentChat?.title || 'Новый чат'
        const preview = fullAnswer.trim().slice(0, 100)
        showLLMResponseNotification(chatTitle, preview)
      }
    } catch (error) {
      console.error('[SmartAssistant] Error checking notifications setting:', error)
    }
  }, [input, attachedFiles, currentChatId, currentChat, loadMessages, saveMessages, updateChatTitle, messages])

  const detectRole = (messageText: string): string => {
    const text = messageText.toLowerCase()
    if (text.match(/налог|учет|декларац|ип|осно|самозанят/i)) return "accountant"
    if (text.match(/юрист|договор|закон|оферта|регистрац/i)) return "lawyer"
    if (text.match(/ваканси|собесед|hr|персонал/i)) return "hr"
    if (text.match(/продаж|клиент|возражени|скрипт/i)) return "sales"
    if (text.match(/маркетинг|реклама|трафик|контент/i)) return "marketing"
    if (text.match(/дизайн|баннер|цвет|интерфейс/i)) return "designer"
    return "consultant"
  }

  const handleNewChat = async () => {
    await createNewChat()
    setMessages([])
  }

  const handleSelectChat = async (chatId: string) => {
    await selectChat(chatId)
    setMessages([])
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  const handleDeleteChat = (chatId: string, title: string) => {
    if (confirm(`Удалить чат "${title}"?`)) {
      deleteChat(chatId)
    }
  }

  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  useEffect(() => {
    const checkChatsWithMessages = async () => {
      const chatIdsWithMessages: string[] = []

      for (const chat of chats) {
        try {
          const messages = await loadMessages(chat.id)
          if (messages.length > 0) {
            chatIdsWithMessages.push(chat.id)
          }
        } catch (error) {
          console.error(`Error loading messages for chat ${chat.id}:`, error)
          chatIdsWithMessages.push(chat.id)
        }
      }

      setChatsWithMessages(chatIdsWithMessages)
    }

    if (!chatsLoading && chats.length > 0) {
      checkChatsWithMessages()
    }
  }, [chats, chatsLoading, loadMessages])

  const filteredChats = useMemo(() => {
    if (chatsLoading || chatsWithMessages.length === 0) return []
    return chats.filter((chat) => chatsWithMessages.includes(chat.id))
  }, [chats, chatsWithMessages, chatsLoading])

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

  const renderEmptyState = () => {
    if (!currentCategory) return null
    const CategoryIcon = currentCategory.icon

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Альфа - помощник по бизнесу</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Задайте любой вопрос или загрузите документ для анализа</p>

        <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-accent' : 'bg-muted'}`}>
              <CategoryIcon size={20} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{currentCategory.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{currentCategory.description}</p>
          <div className="space-y-2">
            {currentCategory.questions.map((question, index) => (
              <button
                key={index}
                className="w-full text-left p-3 bg-input rounded-lg text-foreground hover:bg-accent transition-colors"
                onClick={() => setInput(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen bg-background">Loading...</div>
  }

    return (
    <div className="flex h-screen bg-background relative">
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-full lg:w-80 fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-transform duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Чаты</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Закрыть"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>
          <button 
            onClick={handleNewChat} 
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            <span>Новый чат</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary rounded-full animate-spin border-t-transparent" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <MessageSquare size={64} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Нет чатов</h3>
              <p className="text-sm text-muted-foreground">Создайте новый чат, чтобы начать разговор</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors ${
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
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDeleteChat(chat.id, chat.title) 
                  }}
                  className="p-2 hover:bg-accent rounded transition-colors"
                >
                  <Trash2 size={18} className="text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full lg:w-auto">
        <header className="bg-card border-b border-border p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Открыть меню чатов"
            >
              <Menu size={20} className="text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {currentChat?.title || 'Новый чат'}
            </h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Settings size={20} className="text-foreground" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? renderEmptyState() : (
          messages.map((msg) => {
            const isGenerating = msg.role === 'assistant' && (msg.id.startsWith('temp-') || (!msg.parts[0]?.text || msg.parts[0].text.trim() === '')) && isLoading
            const messageText = msg.parts[0]?.text || ''
            const isCopied = copiedMessageId === msg.id
            return (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2 w-full`}>
                  <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                    {messageText ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                        className="markdown-content"
                      >
                        {messageText}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-muted-foreground">Пишет...</span>
                    )}
                  </div>
                  {isGenerating && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-5 h-5 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                    </div>
                  )}
                </div>
                {messageText && !isGenerating && (
                  <button
                    onClick={() => handleCopyMessage(msg.id, messageText)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                      isCopied 
                        ? 'bg-primary text-white' 
                        : 'bg-muted hover:bg-accent text-muted-foreground'
                    }`}
                    title={isCopied ? 'Скопировано!' : 'Скопировать'}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Скопировать</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })
        )}
        </div>
        <div ref={messagesEndRef} />

        <footer className="bg-card border-t border-border p-4">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm border border-border">
                <FileText size={16} className="text-primary" />
                <span className="text-foreground truncate flex-1 max-w-32">{f.name}</span>
                <button onClick={() => handleRemoveFile(i)} className="p-1 hover:bg-accent rounded transition-colors">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          <label className="p-3 rounded-full bg-muted hover:bg-accent transition-colors cursor-pointer">
            <input 
              type="file" 
              onChange={handlePickDocument} 
              className="hidden" 
              accept=".docx,.xlsx,.txt,.pdf" 
            />
            <Paperclip size={20} className="text-foreground" />
          </label>

          <button
            onClick={handleVoiceInput}
            disabled={isTranscribing}
            className={`p-3 rounded-full ${isRecording ? 'bg-primary' : 'bg-muted'} ${isTranscribing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'} transition-colors`}
          >
            <Mic size={20} className={isRecording ? 'text-white' : 'text-muted-foreground'} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 p-3 bg-muted rounded-2xl text-foreground outline-none resize-none max-h-32 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isTranscribing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachedFiles.length === 0) || isTranscribing}
            className={`p-3 rounded-full ${input.trim() || attachedFiles.length > 0 ? 'bg-primary' : 'bg-muted'} ${(!input.trim() && attachedFiles.length === 0) || isTranscribing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} transition-all`}
          >
            <Send size={20} className={input.trim() || attachedFiles.length > 0 ? 'text-white' : 'text-muted-foreground'} />
          </button>
        </div>
      </footer>
      </div>
    </div>
  )
}