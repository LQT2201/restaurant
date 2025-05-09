"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  FlatList,
} from "react-native";
import {
  Surface,
  Text,
  Divider,
  Chip,
  Button,
  Appbar,
  ActivityIndicator,
  IconButton,
  useTheme,
  Searchbar,
  SegmentedButtons,
  Badge,
  Avatar,
  TouchableRipple,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { getCompletedOrders } from "../../database/orderOperations";
import { formatCurrency, formatDate } from "../../utils/format";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function CompletedOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [timeFilter, setTimeFilter] = useState("all");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const completedOrders = await getCompletedOrders();
      setOrders(completedOrders);
    } catch (error) {
      console.error("Error loading completed orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewOrder = (orderId) => {
    router.push(`/staff/order-details?id=${orderId}`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#4CAF50"; // Green
      case "cancelled":
        return "#F44336"; // Red
      default:
        return "#757575"; // Grey
    }
  };

  const getColorWithOpacity = (color, opacity = 0.15) => {
    try {
      // Handle hex colors
      const hex = color.replace("#", "");
      if (hex.length === 6) {
        const r = Number.parseInt(hex.substring(0, 2), 16);
        const g = Number.parseInt(hex.substring(2, 4), 16);
        const b = Number.parseInt(hex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
      }
      return `${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
    } catch (error) {
      return color;
    }
  };

  // Filter orders based on search query and time filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchQuery) ||
      (order.table_name &&
        order.table_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.staff_name &&
        order.staff_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (timeFilter === "all") return true;

    const orderDate = new Date(order.completed_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    switch (timeFilter) {
      case "today":
        return orderDate >= today;
      case "yesterday":
        return orderDate >= yesterday && orderDate < today;
      case "week":
        return orderDate >= weekAgo;
      case "month":
        return orderDate >= monthAgo;
      default:
        return true;
    }
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.completed_at) - new Date(a.completed_at);
      case "amount":
        return b.total_amount - a.total_amount;
      case "items":
        return b.item_count - a.item_count;
      default:
        return 0;
    }
  });

  const renderOrderCard = ({ item: order }) => (
    <TouchableRipple onPress={() => handleViewOrder(order.id)} borderless>
      <Surface style={styles.orderCard} elevation={1}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Avatar.Icon
              size={40}
              icon="receipt"
              style={{
                backgroundColor: getColorWithOpacity(theme.colors.primary, 0.1),
              }}
              color={theme.colors.primary}
            />
            <View style={styles.orderIdTextContainer}>
              <Text style={styles.orderIdLabel}>Mã Đơn</Text>
              <Text style={styles.orderId}>#{order.id}</Text>
            </View>
          </View>
          <Chip
            mode="flat"
            style={[
              styles.statusChip,
              {
                backgroundColor: getColorWithOpacity(
                  getStatusColor(order.status),
                  0.15
                ),
                maxWidth: 200,
                overflow: "hidden",
                alignSelf: "flex-start",
                height: 32,
                paddingHorizontal: 8,
              },
            ]}
            textStyle={{
              color: getStatusColor(order.status),
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: getStatusColor(order.status) }}
            >
              {order.status === "completed"
                ? "Hoàn thành"
                : order.status === "cancelled"
                ? "Đã hủy"
                : order.status}
            </Text>
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <IconButton
              icon="table-chair"
              size={20}
              style={styles.detailIcon}
              iconColor={theme.colors.primary}
            />
            <View>
              <Text style={styles.detailLabel}>Bàn</Text>
              <Text style={styles.detailValue}>
                {order.table_name || "Không có"}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <IconButton
              icon="account"
              size={20}
              style={styles.detailIcon}
              iconColor={theme.colors.primary}
            />
            <View>
              <Text style={styles.detailLabel}>Nhân viên</Text>
              <Text style={styles.detailValue}>
                {order.staff_name || "Không có"}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <IconButton
              icon="clock-check"
              size={20}
              style={styles.detailIcon}
              iconColor={theme.colors.primary}
            />
            <View>
              <Text style={styles.detailLabel}>Hoàn thành</Text>
              <Text style={styles.detailValue}>
                {formatDate(order.completed_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng tiền</Text>
            <Text style={[styles.totalText, { color: theme.colors.primary }]}>
              {formatCurrency(order.total_amount)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Số món</Text>
            <Badge style={styles.itemCountBadge} size={24}>
              {order.item_count}
            </Badge>
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={() => handleViewOrder(order.id)}
          style={styles.viewButton}
          icon="eye"
          contentStyle={styles.viewButtonContent}
        >
          Xem chi tiết
        </Button>
      </Surface>
    </TouchableRipple>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Searchbar
        placeholder="Tìm theo mã, bàn, hoặc nhân viên..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.outline}
      />

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Khoảng thời gian:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <SegmentedButtons
            value={timeFilter}
            onValueChange={setTimeFilter}
            buttons={[
              { value: "all", label: "Tất cả" },
              { value: "today", label: "Hôm nay" },
              // { value: "yesterday", label: "Hôm qua" },
              // { value: "week", label: "Tuần này" },
              { value: "month", label: "Tháng này" },
            ]}
            style={styles.segmentedButtons}
          />
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.filterLabel}>Sắp xếp theo:</Text>
        <SegmentedButtons
          value={sortBy}
          onValueChange={setSortBy}
          buttons={[
            { value: "date", label: "Ngày", icon: "calendar" },
            { value: "amount", label: "Số tiền", icon: "cash" },
            { value: "items", label: "Số món", icon: "food" },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.statsContainer}>
        <Surface style={styles.statCard} elevation={0}>
          <Text style={styles.statValue}>{filteredOrders.length}</Text>
          <Text style={styles.statLabel}>Đơn</Text>
        </Surface>

        <Surface style={styles.statCard} elevation={0}>
          <Text style={styles.statValue}>
            {formatCurrency(
              filteredOrders.reduce((sum, order) => sum + order.total_amount, 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Tổng doanh thu</Text>
        </Surface>

        <Surface style={styles.statCard} elevation={0}>
          <Text style={styles.statValue}>
            {filteredOrders.reduce((sum, order) => sum + order.item_count, 0)}
          </Text>
          <Text style={styles.statLabel}>Món đã bán</Text>
        </Surface>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Đơn Đã Hoàn Thành" />
        <Appbar.Action icon="refresh" onPress={loadOrders} />
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải đơn đã hoàn thành...</Text>
        </View>
      ) : (
        <>
          {isTablet ? (
            <FlatList
              data={sortedOrders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.gridItem}>{renderOrderCard({ item })}</View>
              )}
              numColumns={2}
              contentContainerStyle={styles.gridContent}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={
                <Surface style={styles.emptyState} elevation={1}>
                  <IconButton
                    icon="receipt-text-outline"
                    size={64}
                    iconColor={theme.colors.outline}
                  />
                  <Text style={styles.emptyTitle}>
                    Không có đơn đã hoàn thành
                  </Text>
                  <Text style={styles.emptyText}>
                    {searchQuery || timeFilter !== "all"
                      ? "Hãy thử thay đổi tìm kiếm hoặc bộ lọc"
                      : "Đơn đã hoàn thành sẽ hiển thị ở đây"}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={loadOrders}
                    style={styles.emptyButton}
                    icon="refresh"
                  >
                    Làm mới
                  </Button>
                </Surface>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                />
              }
            />
          ) : (
            <FlatList
              data={sortedOrders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOrderCard}
              contentContainerStyle={styles.content}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={
                <Surface style={styles.emptyState} elevation={1}>
                  <IconButton
                    icon="receipt-text-outline"
                    size={64}
                    iconColor={theme.colors.outline}
                  />
                  <Text style={styles.emptyTitle}>
                    Không có đơn đã hoàn thành
                  </Text>
                  <Text style={styles.emptyText}>
                    {searchQuery || timeFilter !== "all"
                      ? "Hãy thử thay đổi tìm kiếm hoặc bộ lọc"
                      : "Đơn đã hoàn thành sẽ hiển thị ở đây"}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={loadOrders}
                    style={styles.emptyButton}
                    icon="refresh"
                  >
                    Làm mới
                  </Button>
                </Surface>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  appbarHeader: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    padding: 16,
  },
  gridContent: {
    padding: 16,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    maxWidth: "50%",
  },
  headerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#666",
  },
  filterScroll: {
    maxHeight: 40,
  },
  sortContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: "#F3F4F6",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 8,
  },
  orderCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderIdTextContainer: {
    marginLeft: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#666",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    margin: 0,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  itemCountBadge: {
    backgroundColor: "#4CAF50",
  },
  viewButton: {
    borderRadius: 8,
  },
  viewButtonContent: {
    height: 40,
  },
});
