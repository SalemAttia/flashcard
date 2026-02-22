import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useDecks } from "../src/store/useDecks";
import { TestMode } from "../src/components/TestMode";

export default function TestScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { getDeck, markStudied, loaded } = useDecks();

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
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
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      edges={["top"]}
    >
      <View className="flex-1 w-full max-w-2xl self-center">
      <TestMode
        deck={deck}
        onComplete={(correct, total) => {
          markStudied(deck.id);
          router.replace(
            `/summary?correct=${correct}&total=${total}&isTest=true&deckId=${deck.id}`,
          );
        }}
        onCancel={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
      />
      </View>
    </SafeAreaView>
  );
}
