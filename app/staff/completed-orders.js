import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Surface, Text, List, Divider, Chip, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { getCompletedOrders } from "../../database/orderOperations";
import { formatCurrency, formatDate } from "../../utils/format";

export default function CompletedOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewOrder = (orderId) => {
    router.push(`/staff/order-details?id=${orderId}`);
  };

  return (
    <View style={styles.container}>
      {/* <Surface style={styles.header} elevation={2}>
        <Text style={styles.title}>Completed Orders</Text>
      </Surface> */}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <Surface style={styles.emptyState} elevation={1}>
            <Text style={styles.emptyText}>No completed orders found</Text>
          </Surface>
        ) : (
          orders.map((order) => (
            <Surface key={order.id} style={styles.orderCard} elevation={1}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, { backgroundColor: "#E8F5E9" }]}
                >
                  {order.status}
                </Chip>
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.infoText}>
                  Table: {order.table_name || "N/A"}
                </Text>
                <Text style={styles.infoText}>
                  Staff: {order.staff_name || "N/A"}
                </Text>
                <Text style={styles.infoText}>
                  Completed: {formatDate(order.completed_at)}
                </Text>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.totalText}>
                  Total: {formatCurrency(order.total_amount)}
                </Text>
                <Text style={styles.itemsText}>{order.item_count} items</Text>
              </View>

              <Button
                mode="outlined"
                onPress={() => handleViewOrder(order.id)}
                style={styles.viewButton}
              >
                View Details
              </Button>
            </Surface>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  orderCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusChip: {
    marginLeft: 8,
  },
  orderInfo: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemsText: {
    fontSize: 14,
    color: "#666",
  },
  viewButton: {
    marginTop: 8,
  },
});
