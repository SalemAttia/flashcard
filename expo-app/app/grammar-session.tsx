import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { X, Sparkles, GraduationCap } from "lucide-react-native";
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
import { QuestionCard } from "../src/components/Grammar/QuestionCard";
import { AnswerFeedback } from "../src/components/Grammar/AnswerFeedback";
import { generateGrammarQuestions } from "../src/services/grammarService";
import { getTopicConfig } from "../src/constants/grammarTopics";
import {
  GrammarTopicId,
  GrammarQuestion,
  GrammarAnswer,
  GrammarSessionResult,
} from "../src/types";

type SessionPhase = "generating" | "answering" | "feedback";

const GRAMMAR_RESULT_KEY = "grammar_last_result";

export default function GrammarSessionScreen() {
  const { topicId, customTopic, questionCount: questionCountParam } =
    useLocalSearchParams<{
      topicId?: GrammarTopicId;
      customTopic?: string;
      questionCount?: string;
    }>();
  const { user } = useAuth();
  const topicConfig = topicId ? getTopicConfig(topicId as GrammarTopicId) : null;
  const questionCount = questionCountParam ? parseInt(questionCountParam, 10) : 10;
  const displayLabel = customTopic || topicConfig?.label || "Grammar Quiz";

  const [phase, setPhase] = useState<SessionPhase>("generating");
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<GrammarAnswer[]>([]);

  const spinRotation = useSharedValue(0);

  useEffect(() => {
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    loadQuestions();
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const loadQuestions = async () => {
    try {
      const generated = await generateGrammarQuestions(topicConfig, {
        customTopic: customTopic || undefined,
        questionCount,
      });
      if (generated.length === 0) throw new Error("No questions generated");
      setQuestions(generated);
      setPhase("answering");
    } catch (error) {
      console.warn("Failed to generate questions:", error);
      Toast.show({
        type: "error",
        text1: "Failed to generate questions",
        text2: "Please try again.",
      });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }
  };

  const handleAnswer = (selected: string) => {
    if (phase !== "answering" || selectedAnswer) return;
    setSelectedAnswer(selected);

    const question = questions[currentIndex];
    const isCorrect = selected === question.correctAnswer;

    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedAnswer: selected,
        isCorrect,
      },
    ]);

    setPhase("feedback");
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setPhase("answering");
    } else {
      const allAnswers = answers;
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      const totalCount = allAnswers.length;
      const scorePercent = Math.round((correctCount / totalCount) * 100);

      const result: GrammarSessionResult = {
        id: Math.random().toString(36).substr(2, 9),
        topicId: (topicId as GrammarTopicId) || ("custom" as GrammarTopicId),
        customTopic: customTopic || undefined,
        completedAt: new Date().toISOString(),
        questions,
        answers: allAnswers,
        correctCount,
        totalCount,
        scorePercent,
      };


      if (user) {
        await setDoc(doc(db, "users", user.uid, "results", "grammar"), sanitize(result));
      }
      await AsyncStorage.setItem(GRAMMAR_RESULT_KEY, JSON.stringify(result));
      router.replace("/grammar-summary");
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  if (phase === "generating") {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
        <View className="p-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Pressable onPress={handleCancel} className="p-2 -ml-2">
            <X size={24} color="#64748b" />
          </Pressable>
          <View className="items-center">
            <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Grammar Quiz
            </Text>
            <Text className="text-sm font-semibold text-slate-800 dark:text-white">
              {displayLabel}
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
                  borderColor: "#e0e7ff",
                  borderTopColor: "#4f46e5",
                  backgroundColor: "transparent",
                },
              ]}
            />
            <View className="absolute">
              <Sparkles size={32} color="#4f46e5" />
            </View>
          </View>
          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-slate-800 dark:text-white">
              Preparing your quiz...
            </Text>
            <Text className="text-slate-500 text-sm text-center max-w-[240px]">
              AI is generating grammar questions for you.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer?.isCorrect ?? false;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleCancel} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <View className="items-center">
          <View className="flex-row items-center gap-1">
            <GraduationCap size={10} color="#4f46e5" />
            <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Grammar Quiz
            </Text>
          </View>
          <Text className="text-sm font-semibold text-slate-800 dark:text-white">
            {displayLabel}
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
          <Text className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
        <View className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-6"
        contentContainerClassName="pb-10"
      >
        {phase === "answering" && (
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            disabled={!!selectedAnswer}
          />
        )}

        {phase === "feedback" && selectedAnswer && (
          <AnswerFeedback
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            isLast={currentIndex + 1 >= questions.length}
            onNext={handleNext}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
