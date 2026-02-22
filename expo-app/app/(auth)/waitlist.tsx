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
import { useAuth } from "../../src/context/AuthContext";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { Rocket } from "lucide-react-native";

export default function WaitlistScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { email: paramEmail } = useLocalSearchParams<{ email: string }>();

    // Prioritize auth email over param email
    const email = user?.email || paramEmail;

    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (user) {
            // If authenticated and on this screen, they are definitely "on the list" (profile exists but not approved)
            setJoined(true);
            setChecking(false);
            return;
        }

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
    }, [email, user]);

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

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
            router.replace("/(auth)/login");
        } catch (e) {
            console.error("Sign out error:", e);
        } finally {
            setLoading(false);
        }
    };

    const navigateToLogin = () => {
        if (user) {
            handleSignOut();
        } else {
            router.replace({
                pathname: "/(auth)/login",
                params: { email: email?.trim().toLowerCase() }
            });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white dark:bg-slate-950 px-6 justify-center"
        >
            <View className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-8 items-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl items-center justify-center mb-6 shadow-sm">
                    <Rocket size={40} color="#4f46e5" />
                </View>
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
                        <Text className="text-base text-slate-600 dark:text-slate-400 text-center mb-8 font-medium">
                            You are on the waiting list and we should approve you soon or send email to{" "}
                            <Text className="text-indigo-600 font-bold">salem.at.ibrahim@gmail.com</Text>{" "}
                            to be approved faster.
                        </Text>

                        {!user && (
                            <TouchableOpacity
                                onPress={navigateToLogin}
                                disabled={loading}
                                className={`w-full h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl items-center justify-center px-8 ${loading ? "opacity-60" : ""}`}
                            >
                                <Text className="text-slate-900 dark:text-white font-bold text-base">
                                    Return to Login
                                </Text>
                            </TouchableOpacity>
                        )}
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
                            onPress={navigateToLogin}
                            disabled={loading}
                            className="py-2"
                        >
                            <Text className="text-slate-500 font-medium">
                                {user ? (
                                    <Text>Switch account? <Text className="text-indigo-600">Sign out</Text></Text>
                                ) : (
                                    <Text>Already have an account? <Text className="text-indigo-600">Sign in</Text></Text>
                                )}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
