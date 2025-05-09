"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import {
  Surface,
  Text,
  Button,
  Appbar,
  Card,
  ActivityIndicator,
  Chip,
  Portal,
  Dialog,
  TextInput,
  IconButton,
  useTheme,
  Badge,
  Divider,
  Avatar,
  TouchableRipple,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../../database/orderOperations";
import { updateTableStatus } from "../../database/tableOperations";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

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

const ORDER_STATUSES = [
  { label: "Chờ Xử Lý", value: "pending", icon: "clock-outline" },
  { label: "Đang Chế Biến", value: "preparing", icon: "food" },
  { label: "Sẵn Sàng", value: "ready", icon: "check-circle-outline" },
  { label: "Hoàn Thành", value: "completed", icon: "check-circle" },
  { label: "Đã Hủy", value: "cancelled", icon: "close-circle" },
];

export default function OrderDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
    // Refresh order details every 30 seconds
    const interval = setInterval(loadOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await getOrderById(Number.parseInt(id));
      if (!orderData) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Xóa log items cũ và thêm log thông tin nhân viên
      console.log(
        "Thông tin đơn hàng:",
        `#${orderData.id} - Bàn: ${orderData.table_name}`
      );
      console.log("Nhân viên phụ trách:", orderData.staff_name);
      console.log("Trạng thái:", orderData.status);
      console.log(
        "Thời gian tạo:",
        new Date(orderData.created_at).toLocaleString()
      );
      console.log("Tổng tiền:", orderData.total_amount.toLocaleString(), "đ");

      setOrder(orderData);
    } catch (error) {
      console.error("Failed to load order:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrder();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFC107"; // Amber
      case "preparing":
        return "#2196F3"; // Blue
      case "ready":
        return "#4CAF50"; // Green
      case "completed":
        return "#009688"; // Teal
      case "cancelled":
        return "#F44336"; // Red
      default:
        return "#757575"; // Grey
    }
  };

  const getStatusIcon = (status) => {
    const statusObj = ORDER_STATUSES.find((s) => s.value === status);
    return statusObj ? statusObj.icon : "help-circle";
  };

  const getStatusLabel = (status) => {
    const statusObj = ORDER_STATUSES.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const renderOrderItem = ({ item }) => (
    <Surface style={styles.orderItem} elevation={1}>
      <View style={styles.orderItemHeader}>
        <View style={styles.orderItemTitleContainer}>
          <Text variant="titleMedium" style={styles.orderItemName}>
            {item.name}
          </Text>
          {item.notes && (
            <Chip
              icon="note-text"
              style={{
                backgroundColor: getColorWithOpacity("#9C27B0", 0.1),
                height: 24,
                marginTop: 2,
              }}
              textStyle={{ color: "#9C27B0", fontSize: 12 }}
            >
              Ghi chú
            </Chip>
          )}
        </View>
        <Badge
          style={[
            styles.quantityBadge,
            { backgroundColor: theme.colors.primary },
          ]}
          size={24}
        >
          {item.quantity}
        </Badge>
      </View>

      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.orderItemImage}
          resizeMode="cover"
        />
      )}

      {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}

      <View style={styles.orderItemFooter}>
        <Text variant="bodyMedium" style={styles.orderItemPrice}>
          {item.price.toLocaleString()} đ/món
        </Text>
        <Text variant="titleMedium" style={styles.itemTotal}>
          {(item.price * item.quantity).toLocaleString()} đ
        </Text>
      </View>
    </Surface>
  );

  // Hàm cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (newStatus) => {
    if (order.status === newStatus || statusUpdating) return;
    // Không cho phép chuyển về trạng thái trước hoặc sang cancelled
    const currentIndex = ORDER_STATUSES.findIndex(
      (s) => s.value === order.status
    );
    const newIndex = ORDER_STATUSES.findIndex((s) => s.value === newStatus);
    if (newIndex <= currentIndex || newStatus === "cancelled") return;
    try {
      setStatusUpdating(true);
      await updateOrderStatus(order.id, newStatus);
      await loadOrder();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <IconButton
          icon="alert-circle"
          size={64}
          iconColor={theme.colors.error}
        />
        <Text variant="headlineSmall" style={styles.errorTitle}>
          Không Tìm Thấy Đơn Hàng
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          Quay Lại
        </Button>
      </View>
    );
  }

  const renderStatusTimeline = () => {
    const statusIndex = ORDER_STATUSES.findIndex(
      (s) => s.value === order.status
    );

    return (
      <Card style={styles.timelineCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.timelineTitle}>
            Tiến Trình Đơn Hàng
          </Text>
          <View style={styles.timeline}>
            {ORDER_STATUSES.filter(
              (status) => status.value !== "cancelled"
            ).map((status, index) => {
              const isActive =
                ORDER_STATUSES.findIndex((s) => s.value === order.status) >=
                index;
              const isCurrentStatus = order.status === status.value;

              // Tính toán màu sắc
              const backgroundColor = isActive
                ? getColorWithOpacity(
                    getStatusColor(status.value),
                    isCurrentStatus ? 1 : 0.7
                  )
                : "#e0e0e0";

              const borderColor = isActive
                ? getStatusColor(status.value)
                : "#bdbdbd";

              const lineColor =
                ORDER_STATUSES.findIndex((s) => s.value === order.status) >
                index
                  ? getStatusColor(status.value)
                  : "#e0e0e0";

              return (
                <View key={status.value} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <TouchableRipple
                      onPress={() => handleUpdateStatus(status.value)}
                      disabled={
                        statusUpdating ||
                        isCurrentStatus ||
                        ORDER_STATUSES.findIndex(
                          (s) => s.value === status.value
                        ) <= statusIndex
                      }
                      borderless
                      style={{ borderRadius: 16 }}
                      rippleColor={getColorWithOpacity(
                        getStatusColor(status.value),
                        0.3
                      )}
                    >
                      <View
                        style={[
                          styles.timelineIcon,
                          {
                            backgroundColor: backgroundColor,
                            borderColor: borderColor,
                          },
                        ]}
                      >
                        <IconButton
                          icon={status.icon}
                          size={16}
                          iconColor={isActive ? "#fff" : "#9e9e9e"}
                          style={styles.timelineIconButton}
                        />
                      </View>
                    </TouchableRipple>
                    {index < ORDER_STATUSES.length - 2 && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor: lineColor,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.timelineStatusText,
                        isCurrentStatus && {
                          fontWeight: "bold",
                          color: getStatusColor(status.value),
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                    {isCurrentStatus && order.status_updated_at && (
                      <Text variant="bodySmall" style={styles.timelineTime}>
                        {new Date(order.status_updated_at).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={`Đơn Hàng #${order.id}`}
          subtitle={`Bàn: ${order.table_name}`}
        />
        <Appbar.Action icon="refresh" onPress={loadOrder} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Surface style={styles.statusBanner} elevation={2}>
          <View style={styles.statusContainer}>
            <Avatar.Icon
              size={48}
              icon={getStatusIcon(order.status)}
              style={{
                backgroundColor: getColorWithOpacity(
                  getStatusColor(order.status),
                  0.15
                ),
              }}
              color={getStatusColor(order.status)}
            />
            <View style={styles.statusTextContainer}>
              <Text variant="labelMedium" style={styles.statusLabel}>
                Trạng Thái
              </Text>
              <Text
                variant="titleMedium"
                style={[
                  styles.statusText,
                  {
                    color: getStatusColor(order.status),
                  },
                ]}
              >
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          <Divider style={styles.statusDivider} />

          <View style={styles.orderMetaContainer}>
            <View style={styles.orderMetaItem}>
              <IconButton
                icon="clock-outline"
                size={20}
                style={styles.metaIcon}
                iconColor={theme.colors.primary}
              />
              <View>
                <Text variant="labelMedium" style={styles.metaLabel}>
                  Ngày Tạo
                </Text>
                <Text variant="bodyMedium" style={styles.metaValue}>
                  {new Date(order.created_at).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.orderMetaItem}>
              <IconButton
                icon="account"
                size={20}
                style={styles.metaIcon}
                iconColor={theme.colors.primary}
              />
              <View>
                <Text variant="labelMedium" style={styles.metaLabel}>
                  Nhân Viên
                </Text>
                <Text variant="bodyMedium" style={styles.metaValue}>
                  {order.staff_name || "Không xác định"}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {renderStatusTimeline()}

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Danh Sách Món
            </Text>
            <Chip
              icon="food"
              style={{
                backgroundColor: getColorWithOpacity("#4CAF50", 0.15),
              }}
            >
              {order.items.length} món
            </Chip>
          </View>

          {isTablet ? (
            <View style={styles.gridContainer}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  {renderOrderItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={order.items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOrderItem}
              ItemSeparatorComponent={() => (
                <View style={styles.itemSeparator} />
              )}
              contentContainerStyle={styles.itemsList}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyItemsContainer}>
                  <IconButton
                    icon="food-off"
                    size={48}
                    iconColor={theme.colors.outline}
                  />
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    Không có món ăn nào trong đơn hàng này
                  </Text>
                </View>
              }
            />
          )}

          {order.notes && (
            <Card style={styles.notesCard}>
              <Card.Content>
                <View style={styles.notesHeader}>
                  <IconButton
                    icon="note-text-outline"
                    size={20}
                    iconColor={theme.colors.primary}
                  />
                  <Text variant="titleMedium" style={styles.notesLabel}>
                    Ghi Chú Đơn Hàng
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.notesText}>
                  {order.notes}
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      <Surface style={styles.footer} elevation={4}>
        <View style={styles.footerContent}>
          <TouchableRipple style={styles.totalContainer} onPress={() => {}}>
            <View style={styles.totalInnerContainer}>
              <View>
                <Text variant="labelMedium" style={styles.totalLabelSmall}>
                  Tổng Tiền
                </Text>
                <Text
                  variant="headlineMedium"
                  style={[styles.totalAmount, { color: theme.colors.primary }]}
                >
                  {order.total_amount.toLocaleString()} đ
                </Text>
              </View>
              <IconButton
                icon="receipt"
                size={24}
                iconColor={theme.colors.primary}
              />
            </View>
          </TouchableRipple>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  appbar: {
    elevation: 0,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  errorButton: {
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  statusBanner: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    color: "#666",
    marginBottom: 2,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 18,
  },
  statusDivider: {
    marginVertical: 16,
  },
  orderMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderMetaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    margin: 0,
    marginRight: 8,
  },
  metaLabel: {
    color: "#666",
    marginBottom: 2,
  },
  metaValue: {
    fontWeight: "500",
  },
  timelineCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
  },
  timelineTitle: {
    fontWeight: "700",
    marginBottom: 16,
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIconContainer: {
    alignItems: "center",
    width: 24,
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  timelineIconButton: {
    margin: 0,
    padding: 0,
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 15,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineStatusText: {
    fontWeight: "500",
  },
  timelineTime: {
    color: "#666",
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra space for footer
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  itemCountChip: {
    backgroundColor: "rgba(76, 175, 80, 0.15)", // Hardcoded color thay vì dùng getColorWithOpacity
  },
  itemsList: {
    paddingBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  orderItem: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: isTablet ? 0 : 12,
  },
  orderItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderItemTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  orderItemName: {
    fontWeight: "600",
    marginRight: 8,
  },
  orderItemImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteChip: {
    height: 24,
    marginTop: 2,
  },
  quantityBadge: {
    marginLeft: 8,
  },
  itemNotes: {
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
    fontSize: 14,
  },
  orderItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  orderItemPrice: {
    color: "#666",
  },
  itemTotal: {
    fontWeight: "700",
  },
  itemSeparator: {
    height: 12,
  },
  emptyItemsContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    color: "#666",
    marginTop: 8,
  },
  notesCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notesLabel: {
    fontWeight: "600",
  },
  notesText: {
    color: "#555",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerContent: {
    padding: 16,
  },
  totalContainer: {
    borderRadius: 12,
    backgroundColor: "rgba(245, 245, 245, 0.5)", // Hardcoded color thay vì dùng getColorWithOpacity
    padding: 8,
    marginBottom: 16,
  },
  totalInnerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabelSmall: {
    color: "#666",
  },
  totalAmount: {
    fontWeight: "700",
  },
});
