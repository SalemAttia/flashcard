import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TopicSelector } from "../../src/components/Grammar/TopicSelector";
import { GrammarTopicId, SavedCustomTopic } from "../../src/types";
import { useCustomGrammarTopics } from "../../src/store/useCustomGrammarTopics";

export default function GrammarScreen() {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopicId | null>(
    null
  );
  const [customTopic, setCustomTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedSavedTopicId, setSelectedSavedTopicId] = useState<
    string | null
  >(null);

  const { topics: savedTopics, saveTopic, deleteTopic, markTopicUsed } =
    useCustomGrammarTopics();

  const handleSelectSavedTopic = (topic: SavedCustomTopic) => {
    setCustomTopic(topic.title);
    setSelectedTopic(null);
    setSelectedSavedTopicId(topic.id);
  };

  const handleStart = () => {
    const hasCustom = customTopic.trim().length > 0;
    if (!selectedTopic && !hasCustom) return;

    if (selectedSavedTopicId) {
      markTopicUsed(selectedSavedTopicId);
    }

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
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="p-6 pb-2">
        <Text className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Grammar
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Choose a topic and test your grammar
        </Text>
      </View>

      <TopicSelector
        selectedTopic={selectedTopic}
        onSelectTopic={(id) => {
          setSelectedTopic(id);
          setSelectedSavedTopicId(null);
        }}
        customTopic={customTopic}
        onChangeCustomTopic={(text) => {
          setCustomTopic(text);
          setSelectedSavedTopicId(null);
        }}
        questionCount={questionCount}
        onChangeQuestionCount={setQuestionCount}
        onStart={handleStart}
        savedTopics={savedTopics}
        onSaveTopic={saveTopic}
        onDeleteSavedTopic={deleteTopic}
        onSelectSavedTopic={handleSelectSavedTopic}
        selectedSavedTopicId={selectedSavedTopicId}
      />
    </SafeAreaView>
  );
}
