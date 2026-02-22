import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { X, Check, RotateCcw } from "lucide-react-native";
import * as Speech from "expo-speech";
import { Deck, Language } from "../types";
import { Flashcard } from "./Flashcard";

interface StudySessionProps {
  deck: Deck;
  onComplete: (correct: number, total: number) => void;
  onCancel: () => void;
}

export function StudySession({
  deck,
  onComplete,
  onCancel,
}: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>(
    [],
  );
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = deck.cards[currentIndex];
  const progress = (currentIndex / deck.cards.length) * 100;

  const handleSpeak = (text: string, lang: Language) => {
    Speech.speak(text, { language: lang });
  };

  const handleSwipe = (correct: boolean) => {
    const newResults = [...results, { id: currentCard.id, correct }];
    setResults(newResults);
    setIsFlipped(false);

    setTimeout(() => {
      if (currentIndex + 1 < deck.cards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const correctCount = newResults.filter((r) => r.correct).length;
        onComplete(correctCount, deck.cards.length);
      }
    }, 200);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={onCancel} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <View className="items-center">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Studying
          </Text>
          <Text
            className="font-semibold text-sm text-slate-900 dark:text-white"
            numberOfLines={1}
          >
            {deck.title}
          </Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Progress */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Progress
          </Text>
          <Text className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
            {currentIndex + 1} / {deck.cards.length}
          </Text>
        </View>
        <View className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            style={{ width: `${progress}%` }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </View>
      </View>

      {/* Card */}
      <View className="flex-1 items-center justify-center p-6">
        {currentCard && (
          <Flashcard
            key={currentCard.id}
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            frontLang={deck.frontLang}
            backLang={deck.backLang}
            onSpeak={handleSpeak}
          />
        )}
      </View>

      {/* Footer */}
      <View className="p-8 flex-row gap-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <Pressable
          onPress={() => handleSwipe(false)}
          className="flex-1 items-center justify-center gap-2 py-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <X size={28} color="#dc2626" />
          <Text className="text-xs text-red-600 font-semibold uppercase tracking-widest">
            Incorrect
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleSwipe(true)}
          className="flex-1 items-center justify-center gap-2 py-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Check size={28} color="#16a34a" />
          <Text className="text-xs text-green-600 font-semibold uppercase tracking-widest">
            Correct
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
