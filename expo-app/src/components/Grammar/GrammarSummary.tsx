import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Award, Home, RotateCcw, CheckCircle, XCircle } from "lucide-react-native";
import { GrammarSessionResult } from "../../types";
import { GrammarTopicConfig } from "../../constants/grammarTopics";

interface GrammarSummaryProps {
  result: GrammarSessionResult;
  topicConfig: GrammarTopicConfig | null;
  onHome: () => void;
  onRetry: () => void;
}

export function GrammarSummary({
  result,
  topicConfig,
  onHome,
  onRetry,
}: GrammarSummaryProps) {
  const topicLabel = result.customTopic || topicConfig?.label || "Grammar Quiz";
  const passed = result.scorePercent >= 70;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="p-6 gap-6 items-center"
    >
      {/* Hero */}
      <View
        className={`w-full p-8 rounded-3xl items-center gap-4 ${
          passed ? "bg-emerald-50" : "bg-red-50"
        }`}
      >
        <View
          className={`w-24 h-24 rounded-full items-center justify-center ${
            passed ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          <Award size={40} color={passed ? "#059669" : "#dc2626"} />
        </View>
        <View className="items-center gap-1">
          <Text
            className={`text-3xl font-black ${
              passed ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {result.scorePercent}%
          </Text>
          <Text
            className={`text-sm font-bold uppercase tracking-widest ${
              passed ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {passed ? "Great Job!" : "Keep Practicing"}
          </Text>
        </View>
        <Text className="text-xs text-slate-500">
          {topicLabel} · {result.correctCount}/{result.totalCount}{" "}
          correct
        </Text>
      </View>

      {/* Per-question breakdown */}
      <View className="w-full gap-3">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Question Breakdown
        </Text>
        {result.questions.map((question, i) => {
          const answer = result.answers[i];
          const isCorrect = answer?.isCorrect;
          return (
            <View
              key={question.id}
              className="bg-white p-4 rounded-xl border border-slate-100 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-400 font-bold">
                  Question {i + 1}
                </Text>
                {isCorrect ? (
                  <CheckCircle size={18} color="#059669" />
                ) : (
                  <XCircle size={18} color="#dc2626" />
                )}
              </View>
              <Text className="text-sm text-slate-700" numberOfLines={2}>
                {question.sentence}
              </Text>
              {!isCorrect && answer && (
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-xs text-red-500 line-through">
                    {answer.selectedAnswer}
                  </Text>
                  <Text className="text-xs text-emerald-600 font-medium">
                    {question.correctAnswer}
                  </Text>
                </View>
              )}
              <Text className="text-xs text-slate-500">
                {question.explanation}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Actions */}
      <View className="w-full gap-3 mt-2">
        <Pressable
          onPress={onRetry}
          className="w-full py-4 bg-indigo-500 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <RotateCcw size={18} color="#fff" />
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>

        <Pressable
          onPress={onHome}
          className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Home size={18} color="#64748b" />
          <Text className="text-slate-600 font-semibold">Back to Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
