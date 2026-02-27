import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, GraduationCap } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { WritingLevel } from "../types";
import { WRITING_LEVELS } from "../constants/writingLevels";

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  emerald: { bg: "#ecfdf5", border: "#6ee7b7", text: "#059669", badge: "#10b981" },
  blue: { bg: "#eff6ff", border: "#93c5fd", text: "#2563eb", badge: "#3b82f6" },
  violet: { bg: "#f5f3ff", border: "#c4b5fd", text: "#7c3aed", badge: "#8b5cf6" },
  rose: { bg: "#fff1f2", border: "#fda4af", text: "#e11d48", badge: "#f43f5e" },
};

interface LevelPickerProps {
  visible: boolean;
  currentLevel: WritingLevel;
  onSelect: (level: WritingLevel) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  showClose?: boolean;
}

export const LevelPicker: React.FC<LevelPickerProps> = ({
  visible,
  currentLevel,
  onSelect,
  onClose,
  title = "Choose Your Level",
  subtitle = "Select your current Danish proficiency level. This personalizes your learning experience.",
  showClose = true,
}) => {
  const [selected, setSelected] = useState<WritingLevel>(currentLevel);

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View className="flex-1 bg-white dark:bg-slate-950">
        <SafeAreaView className="flex-1">
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="items-center mt-8 mb-8"
            >
              <View className="bg-indigo-50 dark:bg-indigo-900/30 w-20 h-20 rounded-full items-center justify-center mb-5">
                <GraduationCap size={40} color="#4f46e5" />
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
                {title}
              </Text>
              <Text className="text-base text-slate-500 dark:text-slate-400 text-center leading-6 px-4">
                {subtitle}
              </Text>
            </Animated.View>

            {/* Level Cards */}
            {WRITING_LEVELS.map((lvl, index) => {
              const colors = LEVEL_COLORS[lvl.color] ?? LEVEL_COLORS.blue;
              const isSelected = selected === lvl.value;

              return (
                <Animated.View
                  key={lvl.value}
                  entering={FadeInDown.delay(200 + index * 80).duration(400)}
                >
                  <Pressable
                    onPress={() => setSelected(lvl.value)}
                    className="mb-3"
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      className="rounded-2xl p-4 flex-row items-center"
                      style={{
                        backgroundColor: isSelected ? colors.bg : "transparent",
                        borderWidth: 2,
                        borderColor: isSelected ? colors.border : "#e2e8f0",
                      }}
                    >
                      {/* Color dot / check */}
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-4"
                        style={{
                          backgroundColor: isSelected ? colors.badge : `${colors.badge}20`,
                        }}
                      >
                        {isSelected ? (
                          <Check size={20} color="#fff" strokeWidth={3} />
                        ) : (
                          <Text
                            className="font-bold text-sm"
                            style={{ color: colors.badge }}
                          >
                            {lvl.value.toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Text */}
                      <View className="flex-1">
                        <View className="flex-row items-center mb-0.5">
                          <Text
                            className="font-bold text-base"
                            style={{ color: isSelected ? colors.text : "#334155" }}
                          >
                            {lvl.label}
                          </Text>
                        </View>
                        <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">
                          {lvl.sublabel}
                        </Text>
                        <Text
                          className="text-sm leading-5"
                          style={{ color: isSelected ? colors.text : "#64748b" }}
                        >
                          {lvl.description}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 pb-4 pt-2">
            <Pressable
              onPress={handleConfirm}
              className="bg-indigo-600 py-4 rounded-2xl items-center shadow-lg"
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text className="text-white font-bold text-lg">
                Confirm Level
              </Text>
            </Pressable>
            {showClose && (
              <Pressable onPress={onClose} className="mt-3 items-center py-2">
                <Text className="text-slate-400 font-semibold">Cancel</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
