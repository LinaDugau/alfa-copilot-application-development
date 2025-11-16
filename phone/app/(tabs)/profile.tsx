import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import {
  User,
  Settings,
  Bell,
  Lock,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const Colors = getColors(isDark);

  const handleLogout = async () => {
    await logout();
  };

  const styles = createStyles(Colors);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Х</Text>
            </View>
          </View>
          <Text style={styles.userName}>ООО «ХХ»</Text>
        </View>

        <View style={styles.section}>
          <MenuItem
            icon={<User size={24} color={Colors.black} />}
            title="Личные данные"
            styles={styles}
          />
          <MenuItem
            icon={<Settings size={24} color={Colors.black} />}
            title="Настройки"
            styles={styles}
          />
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: Colors.surface }]}
            onPress={toggleTheme}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.background }]}>
                {isDark ? (
                  <Moon size={24} color={Colors.black} />
                ) : (
                  <Sun size={24} color={Colors.black} />
                )}
              </View>
              <Text style={[styles.menuText, { color: Colors.text.primary }]}>
                {isDark ? "Темная тема" : "Светлая тема"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </TouchableOpacity>
          <MenuItem
            icon={<Bell size={24} color={Colors.black} />}
            title="Уведомления"
            styles={styles}
          />
          <MenuItem
            icon={<Lock size={24} color={Colors.black} />}
            title="Безопасность"
            styles={styles}
          />
          <MenuItem
            icon={<FileText size={24} color={Colors.black} />}
            title="Документы"
            styles={styles}
          />
          <MenuItem
            icon={<HelpCircle size={24} color={Colors.black} />}
            title="Поддержка"
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={24} color={Colors.primary} />
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ 
  icon, 
  title,
  styles: menuStyles
}: { 
  icon: React.ReactNode; 
  title: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const { isDark } = useTheme();
  const Colors = getColors(isDark);
  
  return (
    <TouchableOpacity style={[menuStyles.menuItem, { backgroundColor: Colors.surface }]}>
      <View style={menuStyles.menuItemLeft}>
        <View style={[menuStyles.menuIcon, { backgroundColor: Colors.background }]}>
          {icon}
        </View>
        <Text style={[menuStyles.menuText, { color: Colors.text.primary }]}>{title}</Text>
      </View>
      <ChevronRight size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
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
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop:40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 17,
    color: Colors.text.secondary,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom:30,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});