import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../../src/firebase/config";

export default function WaitlistScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function checkWaitlist() {
            if (!email) {
                setChecking(false);
                return;
            }
            try {
                const cleanEmail = email.trim().toLowerCase();
                const waitlistQuery = query(
                    collection(db, "waitlist"),
                    where("email", "==", cleanEmail),
                );
                const snapshot = await getDocs(waitlistQuery);
                if (!snapshot.empty) {
                    setJoined(true);
                }
            } catch (e) {
                console.error("Error checking waitlist:", e);
            } finally {
                setChecking(false);
            }
        }
        checkWaitlist();
    }, [email]);

    async function handleJoinWaitlist() {
        if (!email) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "waitlist"), {
                email: email.trim().toLowerCase(),
                status: "pending",
                createdAt: serverTimestamp(),
            });
            setJoined(true);
        } catch (e: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Could not join waitlist. Please try again.",
                position: "bottom"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white dark:bg-slate-950 px-6 justify-center"
        >
            <View className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 items-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <Text className="text-5xl mb-4">🚀</Text>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                    Closed Beta
                </Text>

                {checking ? (
                    <View className="items-center w-full py-8">
                        <ActivityIndicator color="#4f46e5" size="large" />
                        <Text className="text-slate-500 mt-4">
                            Checking waitlist status...
                        </Text>
                    </View>
                ) : joined ? (
                    <View className="items-center">
                        <Text className="text-base text-emerald-600 dark:text-emerald-400 text-center mb-8 font-medium">
                            You're on the list! We'll email you when your account is ready.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace("/(auth)/login")}
                            className="w-full h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl items-center justify-center px-8"
                        >
                            <Text className="text-slate-900 dark:text-white font-bold text-base">
                                Return to Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="items-center w-full">
                        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                            Our app is currently in limited closed beta, and it looks like{" "}
                            {email ? (
                                <Text className="font-bold text-indigo-600 dark:text-indigo-400 p-1">
                                    {email}
                                </Text>
                            ) : (
                                "your email"
                            )}{" "}
                            doesn't have access yet.
                        </Text>

                        <TouchableOpacity
                            onPress={handleJoinWaitlist}
                            disabled={loading}
                            className={`w-full h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-4 ${loading ? "opacity-60" : ""}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-base">
                                    Join Waitlist
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.replace("/(auth)/login")}
                            disabled={loading}
                        >
                            <Text className="text-slate-500 font-medium py-2">
                                Back to Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
