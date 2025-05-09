import React, { useContext } from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "react-native-paper";

export default function AdminLayout() {
  const { userInfo, logout } = useContext(AuthContext);
  const router = useRouter();

  // Chuyển hướng đến trang đăng nhập nếu chưa xác thực hoặc không phải admin
  if (!userInfo || userInfo.role !== "admin") {
    router.replace("/login");
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerRight: () => (
          <Button
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            style={{ marginRight: 10 }}
          >
            Đăng Xuất
          </Button>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Bảng Điều Khiển",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: "Bàn",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="table-restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Thực Đơn",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant-menu" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: "Nhân Viên",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Báo Cáo",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="insert-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
