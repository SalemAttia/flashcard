import React, { useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import {
  Play,
  Edit2,
  Calendar,
  Layout,
  ClipboardCheck,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { Deck } from "../types";

interface DeckListProps {
  decks: Deck[];
  onEdit: (deck: Deck) => void;
  onStudy: (deck: Deck) => void;
  onTest: (deck: Deck) => void;
}

function DeckCard({
  deck,
  index,
  onEdit,
  onStudy,
  onTest,
}: {
  deck: Deck;
  index: number;
  onEdit: () => void;
  onStudy: () => void;
  onTest: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 50, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const cardShadow = Platform.select({
    ios: {
      shadowColor: "#94a3b8",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return (
    <Animated.View
      style={[animatedStyle, cardShadow]}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-lg text-slate-800 dark:text-white">
            {deck.title}
          </Text>
          <Text
            className="text-slate-500 dark:text-slate-400 text-sm mt-0.5"
            numberOfLines={1}
          >
            {deck.description || "No description"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-4">
        <View className="flex-row items-center gap-1.5">
          <Layout size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {deck.cards.length} Cards
          </Text>
        </View>
        {deck.lastStudied && (
          <View className="flex-row items-center gap-1.5">
            <Calendar size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Recent
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-2 mt-5">
        <Pressable
          onPress={onStudy}
          className="flex-1 bg-indigo-50 dark:bg-indigo-950/30 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Play size={16} color="#4338ca" fill="#4338ca" />
          <Text className="text-indigo-700 font-medium text-sm">Study</Text>
        </Pressable>
        <Pressable
          onPress={onTest}
          className="flex-1 bg-slate-50 dark:bg-slate-800 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <ClipboardCheck size={16} color="#334155" />
          <Text className="text-slate-700 dark:text-slate-200 font-medium text-sm">
            Test
          </Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          className="px-4 bg-slate-50 dark:bg-slate-800 rounded-xl items-center justify-center"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Edit2 size={16} color="#475569" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function DeckList({ decks, onEdit, onStudy, onTest }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <View className="items-center justify-center h-64 gap-4">
        <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
          <Layout size={32} color="#94a3b8" />
        </View>
        <Text className="text-center text-slate-400 dark:text-slate-500">
          No decks yet. Create your first one!
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {decks.map((deck, idx) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          index={idx}
          onEdit={() => onEdit(deck)}
          onStudy={() => onStudy(deck)}
          onTest={() => onTest(deck)}
        />
      ))}
    </View>
  );
}
