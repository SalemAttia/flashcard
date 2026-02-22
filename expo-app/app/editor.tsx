import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { useDecks } from "../src/store/useDecks";
import { DeckEditor } from "../src/components/DeckEditor";

export default function EditorScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const { getDeck, saveDeck, deleteDeck, loaded } = useDecks();

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const deck = deckId ? getDeck(deckId) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="flex-1 w-full max-w-2xl self-center">
      <DeckEditor
        deck={deck}
        onSave={(deckData) => {
          saveDeck(deckData, deckId || null);
          Toast.show({
            type: "success",
            text1: deckId ? "Deck updated successfully" : "New deck created",
          });
          router.replace("/");
        }}
        onCancel={() => router.back()}
        onDelete={(id) => {
          deleteDeck(id);
          Toast.show({ type: "success", text1: "Deck deleted" });
          router.replace("/");
        }}
      />
      </View>
    </SafeAreaView>
  );
}
