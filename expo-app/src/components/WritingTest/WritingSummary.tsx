import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Award, Home, RotateCcw, ChevronUp } from "lucide-react-native";
import { WritingTestResult } from "../../types";
import { LevelConfig, WRITING_LEVELS } from "../../constants/writingLevels";

interface WritingSummaryProps {
  result: WritingTestResult;
  levelConfig: LevelConfig;
  deckTitle?: string;
  onHome: () => void;
  onRetry: () => void;
  onNextLevel: (() => void) | null;
}

export function WritingSummary({
  result,
  levelConfig,
  deckTitle,
  onHome,
  onRetry,
  onNextLevel,
}: WritingSummaryProps) {
  const passed = result.passed;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="p-6 gap-6 items-center"
    >
      {/* Hero */}
      <View
        className={`w-full p-8 rounded-3xl items-center gap-4 ${passed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"
          }`}
      >
        <View
          className={`w-24 h-24 rounded-full items-center justify-center ${passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}
        >
          <Award size={40} color={passed ? "#059669" : "#dc2626"} />
        </View>
        <View className="items-center gap-1">
          <Text
            className={`text-3xl font-black ${passed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
          >
            {Math.round(result.overallScore)}%
          </Text>
          <Text
            className={`text-sm font-bold uppercase tracking-widest ${passed ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-400"
              }`}
          >
            {passed ? "Exam Passed!" : "Keep Practicing"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-slate-500">
            {levelConfig.label} · {levelConfig.sublabel}
          </Text>
          {deckTitle && (
            <Text className="text-xs text-slate-400">· {deckTitle}</Text>
          )}
        </View>
      </View>

      {/* Per-prompt breakdown */}
      <View className="w-full gap-3">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Prompt Breakdown
        </Text>
        {result.responses.map((resp, i) => {
          const prompt = result.prompts[i];
          const evalPassed = resp.evaluation.passed;
          return (
            <View
              key={resp.promptId}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-400 font-bold">
                  Prompt {i + 1}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-full ${evalPassed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${evalPassed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                      }`}
                  >
                    {resp.evaluation.score}%
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-slate-700 dark:text-slate-200" numberOfLines={2}>
                {prompt?.instruction}
              </Text>
              <Text className="text-xs text-slate-500">
                {resp.evaluation.feedback.overall}
              </Text>
              {/* Score bar */}
              <View className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                  style={{ width: `${resp.evaluation.score}%` }}
                  className={`h-full rounded-full ${evalPassed ? "bg-emerald-400" : "bg-red-400"
                    }`}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Actions */}
      <View className="w-full gap-3 mt-2">
        <Pressable
          onPress={onRetry}
          className="w-full py-4 bg-amber-500 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <RotateCcw size={18} color="#fff" />
          <Text className="text-white font-semibold">
            Try Again at {levelConfig.label}
          </Text>
        </Pressable>

        {onNextLevel && (
          <Pressable
            onPress={onNextLevel}
            className="w-full py-4 bg-violet-500 rounded-2xl flex-row items-center justify-center gap-2"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <ChevronUp size={18} color="#fff" />
            <Text className="text-white font-semibold">Try Higher Level</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onHome}
          className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Home size={18} color="#64748b" />
          <Text className="text-slate-600 dark:text-slate-300 font-semibold">Back to Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
