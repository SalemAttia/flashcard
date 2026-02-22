import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  CheckCircle,
  XCircle,
  ChevronRight,
  BarChart3,
} from "lucide-react-native";
import { GrammarQuestion } from "../../types";

interface AnswerFeedbackProps {
  question: GrammarQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
  isLast: boolean;
  onNext: () => void;
}

export function AnswerFeedback({
  question,
  selectedAnswer,
  isCorrect,
  isLast,
  onNext,
}: AnswerFeedbackProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-5">
      {/* Result banner */}
      <View
        className={`p-5 rounded-2xl flex-row items-center gap-3 ${
          isCorrect
            ? "bg-emerald-50 dark:bg-emerald-950/20"
            : "bg-red-50 dark:bg-red-950/20"
        }`}
      >
        {isCorrect ? (
          <CheckCircle size={28} color="#059669" />
        ) : (
          <XCircle size={28} color="#dc2626" />
        )}
        <View className="flex-1">
          <Text
            className={`text-lg font-bold ${
              isCorrect
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </Text>
          {!isCorrect && (
            <Text className="text-sm text-red-600 mt-0.5">
              Your answer:{" "}
              <Text className="line-through">{selectedAnswer}</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Sentence with correct answer */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Correct Answer
        </Text>
        <Text className="text-base text-slate-800 dark:text-white leading-6">
          {question.sentence.includes("___")
            ? question.sentence.replace("___", question.correctAnswer)
            : question.correctAnswer}
        </Text>
      </View>

      {/* Explanation */}
      <View className="bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
        <Text className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
          Explanation
        </Text>
        <Text className="text-sm text-indigo-900 dark:text-indigo-300 leading-5">
          {question.explanation}
        </Text>
      </View>

      {/* Next button */}
      <Pressable
        onPress={onNext}
        className="w-full py-4 bg-indigo-500 rounded-2xl flex-row items-center justify-center gap-2"
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {isLast ? (
          <BarChart3 size={18} color="#fff" />
        ) : (
          <ChevronRight size={18} color="#fff" />
        )}
        <Text className="text-white font-semibold">
          {isLast ? "See Results" : "Next Question"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
