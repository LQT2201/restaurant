import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  ScrollView,
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
  List,
  Surface,
  useTheme,
  Avatar,
  Badge,
  TouchableRipple,
  Searchbar,
  FAB,
} from "react-native-paper";
import { createOrder, addOrderItems } from "../../database/orderOperations";
import { updateTableStatus } from "../../database/tableOperations";
import { getAllMenuItems } from "../../database/menuOperations";
import { formatCurrency } from "../../utils/format";

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

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAllMenuItems();
      console.log("Menu items data:", {
        totalItems: items.length,
        sampleItem: items[0],
        imageUrls: items.map((item) => ({
          id: item.id,
          name: item.name,
          image_url: item.image_url,
          hasImage: !!item.image_url,
          imageType: item.image_url ? typeof item.image_url : "none",
          price: item.price,
          priceType: typeof item.price,
        })),
      });

      // Validate and process menu items
      const validItems = items.map((item) => ({
        ...item,
        price: parseFloat(item.price) || 0, // Ensure price is a number
        is_available: item.is_available === 1,
      }));

      setMenuItems(validItems);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(items.map((item) => item.category_name)),
      ].filter(Boolean);
      console.log("Categories found:", uniqueCategories);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to load menu items:", error);
      Alert.alert("Error", "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, change) => {
    setSelectedItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === itemId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        if (newQuantity <= 0) {
          console.log("Removing item:", existingItem);
          return prevItems.filter((item) => item.id !== itemId);
        }
        const updatedItem = { ...existingItem, quantity: newQuantity };
        console.log("Updating item quantity:", updatedItem);
        return prevItems.map((item) =>
          item.id === itemId ? updatedItem : item
        );
      }
      if (change > 0) {
        const menuItem = menuItems.find((item) => item.id === itemId);
        if (!menuItem) {
          console.error("Menu item not found:", itemId);
          return prevItems;
        }
        const newItem = {
          ...menuItem,
          quantity: 1,
          price: parseFloat(menuItem.price), // Ensure price is a number
        };
        console.log("Adding new item:", newItem);
        return [...prevItems, newItem];
      }
      return prevItems;
    });
  };

  const calculateTotal = () => {
    return selectedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item");
      return;
    }

    try {
      setLoading(true);
      console.log("Creating order with items:", selectedItems);

      // Validate selected items
      const validItems = selectedItems.filter((item) => {
        const isValid = item.id && item.quantity > 0 && item.price > 0;
        if (!isValid) {
          console.warn("Invalid item found:", item);
        }
        return isValid;
      });

      if (validItems.length === 0) {
        throw new Error("No valid menu items found");
      }

      // Create the order
      const orderData = {
        table_id: parseInt(tableId),
        notes: notes.trim(),
        status: "pending",
        items: validItems.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: "",
          price: item.price,
        })),
      };

      console.log("Order data to be created:", orderData);
      const order = await createOrder(orderData);

      if (!order || !order.id) {
        throw new Error("Failed to create order - no order ID returned");
      }

      Alert.alert("Success", `Order #${order.id} created successfully`, [
        {
          text: "View Order",
          onPress: () => router.push(`/staff/order-details?id=${order.id}`),
        },
        {
          text: "Back to Tables",
          onPress: () => router.replace("/staff/tables"),
        },
      ]);
    } catch (error) {
      console.error("Failed to create order:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderMenuItem = ({ item }) => {
    const selectedItem = selectedItems.find(
      (selected) => selected.id === item.id
    );
    const quantity = selectedItem ? selectedItem.quantity : 0;

    return (
      <Card style={styles.menuItemCard}>
        <TouchableRipple onPress={() => handleViewItem(item)}>
          <View>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.menuItemMeta}>
                  <Text
                    style={[
                      styles.menuItemPrice,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {formatCurrency(item.price)}
                  </Text>
                  {item.category_name && (
                    <Chip
                      mode="outlined"
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {item.category_name}
                    </Chip>
                  )}
                </View>
              </View>

              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.menuItemImage}
                  resizeMode="cover"
                />
              ) : (
                <Avatar.Icon
                  size={60}
                  icon="food"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                  color={theme.colors.primary}
                />
              )}
            </View>

            <Divider />

            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={20}
                onPress={() => handleQuantityChange(item.id, -1)}
                disabled={quantity === 0}
                style={[
                  styles.quantityButton,
                  quantity === 0 && styles.quantityButtonDisabled,
                ]}
              />
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={20}
                onPress={() => handleQuantityChange(item.id, 1)}
                style={styles.quantityButton}
              />
            </View>
          </View>
        </TouchableRipple>
      </Card>
    );
  };

  const renderCategoryChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryChipsContainer}
    >
      <Chip
        selected={selectedCategory === "all"}
        onPress={() => setSelectedCategory("all")}
        style={styles.categoryFilterChip}
        textStyle={styles.categoryFilterChipText}
        showSelectedOverlay
      >
        All
      </Chip>

      {categories.map((category) => (
        <Chip
          key={category}
          selected={selectedCategory === category}
          onPress={() => setSelectedCategory(category)}
          style={styles.categoryFilterChip}
          textStyle={styles.categoryFilterChipText}
          showSelectedOverlay
        >
          {category}
        </Chip>
      ))}
    </ScrollView>
  );

  const renderOrderSummaryDialog = () => (
    <Portal>
      <Dialog
        visible={showOrderSummary}
        onDismiss={() => setShowOrderSummary(false)}
        style={styles.orderSummaryDialog}
      >
        <Dialog.Title>Order Summary</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.orderItemsContainer}>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.orderItemRow}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.orderItemTotal}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Divider style={styles.summaryDivider} />

          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalAmount}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Order Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowOrderSummary(false)}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleCreateOrder}
            disabled={loading || selectedItems.length === 0}
          >
            Create Order
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
        <Dialog.Title>{selectedItem?.name}</Dialog.Title>
        <Dialog.Content>
          {selectedItem?.image_url ? (
            <Image
              source={{ uri: selectedItem.image_url }}
              style={styles.itemDetailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Avatar.Icon
                size={80}
                icon="food"
                style={{ backgroundColor: `${theme.colors.primary}20` }}
                color={theme.colors.primary}
              />
            </View>
          )}

          <View style={styles.itemDetailMeta}>
            <Text
              style={[styles.itemDetailPrice, { color: theme.colors.primary }]}
            >
              {formatCurrency(selectedItem?.price)}
            </Text>
            {selectedItem?.category_name && (
              <Chip mode="outlined" style={styles.itemDetailCategory}>
                {selectedItem.category_name}
              </Chip>
            )}
          </View>

          {selectedItem?.description && (
            <Text style={styles.itemDetailDescription}>
              {selectedItem.description}
            </Text>
          )}

          <View style={styles.itemDetailActions}>
            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={24}
                onPress={() => {
                  if (selectedItem) {
                    handleQuantityChange(selectedItem.id, -1);
                  }
                }}
                disabled={
                  !selectedItems.some((item) => item.id === selectedItem?.id)
                }
                style={styles.quantityButton}
              />
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>
                  {selectedItems.find((item) => item.id === selectedItem?.id)
                    ?.quantity || 0}
                </Text>
              </View>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={24}
                onPress={() => {
                  if (selectedItem) {
                    handleQuantityChange(selectedItem.id, 1);
                  }
                }}
                style={styles.quantityButton}
              />
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowItemDialog(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Searchbar
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          iconColor={theme.colors.outline}
        />
      </View>

      {renderCategoryChips()}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading menu items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.menuList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton
                icon="food-off"
                size={80}
                iconColor={theme.colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>No menu items found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or category filter
              </Text>
            </View>
          }
        />
      )}

      {selectedItems.length > 0 && (
        <View style={styles.orderSummaryBar}>
          <View style={styles.orderSummaryInfo}>
            <Text style={styles.orderItemCount}>
              {selectedItems.reduce((total, item) => total + item.quantity, 0)}{" "}
              items
            </Text>
            <Text style={styles.orderTotalPreview}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => setShowOrderSummary(true)}
            icon="cart-check"
          >
            Review Order
          </Button>
        </View>
      )}

      {renderOrderSummaryDialog()}
      {renderItemDetailsDialog()}
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
    paddingBottom: 8,
  },
  searchInput: {
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  categoryChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryChip: {
    height: 24,
    marginRight: 8,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryChipText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  categoryFilterChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryFilterChipText: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
  menuList: {
    padding: 16,
  },
  menuItemCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 0,
  },
  menuItemContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  menuItemDescription: {
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
  },
  menuItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  quantityButton: {
    margin: 0,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityBadge: {
    width: 40,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 4,
  },
  orderSummaryInfo: {
    flex: 1,
  },
  orderItemCount: {
    fontSize: 14,
    color: "#666",
  },
  orderTotalPreview: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderSummaryDialog: {
    borderRadius: 12,
  },
  orderItemsContainer: {
    maxHeight: 300,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderItemPrice: {
    fontSize: 12,
    color: "#666",
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryDivider: {
    marginVertical: 16,
  },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderTotalAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  notesInput: {
    marginTop: 8,
  },
  itemDetailsDialog: {
    borderRadius: 12,
  },
  itemDetailImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  noImageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetailMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetailPrice: {
    fontSize: 20,
    fontWeight: "bold",
  },
  itemDetailCategory: {
    height: 30,
  },
  itemDetailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  itemDetailActions: {
    alignItems: "center",
  },
});
