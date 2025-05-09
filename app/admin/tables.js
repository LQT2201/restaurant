import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
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
  useTheme,
  Searchbar,
  Avatar,
  Chip,
  SegmentedButtons,
  Card,
  Badge,
  Menu,
  TouchableRipple,
} from "react-native-paper";
import {
  getAllTables,
  addTable,
  updateTable,
  deleteTable,
} from "../../database/tableOperations";

export default function TablesScreen() {
  const theme = useTheme();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [tableSection, setTableSection] = useState("Main");
  const [tableStatus, setTableStatus] = useState("empty");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Predefined sections for demo
  const sections = ["Chính", "Sân Thượng", "Quầy Bar", "Phòng Riêng"];

  // Load tables on component mount
  useEffect(() => {
    loadTables();
  }, []);

  // Load tables from database
  const loadTables = async () => {
    try {
      setLoading(true);
      const tableData = await getAllTables();
      setTables(tableData);
    } catch (error) {
      console.error("Failed to load tables:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new table
  const handleAddTable = async () => {
    if (!tableName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bàn");
      return;
    }

    try {
      const tableData = {
        name: tableName.trim(),
        capacity: parseInt(tableCapacity) || 4,
        section: tableSection.trim(),
        status: tableStatus,
      };

      await addTable(tableData);
      Alert.alert("Thành công", "Đã thêm bàn thành công");
      setDialogVisible(false);
      resetForm();
      loadTables();
    } catch (error) {
      console.error("Failed to add table:", error);
      Alert.alert("Lỗi", error.message || "Không thể thêm bàn");
    }
  };

  // Handle updating a table
  const handleUpdateTable = async () => {
    if (!tableName.trim() || !editingTable) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bàn");
      return;
    }

    try {
      const tableData = {
        name: tableName.trim(),
        capacity: parseInt(tableCapacity) || 4,
        section: tableSection.trim(),
        status: tableStatus,
      };

      await updateTable(editingTable.id, tableData);
      Alert.alert("Thành công", "Đã cập nhật bàn thành công");
      setDialogVisible(false);
      resetForm();
      loadTables();
    } catch (error) {
      console.error("Failed to update table:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật bàn");
    }
  };

  // Handle deleting a table
  const handleDeleteTable = (tableId, tableName) => {
    Alert.alert("Xóa Bàn", `Bạn có chắc chắn muốn xóa ${tableName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTable(tableId);
            Alert.alert("Thành công", "Đã xóa bàn thành công");
            loadTables();
          } catch (error) {
            console.error("Failed to delete table:", error);
            Alert.alert("Lỗi", error.message || "Không thể xóa bàn");
          }
        },
      },
    ]);
  };

  // Reset form fields
  const resetForm = () => {
    setTableName("");
    setTableCapacity("4");
    setTableSection("Main");
    setTableStatus("empty");
    setEditingTable(null);
  };

  // Open dialog for editing a table
  const openEditDialog = (table) => {
    setEditingTable(table);
    setTableName(table.name);
    setTableCapacity(table.capacity?.toString() || "4");
    setTableSection(table.section || "Main");
    setTableStatus(table.status || "empty");
    setDialogVisible(true);
  };

  // Open dialog for adding a new table
  const openAddDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  // Quick update table status
  const quickUpdateStatus = async (table, newStatus) => {
    try {
      const updatedTable = {
        ...table,
        status: newStatus,
      };
      await updateTable(table.id, updatedTable);
      loadTables();
    } catch (error) {
      console.error("Failed to update table status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái bàn");
    }
  };

  // Filter tables based on search query and filters
  const filteredTables = tables.filter((table) => {
    // Search filter
    const matchesSearch =
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.section &&
        table.section.toLowerCase().includes(searchQuery.toLowerCase()));

    // Section filter
    const matchesSection =
      filterSection === "All" || table.section === filterSection;

    // Status filter
    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Available" && table.status === "empty") ||
      (filterStatus === "Occupied" && table.status === "occupied") ||
      (filterStatus === "Maintenance" && table.status === "maintenance");

    return matchesSearch && matchesSection && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "empty":
        return theme.colors.primary;
      case "occupied":
        return theme.colors.error;
      case "maintenance":
        return theme.colors.warning || "#F59E0B";
      default:
        return theme.colors.outline;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "empty":
        return "Còn trống";
      case "occupied":
        return "Đang sử dụng";
      case "maintenance":
        return "Bảo trì";
      default:
        return "Không xác định";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "empty":
        return "check-circle";
      case "occupied":
        return "account-group";
      case "maintenance":
        return "tools";
      default:
        return "help-circle";
    }
  };

  // Render a table item
  const renderTableItem = ({ item }) => (
    <Card style={styles.tableCard} mode="elevated">
      <TouchableRipple
        onPress={() => {
          setSelectedTable(item);
          setMenuVisible(true);
        }}
        borderless
      >
        <View>
          <Card.Content style={styles.tableCardContent}>
            <View style={styles.tableHeader}>
              <View style={styles.tableNameSection}>
                <Avatar.Icon
                  size={40}
                  icon="table-chair"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                  }}
                  color={theme.colors.primary}
                />
                <View style={styles.tableNameInfo}>
                  <Text style={styles.tableName}>{item.name}</Text>
                  <View style={styles.tableMetaInfo}>
                    <IconButton
                      icon="map-marker"
                      size={14}
                      style={styles.inlineIcon}
                      iconColor={theme.colors.outline}
                    />
                    <Text style={styles.sectionText}>
                      {item.section || "Main"}
                    </Text>
                    <IconButton
                      icon="account-multiple"
                      size={14}
                      style={styles.inlineIcon}
                      iconColor={theme.colors.outline}
                    />
                    <Text style={styles.capacityText}>
                      {item.capacity || 4}
                    </Text>
                  </View>
                </View>
              </View>

              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { borderColor: getStatusColor(item.status) },
                ]}
                textStyle={{ color: getStatusColor(item.status) }}
                icon={() => (
                  <IconButton
                    icon={getStatusIcon(item.status)}
                    iconColor={getStatusColor(item.status)}
                    size={16}
                    style={styles.chipIcon}
                  />
                )}
              >
                {getStatusText(item.status)}
              </Chip>
            </View>
          </Card.Content>

          <Card.Actions style={styles.cardActions}>
            <Button
              mode="text"
              textColor={theme.colors.primary}
              onPress={() => openEditDialog(item)}
            >
              Edit
            </Button>
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={() => handleDeleteTable(item.id, item.name)}
            >
              Delete
            </Button>
          </Card.Actions>
        </View>
      </TouchableRipple>
    </Card>
  );

  // Render section filter chips
  const renderSectionFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Khu vực</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip
          selected={filterSection === "All"}
          onPress={() => setFilterSection("All")}
          style={styles.filterChip}
          showSelectedOverlay
        >
          All
        </Chip>

        {sections.map((section) => (
          <Chip
            key={section}
            selected={filterSection === section}
            onPress={() => setFilterSection(section)}
            style={styles.filterChip}
            showSelectedOverlay
          >
            {section}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  // Render status filter
  const renderStatusFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Trạng thái</Text>
      <SegmentedButtons
        value={filterStatus}
        onValueChange={setFilterStatus}
        buttons={[
          { value: "All", label: "Tất cả" },
          {
            value: "Available",
            label: "Còn trống",
            icon: "check-circle",
            style:
              filterStatus === "Available"
                ? { backgroundColor: `${theme.colors.primary}20` }
                : {},
          },
          {
            value: "Occupied",
            label: "Đang sử dụng",
            icon: "account-group",
            style:
              filterStatus === "Occupied"
                ? { backgroundColor: `${theme.colors.error}20` }
                : {},
          },
          {
            value: "Maintenance",
            label: "Bảo trì",
            icon: "tools",
            style:
              filterStatus === "Maintenance"
                ? { backgroundColor: `${theme.colors.warning || "#F59E0B"}20` }
                : {},
          },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  // Render header with search and filters
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Bàn</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tables.length}</Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tables.filter((table) => table.status === "empty").length}
            </Text>
            <Text style={styles.statLabel}>Còn trống</Text>
          </View>
        </View>
      </View>

      <Searchbar
        placeholder="Tìm kiếm bàn..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.outline}
      />

      {renderSectionFilter()}
      {renderStatusFilter()}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={filteredTables}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTableItem}
        refreshing={loading}
        onRefresh={loadTables}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <IconButton
                icon="table-chair"
                size={80}
                iconColor={theme.colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>Không tìm thấy bàn nào</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ||
                filterSection !== "All" ||
                filterStatus !== "All"
                  ? "Hãy thử điều chỉnh bộ lọc"
                  : "Thêm bàn để bắt đầu!"}
              </Text>
              {!searchQuery &&
                filterSection === "All" &&
                filterStatus === "All" && (
                  <Button
                    mode="contained"
                    style={styles.emptyButton}
                    onPress={openAddDialog}
                  >
                    Thêm Bàn Đầu Tiên
                  </Button>
                )}
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
            {editingTable ? "Edit Table" : "Add New Table"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Table Name"
              value={tableName}
              onChangeText={setTableName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Table 1, Booth 3"
            />

            <TextInput
              label="Capacity"
              value={tableCapacity}
              onChangeText={setTableCapacity}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text="seats" />}
            />

            <Text style={styles.inputLabel}>Section</Text>
            <View style={styles.chipSelection}>
              {sections.map((section) => (
                <Chip
                  key={section}
                  selected={tableSection === section}
                  onPress={() => setTableSection(section)}
                  style={styles.selectionChip}
                  showSelectedOverlay
                >
                  {section}
                </Chip>
              ))}
            </View>

            <Text style={styles.inputLabel}>Status</Text>
            <SegmentedButtons
              value={tableStatus}
              onValueChange={setTableStatus}
              buttons={[
                {
                  value: "empty",
                  label: "Available",
                  icon: "check-circle",
                  style:
                    tableStatus === "empty"
                      ? { backgroundColor: `${theme.colors.primary}20` }
                      : {},
                },
                {
                  value: "occupied",
                  label: "Occupied",
                  icon: "account-group",
                  style:
                    tableStatus === "occupied"
                      ? { backgroundColor: `${theme.colors.error}20` }
                      : {},
                },
                {
                  value: "maintenance",
                  label: "Maintenance",
                  icon: "tools",
                  style:
                    tableStatus === "maintenance"
                      ? {
                          backgroundColor: `${
                            theme.colors.warning || "#F59E0B"
                          }20`,
                        }
                      : {},
                },
              ]}
              style={styles.statusSegmentedButtons}
            />
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
              onPress={editingTable ? handleUpdateTable : handleAddTable}
            >
              {editingTable ? "Update Table" : "Add Table"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Quick action menu */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.quickMenu}
        >
          <Menu.Item
            leadingIcon="check-circle"
            onPress={() => {
              if (selectedTable) {
                quickUpdateStatus(selectedTable, "empty");
                setMenuVisible(false);
              }
            }}
            title="Mark as Available"
          />
          <Menu.Item
            leadingIcon="account-group"
            onPress={() => {
              if (selectedTable) {
                quickUpdateStatus(selectedTable, "occupied");
                setMenuVisible(false);
              }
            }}
            title="Mark as Occupied"
          />
          <Menu.Item
            leadingIcon="tools"
            onPress={() => {
              if (selectedTable) {
                quickUpdateStatus(selectedTable, "maintenance");
                setMenuVisible(false);
              }
            }}
            title="Mark as Maintenance"
          />
          <Divider />
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              if (selectedTable) {
                openEditDialog(selectedTable);
                setMenuVisible(false);
              }
            }}
            title="Edit Table"
          />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              if (selectedTable) {
                handleDeleteTable(selectedTable.id, selectedTable.name);
                setMenuVisible(false);
              }
            }}
            title="Delete Table"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    marginLeft: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#4B5563",
  },
  filterChip: {
    marginRight: 8,
  },
  segmentedButtons: {
    backgroundColor: "#F3F4F6",
  },
  statusSegmentedButtons: {
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  tableCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tableCardContent: {
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableNameSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableNameInfo: {
    marginLeft: 12,
  },
  tableName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tableMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  sectionText: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 8,
  },
  capacityText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusChip: {
    height: 32,
  },
  chipIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  cardActions: {
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
    color: "#4B5563",
    marginBottom: 8,
  },
  chipSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  selectionChip: {
    margin: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  quickMenu: {
    borderRadius: 12,
    marginTop: 50,
  },
});
