import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Appearance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import {
  LogOut,
  User,
  Mail,
  Shield,
  Bell,
  CircleHelp,
  Moon,
  Sun,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

  const toggleDarkMode = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const menuItems: any[] = [
    {
      icon: colorScheme === "dark" ? Sun : Moon,
      label: "Dark Mode",
      color: "#6366F1",
      onPress: toggleDarkMode,
      value: colorScheme === "dark",
    },
    { icon: Shield, label: "Privacy & Security", color: "#3B82F6" },
    { icon: Bell, label: "Notifications", color: "#F59E0B" },
    { icon: CircleHelp, label: "Help & Support", color: "#10B981" },
  ];

  if (user?.email === "salem.at.ibrahim@gmail.com") {
    menuItems.unshift({
      icon: Shield,
      label: "Admin Dashboard",
      color: "#E11D48",
      onPress: () => router.push("/(tabs)/admin"),
      value: undefined,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="flex-1 w-full max-w-2xl self-center">
        <ScrollView className="flex-1 px-6 pt-8">
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
              <User size={48} color="#4F46E5" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              My Profile
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 mt-1">
              {user?.email}
            </Text>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
            <View className="p-4 border-b border-gray-50 dark:border-slate-800 flex-row items-center">
              <Mail size={20} color="#6B7280" />
              <View className="ml-3">
                <Text className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                  Email Address
                </Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  {user?.email}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
            Settings
          </Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                onPress={item.onPress}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className={`p-4 flex-row items-center justify-between ${index !== menuItems.length - 1 ? "border-b border-gray-50 dark:border-slate-800" : ""}`}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text className="ml-3 text-gray-700 dark:text-slate-200 font-medium">
                    {item.label}
                  </Text>
                </View>
                {item.label === "Dark Mode" ? (
                  <View
                    style={{
                      width: 44,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: item.value ? "#4f46e5" : "#e2e8f0",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#ffffff",
                        transform: [{ translateX: item.value ? 18 : 0 }],
                      }}
                    />
                  </View>
                ) : (
                  <View className="w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700" />
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => signOut()}
            className="bg-rose-50 flex-row items-center justify-center py-4 rounded-2xl border border-rose-100 mb-10 active:bg-rose-100"
          >
            <LogOut size={20} color="#E11D48" />
            <Text className="ml-2 text-rose-600 font-bold text-lg">Log Out</Text>
          </Pressable>

          <View className="items-center mb-10">
            <Text className="text-gray-300 text-xs font-medium">
              Flashcard App v1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
