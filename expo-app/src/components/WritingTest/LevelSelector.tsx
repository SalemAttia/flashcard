import React from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { WRITING_LEVELS, LevelConfig } from "../../constants/writingLevels";
import { WritingLevel, Deck } from "../../types";

interface LevelSelectorProps {
  selectedLevel: WritingLevel | null;
  onSelectLevel: (level: WritingLevel) => void;
  decks: Deck[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  topic: string;
  onChangeTopic: (topic: string) => void;
  onStart: () => void;
}

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/40" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-300 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-900/40" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-300 dark:border-violet-800", text: "text-violet-700 dark:text-violet-400", badge: "bg-violet-100 dark:bg-violet-900/40" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-300 dark:border-rose-800", text: "text-rose-700 dark:text-rose-400", badge: "bg-rose-100 dark:bg-rose-900/40" },
};

const SUGGESTED_TOPICS = [
  "Familie og venner",
  "Mad og drikke",
  "Arbejde og uddannelse",
  "Ferie og rejser",
  "Natur og miljø",
  "By og nabolag",
  "Sundhed og sport",
  "Teknologi",
];

export function LevelSelector({
  selectedLevel,
  onSelectLevel,
  decks,
  selectedDeckId,
  onSelectDeck,
  topic,
  onChangeTopic,
  onStart,
}: LevelSelectorProps) {
  const danishDecks = decks.filter(
    (d) => d.backLang === "da-DK" && d.cards.length > 0
  );

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
      {/* Level selection */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Select Level
        </Text>
        <View className="gap-3">
          {WRITING_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.value;
            const colors = LEVEL_COLORS[level.color];
            return (
              <Pressable
                key={level.value}
                onPress={() => onSelectLevel(level.value)}
                className={`p-4 rounded-2xl border-2 ${isSelected
                    ? `${colors.bg} ${colors.border}`
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  }`}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-bold ${isSelected ? colors.text : "text-slate-800 dark:text-white"
                          }`}
                      >
                        {level.label}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${isSelected ? colors.badge : "bg-slate-100"
                          }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${isSelected ? colors.text : "text-slate-500"
                            }`}
                        >
                          {level.sublabel}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {level.description}
                    </Text>
                    <Text className="text-[10px] text-slate-400 mt-1">
                      {level.promptCount} prompts · Min {level.minWords} words ·
                      Pass: {level.passMark}%
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={colors.text.replace("text-", "")} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Topic */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Topic (Optional)
        </Text>
        <Text className="text-xs text-slate-400 mb-3">
          Choose a theme for your writing prompts.
        </Text>
        <TextInput
          value={topic}
          onChangeText={onChangeTopic}
          placeholder="e.g. familie, mad, ferie..."
          placeholderTextColor="#94a3b8"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white mb-3"
        />
        <View className="flex-row flex-wrap gap-2">
          {SUGGESTED_TOPICS.map((t) => (
            <Pressable
              key={t}
              onPress={() => onChangeTopic(topic === t ? "" : t)}
              className={`px-3 py-1.5 rounded-full border ${topic === t
                  ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
            >
              <Text
                className={`text-xs font-medium ${topic === t ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Vocabulary deck (only for Danish decks) */}
      {danishDecks.length > 0 && (
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Vocabulary Context (Optional)
          </Text>
          <Text className="text-xs text-slate-400 mb-3">
            Pick a deck to seed prompts with its vocabulary.
          </Text>
          <View className="gap-2">
            <Pressable
              onPress={() => onSelectDeck(null)}
              className={`p-3 rounded-xl border-2 ${selectedDeckId === null
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                }`}
            >
              <Text
                className={`text-sm font-medium ${selectedDeckId === null ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                  }`}
              >
                No deck — generic prompts
              </Text>
            </Pressable>
            {danishDecks.map((deck) => (
              <Pressable
                key={deck.id}
                onPress={() => onSelectDeck(deck.id)}
                className={`p-3 rounded-xl border-2 ${selectedDeckId === deck.id
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  }`}
              >
                <Text
                  className={`text-sm font-medium ${selectedDeckId === deck.id
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-400"
                    }`}
                >
                  {deck.title}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  {deck.cards.length} cards
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={onStart}
        disabled={!selectedLevel}
        className={`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 ${selectedLevel ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
          }`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed && selectedLevel ? 0.98 : 1 }],
        })}
      >
        <Text
          className={`font-semibold ${selectedLevel ? "text-white" : "text-slate-400"
            }`}
        >
          Start Writing Exam
        </Text>
        {selectedLevel && <ChevronRight size={18} color="#fff" />}
      </Pressable>
    </ScrollView>
  );
}
