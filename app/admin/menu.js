import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
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
  ActivityIndicator,
} from "react-native-paper";
import {
  getAllMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../database/menuOperations";
import * as Haptics from "expo-haptics";

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
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Get screen dimensions for responsive grid
  const { width } = Dimensions.get("window");
  const numColumns = width > 600 ? 3 : 2; // 3 columns on larger screens, 2 on smaller
  const columnWidth = (width - 32 - (numColumns - 1) * 12) / numColumns; // Account for padding and gaps

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabAnim = useRef(new Animated.Value(100)).current;
  const headerAnim = useRef(new Animated.Value(-50)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  // Animation refs for grid items
  const itemAnimations = useRef({});

  // Categories for demo - replace with your actual categories
  const categories = [
    { id: 1, name: "Khai Vị", icon: "silverware-fork-knife" },
    { id: 2, name: "Món Chính", icon: "food" },
    { id: 3, name: "Tráng Miệng", icon: "cake" },
    { id: 4, name: "Đồ Uống", icon: "cup" },
  ];

  // Initialize animations when component mounts
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load menu items on component mount
  useEffect(() => {
    loadMenuItems();
  }, []);

  // Initialize item animations when menu items change
  useEffect(() => {
    menuItems.forEach((item, index) => {
      if (!itemAnimations.current[item.id]) {
        itemAnimations.current[item.id] = {
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(50),
          scale: new Animated.Value(0.8),
        };

        // Stagger the animations based on grid position
        const delay =
          ((index % numColumns) + Math.floor(index / numColumns)) * 80;
        Animated.parallel([
          Animated.timing(itemAnimations.current[item.id].opacity, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(itemAnimations.current[item.id].translateY, {
            toValue: 0,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(itemAnimations.current[item.id].scale, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [menuItems, numColumns]);

  // Load menu items from database
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const data = await getAllMenuItems();

      // Reset animations for new items
      itemAnimations.current = {};

      setMenuItems(data);
    } catch (error) {
      console.error("Failed to load menu items:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách món ăn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle adding a new menu item
  const handleAddMenuItem = async () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng nhập tên và giá");
      return;
    }

    // Validate price as a number
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thành công", "Đã thêm món ăn thành công");
      setDialogVisible(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error("Failed to add menu item:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", error.message || "Không thể thêm món ăn");
    }
  };

  // Handle updating a menu item
  const handleUpdateMenuItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !editingItem) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng nhập tên và giá");
      return;
    }

    // Validate price as a number
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thành công", "Đã cập nhật món ăn thành công");
      setDialogVisible(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error("Failed to update menu item:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật món ăn");
    }
  };

  // Handle deleting a menu item
  const handleDeleteMenuItem = (itemId, itemName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert("Xóa Món Ăn", `Bạn có chắc chắn muốn xóa ${itemName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            // Animate item removal
            Animated.parallel([
              Animated.timing(itemAnimations.current[itemId].opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(itemAnimations.current[itemId].translateY, {
                toValue: 50,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(itemAnimations.current[itemId].scale, {
                toValue: 0.8,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(async () => {
              await deleteMenuItem(itemId);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Thành công", "Đã xóa món ăn thành công");
              loadMenuItems();
            });
          } catch (error) {
            console.error("Failed to delete menu item:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Lỗi", error.message || "Không thể xóa món ăn");
          }
        },
      },
    ]);
  };

  // Open item detail dialog
  const openItemDetail = (item) => {
    Haptics.selectionAsync();
    setSelectedItem(item);
    setDetailDialogVisible(true);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetForm();
    setDialogVisible(true);
  };

  // Open dialog for editing a menu item
  const openEditDialog = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemDescription(item.description || "");
    setItemCategory(item.category_id);
    setItemImageUrl(item.image_url || "");
    setItemAvailable(item.is_available === 1);
    setDialogVisible(true);
    setDetailDialogVisible(false);
  };

  // Get category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Chưa phân loại";
  };

  // Get category icon by id
  const getCategoryIcon = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.icon : "help-circle";
  };

  // Filter menu items by category
  const filteredMenuItems = filterCategory
    ? menuItems.filter((item) => item.category_id === filterCategory)
    : menuItems;

  // Handle category filter change
  const handleCategoryFilter = (categoryId) => {
    Haptics.selectionAsync();

    // Animate filter change
    Animated.sequence([
      Animated.timing(filterAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setFilterCategory(categoryId);
  };

  // Render a menu item in grid layout
  const renderGridItem = ({ item, index }) => {
    // Get or create animation values for this item
    if (!itemAnimations.current[item.id]) {
      itemAnimations.current[item.id] = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
      };
    }

    return (
      <Animated.View
        style={{
          width: columnWidth,
          opacity: itemAnimations.current[item.id].opacity,
          transform: [
            { translateY: itemAnimations.current[item.id].translateY },
            { scale: itemAnimations.current[item.id].scale },
          ],
        }}
      >
        <Surface style={styles.gridItem} elevation={3}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openItemDetail(item)}
            style={styles.gridItemTouchable}
          >
            {/* Item Image */}
            <View style={styles.gridImageContainer}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.gridItemImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <IconButton
                    icon={getCategoryIcon(item.category_id)}
                    size={32}
                    iconColor="#bbb"
                  />
                </View>
              )}

              {/* Availability badge */}
              <View
                style={[
                  styles.availabilityBadge,
                  {
                    backgroundColor: item.is_available
                      ? "rgba(76, 175, 80, 0.9)"
                      : "rgba(244, 67, 54, 0.9)",
                  },
                ]}
              >
                <Text style={styles.availabilityBadgeText}>
                  {item.is_available ? "Có sẵn" : "Hết"}
                </Text>
              </View>

              {/* Category badge */}
              <View style={styles.categoryBadge}>
                <IconButton
                  icon={getCategoryIcon(item.category_id)}
                  size={14}
                  iconColor="#fff"
                  style={styles.categoryBadgeIcon}
                />
              </View>
            </View>

            {/* Item Content */}
            <View style={styles.gridItemContent}>
              <Text
                style={styles.gridItemName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>

              <Text style={styles.gridItemPrice}>
                {item.price.toLocaleString("vi-VN")}₫
              </Text>

              {item.description ? (
                <Text
                  numberOfLines={2}
                  style={styles.gridItemDescription}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              ) : null}
            </View>

            {/* Quick Actions */}
            <View style={styles.gridItemActions}>
              <IconButton
                icon="pencil"
                iconColor="#4CAF50"
                size={18}
                onPress={(e) => {
                  e.stopPropagation();
                  openEditDialog(item);
                }}
                style={styles.gridActionButton}
              />
              <IconButton
                icon="delete"
                iconColor="#F44336"
                size={18}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteMenuItem(item.id, item.name);
                }}
                style={styles.gridActionButton}
              />
            </View>
          </TouchableOpacity>
        </Surface>
      </Animated.View>
    );
  };

  // Render category filter
  const renderCategoryFilter = () => (
    <Animated.View
      style={[
        styles.filterContainer,
        {
          opacity: filterAnim,
          transform: [
            {
              translateY: filterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterCategory === null && styles.activeFilterChip,
          ]}
          onPress={() => handleCategoryFilter(null)}
        >
          <IconButton
            icon="view-grid"
            size={16}
            iconColor={filterCategory === null ? "#fff" : "#666"}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterChipText,
              filterCategory === null && styles.activeFilterChipText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterChip,
              filterCategory === category.id && styles.activeFilterChip,
            ]}
            onPress={() => handleCategoryFilter(category.id)}
          >
            <IconButton
              icon={category.icon}
              size={16}
              iconColor={filterCategory === category.id ? "#fff" : "#666"}
              style={styles.filterIcon}
            />
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
    </Animated.View>
  );

  // Render header with title and stats
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          transform: [{ translateY: headerAnim }],
          shadowOpacity: headerAnim.interpolate({
            inputRange: [-50, 0],
            outputRange: [0, 0.1],
          }),
        },
      ]}
    >
      <View style={styles.headerContent}>
        {/* <Text style={styles.headerTitle}>Quản Lý Thực Đơn</Text> */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{menuItems.length}</Text>
            <Text style={styles.statLabel}>Tổng số món</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {menuItems.filter((item) => item.is_available === 1).length}
            </Text>
            <Text style={styles.statLabel}>Có sẵn</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>Danh mục</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: "#f5f5f5" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}
      {renderCategoryFilter()}

      <FlatList
        data={filteredMenuItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGridItem}
        refreshing={refreshing}
        onRefresh={loadMenuItems}
        numColumns={numColumns}
        key={numColumns} // Force re-render when numColumns changes
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          !loading ? (
            <Animated.View
              style={[
                styles.emptyContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/5445/5445197.png",
                }}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>Không tìm thấy món ăn nào</Text>
              <Text style={styles.emptySubtitle}>Thêm món ăn để bắt đầu!</Text>
              <Button
                mode="contained"
                style={styles.emptyButton}
                onPress={openAddDialog}
                buttonColor="#6200ee"
              >
                Thêm Món Đầu Tiên
              </Button>
            </Animated.View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
              <Text style={styles.loadingText}>Đang tải thực đơn...</Text>
            </View>
          )
        }
      />

      <Animated.View
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          transform: [{ translateY: fabAnim }],
        }}
      >
        <FAB
          style={[styles.fab, { backgroundColor: "#6200ee" }]}
          icon="plus"
          color="#fff"
          onPress={openAddDialog}
        />
      </Animated.View>

      {/* Item Detail Dialog */}
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={styles.detailDialog}
        >
          {selectedItem && (
            <>
              <Dialog.Content style={styles.detailDialogContent}>
                {selectedItem.image_url ? (
                  <Image
                    source={{ uri: selectedItem.image_url }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.detailNoImage}>
                    <IconButton
                      icon={getCategoryIcon(selectedItem.category_id)}
                      size={64}
                      iconColor="#bbb"
                    />
                  </View>
                )}

                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleRow}>
                    <Text style={styles.detailTitle}>{selectedItem.name}</Text>
                    <View
                      style={[
                        styles.detailAvailabilityChip,
                        {
                          backgroundColor: selectedItem.is_available
                            ? "rgba(76, 175, 80, 0.1)"
                            : "rgba(244, 67, 54, 0.1)",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selectedItem.is_available
                            ? "#4CAF50"
                            : "#F44336",
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {selectedItem.is_available ? "Có sẵn" : "Hết hàng"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailCategoryRow}>
                    <IconButton
                      icon={getCategoryIcon(selectedItem.category_id)}
                      size={16}
                      iconColor="#6200ee"
                      style={styles.detailCategoryIcon}
                    />
                    <Text style={styles.detailCategory}>
                      {getCategoryName(selectedItem.category_id)}
                    </Text>
                  </View>

                  <Text style={styles.detailPrice}>
                    {selectedItem.price.toLocaleString("vi-VN")}₫
                  </Text>

                  {selectedItem.description ? (
                    <View style={styles.detailDescriptionContainer}>
                      <Text style={styles.detailDescriptionLabel}>Mô tả:</Text>
                      <Text style={styles.detailDescription}>
                        {selectedItem.description}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Dialog.Content>

              <Dialog.Actions>
                <Button
                  onPress={() => setDetailDialogVisible(false)}
                  textColor="#666"
                >
                  Đóng
                </Button>
                <Button
                  mode="outlined"
                  onPress={() =>
                    handleDeleteMenuItem(selectedItem.id, selectedItem.name)
                  }
                  textColor="#F44336"
                  style={{ borderColor: "#F44336" }}
                >
                  Xóa
                </Button>
                <Button
                  mode="contained"
                  onPress={() => openEditDialog(selectedItem)}
                  buttonColor="#6200ee"
                >
                  Chỉnh Sửa
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      {/* Add/Edit Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {editingItem ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn"}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Tên món ăn"
                  value={itemName}
                  onChangeText={setItemName}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: "#6200ee" } }}
                />
                <TextInput
                  label="Giá"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  left={<TextInput.Affix text="₫" />}
                  theme={{ colors: { primary: "#6200ee" } }}
                />

                <Text style={styles.inputLabel}>Danh mục</Text>
                <View style={styles.categorySelection}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setItemCategory(category.id);
                      }}
                      style={[
                        styles.categorySelectButton,
                        itemCategory === category.id && {
                          backgroundColor: "rgba(98, 0, 238, 0.1)",
                          borderColor: "#6200ee",
                        },
                      ]}
                    >
                      <IconButton
                        icon={category.icon}
                        size={16}
                        iconColor={
                          itemCategory === category.id ? "#6200ee" : "#666"
                        }
                        style={styles.categoryIcon}
                      />
                      <Text
                        style={[
                          styles.categorySelectText,
                          itemCategory === category.id && {
                            color: "#6200ee",
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
                  label="Mô tả (tùy chọn)"
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  theme={{ colors: { primary: "#6200ee" } }}
                />
                <TextInput
                  label="URL hình ảnh"
                  value={itemImageUrl}
                  onChangeText={setItemImageUrl}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Nhập URL hình ảnh"
                  theme={{ colors: { primary: "#6200ee" } }}
                  right={
                    <TextInput.Icon
                      icon="image"
                      onPress={() => {
                        Haptics.selectionAsync();
                        // Here you could add image picker functionality
                        Alert.alert("Feature", "Image picker would open here");
                      }}
                    />
                  }
                />
                {itemImageUrl ? (
                  <Animated.View
                    style={styles.imagePreviewContainer}
                    entering={Animated.FadeIn}
                  >
                    <Image
                      source={{ uri: itemImageUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </Animated.View>
                ) : null}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Có sẵn để đặt hàng</Text>
                  <Switch
                    value={itemAvailable}
                    onValueChange={(value) => {
                      Haptics.selectionAsync();
                      setItemAvailable(value);
                    }}
                    color="#6200ee"
                  />
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDialogVisible(false);
              }}
              textColor="#F44336"
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              buttonColor="#6200ee"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                editingItem ? handleUpdateMenuItem() : handleAddMenuItem();
              }}
            >
              {editingItem ? "Cập Nhật" : "Thêm Món"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#212121",
  },
  statsContainer: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 0,
  },
  statItem: {
    marginRight: 24,
    backgroundColor: "#f9f5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 110,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200ee",
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
    zIndex: 5,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  activeFilterChip: {
    backgroundColor: "#6200ee",
  },
  filterIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  filterChipText: {
    color: "#666",
    fontWeight: "500",
    marginLeft: -4,
  },
  activeFilterChipText: {
    color: "#fff",
  },

  // Grid layout styles
  gridContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridItem: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    height: 280, // Fixed height for grid items
  },
  gridItemTouchable: {
    flex: 1,
  },
  gridImageContainer: {
    height: 140,
    position: "relative",
  },
  gridItemImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  availabilityBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availabilityBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(98, 0, 238, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadgeIcon: {
    margin: 0,
    padding: 0,
  },
  gridItemContent: {
    padding: 12,
    flex: 1,
  },
  gridItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  gridItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 8,
  },
  gridItemDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  gridItemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 4,
    backgroundColor: "#fafafa",
  },
  gridActionButton: {
    margin: 0,
  },

  // Detail dialog styles
  detailDialog: {
    borderRadius: 16,
    backgroundColor: "#fff",
    maxWidth: 500,
    width: "90%",
    alignSelf: "center",
  },
  detailDialogContent: {
    padding: 0,
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  detailNoImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  detailHeader: {
    padding: 16,
  },
  detailTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
    marginRight: 8,
  },
  detailAvailabilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailCategoryIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  detailCategory: {
    fontSize: 14,
    color: "#6200ee",
    marginLeft: -4,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 16,
  },
  detailDescriptionContainer: {
    backgroundColor: "#f9f5ff",
    padding: 12,
    borderRadius: 8,
  },
  detailDescriptionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Other existing styles
  fab: {
    elevation: 6,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  dialogTitle: {
    textAlign: "center",
    fontSize: 20,
    color: "#212121",
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
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
  categorySelectButton: {
    flexDirection: "row",
    alignItems: "center",
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  categorySelectText: {
    fontSize: 14,
    color: "#666",
    marginLeft: -4,
  },
  categoryIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: "#212121",
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
    color: "#212121",
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
