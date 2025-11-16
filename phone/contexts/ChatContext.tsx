import createContextHook from "@nkzw/create-context-hook";
import { EncryptedStorage } from "../utils/encrypted-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatHistory {
  chatId: string;
  messages: Message[];
}

const CHATS_KEY = "business_copilot_chats";
const CURRENT_CHAT_KEY = "business_copilot_current_chat";
const MESSAGES_KEY_PREFIX = "business_copilot_messages_";

export const [ChatProvider, useChat] = createContextHook(() => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadChats = useCallback(async () => {
    try {
      const chatsData = await EncryptedStorage.getItem(CHATS_KEY);
      const currentChat = await EncryptedStorage.getItem(CURRENT_CHAT_KEY);
      
      if (chatsData) {
        setChats(JSON.parse(chatsData));
      }
      
      if (currentChat) {
        setCurrentChatId(currentChat);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const createNewChat = useCallback(async (): Promise<string> => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Новый чат",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats((prevChats) => {
      const updatedChats = [newChat, ...prevChats];
      EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
      return updatedChats;
    });
    await EncryptedStorage.setItem(CURRENT_CHAT_KEY, newChat.id);
    setCurrentChatId(newChat.id);
    
    return newChat.id;
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    await EncryptedStorage.setItem(CURRENT_CHAT_KEY, chatId);
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((c) => c.id !== chatId);
      EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
      
      setCurrentChatId((prevChatId) => {
        if (prevChatId === chatId) {
          if (updatedChats.length > 0) {
            EncryptedStorage.setItem(CURRENT_CHAT_KEY, updatedChats[0].id);
            return updatedChats[0].id;
          } else {
            return null;
          }
        }
        return prevChatId;
      });
      
      return updatedChats;
    });
    await EncryptedStorage.removeItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
  }, []);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((c) =>
        c.id === chatId ? { ...c, title, updatedAt: Date.now() } : c
      );
      EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
      return updatedChats;
    });
  }, []);

  const loadMessages = useCallback(async (chatId: string): Promise<Message[]> => {
    try {
      const messagesData = await EncryptedStorage.getItem(
        `${MESSAGES_KEY_PREFIX}${chatId}`
      );
      return messagesData ? JSON.parse(messagesData) : [];
    } catch (error) {
      console.error("Error loading messages:", error);
      return [];
    }
  }, []);

  const saveMessages = useCallback(async (chatId: string, messages: Message[]) => {
    try {
      await EncryptedStorage.setItem(
        `${MESSAGES_KEY_PREFIX}${chatId}`,
        JSON.stringify(messages)
      );
      
      setChats((prevChats) => {
        const updatedChats = prevChats.map((c) =>
          c.id === chatId ? { ...c, updatedAt: Date.now() } : c
        );
        EncryptedStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
        return updatedChats;
      });
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  }, []);

  const currentChat = useMemo(
    () => chats.find((c) => c.id === currentChatId),
    [chats, currentChatId]
  );

  return useMemo(
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
    [
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
    ]
  );
});

