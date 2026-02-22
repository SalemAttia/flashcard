import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import {
  X,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Volume2,
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
import * as Speech from "expo-speech";
import OpenAI from "openai";
import { Deck, Card, Language } from "../types";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

interface TestModeProps {
  deck: Deck;
  onComplete: (correct: number, total: number) => void;
  onCancel: () => void;
}

type QuestionType = "multiple-choice" | "true-false" | "written" | "sound";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
  audioText?: string;
  audioLang?: Language;
  soundVariant?: "multiple-choice" | "written";
}

export function TestMode({ deck, onComplete, onCancel }: TestModeProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const spinRotation = useSharedValue(0);
  const speakingPulse = useSharedValue(1);

  useEffect(() => {
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    generateQuestions();
    return () => {
      Speech.stop();
    };
  }, []);

  // Auto-play audio when a sound question becomes current
  useEffect(() => {
    const current = questions[currentIndex];
    if (
      !loading &&
      current?.type === "sound" &&
      current.audioText &&
      current.audioLang
    ) {
      const timer = setTimeout(() => {
        speakAudio(current.audioText!, current.audioLang!);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, loading]);

  // Pulse animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      speakingPulse.value = withRepeat(
        withTiming(1.08, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    } else {
      speakingPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isSpeaking]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const speakingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakingPulse.value }],
  }));

  const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) return resolve(voices);
      window.speechSynthesis.onvoiceschanged = () =>
        resolve(window.speechSynthesis.getVoices());
    });

  const speakAudio = async (text: string, lang: Language) => {
    Speech.stop();
    setIsSpeaking(true);

    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      const voices = await getVoicesAsync();
      const langPrefix = lang.split("-")[0];
      const match = voices.find(
        (v) => v.lang === lang || v.lang.startsWith(langPrefix + "-"),
      );

      if (match) {
        utterance.voice = match;
      } else {
        Toast.show({
          type: "error",
          text1: `No ${lang} voice found`,
          text2:
            "Install a Danish voice: Settings → Accessibility → Spoken Content → Voices.",
        });
        setIsSpeaking(false);
        return;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      Speech.speak(text, {
        language: lang,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

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

Generate exactly ${questionCount} questions as a JSON array. Include a mix of all four types:
1. "multiple-choice" — 4 plausible written options, only one correct
2. "true-false" — present a term with a potentially wrong definition
3. "written" — ask the user to type the translation
4. "sound" — the user hears a word/phrase spoken aloud and must identify it

Each object must have:
{
  "type": "multiple-choice" | "true-false" | "written" | "sound",
  "prompt": "question text shown to the user (for sound: e.g. 'Listen and translate:')",
  "correctAnswer": "the correct answer string",
  "options": ["a","b","c","d"],     // for multiple-choice and sound with soundVariant multiple-choice
  "explanation": "brief explanation",
  // For type "sound" only:
  "audioText": "the exact text to speak aloud",
  "audioLang": "${deck.frontLang}",
  "soundVariant": "multiple-choice" | "written"
}

For type "sound":
- audioText should be the word/phrase from the front side of the card (in ${deck.frontLang})
- correctAnswer should be the translation the user must produce (in ${deck.backLang})
- options (if soundVariant is "multiple-choice") should be plausible translations in ${deck.backLang}
- prompt should be instructional, e.g. "Listen and translate:"
- audioLang must be "${deck.frontLang}"

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
        // Force correct language code — AI may return "da" instead of "da-DK"
        audioLang: q.type === "sound" ? deck.frontLang : q.audioLang,
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
        if (typeRand > 0.75) {
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
        } else if (typeRand > 0.5) {
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
        } else if (typeRand > 0.25) {
          return {
            id: `q-${i}`,
            type: "written" as const,
            prompt: `Translate "${card.front}" into ${deck.backLang}:`,
            correctAnswer: card.back,
            explanation: `The correct answer is "${card.back}".`,
          };
        } else {
          // Sound question
          const canDoSoundMultiple = deck.cards.length >= 4;
          const soundIsMultipleChoice =
            canDoSoundMultiple && Math.random() > 0.5;
          const distractors = deck.cards
            .filter((c) => c.id !== card.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((c) => c.back);

          return {
            id: `q-${i}`,
            type: "sound" as const,
            prompt: "Listen and translate:",
            audioText: card.front,
            audioLang: deck.frontLang,
            correctAnswer: card.back,
            soundVariant: (soundIsMultipleChoice
              ? "multiple-choice"
              : "written") as "multiple-choice" | "written",
            options: soundIsMultipleChoice
              ? [card.back, ...distractors].sort(() => Math.random() - 0.5)
              : undefined,
            explanation: `"${card.front}" (${deck.frontLang}) translates to "${card.back}".`,
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
    const isWrittenInput =
      current.type === "written" ||
      (current.type === "sound" && current.soundVariant === "written");

    const isCorrect = isWrittenInput
      ? answer.trim().toLowerCase() ===
        current.correctAnswer.trim().toLowerCase()
      : answer === current.correctAnswer;

    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setUserAnswer(answer);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    Speech.stop();
    setIsSpeaking(false);
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
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-8 gap-6">
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

  const isWrittenInput =
    current.type === "written" ||
    (current.type === "sound" && current.soundVariant === "written");

  const isAnswerCorrect = isWrittenInput
    ? userAnswer.trim().toLowerCase() ===
      current.correctAnswer.trim().toLowerCase()
    : userAnswer === current.correctAnswer;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Pressable
          onPress={() => {
            Speech.stop();
            onCancel();
          }}
          className="p-2 -ml-2"
        >
          <X size={24} color="#64748b" />
        </Pressable>
        <View className="items-center">
          <View className="flex-row items-center gap-1">
            <Sparkles size={10} color="#4f46e5" />
            <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              AI Test Mode
            </Text>
          </View>
          <Text
            className="font-semibold text-sm text-slate-900 dark:text-white"
            numberOfLines={1}
          >
            {deck.title}
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

      {/* Question */}
      <ScrollView
        className="flex-1 p-6"
        contentContainerClassName="items-center justify-center flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[384px] gap-8">
          <View className="items-center gap-4">
            <View className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
              <Text className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                {current.type === "sound"
                  ? "listening"
                  : current.type.replace("-", " ")}
              </Text>
            </View>

            {/* Non-sound prompt */}
            {current.type !== "sound" && (
              <Text className="text-2xl font-bold text-slate-800 dark:text-white text-center leading-relaxed">
                {current.prompt}
              </Text>
            )}

            {/* Sound prompt: speaker button */}
            {current.type === "sound" && (
              <View className="items-center gap-4">
                <Text className="text-base text-slate-500 dark:text-slate-400 text-center">
                  {current.prompt}
                </Text>
                <Pressable
                  onPress={() => {
                    if (current.audioText && current.audioLang) {
                      speakAudio(current.audioText, current.audioLang);
                    }
                  }}
                  disabled={showFeedback}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Animated.View
                    style={[
                      {
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        alignItems: "center" as const,
                        justifyContent: "center" as const,
                        backgroundColor: isSpeaking ? "#e0e7ff" : "#4f46e5",
                      },
                      isSpeaking ? speakingPulseStyle : {},
                    ]}
                  >
                    <Volume2
                      size={44}
                      color={isSpeaking ? "#4f46e5" : "#ffffff"}
                    />
                  </Animated.View>
                </Pressable>
                <Text className="text-xs text-slate-400 font-medium">
                  Tap to {isSpeaking ? "replay" : "listen"}
                </Text>
              </View>
            )}
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
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                          : isSelected
                            ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
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
                              ? "text-green-700 dark:text-green-400"
                              : isSelected
                                ? "text-red-700 dark:text-red-400"
                                : "text-slate-400 dark:text-slate-600"
                            : "text-slate-800 dark:text-white"
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
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                            : isSelected
                              ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
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
                                ? "text-red-700 dark:text-red-400"
                                : "text-slate-400 dark:text-slate-600"
                            : "text-slate-700 dark:text-white"
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
                        ? "bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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

            {/* Sound: multiple-choice variant */}
            {current.type === "sound" &&
              current.soundVariant === "multiple-choice" &&
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
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                          : isSelected
                            ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
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
                              ? "text-green-700 dark:text-green-400"
                              : isSelected
                                ? "text-red-700 dark:text-red-400"
                                : "text-slate-400 dark:text-slate-600"
                            : "text-slate-800 dark:text-white"
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

            {/* Sound: written variant */}
            {current.type === "sound" && current.soundVariant === "written" && (
              <View className="gap-4">
                <TextInput
                  editable={!showFeedback}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  onSubmitEditing={() => handleAnswer(userAnswer)}
                  returnKeyType="done"
                  placeholder="Type what you heard..."
                  placeholderTextColor="#94a3b8"
                  className={`w-full p-4 rounded-2xl border-2 text-base ${
                    showFeedback
                      ? isAnswerCorrect
                        ? "bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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
                  ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50"
                  : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50"
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
                    isAnswerCorrect
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {isAnswerCorrect ? "Brilliant!" : "Not quite"}
                </Text>
              </View>
              <Text
                className={`text-sm font-medium leading-relaxed ${
                  isAnswerCorrect
                    ? "text-green-800 dark:text-green-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {current.explanation}
              </Text>
              <Pressable
                onPress={nextQuestion}
                className="mt-4 w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex-row items-center justify-center gap-2"
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Text className="text-slate-800 dark:text-white font-bold">
                  Next Question
                </Text>
                <ChevronRight
                  size={18}
                  color={isAnswerCorrect ? "#166534" : "#991b1b"}
                />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
