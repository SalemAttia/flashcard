import React, { useEffect } from "react";
import { View, Text, Pressable, useWindowDimensions, Platform } from "react-native";
import { RotateCcw, Volume2 } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Card, Language } from "../types";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
  frontLang: Language;
  backLang: Language;
  onSpeak: (text: string, lang: Language) => void;
}

export function Flashcard({
  card,
  isFlipped,
  onFlip,
  frontLang,
  backLang,
  onSpeak,
}: FlashcardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 340);
  const cardHeight = cardWidth * (4 / 3);

  const flipAnim = useSharedValue(0);

  useEffect(() => {
    flipAnim.value = withTiming(isFlipped ? 1 : 0, { duration: 500 });
  }, [isFlipped]);

  // On web, backfaceVisibility in animated styles doesn't work reliably.
  // Use opacity to hide/show faces instead: front visible when < 90deg, back when >= 90deg.
  const sharedFaceStyle = {
    position: "absolute" as const,
    width: "100%" as const,
    height: "100%" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: "hidden" as const,
      opacity: Platform.OS === "web"
        ? interpolate(flipAnim.value, [0, 0.5, 0.5, 1], [1, 1, 0, 0])
        : 1,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: "hidden" as const,
      opacity: Platform.OS === "web"
        ? interpolate(flipAnim.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1])
        : 1,
    };
  });

  return (
    <Pressable
      onPress={onFlip}
      style={{ width: cardWidth, height: cardHeight }}
    >
      {/* Front */}
      <Animated.View
        style={[
          sharedFaceStyle,
          frontStyle,
          {
            shadowColor: "#94a3b8",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
          },
        ]}
        className="bg-white border-2 border-slate-100 rounded-[32px] p-8 items-center justify-center"
      >
        <View className="absolute top-6 left-6">
          <Text className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Term ({frontLang})
          </Text>
        </View>
        <Pressable
          onPress={() => onSpeak(card.front, frontLang)}
          className="absolute top-6 right-6 p-2 bg-indigo-50 rounded-full"
        >
          <Volume2 size={20} color="#818cf8" />
        </Pressable>
        <Text
          className="text-2xl font-medium text-slate-800 text-center leading-relaxed"
          style={{
            writingDirection: frontLang === "ar-SA" ? "rtl" : "ltr",
          }}
        >
          {card.front}
        </Text>
        <View className="absolute bottom-8 flex-row items-center gap-2">
          <RotateCcw size={12} color="#cbd5e1" />
          <Text className="text-slate-300 text-xs font-medium">
            Tap to flip
          </Text>
        </View>
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[
          sharedFaceStyle,
          backStyle,
          {
            shadowColor: "#94a3b8",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
          },
        ]}
        className="bg-white border-2 border-slate-100 rounded-[32px] p-8 items-center justify-center"
      >
        <View className="absolute top-6 left-6">
          <Text className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Definition ({backLang})
          </Text>
        </View>
        <Pressable
          onPress={() => onSpeak(card.back, backLang)}
          className="absolute top-6 right-6 p-2 bg-indigo-50 rounded-full"
        >
          <Volume2 size={20} color="#818cf8" />
        </Pressable>
        <Text
          className="text-xl font-medium text-slate-800 text-center leading-relaxed"
          style={{
            writingDirection: backLang === "ar-SA" ? "rtl" : "ltr",
          }}
        >
          {card.back}
        </Text>
        <View className="absolute bottom-8 flex-row items-center gap-2">
          <RotateCcw size={12} color="#cbd5e1" />
          <Text className="text-slate-300 text-xs font-medium">
            Tap to flip back
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
