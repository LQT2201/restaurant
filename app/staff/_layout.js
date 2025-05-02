import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "bold",
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "rgba(0, 0, 0, 0.6)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="tables"
        options={{
          title: "QUẢN LÝ BÀN",
          tabBarLabel: "BÀN",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="table" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active-orders"
        options={{
          title: "ĐƠN HÀNG ĐANG XỬ LÝ",
          tabBarLabel: "ĐANG XỬ LÝ",
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
          tabBarLabel: "HOÀN THÀNH",
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
          title: "HỒ SƠ",
          tabBarLabel: "HỒ SƠ",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          title: "TẠO ĐƠN HÀNG",
          href: null,
          headerStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#000000",
          headerTitleStyle: {
            fontWeight: "bold",
            textTransform: "uppercase",
          },
        }}
      />
      <Tabs.Screen
        name="order-details"
        options={{
          title: "CHI TIẾT ĐƠN HÀNG",
          href: null,
          headerStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#000000",
          headerTitleStyle: {
            fontWeight: "bold",
            textTransform: "uppercase",
          },
        }}
      />
      <Tabs.Screen
        name="add-items"
        options={{
          title: "THÊM MÓN",
          href: null,
          headerStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#000000",
          headerTitleStyle: {
            fontWeight: "bold",
            textTransform: "uppercase",
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: "#000000",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
