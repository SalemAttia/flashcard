import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus, PenLine, ChevronRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useDecks } from "../src/store/useDecks";
import { DeckList } from "../src/components/DeckList";

export default function HomeScreen() {
  const { decks, loaded } = useDecks();

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="p-6 pb-2">
        <Text className="text-2xl font-semibold tracking-tight text-slate-900">
          Decks
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          Master your learning, card by card.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <DeckList
          decks={decks}
          onEdit={(deck) => router.push(`/editor?deckId=${deck.id}`)}
          onStudy={(deck) => {
            if (deck.cards.length === 0) {
              Toast.show({
                type: "error",
                text1: "Add some cards to this deck first!",
              });
              return;
            }
            router.push(`/study?deckId=${deck.id}`);
          }}
          onTest={(deck) => {
            if (deck.cards.length < 2) {
              Toast.show({
                type: "error",
                text1: "You need at least 2 cards for a test!",
              });
              return;
            }
            router.push(`/test?deckId=${deck.id}`);
          }}
        />

        <View className="mt-6 mb-2">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Exam Mode
          </Text>
          <Pressable
            onPress={() => router.push("/writing-test")}
            className="w-full bg-amber-50 border border-amber-200 py-5 px-5 rounded-2xl flex-row items-center gap-4"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center">
              <PenLine size={20} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-800">
                Danish Writing Exam
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                A1 → B2 · AI-graded · Prøve i Dansk
              </Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        </View>
      </ScrollView>

      <View className="p-6 border-t border-slate-100 bg-white">
        <Pressable
          onPress={() => router.push("/editor")}
          className="w-full bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium">New Study Set</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
