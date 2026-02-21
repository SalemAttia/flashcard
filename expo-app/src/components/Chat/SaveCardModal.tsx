import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Check, Plus } from "lucide-react-native";
import { Language, Deck } from "../../types";
import { LANGUAGES } from "../../constants/languages";

interface SaveCardModalProps {
  visible: boolean;
  initialFront: string;
  initialBack: string;
  isExtracting: boolean;
  studyLang: Language;
  nativeLang: Language;
  decks: Deck[];
  onSave: (
    deckId: string | null,
    newDeckTitle: string | null,
    front: string,
    back: string
  ) => void;
  onClose: () => void;
}

export function SaveCardModal({
  visible,
  initialFront,
  initialBack,
  isExtracting,
  studyLang,
  nativeLang,
  decks,
  onSave,
  onClose,
}: SaveCardModalProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(
    decks[0]?.id ?? null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");

  const studyLabel = LANGUAGES.find((l) => l.value === studyLang)?.label ?? studyLang;
  const nativeLabel = LANGUAGES.find((l) => l.value === nativeLang)?.label ?? nativeLang;

  useEffect(() => {
    if (visible) {
      setFront(initialFront);
      setBack(initialBack);
      setIsCreatingNew(decks.length === 0);
      setNewDeckTitle("");
      setSelectedDeckId(decks[0]?.id ?? null);
    }
  }, [visible]);

  // Update fields when AI extraction completes
  useEffect(() => {
    if (visible && initialFront) setFront(initialFront);
  }, [initialFront]);

  useEffect(() => {
    if (visible && initialBack) setBack(initialBack);
  }, [initialBack]);

  const canSave =
    front.trim().length > 0 &&
    back.trim().length > 0 &&
    (isCreatingNew ? newDeckTitle.trim().length > 0 : selectedDeckId !== null);

  const handleSave = () => {
    if (!canSave) return;
    if (isCreatingNew) {
      onSave(null, newDeckTitle.trim(), front.trim(), back.trim());
    } else {
      onSave(selectedDeckId, null, front.trim(), back.trim());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-semibold text-slate-900">
              Save Flashcard
            </Text>
            <Pressable onPress={onClose} className="p-2 rounded-xl bg-slate-50">
              <X size={18} color="#64748b" />
            </Pressable>
          </View>

          {/* Front field */}
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Front ({studyLabel})
          </Text>
          <View className="relative mb-4">
            <TextInput
              value={front}
              onChangeText={setFront}
              placeholder={`Word in ${studyLabel}...`}
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
              style={{ writingDirection: studyLang === "ar-SA" ? "rtl" : "ltr" }}
            />
            {isExtracting && !front && (
              <ActivityIndicator
                size="small"
                color="#4f46e5"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            )}
          </View>

          {/* Back field */}
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Back ({nativeLabel})
          </Text>
          <View className="relative mb-6">
            <TextInput
              value={back}
              onChangeText={setBack}
              placeholder={`Translation in ${nativeLabel}...`}
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
              style={{ writingDirection: nativeLang === "ar-SA" ? "rtl" : "ltr" }}
            />
            {isExtracting && !back && (
              <ActivityIndicator
                size="small"
                color="#4f46e5"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            )}
          </View>

          {/* Deck picker */}
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Save to Deck
          </Text>

          <ScrollView style={{ maxHeight: 160 }} className="mb-4">
            {decks.map((deck) => (
              <Pressable
                key={deck.id}
                onPress={() => {
                  setSelectedDeckId(deck.id);
                  setIsCreatingNew(false);
                }}
                className="flex-row items-center justify-between py-3 border-b border-slate-100"
              >
                <View>
                  <Text className="text-sm font-medium text-slate-900">
                    {deck.title}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                {!isCreatingNew && selectedDeckId === deck.id && (
                  <Check size={18} color="#4f46e5" />
                )}
              </Pressable>
            ))}

            {/* Create new option */}
            <Pressable
              onPress={() => {
                setIsCreatingNew(true);
                setSelectedDeckId(null);
              }}
              className="flex-row items-center gap-2 py-3"
            >
              <Plus size={16} color={isCreatingNew ? "#4f46e5" : "#94a3b8"} />
              <Text
                className={`text-sm font-medium ${
                  isCreatingNew ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                Create new deck
              </Text>
              {isCreatingNew && <Check size={18} color="#4f46e5" />}
            </Pressable>
          </ScrollView>

          {isCreatingNew && (
            <TextInput
              value={newDeckTitle}
              onChangeText={setNewDeckTitle}
              placeholder="New deck name..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 mb-4"
              autoFocus
            />
          )}

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 items-center"
            >
              <Text className="text-sm font-medium text-slate-600">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 items-center"
              style={{ opacity: canSave ? 1 : 0.4 }}
            >
              <Text className="text-sm font-medium text-white">Save Card</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
