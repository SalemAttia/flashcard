import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

type WaitlistUser = {
  id: string;
  email: string;
  status: string;
  source: "waitlist" | "allowed";
};

export default function AdminScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  // Safety check: redirect non-admins immediately.
  useEffect(() => {
    if (authLoading) return;

    if (user?.email !== "salem.at.ibrahim@gmail.com") {
      router.replace("/(tabs)");
    }
  }, [user, authLoading]);

  const loadUsers = async () => {
    // Only show full loader if we have no users yet
    if (users.length === 0) setLoading(true);
    try {
      const waitlistSnap = await getDocs(collection(db, "waitlist"));
      const allowedSnap = await getDocs(collection(db, "allowed_users"));

      const combined: Record<string, WaitlistUser> = {};

      // Map waitlist users
      waitlistSnap.forEach((doc) => {
        const data = doc.data();
        combined[data.email] = {
          id: doc.id,
          email: data.email,
          status: data.status,
          source: "waitlist",
        };
      });

      // Map actual beta users (overwrite waitlist defaults if already in beta)
      allowedSnap.forEach((docSnap) => {
        const data = docSnap.data();
        combined[data.email] = {
          id: docSnap.id,
          email: data.email,
          status: data.status,
          source: "allowed",
        };
      });

      setUsers(Object.values(combined));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateStatus = async (
    email: string,
    newStatus: "enabled" | "disabled",
    currentSource: string,
    waitlistId: string,
  ) => {
    setUpdatingEmail(email);
    try {
      // Create or update the core allowed_users document (using email as ID for simpler lookups)
      await setDoc(
        doc(db, "allowed_users", email),
        {
          email: email,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      // 2. If they came from the waitlist, update that document too
      if (currentSource === "waitlist" && waitlistId) {
        await updateDoc(doc(db, "waitlist", waitlistId), {
          status: newStatus,
        });
      }

      // 3. Update the actual user profile if they have already registered
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (!userSnapshot.empty) {
        // They have a profile, update it
        const userDoc = userSnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          isApproved: newStatus === "enabled"
        });
      }

      setUpdatingEmail(null);
      await loadUsers(); // Refresh
      Alert.alert("Success", `${email} is now ${newStatus}`);
    } catch (e) {
      setUpdatingEmail(null);
      console.error(e);
      Alert.alert("Action Failed", "Could not update the user status.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950 px-4 pt-4">
      <View className="flex-1 w-full max-w-2xl self-center">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Beta Management
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.email}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 shadow-sm">
            <Text className="font-semibold text-base text-slate-800 dark:text-white mb-1">
              {item.email}
            </Text>
            <View className="flex-row items-center mb-4">
              <View
                className={`px-2 py-0.5 rounded-full ${item.status === "enabled" ? "bg-emerald-100 dark:bg-emerald-900/30" : item.status === "disabled" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}
              >
                <Text
                  className={`text-xs font-bold ${item.status === "enabled" ? "text-emerald-700 dark:text-emerald-400" : item.status === "disabled" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              {item.status !== "enabled" && (
                <TouchableOpacity
                  onPress={() =>
                    handleUpdateStatus(
                      item.email,
                      "enabled",
                      item.source,
                      item.id,
                    )
                  }
                  disabled={updatingEmail === item.email}
                  className={`flex-1 bg-indigo-600 py-2 rounded-lg items-center ${updatingEmail === item.email ? "opacity-50" : ""}`}
                >
                  <Text className="text-white font-medium text-sm">
                    {updatingEmail === item.email ? "Processing..." : "Enable Base Access"}
                  </Text>
                </TouchableOpacity>
              )}
              {item.status !== "disabled" && (
                <TouchableOpacity
                  onPress={() =>
                    handleUpdateStatus(
                      item.email,
                      "disabled",
                      item.source,
                      item.id,
                    )
                  }
                  disabled={updatingEmail === item.email}
                  className={`flex-1 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 py-2 rounded-lg items-center ${updatingEmail === item.email ? "opacity-50" : ""}`}
                >
                  <Text className="text-rose-600 dark:text-rose-400 font-medium text-sm">
                    {updatingEmail === item.email ? "..." : "Disable User"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
      </View>
    </SafeAreaView>
  );
}
