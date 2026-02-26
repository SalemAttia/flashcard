import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus, Sparkles, BookOpen } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useDecks } from "../../src/store/useDecks";
import { DeckList } from "../../src/components/DeckList";
import { useUserLevel } from "../../src/store/useUserLevel";
import {
  DECK_SUGGESTIONS,
  DeckSuggestion,
} from "../../src/constants/deckSuggestions";
import { generateDeckCards } from "../../src/services/chatService";
import { Deck } from "../../src/types";

const LEVEL_ORDER = ["a1", "a2", "b1", "b2"] as const;

export default function HomeScreen() {
  const { decks, loaded, saveDeck } = useDecks();
  const { level } = useUserLevel();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Show suggestions for current level + one level below
  const suggestions = useMemo(() => {
    const currentIdx = LEVEL_ORDER.indexOf(level);
    const showLevels = LEVEL_ORDER.slice(
      Math.max(0, currentIdx - 1),
      currentIdx + 1,
    );
    return DECK_SUGGESTIONS.filter(
      (s) =>
        showLevels.includes(s.level) &&
        !decks.some(
          (d) => d.title.toLowerCase() === s.title.toLowerCase(),
        ),
    );
  }, [level, decks]);

  const handleCreateFromSuggestion = (suggestion: DeckSuggestion) => {
    router.push(
      `/editor?title=${encodeURIComponent(suggestion.title)}&description=${encodeURIComponent(suggestion.description)}`,
    );
  };

  const handleGenerateWithAI = async (suggestion: DeckSuggestion) => {
    setGeneratingId(suggestion.id);
    try {
      const cards = await generateDeckCards(
        suggestion.title,
        suggestion.level,
        12,
      );
      if (cards.length === 0) {
        Toast.show({
          type: "error",
          text1: "Could not generate cards. Try again.",
        });
        return;
      }
      const newDeck: Deck = {
        id: "",
        title: suggestion.title,
        description: suggestion.description,
        frontLang: "da-DK",
        backLang: "en-US",
        cards: cards.map((c, i) => ({
          id: `card-${i}`,
          front: c.front,
          back: c.back,
        })),
      };
      await saveDeck(newDeck, null);
      Toast.show({
        type: "success",
        text1: `Created "${suggestion.title}" with ${cards.length} cards!`,
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to generate deck." });
    } finally {
      setGeneratingId(null);
    }
  };

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="flex-1 w-full max-w-2xl self-center">
      <View className="p-6 pb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Decks
          </Text>
          <View className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {level.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Master your learning, card by card.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Suggested Decks */}
        {suggestions.length > 0 && (
          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Suggested for You
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {suggestions.map((suggestion) => {
                const isGenerating = generatingId === suggestion.id;
                return (
                  <View
                    key={suggestion.id}
                    className="w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4"
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <BookOpen size={14} color="#4f46e5" />
                      <View className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                          {suggestion.level.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-sm font-bold text-slate-800 dark:text-white mb-1"
                      numberOfLines={1}
                    >
                      {suggestion.title}
                    </Text>
                    <Text
                      className="text-xs text-slate-400 dark:text-slate-500 mb-2"
                      numberOfLines={1}
                    >
                      {suggestion.titleDa}
                    </Text>
                    <View className="flex-row flex-wrap gap-1 mb-3">
                      {suggestion.sampleWords.slice(0, 3).map((word, i) => (
                        <View
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20"
                        >
                          <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {word}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleCreateFromSuggestion(suggestion)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 items-center"
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Create
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleGenerateWithAI(suggestion)}
                        disabled={isGenerating}
                        className="flex-1 py-2 rounded-xl bg-indigo-500 items-center flex-row justify-center gap-1"
                        style={({ pressed }) => ({
                          opacity: pressed || isGenerating ? 0.7 : 1,
                        })}
                      >
                        {isGenerating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Sparkles size={11} color="#fff" />
                            <Text className="text-[11px] font-semibold text-white">
                              AI Gen
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Existing Decks */}
        <DeckList
          decks={decks}
          onEdit={(deck) => router.push(`/editor?deckId=${deck.id}`)}
          onStudy={(deck) => {
            if (deck.cards.length === 0) {
              Toast.show({
                type: "error",
                text1: "Add some cards to this deck first!",
              });
              return;
            }
            router.push(`/study?deckId=${deck.id}`);
          }}
          onTest={(deck) => {
            if (deck.cards.length < 2) {
              Toast.show({
                type: "error",
                text1: "You need at least 2 cards for a test!",
              });
              return;
            }
            router.push(`/test?deckId=${deck.id}`);
          }}
        />
      </ScrollView>

      <View className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Pressable
          onPress={() => router.push("/editor")}
          className="w-full bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Plus size={20} color="#fff" />
          <Text className="text-white font-medium">New Study Set</Text>
        </Pressable>
      </View>
      </View>
    </SafeAreaView>
  );
}
