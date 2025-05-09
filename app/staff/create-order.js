"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  Divider,
  ActivityIndicator,
  IconButton,
  Portal,
  Dialog,
  Surface,
  useTheme,
  Avatar,
  TouchableRipple,
  Searchbar,
  Badge,
  Appbar,
} from "react-native-paper";
import { createOrder } from "../../database/orderOperations";
import { getAllMenuItems } from "../../database/menuOperations";
import { formatCurrency } from "../../utils/format";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function CreateOrderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tableId } = useLocalSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAllMenuItems();

      // Validate and process menu items
      const validItems = items.map((item) => ({
        ...item,
        price: Number.parseFloat(item.price) || 0, // Ensure price is a number
        is_available: item.is_available === 1,
      }));

      setMenuItems(validItems);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(items.map((item) => item.category_name)),
      ].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to load menu items:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách món ăn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuantityChange = (itemId, change) => {
    setSelectedItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === itemId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        if (newQuantity <= 0) {
          Alert.alert("Xác nhận", "Bạn có muốn xóa món này khỏi đơn hàng?", [
            {
              text: "Hủy",
              style: "cancel",
            },
            {
              text: "Xóa",
              style: "destructive",
              onPress: () => {
                setSelectedItems(
                  prevItems.filter((item) => item.id !== itemId)
                );
              },
            },
          ]);
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
      }
      if (change > 0) {
        const menuItem = menuItems.find((item) => item.id === itemId);
        if (!menuItem) {
          return prevItems;
        }
        return [
          ...prevItems,
          {
            ...menuItem,
            quantity: 1,
            price: Number.parseFloat(menuItem.price),
          },
        ];
      }
      return prevItems;
    });
  };

  const handleQuickAdd = (itemId) => {
    const existingItem = selectedItems.find((item) => item.id === itemId);
    if (existingItem) {
      handleQuantityChange(itemId, 1);
    } else {
      handleQuantityChange(itemId, 1);
      Alert.alert("Thêm món thành công", "Món đã được thêm vào đơn hàng", [
        { text: "OK" },
      ]);
    }
  };

  const calculateTotal = useCallback(() => {
    return selectedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [selectedItems]);

  const totalItems = useMemo(() => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  }, [selectedItems]);

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một món");
      return;
    }

    try {
      setLoading(true);

      // Validate selected items
      const validItems = selectedItems.filter((item) => {
        return item.id && item.quantity > 0 && item.price > 0;
      });

      if (validItems.length === 0) {
        throw new Error("Không tìm thấy món hợp lệ");
      }

      // Kiểm tra và log các items để debug
      console.log(
        "Selected items before creating order:",
        JSON.stringify(validItems)
      );

      // Create the order
      const orderData = {
        table_id: Number.parseInt(tableId),
        notes: notes.trim(),
        status: "pending",
        items: validItems.map((item) => ({
          menu_item_id: item.id,
          quantity: parseInt(item.quantity, 10), // Đảm bảo số lượng là số nguyên
          notes: "",
          price: Number.parseFloat(item.price),
        })),
      };

      const order = await createOrder(orderData);

      if (!order || !order.id) {
        throw new Error(
          "Tạo đơn hàng thất bại - không có ID đơn hàng được trả về"
        );
      }

      Alert.alert("Thành công", `Đơn hàng #${order.id} đã được tạo`, [
        {
          text: "Xem Đơn Hàng",
          onPress: () => router.push(`/staff/order-details?id=${order.id}`),
        },
        {
          text: "Quay Lại Danh Sách Bàn",
          onPress: () => router.replace("/staff/tables"),
        },
      ]);
    } catch (error) {
      console.error("Failed to create order:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Tạo đơn hàng thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" || item.category_name === selectedCategory;
      return matchesSearch && matchesCategory && item.is_available;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const getColorWithOpacity = (color, opacity = 0.15) => {
    try {
      // Handle theme colors that might be in rgb/rgba format
      if (color.startsWith("rgb")) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${opacity})`;
        }
      }

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

      // Fallback to a default color if parsing fails
      return `rgba(128, 128, 128, ${opacity})`;
    } catch (error) {
      console.warn("Error parsing color:", color, error);
      return `rgba(128, 128, 128, ${opacity})`;
    }
  };

  const renderMenuItem = ({ item }) => {
    const selectedItem = selectedItems.find(
      (selected) => selected.id === item.id
    );
    const quantity = selectedItem ? selectedItem.quantity : 0;

    return (
      <Card
        style={[
          styles.menuItemCard,
          quantity > 0 && {
            borderColor: theme.colors.primary,
            borderWidth: 1,
            backgroundColor: getColorWithOpacity(theme.colors.primary, 0.05),
          },
          !item.is_available && styles.unavailableItem,
        ]}
        mode="elevated"
      >
        <TouchableRipple
          onPress={() => handleViewItem(item)}
          onLongPress={() => handleQuickAdd(item.id)}
          borderless
          disabled={!item.is_available}
        >
          <View>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemImageContainer}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={[
                      styles.menuItemImage,
                      !item.is_available && styles.unavailableImage,
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.menuItemImagePlaceholder,
                      {
                        backgroundColor: getColorWithOpacity(
                          theme.colors.primary,
                          0.1
                        ),
                      },
                      !item.is_available && styles.unavailableImage,
                    ]}
                  >
                    <Avatar.Icon
                      size={40}
                      icon="food"
                      style={{
                        backgroundColor: "transparent",
                      }}
                      color={
                        !item.is_available
                          ? theme.colors.outline
                          : theme.colors.primary
                      }
                    />
                  </View>
                )}
                {item.category_name && (
                  <Chip
                    mode="flat"
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: getColorWithOpacity(
                          theme.colors.primary,
                          0.1
                        ),
                      },
                    ]}
                    textStyle={[
                      styles.categoryChipText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {item.category_name}
                  </Chip>
                )}

                {!item.is_available && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableText}>Hết hàng</Text>
                  </View>
                )}
              </View>

              <View style={styles.menuItemInfo}>
                <View>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.menuItemName,
                      !item.is_available && styles.unavailableText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.menuItemDescription,
                        !item.is_available && styles.unavailableText,
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>

                <View style={styles.menuItemMeta}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.menuItemPrice,
                      {
                        color: !item.is_available
                          ? theme.colors.outline
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {formatCurrency(item.price)}
                  </Text>

                  {item.is_available && (
                    <View style={styles.quantityControlsCompact}>
                      <IconButton
                        icon="minus"
                        mode="contained-tonal"
                        size={16}
                        onPress={() => handleQuantityChange(item.id, -1)}
                        disabled={quantity === 0}
                        style={[
                          styles.quantityButtonCompact,
                          quantity === 0 && styles.quantityButtonDisabled,
                          {
                            backgroundColor:
                              quantity > 0
                                ? getColorWithOpacity(theme.colors.primary)
                                : undefined,
                          },
                        ]}
                        iconColor={theme.colors.primary}
                      />
                      <View style={styles.quantityBadgeCompact}>
                        <Text variant="titleMedium" style={styles.quantityText}>
                          {quantity}
                        </Text>
                      </View>
                      <IconButton
                        icon="plus"
                        mode="contained-tonal"
                        size={16}
                        onPress={() => handleQuantityChange(item.id, 1)}
                        style={[
                          styles.quantityButtonCompact,
                          {
                            backgroundColor: getColorWithOpacity(
                              theme.colors.primary
                            ),
                          },
                        ]}
                        iconColor={theme.colors.primary}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableRipple>
      </Card>
    );
  };

  const renderOrderSummaryDialog = () => (
    <Portal>
      <Dialog
        visible={showOrderSummary}
        onDismiss={() => setShowOrderSummary(false)}
        style={styles.orderSummaryDialog}
      >
        <Dialog.Title style={styles.dialogTitle}>Tạo Đơn Hàng</Dialog.Title>
        <Dialog.ScrollArea style={styles.dialogScrollArea}>
          <ScrollView>
            <View style={styles.orderItemsContainer}>
              {selectedItems.map((item) => (
                <Surface
                  key={item.id}
                  style={styles.orderItemRow}
                  elevation={0}
                >
                  <View style={styles.orderItemInfo}>
                    <Text variant="titleMedium" style={styles.orderItemName}>
                      {item.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.orderItemPrice}>
                      {formatCurrency(item.price)} × {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.orderItemActions}>
                    <IconButton
                      icon="minus"
                      size={16}
                      mode="contained-tonal"
                      onPress={() => handleQuantityChange(item.id, -1)}
                      style={styles.orderItemButton}
                      iconColor={theme.colors.error}
                    />
                    <IconButton
                      icon="plus"
                      size={16}
                      mode="contained-tonal"
                      onPress={() => handleQuantityChange(item.id, 1)}
                      style={styles.orderItemButton}
                      iconColor={theme.colors.primary}
                    />
                    <Text variant="titleMedium" style={styles.orderItemTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                </Surface>
              ))}
            </View>

            <Divider style={styles.summaryDivider} />

            <Surface style={styles.orderTotalRow} elevation={0}>
              <Text variant="titleLarge" style={styles.orderTotalLabel}>
                Tổng cộng:
              </Text>
              <Text
                variant="headlineSmall"
                style={[
                  styles.orderTotalAmount,
                  { color: theme.colors.primary },
                ]}
              >
                {formatCurrency(calculateTotal())}
              </Text>
            </Surface>

            <TextInput
              mode="outlined"
              label="Ghi chú đơn hàng"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
              placeholder="Add special instructions or notes for this order"
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.dialogActions}>
          <Button onPress={() => setShowOrderSummary(false)}>Hủy</Button>
          <Button
            mode="contained"
            onPress={handleCreateOrder}
            disabled={loading || selectedItems.length === 0}
            loading={loading}
            style={styles.createOrderButton}
          >
            Tạo đơn hàng
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderItemDetailsDialog = () => (
    <Portal>
      <Dialog
        visible={showItemDialog}
        onDismiss={() => setShowItemDialog(false)}
        style={styles.itemDetailsDialog}
      >
        <Dialog.Title style={styles.dialogTitle}>
          {selectedItem?.name}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.dialogScrollArea}>
          <ScrollView>
            {selectedItem?.image_url ? (
              <Image
                source={{ uri: selectedItem.image_url }}
                style={styles.itemDetailImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.noImageContainer,
                  {
                    backgroundColor: getColorWithOpacity(
                      theme.colors.primary,
                      0.1
                    ),
                  },
                ]}
              >
                <Avatar.Icon
                  size={80}
                  icon="food"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  color={theme.colors.primary}
                />
              </View>
            )}

            <View style={styles.itemDetailMeta}>
              <Text
                variant="headlineSmall"
                style={[
                  styles.itemDetailPrice,
                  { color: theme.colors.primary },
                ]}
              >
                {formatCurrency(selectedItem?.price)}
              </Text>
              {selectedItem?.category_name && (
                <Chip
                  mode="flat"
                  style={[
                    styles.itemDetailCategory,
                    {
                      backgroundColor: getColorWithOpacity(
                        theme.colors.primary,
                        0.1
                      ),
                    },
                  ]}
                  textStyle={{ color: theme.colors.primary }}
                >
                  {selectedItem.category_name}
                </Chip>
              )}
            </View>

            {selectedItem?.description && (
              <Text variant="bodyLarge" style={styles.itemDetailDescription}>
                {selectedItem.description}
              </Text>
            )}

            {selectedItem?.is_available !== false && (
              <Surface style={styles.itemDetailActions} elevation={0}>
                <Text variant="titleMedium" style={styles.quantityLabel}>
                  Số lượng
                </Text>
                <View style={styles.quantityControlsLarge}>
                  <IconButton
                    icon="minus"
                    mode="contained-tonal"
                    size={28}
                    onPress={() => {
                      if (selectedItem) {
                        handleQuantityChange(selectedItem.id, -1);
                      }
                    }}
                    disabled={
                      !selectedItems.some(
                        (item) => item.id === selectedItem?.id
                      )
                    }
                    style={[
                      styles.quantityButtonLarge,
                      !selectedItems.some(
                        (item) => item.id === selectedItem?.id
                      ) && styles.quantityButtonDisabled,
                      {
                        backgroundColor: selectedItems.some(
                          (item) => item.id === selectedItem?.id
                        )
                          ? getColorWithOpacity(theme.colors.primary)
                          : undefined,
                      },
                    ]}
                    iconColor={theme.colors.primary}
                  />
                  <View style={styles.quantityBadgeLarge}>
                    <Text
                      variant="headlineSmall"
                      style={styles.quantityTextLarge}
                    >
                      {selectedItems.find(
                        (item) => item.id === selectedItem?.id
                      )?.quantity || 0}
                    </Text>
                  </View>
                  <IconButton
                    icon="plus"
                    mode="contained-tonal"
                    size={28}
                    onPress={() => {
                      if (selectedItem) {
                        handleQuantityChange(selectedItem.id, 1);
                      }
                    }}
                    style={[
                      styles.quantityButtonLarge,
                      {
                        backgroundColor: getColorWithOpacity(
                          theme.colors.primary
                        ),
                      },
                    ]}
                    iconColor={theme.colors.primary}
                  />
                </View>
              </Surface>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.dialogActions}>
          <Button onPress={() => setShowItemDialog(false)}>Đóng</Button>
          {selectedItem?.is_available !== false && (
            <Button
              mode="contained"
              onPress={() => {
                if (
                  selectedItem &&
                  !selectedItems.some((item) => item.id === selectedItem.id)
                ) {
                  handleQuantityChange(selectedItem.id, 1);
                }
                setShowItemDialog(false);
              }}
              disabled={selectedItems.some(
                (item) => item.id === selectedItem?.id
              )}
              style={styles.addToOrderButton}
            >
              Thêm vào đơn hàng
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Tạo Đơn Hàng" subtitle={`Bàn #${tableId}`} />
        <Appbar.Action icon="refresh" onPress={loadMenuItems} />
        {selectedItems.length > 0 && (
          <View>
            <Appbar.Action
              icon="cart"
              onPress={() => setShowOrderSummary(true)}
              color={theme.colors.primary}
            />
            <Badge
              visible={selectedItems.length > 0}
              size={16}
              style={[
                styles.appbarBadge,
                { backgroundColor: theme.colors.error },
              ]}
            >
              {totalItems}
            </Badge>
          </View>
        )}
      </Appbar.Header>

      <View style={styles.filterHeader}>
        <Searchbar
          placeholder="Tìm kiếm món ăn..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          iconColor={theme.colors.outline}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <Chip
            selected={selectedCategory === "all"}
            onPress={() => setSelectedCategory("all")}
            style={[
              styles.categoryChip,
              selectedCategory === "all" && {
                backgroundColor: getColorWithOpacity(theme.colors.primary),
              },
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === "all" && {
                color: theme.colors.primary,
                fontWeight: "600",
              },
            ]}
          >
            Tất Cả
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && {
                  backgroundColor: getColorWithOpacity(theme.colors.primary),
                },
              ]}
              textStyle={[
                styles.categoryChipText,
                selectedCategory === category && {
                  color: theme.colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Đang tải danh sách món...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.menuList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? "grid" : "list"}
            columnWrapperStyle={isTablet ? styles.gridRow : undefined}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconButton
                  icon="food-off"
                  size={80}
                  iconColor={theme.colors.outlineVariant}
                />
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  Không tìm thấy món ăn
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Hãy thử tìm kiếm hoặc chọn danh mục khác
                </Text>
                <Button
                  mode="contained"
                  icon="refresh"
                  onPress={loadMenuItems}
                  style={styles.refreshButton}
                >
                  Tải Lại
                </Button>
              </View>
            }
          />
        )}
      </View>

      {selectedItems.length > 0 && (
        <Surface style={styles.orderSummaryBar} elevation={4}>
          <View style={styles.orderSummaryContent}>
            <View style={styles.orderTotalInfo}>
              <Text variant="labelMedium" style={styles.orderTotalLabel}>
                Tổng cộng:
              </Text>
              <Text
                variant="titleLarge"
                style={[
                  styles.orderTotalAmount,
                  { color: theme.colors.primary },
                ]}
              >
                {formatCurrency(calculateTotal())}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowOrderSummary(true)}
              icon="cart-check"
              style={styles.createOrderButton}
              contentStyle={styles.createOrderButtonContent}
            >
              Tạo Đơn Hàng
            </Button>
          </View>
        </Surface>
      )}

      {renderOrderSummaryDialog()}
      {renderItemDetailsDialog()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarHeader: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appbarBadge: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  filterHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
  },
  searchInput: {
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 48,
    marginBottom: 8,
  },
  categoryScrollContainer: {
    marginBottom: 8,
    height: 48,
  },
  categoryScroll: {
    backgroundColor: "#fff",
    maxHeight: 48,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    marginRight: 8,
    height: 32,
  },
  categoryChipText: {
    fontSize: 13,
  },
  menuList: {
    padding: 16,
    paddingBottom: 80, // Space for the bottom bar
  },
  gridRow: {
    justifyContent: "space-between",
  },
  menuItemCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 0,
    elevation: 1,
    flex: isTablet ? 0.48 : 1,
    marginHorizontal: isTablet ? 4 : 0,
  },
  unavailableItem: {
    opacity: 0.7,
    backgroundColor: "#F5F5F5",
  },
  unavailableImage: {
    opacity: 0.5,
  },
  unavailableBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    alignItems: "center",
  },
  unavailableText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuItemContent: {
    padding: 12,
    flexDirection: "row",
  },
  menuItemImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  menuItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  menuItemName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  menuItemDescription: {
    color: "#666",
    fontSize: 13,
    marginBottom: 8,
  },
  menuItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemPrice: {
    fontWeight: "700",
  },
  quantityControlsCompact: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButtonCompact: {
    margin: 0,
    borderRadius: 6,
    width: 24,
    height: 24,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityBadgeCompact: {
    width: 24,
    alignItems: "center",
  },
  quantityText: {
    fontWeight: "600",
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
  },
  emptyTitle: {
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    borderRadius: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 16,
    color: "#666",
  },
  orderSummaryBar: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderSummaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderTotalInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderTotalLabel: {
    color: "#666",
    marginBottom: 4,
  },
  orderTotalAmount: {
    fontWeight: "bold",
  },
  orderTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  createOrderButton: {
    borderRadius: 8,
  },
  createOrderButtonContent: {
    height: 48,
  },
  orderSummaryDialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: "center",
    fontWeight: "700",
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogActions: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  addToOrderButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  orderItemsContainer: {
    paddingHorizontal: 24,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontWeight: "600",
  },
  orderItemPrice: {
    color: "#666",
  },
  orderItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderItemButton: {
    margin: 0,
    marginRight: 4,
  },
  orderItemTotal: {
    fontWeight: "700",
    marginLeft: 8,
  },
  summaryDivider: {
    marginVertical: 16,
  },
  notesInput: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  itemDetailsDialog: {
    borderRadius: 16,
  },
  itemDetailImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  noImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetailMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  itemDetailPrice: {
    fontWeight: "700",
  },
  itemDetailCategory: {
    height: 36,
    borderRadius: 18,
  },
  itemDetailDescription: {
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  itemDetailActions: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  quantityLabel: {
    marginBottom: 12,
    fontWeight: "600",
  },
  quantityControlsLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonLarge: {
    margin: 0,
    borderRadius: 12,
  },
  quantityBadgeLarge: {
    width: 60,
    alignItems: "center",
  },
  quantityTextLarge: {
    fontWeight: "700",
  },
});
