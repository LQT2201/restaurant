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
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "../context/AuthContext";
import { initDatabase } from "../database/database";

import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the database when app loads
    async function setupApp() {
      try {
        // Initialize database
        await initDatabase();
        setDbInitialized(true);
      } catch (error: any) {
        console.error("Database initialization error:", error);
        setDbError(error?.message || "Unknown database initialization error");
      }

      // Hide splash screen once everything is ready
      if (loaded) {
        SplashScreen.hideAsync();
      }
    }

    setupApp();
  }, [loaded]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <AuthProvider>
      <PaperProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Slot />
          <StatusBar style="auto" />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
