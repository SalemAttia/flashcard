import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { Language } from "../types";
import { LANGUAGES } from "../constants/languages";

interface LanguagePickerProps {
  value: Language;
  onChange: (value: Language) => void;
  label: string;
}

export function LanguagePicker({
  value,
  onChange,
  label,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.value === value);

  return (
    <>
      <View className="gap-2">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </Text>
        <Pressable
          onPress={() => setOpen(true)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="text-sm font-medium dark:text-white">
            {selected?.flag} {selected?.label}
          </Text>
          <ChevronDown size={16} color="#94a3b8" />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setOpen(false)}
        />
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10">
          <Text className="font-bold text-lg mb-4">{label}</Text>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.value}
              onPress={() => {
                onChange(lang.value);
                setOpen(false);
              }}
              className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
            >
              <Text className="text-base font-medium dark:text-white">
                {lang.flag} {lang.label}
              </Text>
              {lang.value === value && <Check size={20} color="#4f46e5" />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}
