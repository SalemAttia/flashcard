import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import {
  X,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import OpenAI from "openai";
import { Deck, Card, Language } from "../types";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

interface TestModeProps {
  deck: Deck;
  onComplete: (correct: number, total: number) => void;
  onCancel: () => void;
}

type QuestionType = "multiple-choice" | "true-false" | "written";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
}

export function TestMode({ deck, onComplete, onCancel }: TestModeProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const spinRotation = useSharedValue(0);

  useEffect(() => {
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    generateQuestions();
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const generateQuestions = async () => {
    setLoading(true);
    try {
      if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") {
        throw new Error("No API key configured");
      }

      const openai = new OpenAI({
        apiKey: OPENAI_KEY,
        dangerouslyAllowBrowser: true,
      });

      const cardsList = deck.cards
        .map((c) => `- "${c.front}" → "${c.back}"`)
        .join("\n");

      const questionCount = Math.min(deck.cards.length * 2, 10);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are an expert language educator. Generate test questions for flashcard study sets. Always respond with valid JSON only, no markdown fences.",
          },
          {
            role: "user",
            content: `Create a test for this flashcard set:
Title: ${deck.title}
Front language: ${deck.frontLang}
Back language: ${deck.backLang}

Cards:
${cardsList}

Generate exactly ${questionCount} questions as a JSON array. Include a mix of these types:
1. "multiple-choice" — 4 plausible options (options in ${deck.backLang}), only one correct
2. "true-false" — present a term with a potentially wrong definition
3. "written" — ask for the translation

Each object must have:
{
  "type": "multiple-choice" | "true-false" | "written",
  "prompt": "question text",
  "correctAnswer": "the correct answer string",
  "options": ["a", "b", "c", "d"],  // only for multiple-choice
  "explanation": "brief explanation"
}

For true-false, correctAnswer must be exactly "true" or "false".
For written, correctAnswer is the expected translation.
Return ONLY the JSON array.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim() || "[]";
      // Strip markdown code fences if present
      const jsonStr = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      const parsed: Omit<Question, "id">[] = JSON.parse(jsonStr);

      const questionsWithIds: Question[] = parsed.map((q, i) => ({
        ...q,
        id: `q-${i}`,
      }));

      if (questionsWithIds.length === 0) {
        throw new Error("AI returned no questions");
      }

      setQuestions(questionsWithIds);
    } catch (error) {
      console.warn("AI generation failed, using local fallback:", error);
      Toast.show({
        type: "info",
        text1: "Using local question generator",
      });

      // Local fallback generator
      const generated = deck.cards.map((card, i) => {
        const typeRand = Math.random();
        if (typeRand > 0.6) {
          return {
            id: `q-${i}`,
            type: "multiple-choice" as const,
            prompt: `What is the correct translation for "${card.front}"?`,
            correctAnswer: card.back,
            options: [
              card.back,
              ...deck.cards
                .filter((c) => c.id !== card.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map((c) => c.back),
            ].sort(() => Math.random() - 0.5),
            explanation: `"${card.front}" translates to "${card.back}".`,
          };
        } else if (typeRand > 0.3) {
          const isCorrect = Math.random() > 0.5;
          const randomBack = isCorrect
            ? card.back
            : deck.cards[Math.floor(Math.random() * deck.cards.length)].back;
          return {
            id: `q-${i}`,
            type: "true-false" as const,
            prompt: `True or False: "${card.front}" means "${randomBack}"?`,
            correctAnswer: isCorrect ? "true" : "false",
            explanation: isCorrect
              ? "Correct!"
              : `No, "${card.front}" actually means "${card.back}".`,
          };
        } else {
          return {
            id: `q-${i}`,
            type: "written" as const,
            prompt: `Translate "${card.front}" into ${deck.backLang}:`,
            correctAnswer: card.back,
            explanation: `The correct answer is "${card.back}".`,
          };
        }
      });

      setQuestions(generated);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;

    const current = questions[currentIndex];
    const isCorrect =
      current.type === "written"
        ? answer.trim().toLowerCase() ===
          current.correctAnswer.trim().toLowerCase()
        : answer === current.correctAnswer;

    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setUserAnswer(answer);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setShowFeedback(false);
    } else {
      onComplete(correctCount, questions.length);
    }
  };

  if (loading) {
    return (
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
              },
            ]}
          />
          <View className="absolute">
            <Sparkles size={32} color="#4f46e5" />
          </View>
        </View>
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-slate-800">
            AI is crafting your test...
          </Text>
          <Text className="text-slate-500 text-sm text-center max-w-[240px]">
            Generating smart questions and plausible distractors based on your
            cards.
          </Text>
        </View>
      </View>
    );
  }

  const current = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const isAnswerCorrect =
    current.type === "written"
      ? userAnswer.trim().toLowerCase() ===
        current.correctAnswer.trim().toLowerCase()
      : userAnswer === current.correctAnswer;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between bg-white border-b border-slate-100">
        <Pressable onPress={onCancel} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <View className="items-center">
          <View className="flex-row items-center gap-1">
            <Sparkles size={10} color="#4f46e5" />
            <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              AI Test Mode
            </Text>
          </View>
          <Text className="font-semibold text-sm" numberOfLines={1}>
            {deck.title}
          </Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Progress */}
      <View className="px-6 py-4 bg-white border-b border-slate-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Progress
          </Text>
          <Text className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
        <View className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <Animated.View
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </View>
      </View>

      {/* Question */}
      <ScrollView
        className="flex-1 p-6"
        contentContainerClassName="items-center justify-center flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[384px] gap-8">
          <View className="items-center gap-4">
            <View className="px-3 py-1 bg-indigo-50 rounded-full">
              <Text className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                {current.type.replace("-", " ")}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800 text-center leading-relaxed">
              {current.prompt}
            </Text>
          </View>

          <View className="gap-3">
            {/* Multiple Choice */}
            {current.type === "multiple-choice" &&
              current.options?.map((option, idx) => {
                const isSelected = userAnswer === option;
                const isCorrectOption = option === current.correctAnswer;
                return (
                  <Pressable
                    key={idx}
                    disabled={showFeedback}
                    onPress={() => handleAnswer(option)}
                    className={`w-full p-4 rounded-2xl border-2 ${
                      showFeedback
                        ? isCorrectOption
                          ? "bg-green-50 border-green-500"
                          : isSelected
                          ? "bg-red-50 border-red-500"
                          : "bg-white border-slate-100"
                        : "bg-white border-slate-100"
                    }`}
                    style={({ pressed }) =>
                      !showFeedback
                        ? { transform: [{ scale: pressed ? 0.98 : 1 }] }
                        : {}
                    }
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`font-medium ${
                          showFeedback
                            ? isCorrectOption
                              ? "text-green-700"
                              : isSelected
                              ? "text-red-700"
                              : "text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {option}
                      </Text>
                      {showFeedback && isCorrectOption && (
                        <Check size={18} color="#16a34a" />
                      )}
                      {showFeedback && isSelected && !isCorrectOption && (
                        <X size={18} color="#dc2626" />
                      )}
                    </View>
                  </Pressable>
                );
              })}

            {/* True/False */}
            {current.type === "true-false" && (
              <View className="flex-row gap-4">
                {["true", "false"].map((val) => {
                  const isSelected = userAnswer === val;
                  const isCorrectVal = val === current.correctAnswer;
                  return (
                    <Pressable
                      key={val}
                      disabled={showFeedback}
                      onPress={() => handleAnswer(val)}
                      className={`flex-1 p-6 rounded-2xl border-2 items-center ${
                        showFeedback
                          ? isCorrectVal
                            ? "bg-green-50 border-green-500"
                            : isSelected
                            ? "bg-red-50 border-red-500"
                            : "bg-white border-slate-100"
                          : "bg-white border-slate-100"
                      }`}
                      style={({ pressed }) =>
                        !showFeedback
                          ? { transform: [{ scale: pressed ? 0.98 : 1 }] }
                          : {}
                      }
                    >
                      <Text
                        className={`font-bold capitalize ${
                          showFeedback
                            ? isCorrectVal
                              ? "text-green-700"
                              : isSelected
                              ? "text-red-700"
                              : "text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Written */}
            {current.type === "written" && (
              <View className="gap-4">
                <TextInput
                  autoFocus
                  editable={!showFeedback}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  onSubmitEditing={() => handleAnswer(userAnswer)}
                  returnKeyType="done"
                  placeholder="Type the answer..."
                  placeholderTextColor="#94a3b8"
                  className={`w-full p-4 rounded-2xl border-2 text-base ${
                    showFeedback
                      ? isAnswerCorrect
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-red-50 border-red-500 text-red-700"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
                {!showFeedback && (
                  <Pressable
                    onPress={() => handleAnswer(userAnswer)}
                    className="w-full py-4 bg-indigo-600 rounded-2xl items-center"
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <Text className="text-white font-semibold">
                      Check Answer
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Feedback */}
          {showFeedback && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className={`p-6 rounded-3xl border-2 gap-2 ${
                isAnswerCorrect
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <View className="flex-row items-center gap-2">
                {isAnswerCorrect ? (
                  <Check size={14} color="#166534" />
                ) : (
                  <AlertCircle size={14} color="#991b1b" />
                )}
                <Text
                  className={`font-bold uppercase tracking-widest text-[10px] ${
                    isAnswerCorrect ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isAnswerCorrect ? "Brilliant!" : "Not quite"}
                </Text>
              </View>
              <Text
                className={`text-sm font-medium leading-relaxed ${
                  isAnswerCorrect ? "text-green-800" : "text-red-800"
                }`}
              >
                {current.explanation}
              </Text>
              <Pressable
                onPress={nextQuestion}
                className="mt-4 w-full py-3 bg-white border border-slate-200 rounded-xl flex-row items-center justify-center gap-2"
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Text className="text-slate-800 font-bold">Next Question</Text>
                <ChevronRight size={18} color="#1e293b" />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
