import { useChat } from "@/contexts/ChatContext";
import { useRouter } from "expo-router";
import { MessageSquare, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export default function ChatsScreen() {
  const router = useRouter();
  const { chats, currentChatId, selectChat, deleteChat, createNewChat, isLoading, loadMessages } =
    useChat();
  const { isDark } = useTheme();
  const Colors = getColors(isDark);
  const styles = createStyles(Colors);
  
  const [chatsWithMessages, setChatsWithMessages] = useState<string[]>([]);

  const handleSelectChat = async (chatId: string) => {
    await selectChat(chatId);
    router.back();
  };

  const handleDeleteChat = (chatId: string, title: string) => {
    Alert.alert(
      "Удалить чат",
      `Вы уверены, что хотите удалить "${title}"?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await deleteChat(chatId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleNewChat = async () => {
    await createNewChat();
    router.back();
  };

  // Оставляем только чаты, у которых есть сообщения
  useEffect(() => {
    const checkChatsWithMessages = async () => {
      const chatIdsWithMessages: string[] = [];
      
      for (const chat of chats) {
        const messages = await loadMessages(chat.id);
        if (messages.length > 0) {
          chatIdsWithMessages.push(chat.id);
        }
      }
      
      setChatsWithMessages(chatIdsWithMessages);
    };
    
    if (!isLoading && chats.length > 0) {
      checkChatsWithMessages();
    }
  }, [chats, isLoading, loadMessages]);

  const filteredChats = useMemo(() => {
    if (isLoading || chatsWithMessages.length === 0) {
      return [];
    }
    return chats.filter(chat => chatsWithMessages.includes(chat.id));
  }, [chats, chatsWithMessages, isLoading]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.newChatButton} onPress={handleNewChat}>
          <Plus size={20} color={Colors.white} />
          <Text style={styles.newChatButtonText}>Новый чат</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
        {filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={64} color={Colors.text.tertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: Colors.text.secondary }]}>Нет чатов</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.text.tertiary }]}>
              Создайте новый чат, чтобы начать разговор
            </Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <Pressable
              key={chat.id}
              style={({ pressed }) => [
                styles.chatItem,
                { backgroundColor: Colors.surface, borderColor: Colors.border },
                currentChatId === chat.id && { backgroundColor: isDark ? "#2a1a1a" : "#fef2f2", borderColor: isDark ? "#3a2a2a" : "#fecaca" },
                pressed && styles.chatItemPressed,
              ]}
              onPress={() => handleSelectChat(chat.id)}
            >
              <View style={[styles.chatIcon, { backgroundColor: isDark ? "#2a1a1a" : "#fef2f2" }]}>
                <MessageSquare size={20} color={Colors.primary} />
              </View>
              <View style={styles.chatContent}>
                <Text
                  style={[
                    styles.chatTitle,
                    { color: Colors.text.primary },
                    currentChatId === chat.id && { color: Colors.primary, fontWeight: "600" as const },
                  ]}
                  numberOfLines={1}
                >
                  {chat.title}
                </Text>
                <Text style={[styles.chatDate, { color: Colors.text.secondary }]}>{formatDate(chat.updatedAt)}</Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(chat.id, chat.title)}
                hitSlop={8}
              >
                <Trash2 size={18} color={Colors.text.secondary} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  newChatButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  chatItemPressed: {
    opacity: 0.7,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  chatDate: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
  },
});