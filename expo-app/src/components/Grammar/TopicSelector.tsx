import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  ChevronRight,
  HelpCircle,
  Sparkles,
  Bookmark,
  Trash2,
} from "lucide-react-native";
import {
  GRAMMAR_TOPICS,
  GrammarTopicConfig,
} from "../../constants/grammarTopics";
import { GrammarTopicId, SavedCustomTopic } from "../../types";
import { GrammarExplainer } from "./GrammarExplainer";
import { generateGrammarTopicTitle } from "../../services/grammarService";

interface TopicSelectorProps {
  selectedTopic: GrammarTopicId | null;
  onSelectTopic: (topicId: GrammarTopicId) => void;
  customTopic: string;
  onChangeCustomTopic: (text: string) => void;
  questionCount: number;
  onChangeQuestionCount: (count: number) => void;
  onStart: () => void;
  savedTopics: SavedCustomTopic[];
  onSaveTopic: (title: string, description: string) => void;
  onDeleteSavedTopic: (id: string) => void;
  onSelectSavedTopic: (topic: SavedCustomTopic) => void;
  selectedSavedTopicId: string | null;
}

const TOPIC_COLORS: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-300 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/40",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-300 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-900/40",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-300 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 dark:bg-rose-900/40",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/40",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-cyan-300 dark:border-cyan-800",
    text: "text-cyan-700 dark:text-cyan-400",
    badge: "bg-cyan-100 dark:bg-cyan-900/40",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-300 dark:border-indigo-800",
    text: "text-indigo-700 dark:text-indigo-400",
    badge: "bg-indigo-100 dark:bg-indigo-900/40",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-300 dark:border-pink-800",
    text: "text-pink-700 dark:text-pink-400",
    badge: "bg-pink-100 dark:bg-pink-900/40",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    border: "border-teal-300 dark:border-teal-800",
    text: "text-teal-700 dark:text-teal-400",
    badge: "bg-teal-100 dark:bg-teal-900/40",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-300 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-900/40",
  },
  lime: {
    bg: "bg-lime-50 dark:bg-lime-950/20",
    border: "border-lime-300 dark:border-lime-800",
    text: "text-lime-700 dark:text-lime-400",
    badge: "bg-lime-100 dark:bg-lime-900/40",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-300 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-400",
    badge: "bg-sky-100 dark:bg-sky-900/40",
  },
  fuchsia: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    border: "border-fuchsia-300 dark:border-fuchsia-800",
    text: "text-fuchsia-700 dark:text-fuchsia-400",
    badge: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-900/40",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-300 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 dark:bg-yellow-900/40",
  },
  stone: {
    bg: "bg-stone-50 dark:bg-stone-950/20",
    border: "border-stone-300 dark:border-stone-800",
    text: "text-stone-700 dark:text-stone-400",
    badge: "bg-stone-100 dark:bg-stone-900/40",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-300 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-400",
    badge: "bg-purple-100 dark:bg-purple-900/40",
  },
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
  savedTopics,
  onSaveTopic,
  onDeleteSavedTopic,
  onSelectSavedTopic,
  selectedSavedTopicId,
}: TopicSelectorProps) {
  const hasCustomTopic = customTopic.trim().length > 0;
  const canStart = selectedTopic || hasCustomTopic;
  const [explainerTopic, setExplainerTopic] =
    useState<GrammarTopicConfig | null>(null);
  const [explainerCustomLabel, setExplainerCustomLabel] = useState<
    string | null
  >(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [rawDescription, setRawDescription] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleGenerateTitle = async () => {
    if (customTopic.trim().length < 4 || isGeneratingTitle) return;
    setRawDescription(customTopic.trim());
    setIsGeneratingTitle(true);
    setSuggestedTitle(null);
    try {
      const title = await generateGrammarTopicTitle(customTopic.trim());
      setSuggestedTitle(title);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleUseSuggestedTitle = () => {
    if (!suggestedTitle) return;
    onChangeCustomTopic(suggestedTitle);
    setSuggestedTitle(null);
  };

  const handleSaveTopic = () => {
    if (customTopic.trim().length < 4) return;
    onSaveTopic(customTopic.trim(), rawDescription || customTopic.trim());
    setSavedFeedback(true);
    setSuggestedTitle(null);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
      <GrammarExplainer
        visible={!!explainerTopic || !!explainerCustomLabel}
        topicLabel={explainerTopic?.label || explainerCustomLabel || ""}
        topicLabelDa={explainerTopic?.labelDa}
        onClose={() => {
          setExplainerTopic(null);
          setExplainerCustomLabel(null);
        }}
      />

      {/* Custom topic input */}
      <View>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Your Topic
        </Text>
        <Text className="text-xs text-slate-400 mb-3">
          Type any Danish grammar topic, or pick one below.
        </Text>

        {/* Input row with AI Title button */}
        <View className="flex-row items-center gap-2">
          <TextInput
            value={customTopic}
            onChangeText={(text) => {
              onChangeCustomTopic(text);
              setSuggestedTitle(null);
              if (text.trim()) onSelectTopic(null as any);
            }}
            placeholder="e.g. possessive pronouns, conjunctions..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white"
          />
          <Pressable
            onPress={handleGenerateTitle}
            disabled={customTopic.trim().length < 4 || isGeneratingTitle}
            className={`px-3 py-3 rounded-xl border-2 flex-row items-center gap-1.5 ${
              customTopic.trim().length >= 4 && !isGeneratingTitle
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            }`}
          >
            {isGeneratingTitle ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Sparkles
                size={16}
                color={customTopic.trim().length >= 4 ? "#4f46e5" : "#94a3b8"}
              />
            )}
            <Text
              className={`text-xs font-semibold ${
                customTopic.trim().length >= 4 && !isGeneratingTitle
                  ? "text-indigo-600"
                  : "text-slate-400"
              }`}
            >
              AI Title
            </Text>
          </Pressable>
        </View>

        {/* Suggested title row */}
        {suggestedTitle && (
          <View className="mt-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <Text className="text-xs text-indigo-500 mb-1 font-medium">
              Suggested title:
            </Text>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                {suggestedTitle}
              </Text>
              <Pressable
                onPress={handleUseSuggestedTitle}
                className="px-3 py-1.5 rounded-lg bg-indigo-500"
              >
                <Text className="text-white text-xs font-semibold">
                  Use this
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Save topic button */}
        {hasCustomTopic && (
          <Pressable
            onPress={handleSaveTopic}
            disabled={savedFeedback}
            className={`mt-2 flex-row items-center gap-2 px-4 py-2.5 rounded-xl border-2 self-start ${
              savedFeedback
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            }`}
          >
            <Bookmark size={14} color={savedFeedback ? "#059669" : "#64748b"} />
            <Text
              className={`text-xs font-semibold ${
                savedFeedback ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {savedFeedback ? "Saved!" : "Save Topic"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Saved custom topics */}
      {savedTopics.length > 0 && (
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            My Saved Topics
          </Text>
          <View className="gap-2">
            {savedTopics.map((topic) => {
              const isSelected = selectedSavedTopicId === topic.id;
              const colors = TOPIC_COLORS[topic.color] || TOPIC_COLORS.indigo;
              return (
                <Pressable
                  key={topic.id}
                  onPress={() => onSelectSavedTopic(topic)}
                  className={`p-3 rounded-xl border-2 flex-row items-center justify-between ${
                    isSelected
                      ? `${colors.bg} ${colors.border}`
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  }`}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View className="flex-1 mr-2">
                    <Text
                      className={`text-sm font-bold ${
                        isSelected
                          ? colors.text
                          : "text-slate-800 dark:text-white"
                      }`}
                    >
                      {topic.title}
                    </Text>
                    {topic.description !== topic.title && (
                      <Text className="text-xs text-slate-400 italic mt-0.5">
                        {topic.description}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setExplainerCustomLabel(topic.title);
                      }}
                      hitSlop={8}
                      className="p-1.5 rounded-full bg-indigo-50"
                    >
                      <HelpCircle size={15} color="#4f46e5" />
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onDeleteSavedTopic(topic.id);
                      }}
                      hitSlop={8}
                      className="p-1.5 rounded-full"
                    >
                      <Trash2 size={15} color="#94a3b8" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

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
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
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
                          isSelected
                            ? colors.text
                            : "text-slate-800 dark:text-white"
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
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-700"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
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
          canStart ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
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
