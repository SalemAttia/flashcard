import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import { getFriendlyAuthError } from "../../src/utils/authErrors";
import { Sparkles } from "lucide-react-native";

export default function LoginScreen() {
  const { email: initialEmail } = useLocalSearchParams<{ email: string }>();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Attempt login
      await signIn(email.trim(), password);
      // Layout guard handles routing based on approval status
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: getFriendlyAuthError(e),
        position: "bottom",
      });
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
        <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl items-center justify-center mb-6 shadow-sm">
          <Sparkles size={40} color="#4f46e5" />
        </View>
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
