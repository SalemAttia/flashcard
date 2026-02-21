import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { ChevronRight, HelpCircle } from "lucide-react-native";
import { GRAMMAR_TOPICS, GrammarTopicConfig } from "../../constants/grammarTopics";
import { GrammarTopicId } from "../../types";
import { GrammarExplainer } from "./GrammarExplainer";

interface TopicSelectorProps {
  selectedTopic: GrammarTopicId | null;
  onSelectTopic: (topicId: GrammarTopicId) => void;
  customTopic: string;
  onChangeCustomTopic: (text: string) => void;
  questionCount: number;
  onChangeQuestionCount: (count: number) => void;
  onStart: () => void;
}

const TOPIC_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", badge: "bg-emerald-100" },
  blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100" },
  violet: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", badge: "bg-violet-100" },
  rose: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", badge: "bg-rose-100" },
  amber: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700", badge: "bg-cyan-100" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", badge: "bg-indigo-100" },
  pink: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", badge: "bg-pink-100" },
  teal: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700", badge: "bg-teal-100" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", badge: "bg-orange-100" },
  lime: { bg: "bg-lime-50", border: "border-lime-300", text: "text-lime-700", badge: "bg-lime-100" },
  sky: { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-700", badge: "bg-sky-100" },
  fuchsia: { bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-700", badge: "bg-fuchsia-100" },
  red: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", badge: "bg-red-100" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100" },
  stone: { bg: "bg-stone-50", border: "border-stone-300", text: "text-stone-700", badge: "bg-stone-100" },
};

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

export function TopicSelector({
  selectedTopic,
  onSelectTopic,
  customTopic,
  onChangeCustomTopic,
  questionCount,
  onChangeQuestionCount,
  onStart,
}: TopicSelectorProps) {
  const hasCustomTopic = customTopic.trim().length > 0;
  const canStart = selectedTopic || hasCustomTopic;
  const [explainerTopic, setExplainerTopic] = useState<GrammarTopicConfig | null>(null);

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
      <GrammarExplainer
        visible={!!explainerTopic}
        topicLabel={explainerTopic?.label || ""}
        topicLabelDa={explainerTopic?.labelDa}
        onClose={() => setExplainerTopic(null)}
      />
      {/* Custom topic input */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Your Topic
        </Text>
        <Text className="text-xs text-slate-400 mb-3">
          Type any Danish grammar topic, or pick one below.
        </Text>
        <TextInput
          value={customTopic}
          onChangeText={(text) => {
            onChangeCustomTopic(text);
            if (text.trim()) onSelectTopic(null as any);
          }}
          placeholder="e.g. possessive pronouns, conjunctions..."
          placeholderTextColor="#94a3b8"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-800"
        />
      </View>

      {/* Preset topics */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Or Select a Topic
        </Text>
        <View className="gap-3">
          {GRAMMAR_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic.id && !hasCustomTopic;
            const colors = TOPIC_COLORS[topic.color] || TOPIC_COLORS.indigo;
            return (
              <Pressable
                key={topic.id}
                onPress={() => {
                  onSelectTopic(topic.id);
                  onChangeCustomTopic("");
                }}
                className={`p-4 rounded-2xl border-2 ${
                  isSelected
                    ? `${colors.bg} ${colors.border}`
                    : "bg-white border-slate-100"
                }`}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-bold ${
                          isSelected ? colors.text : "text-slate-800"
                        }`}
                      >
                        {topic.label}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          isSelected ? colors.badge : "bg-slate-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isSelected ? colors.text : "text-slate-500"
                          }`}
                        >
                          {topic.labelDa}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {topic.description}
                    </Text>
                    <Text className="text-xs text-slate-400 italic mt-1">
                      {topic.exampleSentence}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setExplainerTopic(topic);
                    }}
                    className="p-1.5 rounded-full bg-indigo-50 ml-2"
                    hitSlop={8}
                  >
                    <HelpCircle size={18} color="#4f46e5" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Question count */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Number of Questions
        </Text>
        <View className="flex-row gap-3">
          {QUESTION_COUNT_OPTIONS.map((count) => {
            const isSelected = questionCount === count;
            return (
              <Pressable
                key={count}
                onPress={() => onChangeQuestionCount(count)}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-400"
                    : "bg-white border-slate-100"
                }`}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text
                  className={`text-base font-bold ${
                    isSelected ? "text-indigo-600" : "text-slate-600"
                  }`}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Start button */}
      <Pressable
        onPress={onStart}
        disabled={!canStart}
        className={`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
          canStart ? "bg-indigo-500" : "bg-slate-200"
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed && canStart ? 0.98 : 1 }],
        })}
      >
        <Text
          className={`font-semibold ${
            canStart ? "text-white" : "text-slate-400"
          }`}
        >
          Start Quiz ({questionCount} questions)
        </Text>
        {canStart && <ChevronRight size={18} color="#fff" />}
      </Pressable>
    </ScrollView>
  );
}
