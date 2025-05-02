import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Surface,
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
} from "react-native-paper";
import { addOrderItems } from "../../database/orderOperations";
import { getAllMenuItems } from "../../database/menuOperations";
import { formatCurrency } from "../../utils/format";

export default function AddItemsScreen() {
  const router = useRouter();
  const { orderId, tableId, tableName } = useLocalSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

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
        })),
      });
      setMenuItems(items);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(items.map((item) => item.category_name)),
      ];
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
          return prevItems.filter((item) => item.id !== itemId);
        }
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
      }
      if (change > 0) {
        const menuItem = menuItems.find((item) => item.id === itemId);
        return [...prevItems, { ...menuItem, quantity: 1 }];
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

  const handleAddItems = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item");
      return;
    }

    try {
      setLoading(true);

      // Add order items
      const orderItems = selectedItems.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        notes: "",
        price: item.price,
      }));

      const result = await addOrderItems(parseInt(orderId), orderItems);

      if (!result) {
        throw new Error("Failed to add items - no response from server");
      }

      Alert.alert(
        "Success",
        `Added ${result.items_added} items to order\nTotal: ${formatCurrency(
          result.new_total
        )}`,
        [
          {
            text: "View Order",
            onPress: () => router.push(`/staff/order-details?id=${orderId}`),
          },
          {
            text: "Add More Items",
            onPress: () => {
              setSelectedItems([]);
              setSearchQuery("");
              setSelectedCategory("all");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to add items:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to add items to order. Please try again."
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
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderCategorySection = ({ item: category }) => {
    const categoryItems = filteredItems.filter(
      (item) => item.category_name === category
    );

    if (categoryItems.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {categoryItems.map((item) => {
          const selectedItem = selectedItems.find(
            (selected) => selected.id === item.id
          );
          const quantity = selectedItem ? selectedItem.quantity : 0;

          return (
            <Surface key={item.id} style={styles.menuItem} elevation={1}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.menuItemPrice}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <IconButton
                    icon="information"
                    size={20}
                    onPress={() => handleViewItem(item)}
                  />
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => handleQuantityChange(item.id, -1)}
                    disabled={quantity === 0}
                  />
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => handleQuantityChange(item.id, 1)}
                  />
                </View>
              </View>
            </Surface>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>Add Items to Order</Text>
        <Text style={styles.headerSubtitle}>Table {tableName}</Text>
      </Surface>

      <View style={styles.searchHeader}>
        <TextInput
          mode="outlined"
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Button
          mode="contained-tonal"
          onPress={() => setShowCategoryDialog(true)}
        >
          {selectedCategory === "all" ? "All Categories" : selectedCategory}
        </Button>
      </View>

      <FlatList
        data={selectedCategory === "all" ? categories : [selectedCategory]}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.menuList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text>No menu items found</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" style={styles.loader} />
          )
        }
      />

      <Surface style={styles.footer} elevation={4}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: {formatCurrency(calculateTotal())}
          </Text>
          <Button
            mode="contained"
            onPress={handleAddItems}
            disabled={loading || selectedItems.length === 0}
          >
            Add to Order
          </Button>
        </View>
      </Surface>

      <Portal>
        <Dialog
          visible={showCategoryDialog}
          onDismiss={() => setShowCategoryDialog(false)}
        >
          <Dialog.Title>Select Category</Dialog.Title>
          <Dialog.Content>
            <List.Item
              key="all-categories"
              title="All Categories"
              onPress={() => {
                setSelectedCategory("all");
                setShowCategoryDialog(false);
              }}
            />
            <Divider key="divider" />
            {categories.map((category, index) => (
              <List.Item
                key={`category-${index}-${category}`}
                title={category}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryDialog(false);
                }}
              />
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={showItemDialog}
          onDismiss={() => setShowItemDialog(false)}
          style={styles.itemDialog}
        >
          <Dialog.Title>{selectedItem?.name}</Dialog.Title>
          <Dialog.Content>
            {selectedItem?.image_url ? (
              <Image
                source={{ uri: selectedItem.image_url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
            <Text style={styles.itemDescription}>
              {selectedItem?.description}
            </Text>
            <Text style={styles.itemPrice}>
              Price: {formatCurrency(selectedItem?.price)}
            </Text>
            <Chip style={styles.itemCategory}>
              {selectedItem?.category_name}
            </Chip>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowItemDialog(false)}>Close</Button>
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
  header: {
    padding: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  searchHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  menuList: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1976D2",
  },
  menuItem: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  menuItemContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: "center",
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  itemDialog: {
    maxWidth: 500,
    width: "90%",
  },
  itemImage: {
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
  noImageText: {
    color: "#666",
    fontSize: 16,
  },
  itemDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  itemCategory: {
    alignSelf: "flex-start",
  },
});
