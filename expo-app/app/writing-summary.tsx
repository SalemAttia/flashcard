import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WritingSummary } from "../src/components/WritingTest/WritingSummary";
import { getLevelConfig, WRITING_LEVELS } from "../src/constants/writingLevels";
import { useDecks } from "../src/store/useDecks";
import { WritingTestResult, WritingLevel } from "../src/types";

const WRITING_RESULT_KEY = "writing_test_last_result";

export default function WritingSummaryScreen() {
  const [result, setResult] = useState<WritingTestResult | null>(null);
  const { getDeck } = useDecks();

  useEffect(() => {
    AsyncStorage.getItem(WRITING_RESULT_KEY).then((raw) => {
      if (raw) {
        try {
          setResult(JSON.parse(raw));
        } catch { }
      }
    });
  }, []);

  if (!result) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  const levelConfig = getLevelConfig(result.level);
  const deck = result.deckId ? getDeck(result.deckId) : null;

  const levelIndex = WRITING_LEVELS.findIndex(
    (l) => l.value === result.level
  );
  const nextLevel =
    levelIndex < WRITING_LEVELS.length - 1
      ? WRITING_LEVELS[levelIndex + 1]
      : null;

  const handleRetry = () => {
    const params: Record<string, string> = { level: result.level };
    if (result.deckId) params.deckId = result.deckId;
    router.replace({ pathname: "/writing-session", params });
  };

  const handleNextLevel = () => {
    if (!nextLevel) return;
    const params: Record<string, string> = { level: nextLevel.value };
    if (result.deckId) params.deckId = result.deckId;
    router.replace({ pathname: "/writing-session", params });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <WritingSummary
        result={result}
        levelConfig={levelConfig}
        deckTitle={deck?.title}
        onHome={() => router.replace("/")}
        onRetry={handleRetry}
        onNextLevel={nextLevel ? handleNextLevel : null}
      />
    </SafeAreaView>
  );
}
