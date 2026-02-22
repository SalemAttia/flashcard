import React, { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GrammarSummary } from "../src/components/Grammar/GrammarSummary";
import { getTopicConfig, GRAMMAR_TOPICS } from "../src/constants/grammarTopics";
import { GrammarSessionResult } from "../src/types";

const GRAMMAR_RESULT_KEY = "grammar_last_result";

export default function GrammarSummaryScreen() {
  const [result, setResult] = useState<GrammarSessionResult | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(GRAMMAR_RESULT_KEY).then((raw) => {
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
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const isCustom = result.topicId === "custom";
  const topicConfig = isCustom
    ? null
    : GRAMMAR_TOPICS.find((t) => t.id === result.topicId) || null;

  const handleRetry = () => {
    const params: Record<string, string> = {
      questionCount: String(result.totalCount),
    };
    if (isCustom && result.customTopic) {
      params.customTopic = result.customTopic;
    } else {
      params.topicId = result.topicId;
    }
    router.replace({ pathname: "/grammar-session", params });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <GrammarSummary
        result={result}
        topicConfig={topicConfig}
        onHome={() => router.replace("/")}
        onRetry={handleRetry}
      />
    </SafeAreaView>
  );
}
