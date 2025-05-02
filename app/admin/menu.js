import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Surface,
  Text,
  Button,
  FAB,
  Dialog,
  Portal,
  TextInput,
  IconButton,
  Divider,
  Switch,
  Chip,
  Avatar,
  useTheme,
} from "react-native-paper";
import {
  getAllMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../database/menuOperations";

export default function MenuScreen() {
  const theme = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState(null);
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [filterCategory, setFilterCategory] = useState(null);

  // Categories for demo - replace with your actual categories
  const categories = [
    { id: 1, name: "Appetizers" },
    { id: 2, name: "Main Course" },
    { id: 3, name: "Desserts" },
    { id: 4, name: "Beverages" },
  ];

  // Load menu items on component mount
  useEffect(() => {
    loadMenuItems();
  }, []);

  // Load menu items from database
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const data = await getAllMenuItems();
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to load menu items:", error);
      Alert.alert("Error", "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new menu item
  const handleAddMenuItem = async () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      Alert.alert("Error", "Please enter both name and price");
      return;
    }

    // Validate price as a number
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    try {
      const menuItemData = {
        name: itemName.trim(),
        price: price,
        description: itemDescription.trim(),
        category_id: itemCategory,
        image_url: itemImageUrl.trim(),
        is_available: itemAvailable ? 1 : 0,
      };

      await addMenuItem(menuItemData);
      Alert.alert("Success", "Menu item added successfully");
      setDialogVisible(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error("Failed to add menu item:", error);
      Alert.alert("Error", error.message || "Failed to add menu item");
    }
  };

  // Handle updating a menu item
  const handleUpdateMenuItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !editingItem) {
      Alert.alert("Error", "Please enter both name and price");
      return;
    }

    // Validate price as a number
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    try {
      const menuItemData = {
        name: itemName.trim(),
        price: price,
        description: itemDescription.trim(),
        category_id: itemCategory,
        image_url: itemImageUrl.trim(),
        is_available: itemAvailable ? 1 : 0,
      };

      await updateMenuItem(editingItem.id, menuItemData);
      Alert.alert("Success", "Menu item updated successfully");
      setDialogVisible(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error("Failed to update menu item:", error);
      Alert.alert("Error", error.message || "Failed to update menu item");
    }
  };

  // Handle deleting a menu item
  const handleDeleteMenuItem = (itemId, itemName) => {
    Alert.alert(
      "Delete Menu Item",
      `Are you sure you want to delete ${itemName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuItem(itemId);
              Alert.alert("Success", "Menu item deleted successfully");
              loadMenuItems();
            } catch (error) {
              console.error("Failed to delete menu item:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete menu item"
              );
            }
          },
        },
      ]
    );
  };

  // Reset form fields
  const resetForm = () => {
    setItemName("");
    setItemPrice("");
    setItemDescription("");
    setItemCategory(null);
    setItemImageUrl("");
    setItemAvailable(true);
    setEditingItem(null);
  };

  // Open dialog for adding a new menu item
  const openAddDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  // Open dialog for editing a menu item
  const openEditDialog = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemDescription(item.description || "");
    setItemCategory(item.category_id);
    setItemImageUrl(item.image_url || "");
    setItemAvailable(item.is_available === 1);
    setDialogVisible(true);
  };

  // Get category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Filter menu items by category
  const filteredMenuItems = filterCategory
    ? menuItems.filter((item) => item.category_id === filterCategory)
    : menuItems;

  // Render a menu item
  const renderMenuItem = ({ item }) => (
    <Surface style={styles.menuItem} elevation={2}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemHeader}>
          <View>
            <Text style={styles.menuItemName}>{item.name}</Text>
            {/* Fixed category chip */}
            <View style={styles.categoryChipContainer}>
              <Text style={styles.categoryChipText}>
                {getCategoryName(item.category_id)}
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
            {/* Fixed availability chip */}
            <View
              style={[
                styles.availabilityChip,
                {
                  backgroundColor: item.is_available
                    ? "rgba(98, 0, 238, 0.1)"
                    : "rgba(176, 0, 32, 0.1)",
                },
              ]}
            >
              <Text
                style={{
                  color: item.is_available
                    ? theme.colors.primary
                    : theme.colors.error,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.menuItemImage}
            resizeMode="cover"
          />
        ) : null}

        {item.description ? (
          <Text numberOfLines={2} style={styles.menuItemDescription}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.menuItemActions}>
        <IconButton
          icon="pencil"
          iconColor={theme.colors.primary}
          size={20}
          mode="contained"
          containerColor="rgba(98, 0, 238, 0.1)"
          onPress={() => openEditDialog(item)}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          size={20}
          mode="contained"
          containerColor="rgba(176, 0, 32, 0.1)"
          onPress={() => handleDeleteMenuItem(item.id, item.name)}
        />
      </View>
    </Surface>
  );

  // Render category filter
  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterCategory === null && styles.activeFilterChip,
          ]}
          onPress={() => setFilterCategory(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              filterCategory === null && styles.activeFilterChipText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterChip,
              filterCategory === category.id && styles.activeFilterChip,
            ]}
            onPress={() => setFilterCategory(category.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterCategory === category.id && styles.activeFilterChipText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render header with title and stats
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Menu Management</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{menuItems.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {menuItems.filter((item) => item.is_available === 1).length}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderCategoryFilter()}

      <FlatList
        data={filteredMenuItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenuItem}
        refreshing={loading}
        onRefresh={loadMenuItems}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/5445/5445197.png",
                }}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>No menu items found</Text>
              <Text style={styles.emptySubtitle}>
                Add an item to get started!
              </Text>
              <Button
                mode="contained"
                style={styles.emptyButton}
                onPress={openAddDialog}
              >
                Add First Item
              </Button>
            </View>
          ) : null
        }
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color="#fff"
        onPress={openAddDialog}
      />

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={itemName}
              onChangeText={setItemName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Price"
              value={itemPrice}
              onChangeText={setItemPrice}
              mode="outlined"
              style={styles.input}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="$" />}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categorySelection}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setItemCategory(category.id)}
                  style={[
                    styles.categorySelectButton,
                    itemCategory === category.id && {
                      backgroundColor: "rgba(98, 0, 238, 0.1)",
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categorySelectText,
                      itemCategory === category.id && {
                        color: theme.colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Description (optional)"
              value={itemDescription}
              onChangeText={setItemDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
            <TextInput
              label="Image URL"
              value={itemImageUrl}
              onChangeText={setItemImageUrl}
              mode="outlined"
              style={styles.input}
              placeholder="Enter image URL"
              right={
                <TextInput.Icon
                  icon="image"
                  onPress={() => {
                    // Here you could add image picker functionality
                    Alert.alert("Feature", "Image picker would open here");
                  }}
                />
              }
            />
            {itemImageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: itemImageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Available for ordering</Text>
              <Switch
                value={itemAvailable}
                onValueChange={setItemAvailable}
                color={theme.colors.primary}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogVisible(false)}
              textColor={theme.colors.error}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={editingItem ? handleUpdateMenuItem : handleAddMenuItem}
            >
              {editingItem ? "Update Item" : "Add Item"}
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
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  statItem: {
    marginRight: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  activeFilterChip: {
    backgroundColor: "#6200ee",
  },
  filterChipText: {
    color: "#666",
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  menuItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItemContent: {
    padding: 16,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 4,
  },
  // Fixed category chip styles
  categoryChipContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    alignSelf: "flex-start",
  },
  categoryChipText: {
    fontSize: 10,
    color: "#666",
  },
  // Fixed availability chip styles
  availabilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  menuItemDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  menuItemImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginVertical: 12,
  },
  menuItemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogTitle: {
    textAlign: "center",
    fontSize: 20,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  categorySelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  // New category selection buttons
  categorySelectButton: {
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categorySelectText: {
    fontSize: 14,
    color: "#666",
  },
  imagePreviewContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});
