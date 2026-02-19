import React from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useDecks } from "../src/store/useDecks";
import { StudySession } from "../src/components/StudySession";

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { getDeck, markStudied, loaded } = useDecks();

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const deck = getDeck(deckId!);
  if (!deck) {
    router.replace("/");
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <StudySession
        deck={deck}
        onComplete={(correct, total) => {
          markStudied(deck.id);
          router.replace(
            `/summary?correct=${correct}&total=${total}&isTest=false&deckId=${deck.id}`
          );
        }}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
