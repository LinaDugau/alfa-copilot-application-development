import { useChat, Message } from "@/contexts/ChatContext";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  FileText,
  Menu,
  Paperclip,
  Plus,
  Send,
  X,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Users,
  UserCheck,
  Palette,
  Scale,
  Calculator,
  Mic,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { askLLM, askLLMStream } from "@/utils/llm";
import { systemPrompt } from "@/utils/prompt";
import { ROLE_PROFILES } from "@/utils/roles";
import { extractTextFromFile } from "@/utils/file-utils";
import { estimateTokens } from "@/utils/token-utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/colors";
import Markdown from "react-native-markdown-display";
import { useAudioRecorder } from "expo-audio";
import { transcribeAudioWithWebSpeech } from "@/utils/speech-recognition";

const MAX_TOKENS = 3500;
const MAX_MESSAGES = 10;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface AttachedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

type AssistantCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  questions: string[];
};

const ASSISTANT_CATEGORIES: AssistantCategory[] = [
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
];

class SimpleEventEmitter {
  _events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter((l) => l !== listener);
    }
  }

  emit(event: string, data: any) {
    if (this._events[event]) {
      this._events[event].forEach((listener) => listener(data));
    }
  }
}

class LLMJobManager {
  emitter = new SimpleEventEmitter();
  jobs = new Map<string, { status: string; chatId: string }>();
  isAppActive = true;
  isOnSmartAssistantScreen = false; 

  subscribe(callback: (data: any) => void) {
    const handleAnswer = (data: any) => callback({ ...data, type: 'answer' });
    const handleStartStream = (data: any) => callback({ ...data, type: 'start-stream' });
    const handleChunk = (data: any) => callback({ ...data, type: 'chunk' });

    this.emitter.on('answer', handleAnswer);
    this.emitter.on('start-stream', handleStartStream);
    this.emitter.on('chunk', handleChunk);

    return () => {
      this.emitter.off('answer', handleAnswer);
      this.emitter.off('start-stream', handleStartStream);
      this.emitter.off('chunk', handleChunk);
    };
  }

  async addJob(dialogue: any[], chatId: string) {
    const jobId = Date.now().toString();
    this.jobs.set(jobId, { status: 'pending', chatId });

    (async () => {
      try {
        const tempId = `temp-${jobId}`;
        if (this.isAppActive) {
          this.emitter.emit('start-stream', { tempId, chatId, jobId });
        }

        const answer = await this.generateFullLLMResponse(dialogue, (chunk: string) => {
          if (this.isAppActive) {
            this.emitter.emit('chunk', { chunk, chatId, jobId, tempId });
          }
        });

        this.jobs.set(jobId, { status: 'done', chatId });
        this.emitter.emit('answer', { answer, chatId, jobId, tempId });
      } catch (error: any) {
        console.error('LLM Job Error:', error);
        this.jobs.set(jobId, { status: 'error', chatId });
        this.emitter.emit('answer', {
          answer: 'Ошибка: не удалось связаться с LM Studio.',
          chatId,
          jobId,
          tempId: `temp-${jobId}`,
          error: true
        });
      }
    })();

    return jobId;
  }

  async generateFullLLMResponse(
    initialDialogue: any[],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const fullAnswer = await askLLMStream(initialDialogue, (chunk: string) => {
      if (onChunk) onChunk(chunk);
    });

    return fullAnswer.trim();
  }

  detectRole(messageText: string): string {
    const text = messageText.toLowerCase();
    if (text.match(/налог|учет|декларац|ип|осно|самозанят/i)) return "accountant";
    if (text.match(/юрист|договор|закон|оферта|регистрац/i)) return "lawyer";
    if (text.match(/ваканси|собесед|hr|персонал/i)) return "hr";
    if (text.match(/продаж|клиент|возражени|скрипт/i)) return "sales";
    if (text.match(/маркетинг|реклама|трафик|контент/i)) return "marketing";
    if (text.match(/дизайн|баннер|цвет|интерфейс/i)) return "designer";
    return "consultant";
  }
}

const llmJobManager = new LLMJobManager();

