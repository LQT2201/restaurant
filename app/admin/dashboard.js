import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, ScrollView, Alert, Dimensions } from "react-native";
import {
  Card,
  Text,
  Button,
  List,
  ActivityIndicator,
  Surface,
  IconButton,
  useTheme,
  Avatar,
  Divider,
  ProgressBar,
  TouchableRipple,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { getAllTables } from "../../database/tableOperations";
import {
  getActiveOrders,
  getCompletedOrders,
  getSalesReport,
} from "../../database/orderOperations";
import { getAllMenuItems } from "../../database/menuOperations";
import { getAllStaff } from "../../database/staffOperations";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "../../utils/format";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function DashboardScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tables: { total: 0, occupied: 0, available: 0 },
    orders: { active: 0, completed: 0 },
    menu: { total: 0 },
    staff: { total: 0, admin: 0, staff: 0 },
    sales: { today: 0, weekly: 0 },
  });
  const { userInfo } = useContext(AuthContext);
  const router = useRouter();

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load tables data
      const tables = await getAllTables().catch((error) => {
        console.error("Error loading tables:", error);
        return [];
      });

      const occupied = tables.filter(
        (table) => table.status === "occupied"
      ).length;

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      const endOfTodayStr = endOfToday.toISOString();

      // Calculate week's date range
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      const startOfWeekStr = startOfWeek.toISOString();

      // Load data with error handling
      const [activeOrders, todayOrders, salesReport, menuItems, staffMembers] =
        await Promise.all([
          getActiveOrders().catch((error) => {
            console.error("Error loading active orders:", error);
            return [];
          }),
          getCompletedOrders(startOfToday, endOfTodayStr).catch((error) => {
            console.error("Error loading completed orders:", error);
            return [];
          }),
          getSalesReport(startOfWeekStr, endOfTodayStr, "day").catch(
            (error) => {
              console.error("Error loading sales report:", error);
              return { summary: { total_revenue: 0 } };
            }
          ),
          getAllMenuItems().catch((error) => {
            console.error("Error loading menu items:", error);
            return [];
          }),
          getAllStaff().catch((error) => {
            console.error("Error loading staff:", error);
            return [];
          }),
        ]);

      // Calculate today's sales from completed orders with null check
      const todaySales = todayOrders.reduce(
        (sum, order) => sum + (order?.total_amount || 0),
        0
      );

      // Calculate weekly sales from sales report with null check
      const weeklySales = salesReport?.summary?.total_revenue || 0;

      // Count staff with null check
      const adminCount = staffMembers.filter(
        (member) => member?.role === "admin"
      ).length;

      // Update stats with safe values
      setStats({
        tables: {
          total: tables.length || 0,
          occupied: occupied || 0,
          available: (tables.length || 0) - (occupied || 0),
        },
        orders: {
          active: activeOrders.length || 0,
          completed: todayOrders.length || 0,
        },
        menu: {
          total: menuItems.length || 0,
        },
        staff: {
          total: staffMembers.length || 0,
          admin: adminCount || 0,
          staff: (staffMembers.length || 0) - (adminCount || 0),
        },
        sales: {
          today: todaySales || 0,
          weekly: weeklySales || 0,
        },
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      Alert.alert(
        "Error",
        "Some dashboard data could not be loaded. Please try refreshing."
      );
      // Set default values in case of error
      setStats({
        tables: { total: 0, occupied: 0, available: 0 },
        orders: { active: 0, completed: 0 },
        menu: { total: 0 },
        staff: { total: 0, admin: 0, staff: 0 },
        sales: { today: 0, weekly: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>
          Đang tải bảng điều khiển...
        </Text>
      </View>
    );
  }

  // Calculate table occupancy percentage
  const tableOccupancyPercentage =
    stats.tables.total > 0 ? stats.tables.occupied / stats.tables.total : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Welcome Card */}
      <Card
        style={[
          styles.welcomeCard,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <View style={styles.welcomeCardContent}>
          <View style={styles.welcomeTextContainer}>
            <Text
              style={[
                styles.welcomeTitle,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              Chào mừng trở lại, {userInfo?.name?.split(" ")[0]}
            </Text>
            <Text
              style={[
                styles.welcomeSubtitle,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <Avatar.Text
            size={50}
            label={
              userInfo?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"
            }
            style={{ backgroundColor: theme.colors.primary }}
          />
        </View>
      </Card>

      {/* Sales Overview */}
      <Card style={styles.salesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Tổng Quan Doanh Thu</Text>
          <View style={styles.salesContainer}>
            <View style={styles.salesItem}>
              <Text style={styles.salesValue}>
                {formatCurrency(stats.sales.today)}
              </Text>
              <Text style={styles.salesLabel}>Hôm Nay</Text>
            </View>
            <View style={styles.salesDivider} />
            <View style={styles.salesItem}>
              <Text style={styles.salesValue}>
                {formatCurrency(stats.sales.weekly)}
              </Text>
              <Text style={styles.salesLabel}>Tuần Này</Text>
            </View>
          </View>
          <Button
            mode="contained"
            style={[
              styles.viewReportsButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => router.push("/admin/reports")}
            icon="chart-bar"
          >
            Xem Báo Cáo
          </Button>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Bàn"
          icon="table-furniture"
          value={stats.tables.total}
          color="#6200EE"
          onPress={() => router.push("/admin/tables")}
          theme={theme}
        >
          <View style={styles.tableStatsContent}>
            <View style={styles.tableOccupancyContainer}>
              <View style={styles.tableOccupancyLabels}>
                <Text style={styles.tableOccupancyLabel}>Tỷ lệ sử dụng</Text>
                <Text style={styles.tableOccupancyPercentage}>
                  {formatPercentage(tableOccupancyPercentage)}
                </Text>
              </View>
              <ProgressBar
                progress={tableOccupancyPercentage}
                color={theme.colors.primary}
                style={styles.tableOccupancyBar}
              />
            </View>
            <View style={styles.tableStatsRow}>
              <View style={styles.tableStatItem}>
                <View
                  style={[
                    styles.tableStatDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text style={styles.tableStatText}>
                  {stats.tables.occupied} đang sử dụng
                </Text>
              </View>
              <View style={styles.tableStatItem}>
                <View
                  style={[
                    styles.tableStatDot,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                />
                <Text style={styles.tableStatText}>
                  {stats.tables.available} còn trống
                </Text>
              </View>
            </View>
          </View>
        </StatCard>

        <StatCard
          title="Đơn Hàng"
          icon="receipt"
          value={stats.orders.active}
          color="#03A9F4"
          onPress={() => router.push("/admin/reports")}
          theme={theme}
        >
          <View style={styles.orderStatsContent}>
            <View style={styles.orderStatItem}>
              <Text style={styles.orderStatValue}>
                {formatNumber(stats.orders.active)}
              </Text>
              <Text style={styles.orderStatLabel}>Đang xử lý</Text>
            </View>
            <View style={styles.orderStatDivider} />
            <View style={styles.orderStatItem}>
              <Text style={styles.orderStatValue}>
                {formatNumber(stats.orders.completed)}
              </Text>
              <Text style={styles.orderStatLabel}>Hoàn thành hôm nay</Text>
            </View>
          </View>
        </StatCard>

        <StatCard
          title="Món Ăn"
          icon="food"
          value={stats.menu.total}
          color="#4CAF50"
          onPress={() => router.push("/admin/menu")}
          theme={theme}
        >
          <Text style={styles.menuItemsSubtitle}>
            {formatNumber(stats.menu.total)} món ăn có sẵn trong thực đơn
          </Text>
        </StatCard>

        <StatCard
          title="Nhân Viên"
          icon="account-group"
          value={stats.staff.total}
          color="#FF5722"
          onPress={() => router.push("/admin/staff")}
          theme={theme}
        >
          <View style={styles.staffStatsContent}>
            <View style={styles.staffRoleContainer}>
              <View style={styles.staffRoleItem}>
                <Avatar.Icon
                  size={24}
                  icon="shield-account"
                  style={[
                    styles.staffRoleIcon,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  color={theme.colors.primary}
                />
                <Text style={styles.staffRoleText}>
                  {formatNumber(stats.staff.admin)} Quản trị viên
                </Text>
              </View>
              <View style={styles.staffRoleItem}>
                <Avatar.Icon
                  size={24}
                  icon="account"
                  style={[
                    styles.staffRoleIcon,
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                  color={theme.colors.secondary}
                />
                <Text style={styles.staffRoleText}>
                  {formatNumber(stats.staff.staff)} Nhân viên
                </Text>
              </View>
            </View>
          </View>
        </StatCard>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Thao Tác Nhanh</Text>

          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="table-furniture"
              label="Bàn"
              onPress={() => router.push("/admin/tables")}
              color="#6200EE"
              theme={theme}
            />
            <QuickActionButton
              icon="food"
              label="Thực Đơn"
              onPress={() => router.push("/admin/menu")}
              color="#4CAF50"
              theme={theme}
            />
            <QuickActionButton
              icon="account-group"
              label="Nhân Viên"
              onPress={() => router.push("/admin/staff")}
              color="#FF5722"
              theme={theme}
            />
            <QuickActionButton
              icon="chart-bar"
              label="Báo Cáo"
              onPress={() => router.push("/admin/reports")}
              color="#03A9F4"
              theme={theme}
            />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

// Stat card component
function StatCard({ title, icon, value, color, onPress, children, theme }) {
  return (
    <Card style={styles.statCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.statCardHeader}>
          <Avatar.Icon
            size={40}
            icon={icon}
            style={{ backgroundColor: `${color}20` }}
            color={color}
          />
          <View style={styles.statCardTitleContainer}>
            <Text style={styles.statCardTitle}>{title}</Text>
            <Text style={styles.statCardValue}>{value}</Text>
          </View>
        </View>
        <Divider style={styles.statCardDivider} />
        <View style={styles.statCardContent}>{children}</View>
      </Card.Content>
    </Card>
  );
}

// Quick action button component
function QuickActionButton({ icon, label, onPress, color, theme }) {
  return (
    <TouchableRipple
      style={styles.quickActionButton}
      onPress={onPress}
      borderless
      rippleColor={`${color}20`}
    >
      <View style={styles.quickActionContent}>
        <Avatar.Icon
          size={50}
          icon={icon}
          style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}
          color={color}
        />
        <Text style={styles.quickActionLabel}>{label}</Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  salesCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  salesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
  },
  salesItem: {
    alignItems: "center",
    flex: 1,
  },
  salesDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  salesLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  salesValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  viewReportsButton: {
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 16,
  },
  statCard: {
    width: isTablet ? "50%" : "100%",
    paddingHorizontal: 8,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statCardTitleContainer: {
    marginLeft: 12,
  },
  statCardTitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statCardDivider: {
    marginBottom: 12,
  },
  statCardContent: {
    minHeight: 60,
  },
  tableStatsContent: {
    marginTop: 8,
  },
  tableOccupancyContainer: {
    marginBottom: 12,
  },
  tableOccupancyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tableOccupancyLabel: {
    fontSize: 12,
    color: "#666",
  },
  tableOccupancyPercentage: {
    fontSize: 12,
    fontWeight: "bold",
  },
  tableOccupancyBar: {
    height: 6,
    borderRadius: 3,
  },
  tableStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  tableStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tableStatText: {
    fontSize: 12,
    color: "#666",
  },
  orderStatsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  orderStatItem: {
    alignItems: "center",
    flex: 1,
  },
  orderStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  orderStatValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  orderStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  menuItemsSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  staffStatsContent: {
    marginTop: 8,
  },
  staffRoleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  staffRoleItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  staffRoleIcon: {
    marginRight: 8,
  },
  staffRoleText: {
    fontSize: 14,
  },
  quickActionsCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  quickActionButton: {
    width: isTablet ? "25%" : "50%",
    padding: 8,
  },
  quickActionContent: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});
