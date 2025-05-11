import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
} from "react-native";
import { TextInput, Button, Text, Surface, Title } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import * as Haptics from "expo-haptics";
import { addStaff } from "../database/staffOperations";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Input animation values
  const [nameFocused, setNameFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const nameAnim = useRef(new Animated.Value(0)).current;
  const usernameAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle input focus animations
  useEffect(() => {
    Animated.timing(nameAnim, {
      toValue: nameFocused || name.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [nameFocused, name]);

  useEffect(() => {
    Animated.timing(usernameAnim, {
      toValue: usernameFocused || username.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [usernameFocused, username]);

  useEffect(() => {
    Animated.timing(passwordAnim, {
      toValue: passwordFocused || password.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, password]);

  const shakeAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRegister = async () => {
    setError("");

    // Validate inputs
    if (!name || !username || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      shakeAnimation();
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      shakeAnimation();
      return;
    }

    // Button press feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Register animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });

    setLoading(true);
    try {
      const staffData = {
        name,
        username,
        password,
        role: "staff", // Default role for new registrations
      };

      await addStaff(staffData);

      // Success animation before navigation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace("/login");
      });
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.");
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={[styles.loadingText, { color: "#ffffff" }]}>
            Đang đăng ký...
          </Text>
        </Animated.View>
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
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            <Surface style={styles.surface}>
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Image
                  source={require("../assets/re.jpg")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>

              <Title style={styles.title}>Đăng Ký Tài Khoản</Title>
              <Text style={styles.subtitle}>Tạo tài khoản nhân viên mới</Text>

              <View style={styles.formContainer}>
                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Animated.View
                    style={[
                      styles.inputIconContainer,
                      {
                        backgroundColor: nameAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["#f0f0f0", "#ede7f6"],
                        }),
                      },
                    ]}
                  >
                    <TextInput.Icon icon="account" color="#6200ee" />
                  </Animated.View>
                  <View style={styles.textInputWrapper}>
                    <TextInput
                      label="Họ và tên"
                      value={name}
                      onChangeText={setName}
                      mode="flat"
                      style={[styles.input, nameFocused && styles.inputFocused]}
                      disabled={loading}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      theme={{
                        colors: {
                          primary: "#6200ee",
                          background: "transparent",
                        },
                      }}
                      underlineColor="transparent"
                      activeUnderlineColor="#6200ee"
                    />
                  </View>
                </View>

                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <Animated.View
                    style={[
                      styles.inputIconContainer,
                      {
                        backgroundColor: usernameAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["#f0f0f0", "#ede7f6"],
                        }),
                      },
                    ]}
                  >
                    <TextInput.Icon icon="account-circle" color="#6200ee" />
                  </Animated.View>
                  <View style={styles.textInputWrapper}>
                    <TextInput
                      label="Tên đăng nhập"
                      value={username}
                      onChangeText={setUsername}
                      mode="flat"
                      style={[
                        styles.input,
                        usernameFocused && styles.inputFocused,
                      ]}
                      autoCapitalize="none"
                      disabled={loading}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => setUsernameFocused(false)}
                      theme={{
                        colors: {
                          primary: "#6200ee",
                          background: "transparent",
                        },
                      }}
                      underlineColor="transparent"
                      activeUnderlineColor="#6200ee"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Animated.View
                    style={[
                      styles.inputIconContainer,
                      {
                        backgroundColor: passwordAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["#f0f0f0", "#ede7f6"],
                        }),
                      },
                    ]}
                  >
                    <TextInput.Icon icon="lock" color="#6200ee" />
                  </Animated.View>
                  <View style={styles.textInputWrapper}>
                    <TextInput
                      label="Mật khẩu"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secureTextEntry}
                      mode="flat"
                      style={[
                        styles.input,
                        passwordFocused && styles.inputFocused,
                      ]}
                      disabled={loading}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      right={
                        <TextInput.Icon
                          icon={secureTextEntry ? "eye-off" : "eye"}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSecureTextEntry(!secureTextEntry);
                          }}
                          color="#6200ee"
                        />
                      }
                      theme={{
                        colors: {
                          primary: "#6200ee",
                          background: "transparent",
                        },
                      }}
                      underlineColor="transparent"
                      activeUnderlineColor="#6200ee"
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Animated.View
                    style={[
                      styles.inputIconContainer,
                      {
                        backgroundColor: passwordAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["#f0f0f0", "#ede7f6"],
                        }),
                      },
                    ]}
                  >
                    <TextInput.Icon icon="lock-check" color="#6200ee" />
                  </Animated.View>
                  <View style={styles.textInputWrapper}>
                    <TextInput
                      label="Xác nhận mật khẩu"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={secureTextEntry}
                      mode="flat"
                      style={[
                        styles.input,
                        passwordFocused && styles.inputFocused,
                      ]}
                      disabled={loading}
                      theme={{
                        colors: {
                          primary: "#6200ee",
                          background: "transparent",
                        },
                      }}
                      underlineColor="transparent"
                      activeUnderlineColor="#6200ee"
                    />
                  </View>
                </View>

                {error ? (
                  <Animated.View
                    style={{
                      transform: [{ translateX: shakeAnim }],
                    }}
                  >
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}

                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }],
                    marginTop: 10,
                  }}
                >
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    style={styles.button}
                    loading={loading}
                    disabled={loading}
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                  >
                    Đăng Ký
                  </Button>
                </Animated.View>

                <View style={styles.footer}>
                  <Text
                    style={[styles.footerText, styles.footerLink]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push("/login");
                    }}
                  >
                    Đã có tài khoản? Đăng nhập
                  </Text>
                </View>
              </View>
            </Surface>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#6200ee",
  },
  surface: {
    padding: 30,
    borderRadius: 24,
    elevation: 12,
    backgroundColor: "white",
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#ede7f6",
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
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIconContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 15,
  },
  textInputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: "white",
    height: 56,
  },
  inputFocused: {
    backgroundColor: "#faf8ff",
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#6200ee",
    elevation: 4,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonContent: {
    height: 48,
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    padding: 10,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6200ee",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
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
