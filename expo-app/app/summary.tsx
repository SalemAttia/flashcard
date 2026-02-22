import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useDecks } from "../src/store/useDecks";
import { Summary } from "../src/components/Summary";

export default function SummaryScreen() {
  const { correct, total, isTest, deckId } = useLocalSearchParams<{
    correct: string;
    total: string;
    isTest: string;
    deckId: string;
  }>();
  const { getDeck } = useDecks();

  const deck = getDeck(deckId!);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="flex-1 w-full max-w-2xl self-center">
      <Summary
        results={{
          correct: parseInt(correct || "0", 10),
          total: parseInt(total || "1", 10),
        }}
        deckTitle={deck?.title || ""}
        onHome={() => router.replace("/")}
        onRetry={() => {
          const route = isTest === "true" ? "/test" : "/study";
          router.replace(`${route}?deckId=${deckId}`);
        }}
      />
      </View>
    </SafeAreaView>
  );
}
