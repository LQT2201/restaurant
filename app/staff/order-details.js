import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native";
import {
  Surface,
  Text,
  Button,
  Divider,
  Appbar,
  Card,
  List,
  ActivityIndicator,
  Chip,
  Portal,
  Dialog,
  TextInput,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getOrderById,
  completeOrder,
  addItemsToOrder,
  updateOrderStatus,
  cancelOrder,
} from "../../database/orderOperations";
import { updateTableStatus } from "../../database/tableOperations";

const ORDER_STATUSES = [
  { label: "Pending", value: "pending" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadOrder();
    // Refresh order details every 30 seconds
    const interval = setInterval(loadOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await getOrderById(parseInt(id));
      if (!orderData) {
        throw new Error("Order not found");
      }
      setOrder(orderData);
    } catch (error) {
      console.error("Failed to load order:", error);
      Alert.alert("Error", error.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    Alert.alert(
      "Complete Order",
      "Are you sure you want to mark this order as completed and paid?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              setCompleting(true);
              const result = await updateOrderStatus(parseInt(id), "completed");
              if (!result) {
                throw new Error("Failed to update order status");
              }
              await updateTableStatus(order.table_id, "empty");
              Alert.alert("Success", "Order completed successfully", [
                {
                  text: "OK",
                  onPress: () => router.replace("/staff/tables"),
                },
              ]);
            } catch (error) {
              console.error("Failed to complete order:", error);
              Alert.alert("Error", error.message || "Failed to complete order");
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddItems = () => {
    router.push({
      pathname: "/staff/add-items",
      params: {
        orderId: id,
        tableId: order.table_id,
        tableName: order.table_name,
      },
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      const result = await updateOrderStatus(parseInt(id), newStatus);
      if (!result) {
        throw new Error("Failed to update order status");
      }

      // If order is completed or cancelled, mark table as empty
      if (newStatus === "completed" || newStatus === "cancelled") {
        await updateTableStatus(order.table_id, "empty");
      }

      await loadOrder(); // Reload order details
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
      Alert.alert("Error", error.message || "Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation");
      return;
    }

    try {
      setLoading(true);
      const result = await cancelOrder(parseInt(id), cancelReason.trim());
      if (!result) {
        throw new Error("Failed to cancel order");
      }
      await updateTableStatus(order.table_id, "empty");
      await loadOrder();
      setShowCancelDialog(false);
      setCancelReason("");
    } catch (error) {
      console.error("Failed to cancel order:", error);
      Alert.alert("Error", error.message || "Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFC107";
      case "preparing":
        return "#2196F3";
      case "ready":
        return "#4CAF50";
      case "completed":
        return "#009688";
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const renderOrderItem = ({ item }) => (
    <Surface style={styles.orderItem} elevation={1}>
      <View style={styles.orderItemContent}>
        <View style={styles.orderItemInfo}>
          <Text style={styles.orderItemName}>{item.name}</Text>
          <Text style={styles.orderItemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.orderItemQuantity}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
          <Text style={styles.itemTotal}>
            ${(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
      {item.notes ? (
        <Text style={styles.itemNotes}>Note: {item.notes}</Text>
      ) : null}
    </Surface>
  );

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text>Order not found</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`Order #${order.id}`} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Order Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Table:</Text>
              <Text style={styles.infoValue}>{order.table_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Staff:</Text>
              <Text style={styles.infoValue}>{order.staff_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(order.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text
                style={[
                  styles.infoValue,
                  styles.statusText,
                  order.status === "active"
                    ? styles.activeStatus
                    : styles.completedStatus,
                ]}
              >
                {order.status === "active" ? "Active" : "Completed"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Order Items" />
          <Card.Content>
            <FlatList
              data={order.items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOrderItem}
              ItemSeparatorComponent={() => <Divider />}
              scrollEnabled={false}
            />

            <Divider style={styles.divider} />

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                ${order.total_amount.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {order.status === "active" && (
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              icon="plus"
              onPress={handleAddItems}
              style={styles.actionButton}
            >
              Add Items
            </Button>
            <Button
              mode="contained"
              icon="cash-register"
              onPress={handleCompleteOrder}
              style={styles.actionButton}
              loading={completing}
              disabled={completing}
            >
              Complete Order (Payment)
            </Button>
          </View>
        )}
      </ScrollView>

      <Surface style={styles.footer} elevation={4}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            ${order.total_amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.actions}>
          {order.status !== "completed" && order.status !== "cancelled" && (
            <>
              <Button
                mode="contained"
                onPress={() => setShowStatusDialog(true)}
                style={styles.actionButton}
              >
                Update Status
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowCancelDialog(true)}
                style={styles.actionButton}
              >
                Cancel Order
              </Button>
            </>
          )}
        </View>
      </Surface>

      <Portal>
        <Dialog
          visible={showStatusDialog}
          onDismiss={() => setShowStatusDialog(false)}
        >
          <Dialog.Title>Update Order Status</Dialog.Title>
          <Dialog.Content>
            <View style={styles.statusButtons}>
              {ORDER_STATUSES.filter(
                (status) =>
                  status.value !== "cancelled" && status.value !== order?.status
              ).map((status) => (
                <Button
                  key={status.value}
                  mode="contained-tonal"
                  onPress={() => handleStatusUpdate(status.value)}
                  style={styles.statusButton}
                >
                  {status.label}
                </Button>
              ))}
            </View>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showCancelDialog}
          onDismiss={() => setShowCancelDialog(false)}
        >
          <Dialog.Title>Cancel Order</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason for cancellation"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCancelOrder}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
  },
  statusText: {
    fontWeight: "bold",
  },
  activeStatus: {
    color: "#2196F3",
  },
  completedStatus: {
    color: "#4CAF50",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  actionsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    marginTop: 10,
  },
  footer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    marginVertical: 4,
  },
});
