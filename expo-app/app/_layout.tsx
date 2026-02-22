import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "nativewind";

function RootNavigator() {
  const { user, loading, isAllowed } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const inAuthGroup = segments[0] === "(auth)";
  const onWaitlistPage = (segments as string[])[1] === "waitlist";

  useEffect(() => {
    if (loading) return;

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user) {
      if (isAllowed) {
        if (inAuthGroup) {
          router.replace("/(tabs)");
        }
      } else {
        if (!onWaitlistPage) {
          router.replace({
            pathname: "/(auth)/waitlist",
            params: { email: user.email || "" }
          });
        }
      }
    }
  }, [user, loading, isAllowed, segments]);

  // Strict guard: keep loading spinner visible until we are on the correct screen
  const isTransitioning =
    loading ||
    (!user && !inAuthGroup) ||
    (user && isAllowed && inAuthGroup) ||
    (user && !isAllowed && !onWaitlistPage);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} className={colorScheme === "dark" ? "dark bg-slate-950" : "bg-white"}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="editor" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen
            name="study"
            options={{
              animation: "slide_from_right",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="test" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="summary" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen
            name="writing-session"
            options={{
              animation: "slide_from_right",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="writing-summary" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen
            name="grammar-session"
            options={{
              animation: "slide_from_right",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="grammar-summary" options={{ animation: "slide_from_bottom" }} />
        </Stack>

        {isTransitioning && (
          <View
            style={StyleSheet.absoluteFill}
            className="bg-white dark:bg-slate-950 items-center justify-center"
          >
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <RootNavigator />
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
