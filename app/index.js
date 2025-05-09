import { useContext, useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function Index() {
  const { isLoading, userToken, userInfo } = useContext(AuthContext);

  // Show loading indicator while checking authentication state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  // Redirect based on authentication status
  if (!userToken) {
    return <Redirect href="/login" />;
  }

  // Redirect based on user role
  if (userInfo?.role === "admin") {
    return <Redirect href="/admin/dashboard" />;
  } else {
    return <Redirect href="/staff/tables" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