const renderMarkdownText = (text: string, textStyle: any, isDark: boolean) => {
  const Colors = getColors(isDark);
  
  const resolvedStyle = Array.isArray(textStyle)
    ? Object.assign({}, ...textStyle.filter(s => s && typeof s === 'object'))
    : textStyle || {};
  
  const textColor = resolvedStyle.color || Colors.text.primary;
  const textSize = resolvedStyle.fontSize || 16;
  const textFontFamily = resolvedStyle.fontFamily;
  const textLineHeight = resolvedStyle.lineHeight || 22;
  
  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: textSize,
      fontFamily: textFontFamily,
      lineHeight: textLineHeight,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 12,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 10,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 8,
      marginBottom: 4,
    },
    heading4: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 6,
      marginBottom: 4,
    },
    heading5: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 4,
      marginBottom: 2,
    },
    heading6: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: textColor,
      marginTop: 4,
      marginBottom: 2,
    },
    strong: {
      fontWeight: 'bold' as const,
      color: textColor,
    },
    em: {
      fontStyle: 'italic' as const,
      color: textColor,
    },
    link: {
      color: Colors.primary,
      textDecorationLine: 'underline' as const,
    },
    bullet_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    ordered_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    list_item: {
      flexDirection: 'row' as const,
      marginBottom: 4,
    },
    bullet_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: textColor,
      fontSize: textSize,
    },
    ordered_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: textColor,
      fontSize: textSize,
    },
    code_inline: {
      backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6',
      color: Colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: 14,
    },
    fence: {
      backgroundColor: isDark ? '#1C1C1E' : '#f3f4f6',
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
    },
    code_block: {
      backgroundColor: 'transparent',
      color: Colors.text.primary,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: 14,
      lineHeight: 20,
    },
    blockquote: {
      backgroundColor: isDark ? '#2C2C2E' : '#f9fafb',
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary,
      paddingLeft: 12,
      paddingRight: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    table: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      marginVertical: 8,
      overflow: 'hidden' as const,
    },
    thead: {
      backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6',
    },
    tbody: {
      backgroundColor: 'transparent',
    },
    th: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: Colors.border,
      padding: 8,
      fontWeight: 'bold' as const,
      color: textColor,
    },
    td: {
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: Colors.border,
      padding: 8,
      color: textColor,
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: Colors.border,
    },
    hr: {
      backgroundColor: Colors.border,
      height: 1,
      marginVertical: 12,
    },
    paragraph: {
      marginTop: 6,
      marginBottom: 6,
      flexWrap: 'wrap' as const,
    },
  };

  return (
    <Markdown style={markdownStyles}>
      {text}
    </Markdown>
  );
};

