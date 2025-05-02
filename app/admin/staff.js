import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
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
} from "react-native-paper";
import {
  getAllStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  updateStaffPassword,
} from "../../database/staffOperations";

export default function StaffScreen() {
  const theme = useTheme();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("staff");

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const staffData = await getAllStaff();
      setStaff(staffData);
    } catch (error) {
      console.error("Failed to load staff:", error);
      Alert.alert("Error", "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (
      !name.trim() ||
      !username.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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
      Alert.alert("Success", "Staff member added successfully");
      setDialogVisible(false);
      resetForm();
      loadStaff();
    } catch (error) {
      console.error("Failed to add staff:", error);
      Alert.alert("Error", error.message || "Failed to add staff");
    }
  };

  const handleUpdateStaff = async () => {
    if (!name.trim() || !username.trim() || !editingStaff) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const staffData = {
        name: name.trim(),
        username: username.trim(),
        role: role,
      };

      await updateStaff(editingStaff.id, staffData);
      Alert.alert("Success", "Staff member updated successfully");
      setDialogVisible(false);
      resetForm();
      loadStaff();
    } catch (error) {
      console.error("Failed to update staff:", error);
      Alert.alert("Error", error.message || "Failed to update staff");
    }
  };

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim() || !editingStaff) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      await updateStaffPassword(editingStaff.id, password.trim(), password);
      setPasswordDialogVisible(false);
      setPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully");
    } catch (error) {
      console.error("Failed to update password:", error);
      Alert.alert("Error", error.message || "Failed to update password");
    }
  };

  const handleDeleteStaff = (staffId, staffName) => {
    Alert.alert(
      "Delete Staff",
      `Are you sure you want to delete ${staffName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStaff(staffId);
              Alert.alert("Success", "Staff member deleted successfully");
              loadStaff();
            } catch (error) {
              console.error("Failed to delete staff:", error);
              Alert.alert("Error", error.message || "Failed to delete staff");
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("staff");
    setEditingStaff(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (staffMember) => {
    setEditingStaff(staffMember);
    setName(staffMember.name);
    setUsername(staffMember.username);
    setRole(staffMember.role);
    setDialogVisible(true);
  };

  const openPasswordDialog = (staffMember) => {
    setEditingStaff(staffMember);
    setPassword("");
    setConfirmPassword("");
    setPasswordDialogVisible(true);
  };

  const renderStaffItem = ({ item }) => (
    <Surface style={[styles.staffItem, { elevation: 2 }]}>
      <View style={styles.staffInfo}>
        <View style={styles.staffHeader}>
          <Text style={[styles.staffName, { color: theme.colors.primary }]}>
            {item.name}
          </Text>
          <Chip
            mode="outlined"
            style={[
              styles.roleChip,
              item.role === "admin"
                ? { backgroundColor: theme.colors.errorContainer }
                : { backgroundColor: theme.colors.secondaryContainer },
            ]}
            textStyle={styles.roleChipText}
          >
            {item.role === "admin" ? "Admin" : "Staff"}
          </Chip>
        </View>
        <Text
          style={[
            styles.staffUsername,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          @{item.username}
        </Text>
      </View>
      <View style={styles.staffActions}>
        <IconButton
          icon="key"
          size={20}
          onPress={() => openPasswordDialog(item)}
          iconColor={theme.colors.primary}
          style={styles.iconButton}
        />
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => openEditDialog(item)}
          iconColor={theme.colors.primary}
          style={styles.iconButton}
        />
        <IconButton
          icon="delete"
          size={20}
          onPress={() => handleDeleteStaff(item.id, item.name)}
          iconColor={theme.colors.error}
          style={styles.iconButton}
        />
      </View>
    </Surface>
  );

  if (loading && staff.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading staff...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStaffItem}
        refreshing={loading}
        onRefresh={loadStaff}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={
          <Surface style={styles.emptyContainer} elevation={0}>
            <Text
              variant="bodyMedium"
              style={{
                textAlign: "center",
                color: theme.colors.onSurfaceVariant,
              }}
            >
              No staff members found. Add a staff member to get started!
            </Text>
          </Surface>
        }
        ListHeaderComponent={
          <Text
            variant="titleMedium"
            style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
          >
            Staff Members ({staff.length})
          </Text>
        }
      />

      <FAB
        icon="plus"
        onPress={openAddDialog}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="white"
      />

      {/* Add/Edit Staff Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {editingStaff ? "Edit Staff Member" : "Add New Staff"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              left={<TextInput.Icon icon="account-circle" />}
            />
            {!editingStaff && (
              <>
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                />
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check" />}
                />
              </>
            )}
            <Text
              variant="labelLarge"
              style={[styles.radioLabel, { color: theme.colors.onSurface }]}
            >
              Role
            </Text>
            <RadioButton.Group
              onValueChange={(value) => setRole(value)}
              value={role}
            >
              <View style={styles.radioContainer}>
                <RadioButton.Item
                  label="Staff"
                  value="staff"
                  position="leading"
                  labelStyle={styles.radioLabelStyle}
                />
                <RadioButton.Item
                  label="Administrator"
                  value="admin"
                  position="leading"
                  labelStyle={styles.radioLabelStyle}
                />
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={editingStaff ? handleUpdateStaff : handleAddStaff}
              style={styles.dialogButton}
            >
              {editingStaff ? "Save Changes" : "Add Staff"}
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
            Change Password for {editingStaff?.name || ""}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdatePassword}
              style={styles.dialogButton}
            >
              Update Password
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  staffItem: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  staffHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  staffUsername: {
    fontSize: 14,
  },
  staffActions: {
    flexDirection: "row",
  },
  iconButton: {
    margin: 0,
  },
  roleChip: {
    height: 24,
    minHeight: 24, // Thêm minHeight để đảm bảo chiều cao tối thiểu
    borderRadius: 12,
    justifyContent: "center", // Căn giữa nội dung theo chiều dọc
  },
  roleChipText: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 6, // Thêm padding ngang để chữ không bị sát mép
    includeFontPadding: false, // Loại bỏ padding mặc định của font
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  input: {
    marginBottom: 12,
  },
  radioLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  radioLabelStyle: {
    fontSize: 14,
  },
  radioContainer: {
    flexDirection: "column",
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    marginVertical: 4,
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  dialogButton: {
    borderRadius: 8,
    marginLeft: 8,
  },
});
