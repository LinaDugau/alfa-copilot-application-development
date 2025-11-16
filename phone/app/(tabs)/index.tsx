import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Bell,
  Calendar,
  Pencil,
  ChevronRight,
  CreditCard,
} from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const Colors = getColors(isDark);
  const styles = createStyles(Colors);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>А</Text>
              </View>
            </View>
            <View>
              <Text style={styles.companyName}>
                ООО «ХХ»
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Calendar size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Pencil size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View>
                <View style={styles.balanceLabelRow}>
                  <Text style={styles.balanceLabel}>Доступный остаток</Text>
                  <View style={styles.badge}>
                    <Bell size={12} color={Colors.white} />
                  </View>
                </View>
                <Text style={styles.balanceAmount}>700 500.00 Р</Text>
                <Text style={styles.balanceSubtext}>на 5 рублёвых счетах</Text>
              </View>
              <View style={styles.depositSection}>
                <Text style={styles.depositLabel}>Депозиты</Text>
                <Text style={styles.depositAmount}>700 000.00</Text>
                <Text style={styles.depositSubtext}>на 2 рублёвых...</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardsSection}>
          <AccountCard
            amount="100 000.90 Р"
            description="Расчётный -1234"
            type="black"
            icon="card"
            Colors={Colors}
            styles={styles}
          />
          <AccountCard
            amount="100 000.90 Р"
            description="Расчётный -1234"
            type="red"
            icon="card"
            Colors={Colors}
            styles={styles}
          />
          <AccountCard
            amount="100 000.90 Р"
            description="Расчётный -1234"
            type="black"
            warning="Блокировка ФНС на 30 000.00 Р"
            icon="card"
            Colors={Colors}
            styles={styles}
          />
        </View>

        <TouchableOpacity style={styles.allAccountsButton}>
          <Text style={styles.allAccountsText}>Все счета и карты</Text>
          <ChevronRight size={20} color={Colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.workSection}>
          <Text style={styles.workTitle}>Дела в работе</Text>
          <TouchableOpacity style={styles.workCard}>
            <View style={styles.workCardLeft}>
              <View style={[styles.workIcon, { backgroundColor: Colors.inputBackground }]}>
                <CreditCard size={24} color={Colors.text.primary} />
              </View>
              <View>
                <Text style={styles.workCardTitle}>Оплатить</Text>
                <Text style={styles.workCardSubtitle}>
                  Входящие счета и налоги
                </Text>
              </View>
            </View>
            <View style={styles.workBadge}>
              <Text style={styles.workBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function AccountCard({
  amount,
  description,
  type,
  warning,
  icon,
  Colors,
  styles: cardStyles,
}: {
  amount: string;
  description: string;
  type: "black" | "red" | "blue";
  warning?: string;
  icon: string;
  Colors: ReturnType<typeof getColors>;
  styles: ReturnType<typeof createStyles>;
}) {
  const cardColor =
    type === "black"
      ? Colors.card.black
      : type === "red"
      ? Colors.card.red
      : Colors.card.blue;

  const iconBackgroundColor = type === "black" && Colors.background === "#000000" 
    ? "#2C2C2E" 
    : cardColor;
  const iconBorderColor = type === "black" && Colors.background === "#000000"
    ? "#38383A" 
    : "transparent";

  return (
    <View style={cardStyles.accountCard}>
      <View style={cardStyles.accountCardLeft}>
        <View style={[
          cardStyles.cardIcon, 
          { 
            backgroundColor: iconBackgroundColor,
            borderWidth: type === "black" ? 1 : 0,
            borderColor: iconBorderColor,
          }
        ]}>
          <CreditCard size={20} color={Colors.white} />
        </View>
        <View>
          <Text style={[cardStyles.accountAmount, { color: Colors.text.primary }]}>{amount}</Text>
          <Text style={[cardStyles.accountDescription, { color: Colors.text.secondary }]}>{description}</Text>
          {warning && <Text style={[cardStyles.accountWarning, { color: Colors.primary }]}>{warning}</Text>}
        </View>
      </View>
      <View style={[
        cardStyles.miniCard, 
        { 
          backgroundColor: cardColor,
          borderWidth: 1,
          borderColor: Colors.border,
        }
      ]} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    position: "relative",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceSection: {
    padding: 16,
    backgroundColor: Colors.surface,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  balanceSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  depositSection: {
    alignItems: "flex-end",
  },
  depositLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  depositAmount: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  depositSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  cardsSection: {
    padding: 16,
    gap: 12,
    backgroundColor: Colors.surface,
  },
  accountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAmount: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  accountDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  accountWarning: {
    fontSize: 13,
    marginTop: 2,
  },
  miniCard: {
    width: 44,
    height: 28,
    borderRadius: 4,
  },
  allAccountsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  allAccountsText: {
    fontSize: 17,
    color: Colors.text.primary,
  },
  workSection: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  workTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  workCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  workCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  workIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  workCardTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  workCardSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  workBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  workBadgeText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
});