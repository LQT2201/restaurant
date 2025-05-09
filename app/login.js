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
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Input animation values
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const usernameAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;

  // Background animation
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations when component mounts
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

    // Start background animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Handle input focus animations
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
    // Vibrate device for error feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Create a sequence of movements for shake effect
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

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      shakeAnimation();
      return;
    }

    // Button press feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Login animation
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
      const user = await login(username, password);
      if (user) {
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
          if (user.role === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/staff/tables");
          }
        });
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
        shakeAnimation();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message || "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại."
      );
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  // Interpolate background colors for animation
  const backgroundColorTop = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#4a00e0", "#8e2de2"],
  });

  const backgroundColorBottom = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#8e2de2", "#4a00e0"],
  });

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
            Đang đăng nhập...
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
        {/* Animated Background */}
        <Animated.View style={[StyleSheet.absoluteFill]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: backgroundColorTop,
              },
            ]}
          />
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backgroundPattern]}
          >
            <ImageBackground
              source={require("../assets/res.jpg")}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </Animated.View>
        </Animated.View>

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

              <Title style={styles.title}>Chào Mừng Trở Lại</Title>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

              <View style={styles.formContainer}>
                {/* Enhanced Username Input */}
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
                    <TextInput.Icon icon="account" color="#6200ee" />
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

                {/* Enhanced Password Input */}
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
                    onPress={handleLogin}
                    style={styles.button}
                    loading={loading}
                    disabled={loading}
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                  >
                    Đăng Nhập
                  </Button>
                </Animated.View>

                <View style={styles.footer}>
                  <Text
                    style={styles.footerText}
                    onPress={() => {
                      Haptics.selectionAsync();
                    }}
                  >
                    Quên mật khẩu?
                  </Text>
                  <Text
                    style={[styles.footerText, styles.footerLink]}
                    onPress={() => {
                      Haptics.selectionAsync();

                      // Fade out animation before navigation
                      Animated.parallel([
                        Animated.timing(fadeAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: true,
                        }),
                        Animated.timing(slideAnim, {
                          toValue: 50,
                          duration: 300,
                          useNativeDriver: true,
                        }),
                      ]).start(() => {
                        router.push("/register");
                      });
                    }}
                  >
                    Tạo tài khoản
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
  },
  backgroundPattern: {
    opacity: 0.8,
  },
  backgroundImage: {
    flex: 1,
  },
  surface: {
    padding: 30,
    borderRadius: 24, // More rounded corners
    elevation: 12, // Increased elevation
    backgroundColor: "white",
    shadowColor: "#6200ee", // Purple shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 50, // Make logo circular
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
    borderRadius: 12, // More rounded button
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
    letterSpacing: 0.5, // Slight letter spacing for better readability
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
