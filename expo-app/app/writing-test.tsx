import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useDecks } from "../src/store/useDecks";
import { LevelSelector } from "../src/components/WritingTest/LevelSelector";
import { WritingLevel } from "../src/types";

export default function WritingTestScreen() {
  const { decks } = useDecks();
  const [selectedLevel, setSelectedLevel] = useState<WritingLevel | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedLevel) return;
    const params: Record<string, string> = { level: selectedLevel };
    if (selectedDeckId) params.deckId = selectedDeckId;
    router.push({ pathname: "/writing-session", params });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="p-4 flex-row items-center gap-3 border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>
        <View>
          <Text className="text-lg font-bold text-slate-900">
            Danish Writing Exam
          </Text>
          <Text className="text-xs text-slate-500">
            🇩🇰 Choose your level and start writing
          </Text>
        </View>
      </View>

      <LevelSelector
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        decks={decks}
        selectedDeckId={selectedDeckId}
        onSelectDeck={setSelectedDeckId}
        onStart={handleStart}
      />
    </SafeAreaView>
  );
}
