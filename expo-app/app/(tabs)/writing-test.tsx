import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useDecks } from "../../src/store/useDecks";
import { LevelSelector } from "../../src/components/WritingTest/LevelSelector";
import { WritingLevel } from "../../src/types";

export default function WritingTestScreen() {
  const { decks } = useDecks();
  const [selectedLevel, setSelectedLevel] = useState<WritingLevel | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");

  const handleStart = () => {
    if (!selectedLevel) return;
    const params: Record<string, string> = { level: selectedLevel };
    if (selectedDeckId) params.deckId = selectedDeckId;
    if (topic.trim()) params.topic = topic.trim();
    router.push({ pathname: "/writing-session", params });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="p-6 pb-2">
        <Text className="text-2xl font-semibold tracking-tight text-slate-900">
          Writing
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          🇩🇰 Choose your level and start writing
        </Text>
      </View>

      <LevelSelector
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        decks={decks}
        selectedDeckId={selectedDeckId}
        onSelectDeck={setSelectedDeckId}
        topic={topic}
        onChangeTopic={setTopic}
        onStart={handleStart}
      />
    </SafeAreaView>
  );
}
