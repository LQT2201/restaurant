import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  Surface,
  Text,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
  Appbar,
} from "react-native-paper";
import {
  getActiveOrders,
  updateOrderStatus,
} from "../../database/orderOperations";

export default function ActiveOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const activeOrders = await getActiveOrders();
      setOrders(activeOrders);
    } catch (error) {
      console.error("Failed to load active orders:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng đang xử lý");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
      loadOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA000";
      case "preparing":
        return "#1976D2";
      case "ready":
        return "#388E3C";
      default:
        return "#757575";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const renderOrderItem = ({ item }) => (
    <Surface style={styles.orderCard} elevation={2}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.tableText}>Bàn {item.table_name}</Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
        <Chip
          mode="flat"
          textStyle={{ color: "white" }}
          style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          {item.status === "pending"
            ? "CHỜ XỬ LÝ"
            : item.status === "preparing"
            ? "ĐANG CHẾ BIẾN"
            : item.status === "ready"
            ? "SẴN SÀNG"
            : item.status.toUpperCase()}
        </Chip>
      </View>

      <View style={styles.orderSummary}>
        <Text>Số món: {item.item_count}</Text>
        <Text style={styles.totalText}>
          Tổng: ${item.total_amount?.toFixed(2)}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.actionButtons}>
        <Button
          mode="contained-tonal"
          onPress={() => router.push(`/staff/order-details?id=${item.id}`)}
        >
          Xem Chi Tiết
        </Button>
        {item.status === "pending" && (
          <Button
            mode="contained"
            onPress={() => handleStatusUpdate(item.id, "preparing")}
          >
            Bắt Đầu Chế Biến
          </Button>
        )}
        {item.status === "preparing" && (
          <Button
            mode="contained"
            onPress={() => handleStatusUpdate(item.id, "ready")}
          >
            Đánh Dấu Sẵn Sàng
          </Button>
        )}
        {item.status === "ready" && (
          <Button
            mode="contained"
            onPress={() => handleStatusUpdate(item.id, "completed")}
          >
            Hoàn Thành Đơn Hàng
          </Button>
        )}
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Đơn Hàng Đang Xử Lý" />
        <Appbar.Action icon="refresh" onPress={loadOrders} />
      </Appbar.Header>

      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: "all", label: "Tất Cả" },
          { value: "pending", label: "Chờ Xử Lý" },
          { value: "preparing", label: "Đang Chế Biến" },
          { value: "ready", label: "Sẵn Sàng" },
        ]}
        style={styles.filterButtons}
      />

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadOrders}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text>Không tìm thấy đơn hàng đang xử lý nào</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" style={styles.loader} />
          )
        }
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
  filterButtons: {
    margin: 8,
  },
  listContent: {
    padding: 8,
  },
  orderCard: {
    padding: 16,
    borderRadius: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tableText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timeText: {
    color: "#666",
  },
  statusChip: {
    borderRadius: 16,
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  totalText: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loader: {
    marginTop: 20,
  },
});
