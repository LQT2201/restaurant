"use client";

import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Card,
  Text,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
  Menu,
  Avatar,
  Badge,
  Surface,
  useTheme,
  TouchableRipple,
  Searchbar,
  FAB,
  Appbar,
} from "react-native-paper";
import {
  getAllTables,
  updateTableStatus,
} from "../../database/tableOperations";
import { getOrdersByTable } from "../../database/orderOperations";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function TablesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedTable, setSelectedTable] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Load tables when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTables();
      // Refresh tables every 30 seconds
      const interval = setInterval(loadTables, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const loadTables = async () => {
    try {
      setLoading(true);
      const tableData = await getAllTables();
      setTables(tableData);
    } catch (error) {
      console.error("Failed to load tables:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTables();
  }, []);

  const handleStatusUpdate = async (tableId, status) => {
    try {
      await updateTableStatus(tableId, status);
      loadTables();
    } catch (error) {
      console.error("Failed to update table status:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái bàn");
    }
  };

  const handleViewOrders = async (tableId) => {
    try {
      const orders = await getOrdersByTable(tableId, true);
      if (orders.length > 0) {
        router.push(`/staff/order-details?id=${orders[0].id}`);
      } else {
        Alert.alert("Thông báo", "Không có đơn hàng đang xử lý cho bàn này");
      }
    } catch (error) {
      console.error("Failed to get table orders:", error);
      Alert.alert("Lỗi", "Không thể lấy thông tin đơn hàng");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "empty":
        return theme.colors.primary;
      case "occupied":
        return theme.colors.error;
      case "reserved":
        return theme.colors.warning || "#FFC107";
      case "maintenance":
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "empty":
        return "check-circle";
      case "occupied":
        return "silverware-fork-knife";
      case "reserved":
        return "calendar-clock";
      case "maintenance":
        return "tools";
      default:
        return "help-circle";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "empty":
        return "Còn Trống";
      case "occupied":
        return "Đang Sử Dụng";
      case "reserved":
        return "Đã Đặt Trước";
      case "maintenance":
        return "Bảo Trì";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Filter tables by status and search query
  const filteredTables = tables.filter((table) => {
    const matchesFilter = filter === "all" || table.status === filter;
    const matchesSearch =
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.section.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group tables by section
  const tablesBySection = filteredTables.reduce((acc, table) => {
    const section = table.section || "Chưa Phân Loại";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(table);
    return acc;
  }, {});

  // Convert grouped tables to sections for SectionList
  const sections = Object.keys(tablesBySection).map((section) => ({
    title: section,
    data: tablesBySection[section],
  }));

  // Count tables by status
  const tableCounts = tables.reduce(
    (acc, table) => {
      acc.total++;
      acc[table.status]++;
      return acc;
    },
    { total: 0, empty: 0, occupied: 0, reserved: 0, maintenance: 0 }
  );

  const openMenu = (table, event) => {
    // Get the position of the touch event
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setSelectedTable(table.id);
    setMenuVisible(true);
  };

  const renderTableItem = ({ item }) => (
    <Card
      style={[
        styles.tableCard,
        item.status === "occupied" && styles.occupiedTableCard,
      ]}
      mode="elevated"
    >
      <TouchableRipple
        onPress={() => {
          if (item.status === "occupied") {
            handleViewOrders(item.id);
          } else if (item.status === "empty") {
            router.push(`/staff/create-order?tableId=${item.id}`);
          }
        }}
        borderless
      >
        <View>
          <Card.Content style={styles.tableCardContent}>
            <View style={styles.tableHeader}>
              <View style={styles.tableInfo}>
                <Avatar.Icon
                  size={40}
                  icon="table-chair"
                  style={{
                    backgroundColor: `${getStatusColor(item.status)}20`,
                  }}
                  color={getStatusColor(item.status)}
                />
                <View style={styles.tableNameContainer}>
                  <Text variant="titleMedium" style={styles.tableName}>
                    Bàn {item.name}
                  </Text>
                  <View style={styles.tableDetailsContainer}>
                    <View style={styles.tableDetailItem}>
                      <IconButton
                        icon="account-group"
                        size={16}
                        style={styles.detailIcon}
                        iconColor={theme.colors.outline}
                      />
                      <Text variant="bodySmall" style={styles.tableDetailText}>
                        {item.capacity}
                      </Text>
                    </View>
                    <View style={styles.tableDetailItem}>
                      <IconButton
                        icon="map-marker"
                        size={16}
                        style={styles.detailIcon}
                        iconColor={theme.colors.outline}
                      />
                      <Text variant="bodySmall" style={styles.tableDetailText}>
                        {item.section}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { borderColor: getStatusColor(item.status) },
                ]}
                textStyle={{ color: getStatusColor(item.status) }}
                icon={() => (
                  <IconButton
                    icon={getStatusIcon(item.status)}
                    iconColor={getStatusColor(item.status)}
                    size={16}
                    style={styles.chipIcon}
                  />
                )}
              >
                {getStatusText(item.status)}
              </Chip>
            </View>

            {item.active_order_id && (
              <Surface style={styles.orderInfoCard} elevation={0}>
                <View style={styles.orderInfoHeader}>
                  <Text variant="labelLarge" style={styles.orderInfoTitle}>
                    Đơn Hàng Đang Xử Lý
                  </Text>
                  <Badge
                    size={22}
                    style={[
                      styles.orderBadge,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    #{item.active_order_id}
                  </Badge>
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailItem}>
                    <IconButton
                      icon="food"
                      size={16}
                      style={styles.detailIcon}
                      iconColor={theme.colors.primary}
                    />
                    <Text variant="bodyMedium" style={styles.orderDetailText}>
                      {item.item_count || 0} món
                    </Text>
                  </View>
                  <View style={styles.orderDetailItem}>
                    <IconButton
                      icon="cash"
                      size={16}
                      style={styles.detailIcon}
                      iconColor={theme.colors.primary}
                    />
                    <Text variant="bodyMedium" style={styles.orderDetailText}>
                      {item.active_order_amount?.toFixed(2) || "0.00"} đ
                    </Text>
                  </View>
                </View>
              </Surface>
            )}
          </Card.Content>

          <Divider />

          <Card.Actions style={styles.cardActions}>
            {item.status === "empty" ? (
              <Button
                mode="contained"
                icon="plus"
                onPress={() =>
                  router.push(`/staff/create-order?tableId=${item.id}`)
                }
              >
                Tạo Đơn Hàng
              </Button>
            ) : item.status === "occupied" ? (
              <Button
                mode="contained-tonal"
                icon="eye"
                onPress={() => handleViewOrders(item.id)}
              >
                Xem Đơn Hàng
              </Button>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <IconButton
              icon="dots-vertical"
              mode="contained-tonal"
              size={20}
              onPress={(event) => openMenu(item, event)}
              style={styles.menuButton}
            />
          </Card.Actions>
        </View>
      </TouchableRipple>
    </Card>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <IconButton
          icon="map-marker"
          size={20}
          style={styles.sectionIcon}
          iconColor={theme.colors.primary}
        />
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {section.title}
        </Text>
      </View>
      <Text variant="bodySmall" style={styles.sectionCount}>
        {section.data.length} bàn
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsContainer}>
        {/* <Surface style={styles.statCard} elevation={0}>
          <Text variant="headlineSmall" style={styles.statValue}>
            {tableCounts.total}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Tổng Số
          </Text>
        </Surface> */}
        <Surface style={styles.statCard} elevation={0}>
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: getStatusColor("empty") }]}
          >
            {tableCounts.empty}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Còn Trống
          </Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: getStatusColor("occupied") }]}
          >
            {tableCounts.occupied}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Đang Sử Dụng
          </Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: getStatusColor("reserved") }]}
          >
            {tableCounts.reserved}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Đã Đặt Trước
          </Text>
        </Surface>
      </View>

      <Searchbar
        placeholder="Tìm kiếm bàn..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.outline}
      />

      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: "all", label: "Tất Cả" },
          {
            value: "empty",
            label: "Còn Trống",
            icon: "check-circle",
            style:
              filter === "empty"
                ? { backgroundColor: `${getStatusColor("empty")}20` }
                : {},
          },
          {
            value: "occupied",
            label: "Đang Sử Dụng",
            icon: "silverware-fork-knife",
            style:
              filter === "occupied"
                ? { backgroundColor: `${getStatusColor("occupied")}20` }
                : {},
          },
          {
            value: "reserved",
            label: "Đã Đặt Trước",
            icon: "calendar-clock",
            style:
              filter === "reserved"
                ? { backgroundColor: `${getStatusColor("reserved")}20` }
                : {},
          },
        ]}
        style={styles.filterButtons}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Quản Lý Bàn" />
        <Appbar.Action icon="refresh" onPress={loadTables} />
        <Appbar.Action
          icon="cog"
          onPress={() => router.push("/staff/manage-tables")}
        />
      </Appbar.Header>

      {isTablet ? (
        <FlatList
          data={sections}
          renderItem={({ item: section }) => (
            <View>
              {renderSectionHeader({ section })}
              <View style={styles.gridContainer}>
                {section.data.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    {renderTableItem({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}
          keyExtractor={(item) => item.title}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <IconButton
                  icon="table-chair"
                  size={80}
                  iconColor={theme.colors.outlineVariant}
                />
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  Không tìm thấy bàn nào
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  {searchQuery || filter !== "all"
                    ? "Hãy điều chỉnh bộ lọc của bạn"
                    : "Thêm bàn để bắt đầu"}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => router.push("/staff/manage-tables")}
                  style={styles.emptyButton}
                >
                  Thêm Bàn
                </Button>
              </View>
            ) : (
              <ActivityIndicator
                size="large"
                style={styles.loader}
                color={theme.colors.primary}
              />
            )
          }
        />
      ) : (
        <FlatList
          data={filteredTables}
          renderItem={renderTableItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <IconButton
                  icon="table-chair"
                  size={80}
                  iconColor={theme.colors.outlineVariant}
                />
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  Không tìm thấy bàn nào
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  {searchQuery || filter !== "all"
                    ? "Hãy điều chỉnh bộ lọc của bạn"
                    : "Thêm bàn để bắt đầu"}
                </Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => router.push("/staff/manage-tables")}
                  style={styles.emptyButton}
                >
                  Thêm Bàn
                </Button>
              </View>
            ) : (
              <ActivityIndicator
                size="large"
                style={styles.loader}
                color={theme.colors.primary}
              />
            )
          }
        />
      )}

      <Menu
        visible={menuVisible}
        onDismiss={() => {
          setMenuVisible(false);
          setSelectedTable(null);
        }}
        anchor={menuPosition}
        style={styles.menu}
      >
        {selectedTable && (
          <>
            <Menu.Item
              leadingIcon="check-circle"
              onPress={() => {
                handleStatusUpdate(selectedTable, "empty");
                setMenuVisible(false);
              }}
              title="Đánh dấu là Còn Trống"
              disabled={
                tables.find((t) => t.id === selectedTable)?.status === "empty"
              }
            />
            <Menu.Item
              leadingIcon="silverware-fork-knife"
              onPress={() => {
                handleStatusUpdate(selectedTable, "occupied");
                setMenuVisible(false);
              }}
              title="Đánh dấu là Đang Sử Dụng"
              disabled={
                tables.find((t) => t.id === selectedTable)?.status ===
                "occupied"
              }
            />
            <Menu.Item
              leadingIcon="calendar-clock"
              onPress={() => {
                handleStatusUpdate(selectedTable, "reserved");
                setMenuVisible(false);
              }}
              title="Đánh dấu là Đã Đặt Trước"
              disabled={
                tables.find((t) => t.id === selectedTable)?.status ===
                "reserved"
              }
            />
            <Menu.Item
              leadingIcon="tools"
              onPress={() => {
                handleStatusUpdate(selectedTable, "maintenance");
                setMenuVisible(false);
              }}
              title="Đánh dấu là Bảo Trì"
              disabled={
                tables.find((t) => t.id === selectedTable)?.status ===
                "maintenance"
              }
            />
          </>
        )}
      </Menu>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/staff/manage-tables")}
        color={theme.colors.onPrimary}
      />
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
  headerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    minWidth: 70,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  filterButtons: {
    backgroundColor: "#F3F4F6",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80, // Space for FAB
  },
  tableCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  occupiedTableCard: {
    borderColor: "#FFCDD2",
    borderWidth: 1,
  },
  tableCardContent: {
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tableInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableNameContainer: {
    marginLeft: 12,
  },
  tableName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tableDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  detailIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  tableDetailText: {
    fontSize: 14,
    color: "#666",
  },
  statusChip: {
    height: 32,
  },
  chipIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  orderInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  orderInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderInfoTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderBadge: {
    fontSize: 12,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardActions: {
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  menuButton: {
    marginLeft: 8,
  },
  separator: {
    height: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginVertical: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    margin: 0,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
  menu: {
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  gridItem: {
    width: isTablet ? "48%" : "100%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});
