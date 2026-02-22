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
import { useRouter } from "expo-router";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import { getFriendlyAuthError } from "../../src/utils/authErrors";

export default function RegisterScreen() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password) return;
    if (password !== confirm) {
      Toast.show({
        type: "error",
        text1: "Passwords don't match",
        text2: "Please make sure both passwords are identical.",
        position: "bottom"
      });
      return;
    }
    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password too short",
        text2: "Password must be at least 6 characters.",
        position: "bottom"
      });
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Always create account
      await signUp(email.trim(), password);

      // 2. Create user profile and add to waitlist
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Create the user profile document
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          email: cleanEmail,
          isApproved: false,
          createdAt: serverTimestamp(),
        });

        // Also add to waitlist for redundancy/interest tracking
        await addDoc(collection(db, "waitlist"), {
          email: cleanEmail,
          status: "pending",
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e: any) {
      if (e?.code === "auth/email-already-in-use") {
        try {
          // Try to sign in instead
          await signIn(email.trim(), password);
          // router.replace("/(tabs)"); // Layout handles this now
          return;
        } catch (signInError: any) {
          Toast.show({
            type: "error",
            text1: "Account already exists",
            text2: "It looks like you already have an account. Please sign in with your password.",
            position: "bottom",
            onPress: () => {
              router.replace({
                pathname: "/(auth)/login",
                params: { email: email.trim().toLowerCase() }
              });
              Toast.hide();
            }
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: getFriendlyAuthError(e),
          position: "bottom"
        });
      }
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
          Join the Beta
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Create an account to join the waitlist
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
          className="w-full h-14 bg-white dark:bg-slate-950 rounded-2xl px-4 mb-4 text-slate-900 dark:text-white text-base border border-slate-200 dark:border-slate-800"
          placeholder="Password (min. 6 characters)"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          className="w-full h-14 bg-white dark:bg-slate-950 rounded-2xl px-4 mb-5 text-slate-900 dark:text-white text-base border border-slate-200 dark:border-slate-800"
          placeholder="Confirm password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className={`w-full h-14 bg-indigo-600 rounded-2xl items-center justify-center ${loading ? "opacity-60" : ""}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-slate-500 text-sm">
            Already have an account?{" "}
            <Text className="text-indigo-600 font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
