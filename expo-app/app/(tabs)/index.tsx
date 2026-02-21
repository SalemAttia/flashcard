import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useDecks } from "../../src/store/useDecks";
import { DeckList } from "../../src/components/DeckList";

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
