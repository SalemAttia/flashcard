import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  SpellCheck,
  Zap,
} from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { WritingEvaluation } from "../../types";
import { LevelConfig } from "../../constants/writingLevels";

interface EvaluationFeedbackProps {
  evaluation: WritingEvaluation;
  userText: string;
  levelConfig: LevelConfig;
  isLast: boolean;
  onNext: () => void;
}

const CRITERIA_CONFIG = [
  { key: "grammar" as const, label: "Grammar", Icon: BookOpen },
  { key: "vocabulary" as const, label: "Vocabulary", Icon: MessageSquare },
  { key: "spelling" as const, label: "Spelling", Icon: SpellCheck },
  { key: "fluency" as const, label: "Fluency", Icon: Zap },
];

export function EvaluationFeedback({
  evaluation,
  userText,
  levelConfig,
  isLast,
  onNext,
}: EvaluationFeedbackProps) {
  const [showCorrected, setShowCorrected] = useState(false);
  const passed = evaluation.passed;

  return (
    <Animated.View entering={FadeIn.duration(300)} className="gap-4">
      {/* Score */}
      <View
        className={`p-6 rounded-3xl border-2 items-center gap-3 ${
          passed
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
            : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50"
        }`}
      >
        <View
          className={`w-20 h-20 rounded-full items-center justify-center border-4 ${
            passed ? "border-emerald-400" : "border-red-400"
          }`}
        >
          <Text
            className={`text-2xl font-black ${
              passed
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {evaluation.score}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {passed ? (
            <Check size={16} color="#166534" />
          ) : (
            <X size={16} color="#991b1b" />
          )}
          <Text
            className={`font-bold uppercase tracking-widest text-xs ${
              passed
                ? "text-emerald-800 dark:text-emerald-300"
                : "text-red-800 dark:text-red-400"
            }`}
          >
            {passed ? "Passed" : "Not yet"}
          </Text>
        </View>
        <Text
          className={`text-sm text-center leading-relaxed ${
            passed
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {evaluation.feedback.overall}
        </Text>
      </View>

      {/* Criteria breakdown */}
      <View className="gap-2">
        {CRITERIA_CONFIG.map(({ key, label, Icon }) => (
          <View
            key={key}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-row gap-3"
          >
            <View className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg items-center justify-center mt-0.5">
              <Icon size={16} color="#64748b" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {label}
              </Text>
              <Text className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {evaluation.feedback[key]}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Corrected text */}
      {evaluation.correctedText && (
        <View>
          <Pressable
            onPress={() => setShowCorrected((v) => !v)}
            className="flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Corrected Version
            </Text>
            {showCorrected ? (
              <ChevronUp size={16} color="#94a3b8" />
            ) : (
              <ChevronDown size={16} color="#94a3b8" />
            )}
          </Pressable>
          {showCorrected && (
            <View className="bg-slate-50 dark:bg-slate-950 p-4 rounded-b-xl border border-t-0 border-slate-100 dark:border-slate-800 gap-3">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Your text
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {userText}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                  Suggested correction
                </Text>
                <Text className="text-sm text-slate-800 dark:text-white leading-relaxed">
                  {evaluation.correctedText}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Highlighted errors */}
      {evaluation.highlightedErrors &&
        evaluation.highlightedErrors.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Specific Errors
            </Text>
            {evaluation.highlightedErrors.map((err, i) => (
              <View
                key={i}
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex-row gap-3 items-center"
              >
                <View className="items-center gap-0.5">
                  <Text className="text-sm text-red-500 line-through font-medium">
                    {err.word}
                  </Text>
                  <Text className="text-sm text-emerald-600 font-medium">
                    {err.suggestion}
                  </Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                  {err.reason}
                </Text>
              </View>
            ))}
          </View>
        )}

      {/* Next button */}
      <Pressable
        onPress={onNext}
        className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex-row items-center justify-center gap-2"
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <Text className="text-slate-800 dark:text-white font-bold">
          {isLast ? "See Results" : "Next Prompt"}
        </Text>
        <ChevronRight size={18} color="#1e293b" />
      </Pressable>
    </Animated.View>
  );
}