export default function SmartAssistantScreen() {
  const router = useRouter();
  const segments = useSegments();
  const { isDark } = useTheme();
  const Colors = getColors(isDark);

  const {
    currentChatId,
    currentChat,
    createNewChat,
    loadMessages,
    saveMessages,
    updateChatTitle,
  } = useChat();

  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {},
    ios: {},
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  } as any);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      parts: Array<{ type: "text"; text: string }>;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const currentCategory = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * ASSISTANT_CATEGORIES.length);
    return ASSISTANT_CATEGORIES[randomIndex];
  }, [currentChatId]);

  const initializeChat = useCallback(async () => {
    if (!currentChatId) {
      await createNewChat();
    }
    setIsInitialized(true);
  }, [currentChatId, createNewChat]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        setNotificationsEnabled(finalStatus === 'granted');
      } catch (error) {
        console.warn('Notifications not available:', error);
        setNotificationsEnabled(false);
      }
    })();
  }, []);

  const sendAnswerReadyNotification = useCallback(async (chatTitle?: string) => {
    if (!notificationsEnabled) {
      return;
    }

    try {
      if (!llmJobManager.isOnSmartAssistantScreen) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Ответ готов!",
            body: chatTitle
              ? `Новый ответ в чате "${chatTitle}"`
              : "Ваш вопрос получил ответ",
            sound: true,
            data: { chatId: currentChatId },
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.warn('Could not send notification (this is normal in Expo Go):', error);
    }
  }, [currentChatId, notificationsEnabled]);

  const loadChatMessages = useCallback(async () => {
    if (!currentChatId) return;

    const storedMessages = await loadMessages(currentChatId);
    const permanentMessages = storedMessages.filter(msg => !msg.id.startsWith('temp-'));
    
    if (permanentMessages.length > 0) {
      const formattedMessages = permanentMessages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
    
    const activeJobs = Array.from(llmJobManager.jobs.entries()).filter(
      ([_, job]) => job.chatId === currentChatId && job.status === 'pending'
    );
    setIsLoading(activeJobs.length > 0);
  }, [currentChatId, loadMessages]);

  useEffect(() => {
    if (isInitialized && currentChatId) {
      setMessages([]);
      setIsLoading(false);
      loadChatMessages();
    }
  }, [currentChatId, isInitialized, loadChatMessages]);

  const prevSegmentsRef = useRef<string[]>([]);
  useEffect(() => {
    const isOnSmartAssistantScreen = segments[segments.length - 1] === 'smart-assistant';
    const wasOnSmartAssistantScreen = prevSegmentsRef.current[prevSegmentsRef.current.length - 1] === 'smart-assistant';

    llmJobManager.isOnSmartAssistantScreen = isOnSmartAssistantScreen;

    if (isOnSmartAssistantScreen && (!wasOnSmartAssistantScreen || prevSegmentsRef.current.length === 0)) {
      if (isInitialized && currentChatId) {
        loadChatMessages().then(() => {
          const activeJobs = Array.from(llmJobManager.jobs.entries()).filter(
            ([_, job]) => job.chatId === currentChatId && job.status === 'pending'
          );
          if (activeJobs.length > 0) {
            setIsLoading(true);
          } else {
            setIsLoading(false);
          }
        });
      }
    }

    if (!isOnSmartAssistantScreen && wasOnSmartAssistantScreen) {
    }

    prevSegmentsRef.current = segments;
  }, [segments, isInitialized, currentChatId, loadChatMessages]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        llmJobManager.isAppActive = true;
        if (currentChatId) {
          loadChatMessages();
          const activeJobs = Array.from(llmJobManager.jobs.entries()).filter(
            ([_, job]) => job.chatId === currentChatId && job.status === 'pending'
          );
          if (activeJobs.length > 0) {
            setIsLoading(true);
          }
        }
      } else {
        llmJobManager.isAppActive = false;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [currentChatId, loadChatMessages]);

  useEffect(() => {
    if (!currentChatId) return;

    const unsubscribe = llmJobManager.subscribe(async (data) => {
      if (data.chatId !== currentChatId) return;

      if (data.type === 'start-stream') {
        if (llmJobManager.isOnSmartAssistantScreen && data.chatId === currentChatId) {
          const tempMsg = {
            id: data.tempId,
            role: 'assistant' as const,
            parts: [{ type: 'text' as const, text: '' }]
          };
          setMessages(prev => [...prev, tempMsg]);
          setIsLoading(true);
        }
      } else if (data.type === 'chunk') {
        if (llmJobManager.isOnSmartAssistantScreen && data.chatId === currentChatId) {
          setMessages(prev => prev.map(msg =>
            msg.id === data.tempId
              ? { ...msg, parts: [{ type: 'text' as const, text: (msg.parts[0]?.text || '') + data.chunk }] }
              : msg
          ));
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      } else if (data.type === 'answer') {
        const messageId = data.jobId ? `msg-${data.jobId}` : Date.now().toString();

        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: data.answer.trim(),
          timestamp: Date.now()
        };
        const currentMessages = await loadMessages(data.chatId);

        const filteredMessages = currentMessages.filter(msg => 
          msg.id !== messageId && 
          msg.id !== data.tempId && 
          !msg.id.startsWith(`temp-${data.jobId}`)
        );

        const messageExistsById = currentMessages.some(msg => msg.id === messageId);
        const messageExistsByContent = filteredMessages.some(
          msg => {
            const contentMatch = msg.content.trim() === data.answer.trim();
            const timeMatch = Math.abs(msg.timestamp - assistantMessage.timestamp) < 10000;
            return contentMatch && timeMatch;
          }
        );

        if (!messageExistsById && !messageExistsByContent) {
          await saveMessages(data.chatId, [...filteredMessages, assistantMessage]);

          const chatTitle = currentChat?.title || "Новый чат";
          await sendAnswerReadyNotification(chatTitle);
        } else if (messageExistsById) {
          const updatedMessages = filteredMessages.map(msg => 
            msg.id === messageId ? assistantMessage : msg
          );
          await saveMessages(data.chatId, updatedMessages);
        }

        if (llmJobManager.isOnSmartAssistantScreen && data.chatId === currentChatId) {
          setMessages(prev => {
            const messageId = data.jobId ? `msg-${data.jobId}` : assistantMessage.id;
            const finalText = data.answer.trim();

            const messageExistsById = prev.some(msg => msg.id === messageId);
            const messageExistsByContent = prev.some(msg =>
              msg.id !== data.tempId &&
              msg.role === 'assistant' &&
              msg.parts[0]?.text?.trim() === finalText
            );

            if (messageExistsById || messageExistsByContent) {
              return prev.filter(msg => msg.id !== data.tempId && !msg.id.startsWith(`temp-${data.jobId}`));
            }

            const tempMsg = prev.find(msg => msg.id === data.tempId);
            if (tempMsg) {
              const currentText = tempMsg.parts[0]?.text || '';

              if (currentText.trim() === finalText) {
                return prev.map(msg =>
                  msg.id === data.tempId
                    ? { ...msg, id: messageId }
                    : msg
                );
              } else {
                return prev.map(msg =>
                  msg.id === data.tempId
                    ? { ...msg, id: messageId, parts: [{ type: 'text' as const, text: finalText }] }
                    : msg
                );
              }
            } else {
              return [...prev, {
                id: messageId,
                role: 'assistant' as const,
                parts: [{ type: 'text' as const, text: finalText }]
              }];
            }
          });
        } else {
        }
        if (data.chatId === currentChatId) {
          setIsLoading(false);
        }
      }
    });

    return unsubscribe;
  }, [currentChatId, loadMessages, saveMessages, loadChatMessages, currentChat]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setAttachedFiles((prev) => [
          ...prev,
          {
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType || "application/octet-stream",
            size: file.size || 0,
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        setIsRecording(true);
        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudioWithWebSpeech();
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } catch (error: any) {
          console.error('Speech recognition error:', error);
          if (error.message?.includes('не поддерживается')) {
            console.warn('Speech recognition not available:', error.message);
          } else {
            alert(error.message || 'Ошибка распознавания речи');
          }
        } finally {
          setIsRecording(false);
          setIsTranscribing(false);
        }
      } else {
        try {
          await audioRecorder.record();
          setIsRecording(true);
        } catch (error: any) {
          console.error('Failed to start recording:', error);
          setIsRecording(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!audioRecorder.isRecording) return;

    try {
      setIsTranscribing(true);
      await audioRecorder.stop();
      console.log('Audio recording stopped');
      setIsRecording(false);
      setIsTranscribing(false);
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (!currentChatId) return;

    const messageText = input.trim();

    let displayMessage = messageText;
    if (attachedFiles.length > 0) {
      const fileList = attachedFiles.map((f) => f.name).join(", ");
      displayMessage = messageText ?
        `${messageText}\n\n📎 Файлы: ${fileList}` :
        `📎 Файлы: ${fileList}`;
    }

    let aiMessageContent = messageText;
    if (attachedFiles.length > 0) {
      const fileContents: string[] = [];

      for (const file of attachedFiles) {
        try {
          const content = await extractTextFromFile(file.uri, file.mimeType, file.name);
          fileContents.push(`\n\n--- Содержимое файла "${file.name}" ---\n${content}\n--- Конец файла ---`);
        } catch (error) {
          fileContents.push(`\n\n[Ошибка чтения файла "${file.name}"]`);
        }
      }

      aiMessageContent = messageText + fileContents.join("\n");
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: displayMessage, 
      timestamp: Date.now(),
    };

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", parts: [{ type: "text", text: displayMessage }] },
    ]);

    const currentMessages = await loadMessages(currentChatId);
    const updatedMessages = [...currentMessages, userMessage];
    await saveMessages(currentChatId, updatedMessages);

    if (updatedMessages.length === 1) {
      const title = displayMessage.slice(0, 50) + (displayMessage.length > 50 ? "..." : "");
      await updateChatTitle(currentChatId, title);
    }

    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);  

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const roleId = llmJobManager.detectRole(aiMessageContent);
    const roleProfile = ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES];

    const systemContent = `${systemPrompt}

    Твоя выбранная роль: **${roleProfile.title}**.
    Используй стиль роли:
    ${roleProfile.style}
    `;

    let tokensUsed = estimateTokens(systemContent);

    const recentMessages = messagesRef.current.slice(-MAX_MESSAGES);

    const dialogueMessages = recentMessages.map(m => ({
      role: m.role,
      content: m.parts[0].text,
    }));

    const trimmedDialogue: any[] = [];
    for (const msg of dialogueMessages.reverse()) {
      const msgTokens = estimateTokens(msg.content);
      if (tokensUsed + msgTokens > MAX_TOKENS) break;
      trimmedDialogue.unshift(msg);
      tokensUsed += msgTokens;
    }

    const userMessageTokens = estimateTokens(aiMessageContent);
    if (tokensUsed + userMessageTokens > MAX_TOKENS * 1.1) {
      trimmedDialogue.splice(0, trimmedDialogue.length - 2);
    }

    const dialogue = [
      { role: "system", content: systemContent },
      ...trimmedDialogue,
      { role: "user", content: aiMessageContent },
    ];

    llmJobManager.addJob(dialogue, currentChatId);
  }, [input, attachedFiles, currentChatId, loadMessages, saveMessages, updateChatTitle]);

  const handleNewChat = async () => {
    await createNewChat();
    setMessages([]);
  };

  const handleCopyMessage = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (Platform.OS === 'web') {
        alert('Сообщение скопировано');
      } else {
        Alert.alert('Скопировано', 'Сообщение скопировано в буфер обмена');
      }
    } catch (error) {
      console.error('Failed to copy message:', error);
      if (Platform.OS === 'web') {
        alert('Не удалось скопировать сообщение');
      } else {
        Alert.alert('Ошибка', 'Не удалось скопировать сообщение');
      }
    }
  }, []);

  const renderEmptyState = () => {
    const CategoryIcon = currentCategory.icon;

    return (
      <ScrollView
        style={[styles.emptyState, { backgroundColor: Colors.background }]}
        contentContainerStyle={styles.emptyStateContent}
      >
        <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>Альфа - помощник по бизнесу</Text>
        <Text style={[styles.emptyDescription, { color: Colors.text.secondary }]}>
          Задайте любой вопрос или загрузите документ для анализа
        </Text>

        <View style={[styles.categoryCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? "#2a1a1a" : "#fef2f2" }]}>
              <CategoryIcon size={20} color="#DC2626" />
            </View>
            <Text style={[styles.categoryTitle, { color: Colors.text.primary }]}>{currentCategory.title}</Text>
          </View>
          <Text style={[styles.categoryDescription, { color: Colors.text.secondary }]}>
            {currentCategory.description}
          </Text>
          <View style={styles.questionsList}>
            {currentCategory.questions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.questionItem, { backgroundColor: Colors.inputBackground }]}
                onPress={() => setInput(question)}
              >
                <Text style={[styles.questionText, { color: Colors.text.primary }]}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: currentChat?.title || "Новый чат",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/contact")}
              style={styles.headerButton}
            >
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleNewChat}
              >
                <Plus size={24} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push("/chats" as any)}
              >
                <Menu size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: "600",
            color: Colors.text.primary,
          },
        }}
      />

      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {messages.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.messagesList}
                style={{ backgroundColor: Colors.background }}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                renderItem={({ item }: { item: any }) => {
                  const messageText = item.parts[0]?.text || "";
                  const isLastMessage = messages[messages.length - 1]?.id === item.id;
                  const showLoading = isLastMessage && item.role === "assistant" && isLoading;
                  return (
                    <Pressable
                      onLongPress={() => handleCopyMessage(messageText)}
                      style={[
                        styles.messageContainer,
                        item.role === "user"
                          ? styles.userMessage
                          : styles.assistantMessage,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          item.role === "user"
                            ? { backgroundColor: Colors.messageBubble.user }
                            : {
                                backgroundColor: Colors.messageBubble.assistant,
                                borderColor: Colors.messageBubble.assistantBorder,
                              },
                        ]}
                      >
                        {messageText ? (
                          renderMarkdownText(
                            messageText,
                            [
                              styles.messageText,
                              item.role === "user"
                                ? styles.userMessageText
                                : { color: Colors.text.primary },
                            ],
                            isDark
                          )
                        ) : null}
                        {showLoading && (
                          <View style={styles.loadingIndicator}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />

            </>
          )}

          <View style={[styles.inputContainer, { backgroundColor: Colors.surface, borderTopColor: Colors.border }]}>
            {attachedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                {attachedFiles.map((file, index) => (
                  <View key={index} style={[styles.fileChip, { backgroundColor: isDark ? "#2a1a1a" : "#fef2f2", borderColor: isDark ? "#3a2a2a" : "#fecaca" }]}>
                    <FileText size={16} color={Colors.primary} />
                    <Text style={[styles.fileName, { color: isDark ? "#ff6b6b" : "#991b1b" }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Pressable onPress={() => handleRemoveFile(index)}>
                      <X size={16} color={Colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputRow}>
              <Pressable
                style={[styles.attachButton, { backgroundColor: Colors.inputBackground }]}
                onPress={handlePickDocument}
              >
                <Paperclip size={22} color={Colors.text.secondary} />
              </Pressable>

              {isTranscribing && (
                <View style={[styles.recordingIndicator, { backgroundColor: Colors.primary }]}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={[styles.recordingText, { color: Colors.white }]}>
                    {isRecording ? 'Говорите...' : 'Обработка...'}
                  </Text>
                </View>
              )}

              <TextInput
                style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text.primary }]}
                value={input}
                onChangeText={setInput}
                placeholder="Напишите сообщение..."
                placeholderTextColor={Colors.text.secondary}
                multiline
                maxLength={4000}
                editable={!isTranscribing}
              />

              <Pressable
                style={[
                  styles.micButton,
                  { backgroundColor: isRecording ? Colors.primary : Colors.inputBackground },
                ]}
                onPress={handleVoiceInput}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={isRecording ? Colors.white : Colors.text.secondary} />
                ) : (
                  <Mic
                    size={20}
                    color={isRecording ? Colors.white : Colors.text.secondary}
                  />
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.sendButton,
                  { backgroundColor: Colors.primary },
                  !input.trim() && attachedFiles.length === 0
                    ? { backgroundColor: Colors.inputBackground }
                    : null,
                ]}
                onPress={handleSend}
                disabled={(!input.trim() && attachedFiles.length === 0) || isTranscribing}
              >
                <Send
                  size={20}
                  color={
                    !input.trim() && attachedFiles.length === 0
                      ? Colors.text.secondary
                      : Colors.white
                  }
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerRightContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  keyboardView: { flex: 1 },
  emptyState: { flex: 1 },
  emptyStateContent: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 65 },
  emptyTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  emptyDescription: { fontSize: 16, textAlign: "center", marginBottom: 28 },
  categoryCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  categoryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: { fontSize: 20, fontWeight: "700" },
  categoryDescription: { fontSize: 14, marginBottom: 16 },
  questionsList: { gap: 12 },
  questionItem: { padding: 12, borderRadius: 8 },
  questionText: { fontSize: 15 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16 },
  messageContainer: { marginBottom: 16, maxWidth: "80%" },
  userMessage: { alignSelf: "flex-end" },
  assistantMessage: { alignSelf: "flex-start" },
  messageBubble: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, position: "relative" },
  loadingIndicator: { position: "absolute", bottom: 8, right: 12 },
  messageText: { fontSize: 16 },
  userMessageText: { color: "#ffffff" },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
  },
  filesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    maxWidth: "100%",
  },
  fileName: { flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  micButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sendButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 20 },
  sendButtonDisabled: {},
});