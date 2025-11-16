import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  User,
  Building2,
  UserCheck,
  Landmark,
  ArrowLeftRight,
  PiggyBank,
  ChevronRight,
} from "lucide-react-native";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export default function PaymentsScreen() {
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
          <Text style={styles.sectionTitlePay}>Недавние платежи</Text>
          <View style={styles.recentPayments}>
            <TouchableOpacity style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.inputBackground }]}>
                <Building2 size={24} color={Colors.text.primary} />
              </View>
              <Text style={styles.categoryText}>Юридцу</Text>
              <ChevronRight
                size={20}
                color={Colors.text.tertiary}
                style={styles.categoryChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.inputBackground }]}>
                <User size={24} color={Colors.text.primary} />
              </View>
              <Text style={styles.categoryText}>Физлицу</Text>
              <ChevronRight
                size={20}
                color={Colors.text.tertiary}
                style={styles.categoryChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.inputBackground }]}>
                <UserCheck size={24} color={Colors.text.primary} />
              </View>
              <Text style={styles.categoryTextForSubtext}>Самозанятому</Text>
              <Text style={styles.categorySubtext}>Физлицу или ИП без НДС</Text>
              <ChevronRight
                size={20}
                color={Colors.text.tertiary}
                style={styles.categoryChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: Colors.inputBackground }]}>
                <Landmark size={24} color={Colors.text.primary} />
              </View>
              <Text style={styles.categoryTextForSubtext}>Государству</Text>
              <Text style={styles.categorySubtext}>
                В налоговую или бюджет
              </Text>
              <ChevronRight
                size={20}
                color={Colors.text.tertiary}
                style={styles.categoryChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Переводы</Text>
          <TouchableOpacity style={styles.transferCard}>
            <View style={[styles.transferIcon, { backgroundColor: Colors.inputBackground }]}>
              <ArrowLeftRight size={24} color={Colors.text.primary} />
            </View>
              <Text style={styles.transferText}>Между счетами</Text>
            <ChevronRight
              size={20}
              color={Colors.text.tertiary}
              style={styles.transferChevron}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Валютные операции</Text>
          <TouchableOpacity style={styles.transferCard}>
            <View style={[styles.transferIcon, { backgroundColor: Colors.inputBackground }]}>
              <PiggyBank size={24} color={Colors.text.primary} />
            </View>
              <Text style={styles.transferText}>Обмен валют</Text>
            <ChevronRight
              size={20}
              color={Colors.text.tertiary}
              style={styles.transferChevron}
            />
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
  sectionTitlePay: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
    marginTop:40,
  },
  recentPayments: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  categoryTextForSubtext: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
    bottom: 11,
  },
  categorySubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
    position: "absolute",
    left: 72,
    bottom: 20,
  },
  categoryChevron: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  transferCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  transferIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transferText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  transferChevron: {
    position: "absolute",
    right: 16,
  },
  currencyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  currencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
});