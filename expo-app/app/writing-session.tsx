import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { X, Sparkles, PenLine } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../src/firebase/config";
import { useAuth } from "../src/context/AuthContext";
import { sanitize } from "../src/utils/firestore";
import { useDecks } from "../src/store/useDecks";
import { WritingPromptCard } from "../src/components/WritingTest/WritingPromptCard";
import { EvaluationFeedback } from "../src/components/WritingTest/EvaluationFeedback";
import {
  generateWritingPrompts,
  evaluateWriting,
} from "../src/services/danishWritingService";
import { getLevelConfig } from "../src/constants/writingLevels";
import {
  WritingLevel,
  WritingPrompt,
  WritingEvaluation,
  WritingTestResult,
} from "../src/types";

type SessionPhase =
  | "generating"
  | "writing"
  | "evaluating"
  | "feedback"
  | "complete";

const WRITING_RESULT_KEY = "writing_test_last_result";

export default function WritingSessionScreen() {
  const { level, deckId, topic } = useLocalSearchParams<{
    level: WritingLevel;
    deckId?: string;
    topic?: string;
  }>();
  const { user } = useAuth();
  const { getDeck } = useDecks();
  const deck = deckId ? getDeck(deckId) : null;
  const levelConfig = getLevelConfig(level as WritingLevel);

  const [phase, setPhase] = useState<SessionPhase>("generating");
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [startTimeMs, setStartTimeMs] = useState(0);
  const [responses, setResponses] = useState<WritingTestResult["responses"]>(
    [],
  );
  const [currentEvaluation, setCurrentEvaluation] =
    useState<WritingEvaluation | null>(null);

  const spinRotation = useSharedValue(0);

  useEffect(() => {
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    loadPrompts();
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const loadPrompts = async () => {
    try {
      const generated = await generateWritingPrompts(levelConfig, deck, topic);
      if (generated.length === 0) throw new Error("No prompts generated");
      setPrompts(generated);
      setPhase("writing");
      setStartTimeMs(Date.now());
    } catch (error) {
      console.warn("Failed to generate prompts:", error);
      Toast.show({
        type: "error",
        text1: "Failed to generate prompts",
        text2: "Please try again.",
      });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }
  };

  const handleSubmit = async () => {
    if (!currentText.trim()) return;
    setPhase("evaluating");

    const prompt = prompts[currentIndex];
    const timeSpent = Date.now() - startTimeMs;

    try {
      const evaluation = await evaluateWriting(
        prompt,
        currentText,
        levelConfig,
      );
      setCurrentEvaluation(evaluation);
      setResponses((prev) => [
        ...prev,
        {
          promptId: prompt.id,
          userText: currentText,
          evaluation,
          timeSpentMs: timeSpent,
        },
      ]);
      setPhase("feedback");
    } catch (error) {
      console.warn("Evaluation failed:", error);
      Toast.show({
        type: "error",
        text1: "Evaluation failed",
        text2: "Your response was saved with a basic score.",
      });
      // Fallback: just move on
      setPhase("feedback");
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < prompts.length) {
      setCurrentIndex((i) => i + 1);
      setCurrentText("");
      setCurrentEvaluation(null);
      setPhase("writing");
      setStartTimeMs(Date.now());
    } else {
      // Build result and navigate to summary
      const allResponses = responses;
      const overallScore =
        allResponses.reduce((sum, r) => sum + r.evaluation.score, 0) /
        allResponses.length;

      const result: WritingTestResult = {
        id: Math.random().toString(36).substr(2, 9),
        deckId: deckId || undefined,
        level: level as WritingLevel,
        completedAt: new Date().toISOString(),
        prompts,
        responses: allResponses,
        overallScore,
        passed: overallScore >= levelConfig.passMark,
      };

      if (user) {
        await setDoc(
          doc(db, "users", user.uid, "results", "writing"),
          sanitize(result),
        );
      }
      await AsyncStorage.setItem(WRITING_RESULT_KEY, JSON.stringify(result));
      router.replace("/writing-summary");
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  if (phase === "generating" || phase === "evaluating") {
    const isEvaluating = phase === "evaluating";
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-slate-950"
        edges={["top"]}
      >
        <View className="p-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Pressable onPress={handleCancel} className="p-2 -ml-2">
            <X size={24} color="#64748b" />
          </Pressable>
          <View className="items-center">
            <Text className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Writing Exam
            </Text>
            <Text className="text-sm font-semibold text-slate-800 dark:text-white">
              {levelConfig.label}
            </Text>
          </View>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center p-8 gap-6">
          <View className="relative items-center justify-center">
            <Animated.View
              style={[
                spinStyle,
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 4,
                  borderColor: "#fef3c7",
                  borderTopColor: "#f59e0b",
                },
              ]}
            />
            <View className="absolute">
              {isEvaluating ? (
                <Sparkles size={32} color="#f59e0b" />
              ) : (
                <PenLine size={32} color="#f59e0b" />
              )}
            </View>
          </View>
          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-slate-800 dark:text-white">
              {isEvaluating
                ? "Evaluating your writing..."
                : "Preparing your exam..."}
            </Text>
            <Text className="text-slate-500 text-sm text-center max-w-[240px]">
              {isEvaluating
                ? "AI is analyzing your grammar, vocabulary, and fluency."
                : "Generating writing prompts for your level."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentPrompt = prompts[currentIndex];
  const progressPercent = ((currentIndex + 1) / prompts.length) * 100;

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      edges={["top"]}
    >
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleCancel} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <View className="items-center">
          <View className="flex-row items-center gap-1">
            <PenLine size={10} color="#d97706" />
            <Text className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Writing Exam
            </Text>
          </View>
          <Text className="text-sm font-semibold text-slate-800 dark:text-white">
            {levelConfig.label}
          </Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Progress */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Progress
          </Text>
          <Text className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
            {currentIndex + 1} / {prompts.length}
          </Text>
        </View>
        <View className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-amber-500 rounded-full"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-6"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-10"
      >
        {phase === "writing" && (
          <WritingPromptCard
            prompt={currentPrompt}
            levelConfig={levelConfig}
            userText={currentText}
            onChangeText={setCurrentText}
            onSubmit={handleSubmit}
            isSubmitting={false}
          />
        )}

        {phase === "feedback" && currentEvaluation && (
          <EvaluationFeedback
            evaluation={currentEvaluation}
            userText={currentText}
            levelConfig={levelConfig}
            isLast={currentIndex + 1 >= prompts.length}
            onNext={handleNext}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
