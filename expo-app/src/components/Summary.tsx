import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Award, RotateCcw, Home, TrendingUp } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface SummaryProps {
  results: { correct: number; total: number };
  deckTitle: string;
  onHome: () => void;
  onRetry: () => void;
}

export function Summary({ results, deckTitle, onHome, onRetry }: SummaryProps) {
  const percentage = Math.round((results.correct / results.total) * 100);

  const iconScale = useSharedValue(0);
  useEffect(() => {
    iconScale.value = withSpring(1, { stiffness: 200, damping: 15 });
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View className="flex-1 bg-white dark:bg-slate-950 p-6">
      <View className="flex-1 items-center justify-center gap-8">
        <Animated.View
          style={iconStyle}
          className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center"
        >
          <Award size={48} color="#22c55e" />
        </Animated.View>

        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">
            Session Complete!
          </Text>
          <Text className="text-slate-500 dark:text-slate-400">
            You've finished studying{" "}
            <Text className="font-semibold text-indigo-600 dark:text-indigo-400">
              {deckTitle}
            </Text>
          </Text>
        </View>

        <View className="flex-row gap-4 w-full max-w-[384px]">
          <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Score
            </Text>
            <Text className="text-2xl font-bold text-slate-800 dark:text-white">
              {percentage}%
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Correct
            </Text>
            <Text className="text-2xl font-bold text-slate-800 dark:text-white">
              {results.correct}/{results.total}
            </Text>
          </View>
        </View>

        <View className="w-full max-w-[384px] p-5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex-row items-center gap-4">
          <View className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <TrendingUp size={20} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-indigo-400 uppercase tracking-tight">
              Next Step
            </Text>
            <Text className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              Review your incorrect cards later today.
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3 pb-4">
        <Pressable
          onPress={onRetry}
          className="w-full bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <RotateCcw size={20} color="#fff" />
          <Text className="text-white font-semibold">Study Again</Text>
        </Pressable>
        <Pressable
          onPress={onHome}
          className="w-full bg-slate-50 dark:bg-slate-900 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <Home size={20} color="#475569" />
          <Text className="text-slate-600 dark:text-slate-300 font-semibold">
            Back to Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
