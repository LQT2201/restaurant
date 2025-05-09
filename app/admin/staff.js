import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
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
  RadioButton,
  Chip,
  useTheme,
  ActivityIndicator,
  Avatar,
  Searchbar,
} from "react-native-paper";
import {
  getAllStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  updateStaffPassword,
} from "../../database/staffOperations";
import * as Haptics from "expo-haptics";

export default function StaffScreen() {
  const theme = useTheme();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabAnim = useRef(new Animated.Value(100)).current;
  const headerAnim = useRef(new Animated.Value(-50)).current;

  // Animation refs for list items
  const itemAnimations = useRef({});

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
    ]).start();
  }, []);

  useEffect(() => {
    loadStaff();
  }, []);

  // Filter staff when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStaff(staff);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = staff.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.username.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query)
      );
      setFilteredStaff(filtered);
    }
  }, [searchQuery, staff]);

  // Initialize item animations when staff list changes
  useEffect(() => {
    staff.forEach((item, index) => {
      if (!itemAnimations.current[item.id]) {
        itemAnimations.current[item.id] = {
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(50),
          scale: new Animated.Value(0.8),
        };

        // Stagger the animations
        const delay = index * 100;
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
  }, [staff]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const staffData = await getAllStaff();

      // Reset animations for new items
      itemAnimations.current = {};

      setStaff(staffData);
      setFilteredStaff(staffData);
    } catch (error) {
      console.error("Failed to load staff:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddStaff = async () => {
    if (
      !name.trim() ||
      !username.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Mật khẩu không khớp");
      return;
    }

    try {
      const staffData = {
        name: name.trim(),
        username: username.trim(),
        password: password,
        role: role,
      };

      await addStaff(staffData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thành công", "Đã thêm nhân viên thành công");
      setDialogVisible(false);
      resetForm();
      loadStaff();
    } catch (error) {
      console.error("Failed to add staff:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", error.message || "Không thể thêm nhân viên");
    }
  };

  const handleUpdateStaff = async () => {
    if (!name.trim() || !username.trim() || !editingStaff) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const staffData = {
        name: name.trim(),
        username: username.trim(),
        role: role,
      };

      await updateStaff(editingStaff.id, staffData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thành công", "Đã cập nhật thông tin nhân viên thành công");
      setDialogVisible(false);
      resetForm();
      loadStaff();
    } catch (error) {
      console.error("Failed to update staff:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể cập nhật thông tin nhân viên"
      );
    }
  };

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim() || !editingStaff) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", "Mật khẩu không khớp");
      return;
    }

    try {
      await updateStaffPassword(editingStaff.id, password.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPasswordDialogVisible(false);
      setPassword("");
      setConfirmPassword("");
      Alert.alert("Thành công", "Đã cập nhật mật khẩu thành công");
    } catch (error) {
      console.error("Failed to update password:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật mật khẩu");
    }
  };

  const handleDeleteStaff = (staffId, staffName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert("Xóa Nhân Viên", `Bạn có chắc chắn muốn xóa ${staffName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            // Animate item removal
            Animated.parallel([
              Animated.timing(itemAnimations.current[staffId].opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(itemAnimations.current[staffId].translateY, {
                toValue: 50,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(itemAnimations.current[staffId].scale, {
                toValue: 0.8,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(async () => {
              await deleteStaff(staffId);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Thành công", "Đã xóa nhân viên thành công");
              loadStaff();
            });
          } catch (error) {
            console.error("Failed to delete staff:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Lỗi", error.message || "Không thể xóa nhân viên");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("staff");
    setEditingStaff(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openAddDialog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (staffMember) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingStaff(staffMember);
    setName(staffMember.name);
    setUsername(staffMember.username);
    setRole(staffMember.role);
    setDialogVisible(true);
  };

  const openPasswordDialog = (staffMember) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingStaff(staffMember);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordDialogVisible(true);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color based on role
  const getAvatarColor = (role) => {
    return role === "admin" ? "#F44336" : "#6200ee";
  };

  const renderStaffItem = ({ item, index }) => {
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
          opacity: itemAnimations.current[item.id].opacity,
          transform: [
            { translateY: itemAnimations.current[item.id].translateY },
            { scale: itemAnimations.current[item.id].scale },
          ],
        }}
      >
        <Surface style={styles.staffItem} elevation={3}>
          <View style={styles.staffInfo}>
            <View style={styles.staffHeader}>
              <Avatar.Text
                size={40}
                label={getInitials(item.name)}
                style={[
                  styles.avatar,
                  { backgroundColor: getAvatarColor(item.role) },
                ]}
              />
              <View style={styles.staffDetails}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffUsername}>@{item.username}</Text>
              </View>
              <Chip
                mode="flat"
                style={[
                  styles.roleChip,
                  item.role === "admin"
                    ? { backgroundColor: "rgba(244, 67, 54, 0.1)" }
                    : { backgroundColor: "rgba(98, 0, 238, 0.1)" },
                ]}
                textStyle={[
                  styles.roleChipText,
                  item.role === "admin"
                    ? { color: "#F44336" }
                    : { color: "#6200ee" },
                ]}
              >
                {item.role === "admin" ? "Quản trị viên" : "Nhân viên"}
              </Chip>
            </View>
          </View>
          <View style={styles.staffActions}>
            <IconButton
              icon="key"
              size={20}
              mode="contained"
              onPress={() => openPasswordDialog(item)}
              iconColor="#FFC107"
              containerColor="rgba(255, 193, 7, 0.1)"
              style={styles.actionButton}
            />
            <IconButton
              icon="pencil"
              size={20}
              mode="contained"
              onPress={() => openEditDialog(item)}
              iconColor="#4CAF50"
              containerColor="rgba(76, 175, 80, 0.1)"
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              mode="contained"
              onPress={() => handleDeleteStaff(item.id, item.name)}
              iconColor="#F44336"
              containerColor="rgba(244, 67, 54, 0.1)"
              style={styles.actionButton}
            />
          </View>
        </Surface>
      </Animated.View>
    );
  };

  // Render header with title and search
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
      {/* <View style={styles.headerContent}></View> */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm nhân viên..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#6200ee"
          clearButtonMode="while-editing"
        />
      </View>
    </Animated.View>
  );

  if (loading && staff.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải danh sách nhân viên...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#f5f5f5" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStaffItem}
        refreshing={refreshing}
        onRefresh={loadStaff}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
              <Avatar.Icon
                size={80}
                icon="account-group"
                style={styles.emptyIcon}
                color="#6200ee"
              />
              <Text style={styles.emptyTitle}>Không tìm thấy nhân viên</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Thử tìm kiếm với từ khóa khác"
                  : "Thêm nhân viên để bắt đầu!"}
              </Text>
              {!searchQuery && (
                <Button
                  mode="contained"
                  style={styles.emptyButton}
                  onPress={openAddDialog}
                  buttonColor="#6200ee"
                >
                  Thêm Nhân Viên Đầu Tiên
                </Button>
              )}
            </Animated.View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
              <Text style={styles.loadingText}>
                Đang tải danh sách nhân viên...
              </Text>
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
          icon="plus"
          onPress={openAddDialog}
          style={[styles.fab, { backgroundColor: "#6200ee" }]}
          color="white"
        />
      </Animated.View>

      {/* Add/Edit Staff Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {editingStaff ? "Chỉnh Sửa Nhân Viên" : "Thêm Nhân Viên Mới"}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <View style={styles.dialogContent}>
              <TextInput
                label="Họ và tên"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: "#6200ee" } }}
              />
              <TextInput
                label="Tên đăng nhập"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                left={<TextInput.Icon icon="account-circle" />}
                theme={{ colors: { primary: "#6200ee" } }}
              />
              {!editingStaff && (
                <>
                  <TextInput
                    label="Mật khẩu"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowPassword(!showPassword);
                        }}
                      />
                    }
                    theme={{ colors: { primary: "#6200ee" } }}
                  />
                  <TextInput
                    label="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                      />
                    }
                    theme={{ colors: { primary: "#6200ee" } }}
                  />
                </>
              )}

              <Text style={styles.radioLabel}>Vai trò</Text>
              <View style={styles.roleSelection}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRole("staff");
                  }}
                  style={[
                    styles.roleSelectButton,
                    role === "staff" && {
                      backgroundColor: "rgba(98, 0, 238, 0.1)",
                      borderColor: "#6200ee",
                    },
                  ]}
                >
                  <IconButton
                    icon="account"
                    size={20}
                    iconColor={role === "staff" ? "#6200ee" : "#666"}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleSelectText,
                      role === "staff" && {
                        color: "#6200ee",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    Nhân viên
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRole("admin");
                  }}
                  style={[
                    styles.roleSelectButton,
                    role === "admin" && {
                      backgroundColor: "rgba(244, 67, 54, 0.1)",
                      borderColor: "#F44336",
                    },
                  ]}
                >
                  <IconButton
                    icon="shield-account"
                    size={20}
                    iconColor={role === "admin" ? "#F44336" : "#666"}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleSelectText,
                      role === "admin" && {
                        color: "#F44336",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    Quản trị viên
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
                editingStaff ? handleUpdateStaff() : handleAddStaff();
              }}
            >
              {editingStaff ? "Lưu thay đổi" : "Thêm nhân viên"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog
          visible={passwordDialogVisible}
          onDismiss={() => setPasswordDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Đổi mật khẩu cho {editingStaff?.name || ""}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Mật khẩu mới"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowPassword(!showPassword);
                  }}
                />
              }
              theme={{ colors: { primary: "#6200ee" } }}
            />
            <TextInput
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                />
              }
              theme={{ colors: { primary: "#6200ee" } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPasswordDialogVisible(false);
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
                handleUpdatePassword();
              }}
            >
              Cập nhật mật khẩu
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
    flexDirection: "row",
    marginTop: 8,
  },
  statItem: {
    marginRight: 24,
    backgroundColor: "#f9f5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
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
  searchContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  staffItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  staffHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  staffDetails: {
    flex: 1,
  },
  staffInfo: {
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 2,
  },
  staffUsername: {
    fontSize: 14,
    color: "#666",
  },
  staffActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    backgroundColor: "#fafafa",
    padding: 8,
    borderRadius: 8,
  },
  actionButton: {
    margin: 4,
  },
  roleChip: {
    height: 30,
    borderRadius: 14,
    marginLeft: "auto",
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
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
  radioLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    marginTop: 8,
  },
  roleSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  roleIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  roleSelectText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    backgroundColor: "rgba(98, 0, 238, 0.1)",
    marginBottom: 16,
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
});
