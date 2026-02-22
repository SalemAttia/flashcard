import React from "react";
import { View, Text, Pressable } from "react-native";
import { BookmarkPlus, StickyNote } from "lucide-react-native";
import { ChatMessage as ChatMessageType } from "../../types";

interface ChatMessageProps {
  message: ChatMessageType;
  onSaveCard: (message: ChatMessageType) => void;
  onAddNote: (message: ChatMessageType) => void;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatMessageBubble({
  message,
  onSaveCard,
  onAddNote,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <View className={`flex-col ${isUser ? "items-end" : "items-start"} mb-1`}>
      <View
        className={
          isUser
            ? "bg-indigo-600 rounded-3xl rounded-br-sm px-4 py-3 max-w-[80%]"
            : "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-bl-sm px-4 py-3 max-w-[85%]"
        }
      >
        <Text
          className={`text-sm leading-5 ${isUser ? "text-white" : "text-slate-900 dark:text-slate-100"}`}
        >
          {message.content}
        </Text>
      </View>

      <Text className="text-[10px] text-slate-400 mt-1 mx-1">
        {formatTime(message.timestamp)}
      </Text>

      {!isUser && (
        <View className="flex-row gap-2 mt-1 ml-1">
          <Pressable
            onPress={() => onSaveCard(message)}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <BookmarkPlus size={13} color="#64748b" />
            <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Save Card
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onAddNote(message)}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <StickyNote size={13} color="#64748b" />
            <Text className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Add Note
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
