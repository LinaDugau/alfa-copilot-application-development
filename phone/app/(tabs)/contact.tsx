import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Users,
  MessageCircle,
  Mail,
  HelpCircle,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";

export default function ContactScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const Colors = getColors(isDark);
  const styles = createStyles(Colors);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <TouchableOpacity style={styles.managersCard}>
            <View style={[styles.managersIcon, { backgroundColor: Colors.inputBackground }]}>
              <Users size={24} color={Colors.text.primary} />
            </View>
            <Text style={styles.managersText}>Контакты менеджеров</Text>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите способ связи</Text>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactIcon, { backgroundColor: Colors.inputBackground }]}>
                <MessageCircle size={24} color={Colors.text.primary} />
              </View>
              <View style={styles.contactInfo}>
                <View style={styles.contactTitleRow}>
                  <Text style={styles.contactTitle}>Чат</Text>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>1</Text>
                  </View>
                </View>
                <Text style={styles.contactSubtitle}>
                  Благодарю за ожидание, по услуге СБП без экваиринга, не...
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => router.push("/smart-assistant")}
          >
            <View style={styles.contactLeft}>
              <View style={[styles.contactIcon, styles.assistantIcon]}>
                <Sparkles size={24} color={Colors.white} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Умный помощник по бизнесу</Text>
                <Text style={styles.contactSubtitle}>
                  AI-ассистент для решения бизнес-задач
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactIcon, { backgroundColor: Colors.inputBackground }]}>
                <Mail size={24} color={Colors.text.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Письма</Text>
                <Text style={styles.contactSubtitle}>
                  Официальные заявления и запросы в банк
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactIcon, { backgroundColor: Colors.inputBackground }]}>
                <HelpCircle size={24} color={Colors.text.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Помощь</Text>
                <Text style={styles.contactSubtitle}>
                  База знаний о наших продуктах и сервисах
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactIcon, { backgroundColor: Colors.inputBackground }]}>
                <MoreHorizontal size={24} color={Colors.text.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Другой способ</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  managersCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop:50,
  },
  managersIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  managersText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  assistantIcon: {
    backgroundColor: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  notificationBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700" as const,
  },
});