import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from "react-native-paper";
import { AuthProvider } from "../context/AuthContext";
import { initDatabase, dropAllTables } from "../database/database";
import { Colors } from "../constants/Colors";

import { useColorScheme } from "@/hooks/useColorScheme";

// Ngăn màn hình splash tự động ẩn trước khi tài nguyên được tải xong
SplashScreen.preventAutoHideAsync();

// Tạo theme cho Paper
const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.light.primary,
    secondary: Colors.light.accent,
    background: Colors.light.background,
    surface: Colors.light.surface,
    text: Colors.light.text,
    error: Colors.light.error,
  },
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.primary,
    secondary: Colors.dark.accent,
    background: Colors.dark.background,
    surface: Colors.dark.surface,
    text: Colors.dark.text,
    error: Colors.dark.error,
  },
};

// Tạo theme cho Navigation
const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function setupApp() {
      try {
        // await dropAllTables();
        await initDatabase();
        setDbInitialized(true);
      } catch (error: any) {
        console.error("Lỗi khởi tạo cơ sở dữ liệu:", error);
        setDbError(
          error?.message || "Lỗi khởi tạo cơ sở dữ liệu không xác định"
        );
      }

      if (loaded) {
        SplashScreen.hideAsync();
      }
    }

    setupApp();
  }, [loaded]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  const isDark = colorScheme === "dark";
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;
  const navigationTheme = isDark ? navigationDarkTheme : navigationLightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navigationTheme}>
          <Slot />
          <StatusBar style={isDark ? "light" : "dark"} />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
