import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Send } from "lucide-react-native";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const canSend = !disabled && text.trim().length > 0;

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 border-t border-slate-100 bg-white">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask anything..."
        placeholderTextColor="#94a3b8"
        multiline
        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900"
        style={{ maxHeight: 112 }}
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className="w-11 h-11 rounded-full bg-indigo-600 items-center justify-center"
        style={{ opacity: canSend ? 1 : 0.4 }}
      >
        <Send size={18} color="#fff" />
      </Pressable>
    </View>
  );
}
