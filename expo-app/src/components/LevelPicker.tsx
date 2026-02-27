import React from "react";
import { View, Text, Pressable } from "react-native";
import { WritingLevel } from "../types";

const LEVELS: { value: WritingLevel; label: string; short: string }[] = [
  { value: "a1", label: "A1 - Beginner", short: "A1" },
  { value: "a2", label: "A2 - Elementary", short: "A2" },
  { value: "b1", label: "B1 - Intermediate", short: "B1" },
  { value: "b2", label: "B2 - Upper-Intermediate", short: "B2" },
];

interface LevelPickerProps {
  value: WritingLevel;
  onChange: (value: WritingLevel) => void;
}

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  return (
    <View className="gap-2">
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        Level
      </Text>
      <View className="flex-row gap-2">
        {LEVELS.map((level) => {
          const isActive = level.value === value;
          return (
            <Pressable
              key={level.value}
              onPress={() => onChange(level.value)}
              className={`flex-1 py-2.5 rounded-xl border items-center ${
                isActive
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? "text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {level.short}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
