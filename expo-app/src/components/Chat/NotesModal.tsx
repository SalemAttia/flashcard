import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { X, Trash2, FileText } from "lucide-react-native";
import { ChatNote } from "../../types";

interface NotesModalProps {
  visible: boolean;
  notes: ChatNote[];
  onDeleteNote: (id: string) => void;
  onClose: () => void;
}

function formatNoteDate(timestamp: string): string {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " +
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function NotesModal({
  visible,
  notes,
  onDeleteNote,
  onClose,
}: NotesModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-slate-900">Notes</Text>
            {notes.length > 0 && (
              <View className="bg-indigo-100 rounded-full px-2 py-0.5">
                <Text className="text-xs font-semibold text-indigo-600">
                  {notes.length}
                </Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} className="p-2 rounded-xl bg-slate-50">
            <X size={18} color="#64748b" />
          </Pressable>
        </View>

        {/* Notes list */}
        {notes.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 gap-3">
            <FileText size={40} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm text-center">
              No notes yet. Tap "Add Note" on any tutor message to save it here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 mb-1">
                      {formatNoteDate(item.timestamp)}
                    </Text>
                    <Text className="text-sm text-slate-900 leading-5">
                      {item.text}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onDeleteNote(item.id)}
                    className="p-2 rounded-lg bg-red-50"
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
