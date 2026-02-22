import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="editor"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="study"
        options={{
          animation: "slide_from_right",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="test" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="summary"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="writing-session"
        options={{
          animation: "slide_from_right",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="writing-summary"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="grammar-session"
        options={{
          animation: "slide_from_right",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="grammar-summary"
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <RootNavigator />
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
