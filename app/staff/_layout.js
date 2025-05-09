import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Colors } from "../../constants/Colors";

export default function StaffLayout() {
  const theme = useTheme();
  const isDark = theme.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface,
          borderTopColor: isDark ? Colors.dark.border : Colors.light.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isDark
          ? Colors.dark.primary
          : Colors.light.primary,
        tabBarInactiveTintColor: isDark
          ? Colors.dark.textSecondary
          : Colors.light.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="tables"
        options={{
          title: "QUẢN LÝ BÀN",
          tabBarLabel: "Bàn",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="table" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active-orders"
        options={{
          title: "ĐƠN HÀNG ĐANG XỬ LÝ",
          tabBarLabel: "Đang xử lý",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clock-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="completed-orders"
        options={{
          title: "ĐƠN HÀNG HOÀN THÀNH",
          tabBarLabel: "Hoàn thành",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarLabel: "Hồ sơ",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          title: "Tạo đơn hàng",
          href: null,
          headerStyle: {
            backgroundColor: isDark
              ? Colors.dark.surface
              : Colors.light.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
          headerTitleStyle: {},
        }}
      />
      <Tabs.Screen
        name="order-details"
        options={{
          title: "Chi tiết đơn hàng",
          href: null,
          headerStyle: {
            backgroundColor: isDark
              ? Colors.dark.surface
              : Colors.light.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
          headerTitleStyle: {},
        }}
      />
      <Tabs.Screen
        name="add-items"
        options={{
          title: "Thêm món",
          href: null,
          headerStyle: {
            backgroundColor: isDark
              ? Colors.dark.surface
              : Colors.light.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
          headerTitleStyle: {},
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 0,
    shadowOpacity: 0,
  },
});
