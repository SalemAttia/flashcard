import React from "react";
import { View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { Language, WritingLevel } from "../../types";
import { LanguagePicker } from "../LanguagePicker";
import { LevelPicker } from "../LevelPicker";

interface LanguageSelectorProps {
  studyLang: Language;
  nativeLang: Language;
  userLevel: WritingLevel;
  onChangeStudy: (lang: Language) => void;
  onChangeNative: (lang: Language) => void;
  onChangeLevel: (level: WritingLevel) => void;
}

export function LanguageSelector({
  studyLang,
  nativeLang,
  userLevel,
  onChangeStudy,
  onChangeNative,
  onChangeLevel,
}: LanguageSelectorProps) {
  return (
    <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <LanguagePicker
            value={studyLang}
            onChange={onChangeStudy}
            label="Studying"
          />
        </View>
        <ArrowRight size={16} color="#94a3b8" style={{ marginTop: 20 }} />
        <View className="flex-1">
          <LanguagePicker
            value={nativeLang}
            onChange={onChangeNative}
            label="Native"
          />
        </View>
      </View>
      <LevelPicker value={userLevel} onChange={onChangeLevel} />
    </View>
  );
}
