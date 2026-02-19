import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronLeft, Plus, Trash2, Save, X, FileText } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Deck, Card, Language } from "../types";
import { LanguagePicker } from "./LanguagePicker";

interface DeckEditorProps {
  deck?: Deck;
  onSave: (deck: Deck) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export function DeckEditor({ deck, onSave, onCancel, onDelete }: DeckEditorProps) {
  const [title, setTitle] = useState(deck?.title || "");
  const [description, setDescription] = useState(deck?.description || "");
  const [frontLang, setFrontLang] = useState<Language>(deck?.frontLang || "en-US");
  const [backLang, setBackLang] = useState<Language>(deck?.backLang || "da-DK");
  const [cards, setCards] = useState<Card[]>(
    deck?.cards || [{ id: "1", front: "", back: "" }]
  );
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addCard = () => {
    setCards([
      ...cards,
      { id: Math.random().toString(36).substr(2, 9), front: "", back: "" },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length === 1) return;
    setCards(cards.filter((c) => c.id !== id));
  };

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleBulkImport = () => {
    const lines = bulkText
      .split("\n")
      .filter((l) => l.trim().includes(";") || l.trim().includes(","));
    if (lines.length === 0) {
      Toast.show({ type: "error", text1: "Invalid format. Use 'Front; Back' format." });
      return;
    }

    const newCards = lines.map((line) => {
      const [front, ...backParts] = line.split(/[;,]/);
      return {
        id: Math.random().toString(36).substr(2, 9),
        front: front.trim(),
        back: backParts.join(";").trim(),
      };
    });

    setCards([...cards.filter((c) => c.front || c.back), ...newCards]);
    setBulkText("");
    setShowBulk(false);
    Toast.show({ type: "success", text1: `Imported ${newCards.length} cards` });
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: deck?.id || "",
      title,
      description,
      frontLang,
      backLang,
      cards: cards.filter((c) => c.front.trim() && c.back.trim()),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-100 bg-white">
        <Pressable onPress={onCancel} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>
        <Text className="font-semibold">
          {deck ? "Edit Set" : "Create New Set"}
        </Text>
        <Pressable
          onPress={() => setShowBulk(true)}
          className="flex-row items-center gap-1.5"
        >
          <FileText size={16} color="#4f46e5" />
          <Text className="text-indigo-600 font-medium text-sm">Bulk</Text>
        </Pressable>
      </View>

      {/* Form */}
      <ScrollView className="flex-1 p-6" keyboardShouldPersistTaps="handled">
        <View className="gap-6 mb-6">
          <View className="gap-2">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
              Set Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Arabic Vocabulary"
              placeholderTextColor="#cbd5e1"
              className="text-xl font-medium border-b-2 border-slate-100 py-2 text-slate-900"
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <LanguagePicker
                value={frontLang}
                onChange={setFrontLang}
                label="Front Language"
              />
            </View>
            <View className="flex-1">
              <LanguagePicker
                value={backLang}
                onChange={setBackLang}
                label="Back Language"
              />
            </View>
          </View>
        </View>

        <View className="gap-6 pb-24">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-slate-800">Cards</Text>
            <Text className="text-xs text-slate-400">({cards.length})</Text>
          </View>

          {cards.map((card, idx) => (
            <View
              key={card.id}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
            >
              <Pressable
                onPress={() => removeCard(card.id)}
                className="absolute top-4 right-4 p-1 z-10"
              >
                <X size={18} color="#cbd5e1" />
              </Pressable>
              <View className="gap-4">
                <View className="gap-1.5">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Front ({frontLang})
                  </Text>
                  <TextInput
                    multiline
                    value={card.front}
                    onChangeText={(value) => updateCard(card.id, "front", value)}
                    placeholder="Enter term..."
                    placeholderTextColor="#cbd5e1"
                    className="text-sm font-medium text-slate-900"
                    textAlignVertical="top"
                    style={{
                      writingDirection: frontLang === "ar-SA" ? "rtl" : "ltr",
                    }}
                  />
                </View>
                <View className="h-px bg-slate-200" />
                <View className="gap-1.5">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Back ({backLang})
                  </Text>
                  <TextInput
                    multiline
                    value={card.back}
                    onChangeText={(value) => updateCard(card.id, "back", value)}
                    placeholder="Enter translation..."
                    placeholderTextColor="#cbd5e1"
                    className="text-sm text-slate-900"
                    textAlignVertical="top"
                    style={{
                      writingDirection: backLang === "ar-SA" ? "rtl" : "ltr",
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addCard}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex-row items-center justify-center gap-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Plus size={20} color="#94a3b8" />
            <Text className="text-slate-400 font-medium">Add Card</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bulk Import Modal */}
      <Modal visible={showBulk} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowBulk(false)} />
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-lg">Bulk Import</Text>
            <Pressable onPress={() => setShowBulk(false)} className="p-2">
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>
          <Text className="text-xs text-slate-500 mb-4">
            Paste your list below. Use a semicolon (;) or comma (,) to separate
            the front and back of each card.
          </Text>
          <TextInput
            multiline
            value={bulkText}
            onChangeText={setBulkText}
            placeholder={"Hello; Hej\nThank you; Tak"}
            placeholderTextColor="#cbd5e1"
            className="h-48 bg-slate-50 rounded-2xl p-4 text-sm border border-slate-100 text-slate-900"
            textAlignVertical="top"
            style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}
          />
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => setShowBulk(false)}
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="text-slate-600 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleBulkImport}
              className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Import Cards</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View className="p-6 border-t border-slate-100 flex-row gap-3 bg-white">
        {deck && (
          <Pressable
            onPress={() => onDelete(deck.id)}
            className="p-4 bg-red-50 rounded-2xl"
          >
            <Trash2 size={24} color="#dc2626" />
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Save size={20} color="#fff" />
          <Text className="text-white font-semibold">Save Changes</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
