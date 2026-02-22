import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { X, Sparkles, BookOpen } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { generateGrammarExplanation } from "../../services/grammarService";

interface GrammarExplainerProps {
  visible: boolean;
  topicLabel: string;
  topicLabelDa?: string;
  onClose: () => void;
}

export function GrammarExplainer({
  visible,
  topicLabel,
  topicLabelDa,
  onClose,
}: GrammarExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const spinRotation = useSharedValue(0);

  useEffect(() => {
    if (visible && !explanation) {
      setLoading(true);
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );
      generateGrammarExplanation(topicLabel, topicLabelDa)
        .then((text) => {
          setExplanation(text);
          setLoading(false);
        })
        .catch(() => {
          setExplanation("Failed to load explanation.");
          setLoading(false);
        });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setExplanation(null);
    }
  }, [visible]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="p-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#64748b" />
          </Pressable>
          <View className="items-center flex-1">
            <View className="flex-row items-center gap-1">
              <BookOpen size={12} color="#4f46e5" />
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Grammar Refresher
              </Text>
            </View>
            <Text
              className="text-sm font-semibold text-slate-800 dark:text-white"
              numberOfLines={1}
            >
              {topicLabel}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center p-8 gap-6">
            <View className="relative items-center justify-center">
              <Animated.View
                style={[
                  spinStyle,
                  {
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: "#e0e7ff",
                    borderTopColor: "#4f46e5",
                  },
                ]}
              />
              <View className="absolute">
                <Sparkles size={24} color="#4f46e5" />
              </View>
            </View>
            <View className="items-center gap-2">
              <Text className="text-lg font-bold text-slate-800 dark:text-white">
                Loading refresher...
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-[240px]">
                AI is preparing a grammar explanation for you.
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="p-6 gap-4">
            {explanation && <MarkdownText text={explanation} />}

            <Pressable
              onPress={onClose}
              className="w-full py-4 bg-indigo-500 rounded-2xl items-center mt-4"
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text className="text-white font-semibold">
                Got it, start the quiz!
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <View className="gap-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} className="h-2" />;

        // Headers
        if (trimmed.startsWith("### ")) {
          return (
            <Text
              key={i}
              className="text-base font-bold text-slate-800 dark:text-white mt-2"
            >
              {cleanMarkdown(trimmed.slice(4))}
            </Text>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <Text
              key={i}
              className="text-lg font-bold text-slate-800 dark:text-indigo-400 mt-3"
            >
              {cleanMarkdown(trimmed.slice(3))}
            </Text>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <Text
              key={i}
              className="text-xl font-bold text-slate-800 dark:text-indigo-500 mt-3"
            >
              {cleanMarkdown(trimmed.slice(2))}
            </Text>
          );
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <View key={i} className="flex-row gap-2 pl-2">
              <Text className="text-slate-400">•</Text>
              <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5 flex-1">
                {cleanMarkdown(trimmed.slice(2))}
              </Text>
            </View>
          );
        }

        // Numbered lists
        const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            <View key={i} className="flex-row gap-2 pl-2">
              <Text className="text-sm text-indigo-500 dark:text-indigo-400 font-bold min-w-[20px]">
                {numberedMatch[1]}.
              </Text>
              <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5 flex-1">
                {cleanMarkdown(numberedMatch[2])}
              </Text>
            </View>
          );
        }

        // Table rows (simple pipe-separated)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          if (trimmed.match(/^\|[-\s|:]+\|$/)) return null; // separator row
          const cells = trimmed
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim());
          return (
            <View
              key={i}
              className="flex-row border-b border-slate-100 dark:border-slate-800 py-1 px-2"
            >
              {cells.map((cell, ci) => (
                <Text
                  key={ci}
                  className={`flex-1 text-sm ${
                    i === 0
                      ? "font-bold text-slate-700 dark:text-slate-200"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {cleanMarkdown(cell)}
                </Text>
              ))}
            </View>
          );
        }

        // Regular paragraph
        return (
          <Text
            key={i}
            className="text-sm text-slate-700 dark:text-slate-300 leading-5"
          >
            {cleanMarkdown(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1");
}
