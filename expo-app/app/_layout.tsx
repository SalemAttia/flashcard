import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
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
          <Stack.Screen
            name="test"
            options={{ animation: "slide_from_right" }}
          />
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
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
