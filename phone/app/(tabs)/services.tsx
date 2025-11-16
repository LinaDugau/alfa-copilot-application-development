import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  Users,
  Wallet,
  CreditCard,
  Search,
} from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export default function ServicesScreen() {
  const { isDark } = useTheme();
  const Colors = getColors(isDark);
  const styles = createStyles(Colors);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promoCard}>
          <View style={styles.promoGradient}>
            <Text style={styles.promoTitle}>Получайте</Text>
            <Text style={styles.promoTitle}>бонусные баллы</Text>
            <Text style={styles.promoTitle}>за операции</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: Colors.surface }]}>
            <Search size={20} color={Colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: Colors.text.primary }]}
              placeholder="Поиск по сервисам и продуктам"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>
          <View style={styles.filterTabs}>
            <TouchableOpacity style={[styles.filterTab, styles.filterTabActive, { backgroundColor: isDark ? Colors.primary : Colors.black }]}>
              <Text style={styles.filterTabActiveText}>Все</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, { backgroundColor: Colors.surface }]}>
              <Text style={[styles.filterTabText, { color: Colors.text.primary }]}>Мои сервисы</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, { backgroundColor: Colors.surface }]}>
              <Text style={[styles.filterTabText, { color: Colors.text.primary }]}>Для бизнеса</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Бонусы</Text>
          <View style={styles.servicesGrid}>
            <ServiceCard
              icon={<Users size={24} color={Colors.white} />}
              title="Зовите друзей"
              gradient={["#FF6B9D", "#C239B3"]}
              styles={styles}
              Colors={Colors}
            />
            <ServiceCard
              icon={<Wallet size={24} color={Colors.white} />}
              title="Деньги сверху"
              gradient={["#FE6B8B", "#FF8E53"]}
              styles={styles}
              Colors={Colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Финансы</Text>
          <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.serviceIcon, { backgroundColor: Colors.inputBackground }]}>
              <CreditCard size={24} color={Colors.text.primary} />
            </View>
            <Text style={styles.serviceText}>Кредит для бизнеса</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceCard({
  icon,
  title,
  gradient,
  styles: cardStyles,
  Colors,
}: {
  icon: React.ReactNode;
  title: string;
  gradient: string[];
  styles: ReturnType<typeof createStyles>;
  Colors: ReturnType<typeof getColors>;
}) {
  return (
    <TouchableOpacity style={cardStyles.gridCard}>
      <View
        style={[
          cardStyles.gridCardGradient,
          {
            backgroundColor: gradient[0],
          },
        ]}
      >
        <View style={cardStyles.gridCardIcon}>
          <Text>{icon}</Text>
        </View>
      </View>
      <Text style={[cardStyles.gridCardTitle, { color: Colors.text.primary }]}>{title}</Text>
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
  promoCard: {
    marginHorizontal: 16,
    marginTop: 70,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
  },
  promoGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#6B5CE7",
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 32,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 15,
  },
  filterTabActiveText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: "600" as const,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: "row",
    gap: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridCardGradient: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  gridCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  serviceText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
});