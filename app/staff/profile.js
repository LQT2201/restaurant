import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Surface,
  Text,
  Button,
  Avatar,
  List,
  Divider,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { userInfo, logout } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              router.replace("/login");
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const getAvatarColor = () => {
    // Generate consistent color based on user's name
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#A37AFC",
      "#FFA34D",
      "#5FCE89",
      "#FF8A65",
      "#7986CB",
      "#F06292",
      "#9575CD",
    ];
    const index = userInfo?.name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with user info */}
      <Surface style={styles.header} elevation={0}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={80}
            label={userInfo?.name?.charAt(0)?.toUpperCase() || "U"}
            style={[styles.avatar, { backgroundColor: getAvatarColor() }]}
            labelStyle={styles.avatarText}
          />
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => router.push("/profile/edit")}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {userInfo?.name || "User"}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {userInfo?.role ? userInfo.role.toUpperCase() : "STAFF"}
          </Text>
        </View>
      </Surface>

      {/* Stats section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3.5y</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
      </View>

      {/* Menu options */}
      <Surface style={[styles.menuContainer, { elevation: 2 }]}>
        <List.Section>
          <List.Item
            title="My Profile"
            description="Update your personal information"
            left={(props) => (
              <List.Icon
                {...props}
                icon="account"
                color={theme.colors.primary}
              />
            )}
            onPress={() => router.push("/profile/edit")}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Active Orders"
            description="View your current orders"
            left={(props) => (
              <List.Icon
                {...props}
                icon="clipboard-list"
                color={theme.colors.primary}
              />
            )}
            onPress={() => router.push("/staff/active-orders")}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Completed Orders"
            description="View order history"
            left={(props) => (
              <List.Icon
                {...props}
                icon="clipboard-check"
                color={theme.colors.primary}
              />
            )}
            onPress={() => router.push("/staff/completed-orders")}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Tables"
            description="Manage restaurant tables"
            left={(props) => (
              <List.Icon
                {...props}
                icon="table-chair"
                color={theme.colors.primary}
              />
            )}
            onPress={() => router.push("/staff/tables")}
            style={styles.listItem}
          />
        </List.Section>
      </Surface>

      {/* Logout button */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          loading={loading}
          disabled={loading}
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonText}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    maxWidth: "80%",
  },
  roleBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1976D2",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#757575",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  menuContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 10,
  },
  divider: {
    marginHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  logoutButton: {
    borderColor: "#F44336",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 4,
  },
  logoutButtonText: {
    color: "#F44336",
    fontSize: 14,
  },
});
