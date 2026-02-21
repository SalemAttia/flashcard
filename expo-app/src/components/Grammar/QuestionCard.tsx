import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GrammarQuestion } from "../../types";

interface QuestionCardProps {
  question: GrammarQuestion;
  onAnswer: (selected: string) => void;
  selectedAnswer: string | null;
  disabled: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  selectedAnswer,
  disabled,
}: QuestionCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-6">
      <View className="bg-white p-5 rounded-2xl border border-slate-100">
        <Text className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
          {question.type === "fill-in-the-blank"
            ? "Fill in the blank"
            : "Multiple Choice"}
        </Text>
        <Text className="text-lg font-semibold text-slate-800 leading-7">
          {question.sentence}
        </Text>
      </View>

      <View className="gap-3">
        {(!question.options || question.options.length === 0) && (
          <Text className="text-slate-400 text-sm text-center py-4">
            No options available for this question.
          </Text>
        )}
        {(question.options ?? []).map((option, index) => {
          const isSelected = selectedAnswer === option;
          const letter = String.fromCharCode(65 + index);

          return (
            <Pressable
              key={option}
              onPress={() => !disabled && onAnswer(option)}
              disabled={disabled}
              className={`p-4 rounded-xl border-2 flex-row items-center gap-3 ${
                isSelected
                  ? "bg-indigo-50 border-indigo-400"
                  : "bg-white border-slate-100"
              }`}
              style={({ pressed }) => ({
                transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
              })}
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isSelected ? "bg-indigo-500" : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    isSelected ? "text-white" : "text-slate-500"
                  }`}
                >
                  {letter}
                </Text>
              </View>
              <Text
                className={`text-sm font-medium flex-1 ${
                  isSelected ? "text-indigo-700" : "text-slate-700"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
