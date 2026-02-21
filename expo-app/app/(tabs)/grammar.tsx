import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TopicSelector } from "../../src/components/Grammar/TopicSelector";
import { GrammarTopicId } from "../../src/types";

export default function GrammarScreen() {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopicId | null>(
    null
  );
  const [customTopic, setCustomTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const handleStart = () => {
    const hasCustom = customTopic.trim().length > 0;
    if (!selectedTopic && !hasCustom) return;

    const params: Record<string, string> = {
      questionCount: String(questionCount),
    };

    if (hasCustom) {
      params.customTopic = customTopic.trim();
    } else if (selectedTopic) {
      params.topicId = selectedTopic;
    }

    router.push({ pathname: "/grammar-session", params });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="p-6 pb-2">
        <Text className="text-2xl font-semibold tracking-tight text-slate-900">
          Grammar
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          Choose a topic and test your grammar
        </Text>
      </View>

      <TopicSelector
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        customTopic={customTopic}
        onChangeCustomTopic={setCustomTopic}
        questionCount={questionCount}
        onChangeQuestionCount={setQuestionCount}
        onStart={handleStart}
      />
    </SafeAreaView>
  );
}
