import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button, Text, Surface, Title } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const user = await login(username, password);
      if (user) {
        if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/staff/tables");
        }
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message || "An error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Logging in...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.background}>
          <Surface style={styles.surface}>
            <Image
              source={require("../assets/re.jpg")} // Thay bằng đường dẫn hình ảnh của bạn
              style={styles.logo}
              resizeMode="contain"
            />

            <Title style={styles.title}>Welcome Back</Title>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.formContainer}>
              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                disabled={loading}
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: "#6200ee" } }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                mode="outlined"
                style={styles.input}
                disabled={loading}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? "eye-off" : "eye"}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
                theme={{ colors: { primary: "#6200ee" } }}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                loading={loading}
                disabled={loading}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                Sign In
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Forgot password?</Text>
                <Text
                  style={[styles.footerText, styles.footerLink]}
                  onPress={() => router.push("/register")}
                >
                  Create account
                </Text>
              </View>
            </View>
          </Surface>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  surface: {
    padding: 30,
    borderRadius: 16,
    elevation: 8,
    backgroundColor: "white",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#6200ee",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#757575",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    marginBottom: 20,
    backgroundColor: "white",
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6200ee",
    elevation: 2,
  },
  buttonLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContent: {
    height: 48,
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6200ee",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  footerText: {
    color: "#757575",
    fontSize: 14,
  },
  footerLink: {
    color: "#6200ee",
    fontWeight: "500",
  },
});
