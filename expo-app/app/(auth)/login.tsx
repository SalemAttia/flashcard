import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { getFriendlyAuthError } from "../../src/utils/authErrors";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Login failed", getFriendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-slate-950 justify-center px-6"
    >
      <View className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 items-center border border-slate-100 dark:border-slate-800 shadow-sm">
        <Text className="text-5xl mb-4">🧠</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
          Welcome back
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Sign in to continue learning
        </Text>

        <TextInput
          className="w-full h-14 bg-white dark:bg-slate-950 rounded-2xl px-4 mb-4 text-slate-900 dark:text-white text-base border border-slate-200 dark:border-slate-800"
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="w-full h-14 bg-white dark:bg-slate-950 rounded-2xl px-4 mb-5 text-slate-900 dark:text-white text-base border border-slate-200 dark:border-slate-800"
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`w-full h-14 bg-indigo-600 rounded-2xl items-center justify-center ${loading ? "opacity-60" : ""}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-slate-500 text-sm">
            Don't have an account?{" "}
            <Text className="text-indigo-600 font-semibold">Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
