import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Send, Lightbulb } from "lucide-react-native";
import { WritingPrompt } from "../../types";
import { LevelConfig } from "../../constants/writingLevels";

interface WritingPromptCardProps {
  prompt: WritingPrompt;
  levelConfig: LevelConfig;
  userText: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function WritingPromptCard({
  prompt,
  levelConfig,
  userText,
  onChangeText,
  onSubmit,
  isSubmitting,
}: WritingPromptCardProps) {
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = wordCount >= prompt.minWords;

  return (
    <View className="gap-5">
      <View className="bg-white rounded-2xl p-5 border border-slate-100 gap-4">
        <Text className="text-lg font-bold text-slate-800 leading-relaxed">
          {prompt.instruction}
        </Text>

        {prompt.contextWords && prompt.contextWords.length > 0 && (
          <View className="gap-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Try to use these words
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {prompt.contextWords.map((word, i) => (
                <View key={i} className="bg-amber-50 px-3 py-1 rounded-full">
                  <Text className="text-amber-700 text-xs font-medium">
                    {word}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {prompt.hints && prompt.hints.length > 0 && (
          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <Lightbulb size={12} color="#94a3b8" />
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hints
              </Text>
            </View>
            <View className="gap-1">
              {prompt.hints.map((hint, i) => (
                <Text key={i} className="text-xs text-slate-500 italic">
                  {hint}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className="gap-3">
        <TextInput
          multiline
          autoFocus
          editable={!isSubmitting}
          value={userText}
          onChangeText={onChangeText}
          placeholder="Skriv dit svar på dansk..."
          placeholderTextColor="#94a3b8"
          textAlignVertical="top"
          className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-base text-slate-900 min-h-[160px]"
        />

        <View className="flex-row items-center justify-between px-1">
          <Text
            className={`text-xs font-medium ${
              meetsMinWords ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {wordCount} / {prompt.minWords} words
          </Text>
          {!meetsMinWords && wordCount > 0 && (
            <Text className="text-[10px] text-slate-400">
              {prompt.minWords - wordCount} more needed
            </Text>
          )}
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={isSubmitting || wordCount === 0}
          className={`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
            isSubmitting || wordCount === 0 ? "bg-slate-200" : "bg-amber-500"
          }`}
          style={({ pressed }) => ({
            transform: [
              { scale: pressed && !isSubmitting && wordCount > 0 ? 0.98 : 1 },
            ],
          })}
        >
          {isSubmitting ? (
            <Text className="text-slate-400 font-semibold">
              Evaluating your writing...
            </Text>
          ) : (
            <>
              <Send size={16} color={wordCount === 0 ? "#94a3b8" : "#fff"} />
              <Text
                className={`font-semibold ${
                  wordCount === 0 ? "text-slate-400" : "text-white"
                }`}
              >
                Submit Answer
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
