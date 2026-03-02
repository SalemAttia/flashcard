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
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  X,
  FileText,
  Sparkles,
  Camera,
  ImagePlus,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import OpenAI from "openai";
import { Globe } from "lucide-react-native";
import { Deck, Card, Language } from "../types";
import { LanguagePicker } from "./LanguagePicker";
import { useChatLanguages } from "../store/useChatLanguages";
import { LANGUAGES } from "../constants/languages";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

interface DeckEditorProps {
  deck?: Deck;
  onSave: (deck: Deck) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  isGlobal?: boolean;
  onToggleGlobal?: () => void;
}

export function DeckEditor({
  deck,
  onSave,
  onCancel,
  onDelete,
  isAdmin,
  isGlobal,
  onToggleGlobal,
}: DeckEditorProps) {
  const { nativeLang, userLevel } = useChatLanguages();
  const nativeLangName =
    LANGUAGES.find((l) => l.value === nativeLang)?.label ?? "English";

  const [title, setTitle] = useState(deck?.title || "");
  const [description, setDescription] = useState(deck?.description || "");
  const [frontLang, setFrontLang] = useState<Language>(
    deck?.frontLang || "en-US",
  );
  const [backLang, setBackLang] = useState<Language>(deck?.backLang || "da-DK");
  const [cards, setCards] = useState<Card[]>(
    deck?.cards || [{ id: "1", front: "", back: "" }],
  );
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showAiGenerate, setShowAiGenerate] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCardCount, setAiCardCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [showImageGenerate, setShowImageGenerate] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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
      Toast.show({
        type: "error",
        text1: "Invalid format. Use 'Front; Back' format.",
      });
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

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      Toast.show({ type: "error", text1: "Please enter a topic" });
      return;
    }
    if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") {
      Toast.show({ type: "error", text1: "OpenAI API key not configured" });
      return;
    }

    setAiLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: OPENAI_KEY,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are an expert multilingual language educator. The student's native language is ${nativeLangName}. Their CEFR level is ${userLevel.toUpperCase()}. Generate flashcard pairs for language learners. Always respond with valid JSON only, no markdown fences.`,
          },
          {
            role: "user",
            content: `Generate ${aiCardCount} flashcard pairs for the topic "${aiTopic}" at CEFR ${userLevel.toUpperCase()} level.
Front language: ${frontLang}
Back language: ${backLang}

Return a JSON array where each object has:
{ "front": "word/phrase in ${frontLang}", "back": "translation in ${backLang}" }

Guidelines based on CEFR level:
- A1: common everyday nouns, basic adjectives, simple greetings
- A2: everyday vocabulary, simple verbs, short useful phrases
- B1: wider vocabulary, common idioms, descriptive phrases, compound words
- B2: specialized terms, complex expressions, nuanced vocabulary, formal register
- Ensure variety within the topic
- Return ONLY the JSON array.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim() || "[]";
      const jsonStr = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      const parsed: { front: string; back: string }[] = JSON.parse(jsonStr);

      if (parsed.length === 0) {
        throw new Error("AI returned no cards");
      }

      const newCards: Card[] = parsed.map((c) => ({
        id: Math.random().toString(36).substr(2, 9),
        front: c.front,
        back: c.back,
      }));

      setCards([...cards.filter((c) => c.front || c.back), ...newCards]);
      setShowAiGenerate(false);
      setAiTopic("");
      Toast.show({
        type: "success",
        text1: `Generated ${newCards.length} cards`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to generate cards. Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: "error", text1: "Camera permission is required" });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.9,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Photo library permission is required",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.9,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const handleImageGenerate = async () => {
    if (!imageBase64) {
      Toast.show({ type: "error", text1: "Please select an image first" });
      return;
    }
    if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") {
      Toast.show({ type: "error", text1: "OpenAI API key not configured" });
      return;
    }

    setImageLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: OPENAI_KEY,
        dangerouslyAllowBrowser: true,
      });

      const frontLangName =
        LANGUAGES.find((l) => l.value === frontLang)?.label ?? frontLang;
      const backLangName =
        LANGUAGES.find((l) => l.value === backLang)?.label ?? backLang;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `You are an expert multilingual OCR and language education assistant. The student's native language is ${nativeLangName} and their CEFR level is ${userLevel.toUpperCase()}. Always respond with valid JSON only, no markdown fences.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: `Analyze this image thoroughly and create vocabulary flashcard pairs.
Front language: ${frontLangName} (${frontLang})
Back language: ${backLangName} (${backLang})
Student CEFR level: ${userLevel.toUpperCase()}

Return a JSON array where each object has:
{ "front": "word/phrase in ${frontLangName}", "back": "translation in ${backLangName}" }

CRITICAL INSTRUCTIONS:
- If the image contains ANY readable text (printed, handwritten, signs, labels, captions, UI text, book pages, screenshots), extract ALL of it. Create one card per word or short phrase.
- If the image shows objects or scenes, identify ALL visible items, actions, colors, materials, and concepts.
- There is NO limit on the number of cards. Return as many as the image contains. Extract EVERYTHING.
- Do NOT skip words. Do NOT summarize. Be exhaustive.
- Every card must relate to something actually visible or readable in the image.
- Adjust vocabulary complexity to CEFR ${userLevel.toUpperCase()} level:
  - A1: include all common everyday words, skip highly technical/specialized terms
  - A2: include everyday vocabulary plus simple descriptive words
  - B1: include most vocabulary including common idioms and compound words
  - B2: include everything — specialized terms, nuanced vocabulary, formal register
- Ensure accurate translations in ${backLangName}.
- Return ONLY the JSON array.`,
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim() || "[]";
      const jsonStr = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      const parsed: { front: string; back: string }[] = JSON.parse(jsonStr);

      if (parsed.length === 0) {
        throw new Error("AI returned no cards");
      }

      const newCards: Card[] = parsed.map((c) => ({
        id: Math.random().toString(36).substr(2, 9),
        front: c.front,
        back: c.back,
      }));

      setCards([...cards.filter((c) => c.front || c.back), ...newCards]);
      setShowImageGenerate(false);
      setImageUri(null);
      setImageBase64(null);
      Toast.show({
        type: "success",
        text1: `Generated ${newCards.length} cards from image`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to analyze image. Please try again.",
      });
    } finally {
      setImageLoading(false);
    }
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
      className="flex-1 bg-white dark:bg-slate-950"
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Pressable onPress={onCancel} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>
        <Text className="font-semibold dark:text-white">
          {deck ? "Edit Set" : "Create New Set"}
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => setShowAiGenerate(true)}
            className="flex-row items-center gap-1"
          >
            <Sparkles size={16} color="#4f46e5" />
            <Text className="text-indigo-600 font-medium text-sm">AI</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowImageGenerate(true)}
            className="flex-row items-center gap-1"
          >
            <Camera size={16} color="#4f46e5" />
            <Text className="text-indigo-600 font-medium text-sm">Image</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowBulk(true)}
            className="flex-row items-center gap-1"
          >
            <FileText size={16} color="#4f46e5" />
            <Text className="text-indigo-600 font-medium text-sm">Bulk</Text>
          </Pressable>
        </View>
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
              className="text-xl font-medium border-b-2 border-slate-100 dark:border-slate-800 py-2 text-slate-900 dark:text-white"
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

          {/* Global Toggle – admin only, existing deck only */}
          {isAdmin && deck && onToggleGlobal && (
            <Pressable
              onPress={onToggleGlobal}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${isGlobal
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Globe size={20} color={isGlobal ? "#059669" : "#94a3b8"} />
                <View className="flex-1">
                  <Text className={`font-semibold text-sm ${isGlobal ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                    }`}>
                    Make Global for Everyone
                  </Text>
                  <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {isGlobal ? "All users can see and study this deck" : "Only you can see this deck"}
                  </Text>
                </View>
              </View>
              <Switch
                value={!!isGlobal}
                onValueChange={onToggleGlobal}
                trackColor={{ false: "#cbd5e1", true: "#6ee7b7" }}
                thumbColor={isGlobal ? "#059669" : "#f1f5f9"}
              />
            </Pressable>
          )}
        </View>

        <View className="gap-6 pb-24">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-slate-800 dark:text-white">
              Cards
            </Text>
            <Text className="text-xs text-slate-400">({cards.length})</Text>
          </View>

          {cards.map((card, idx) => (
            <View
              key={card.id}
              className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800"
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
                    onChangeText={(value) =>
                      updateCard(card.id, "front", value)
                    }
                    placeholder="Enter term..."
                    placeholderTextColor="#cbd5e1"
                    className="text-sm font-medium text-slate-900 dark:text-white"
                    textAlignVertical="top"
                    style={{
                      writingDirection: frontLang === "ar-SA" ? "rtl" : "ltr",
                    }}
                  />
                </View>
                <View className="h-px bg-slate-200 dark:bg-slate-800" />
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
                    className="text-sm text-slate-900 dark:text-slate-200"
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
            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex-row items-center justify-center gap-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Plus size={20} color="#94a3b8" />
            <Text className="text-slate-400 font-medium">Add Card</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bulk Import Modal */}
      <Modal visible={showBulk} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowBulk(false)}
        />
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-lg dark:text-white">
              Bulk Import
            </Text>
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
            placeholderTextColor="#94a3b8"
            className="h-48 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-sm border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
            textAlignVertical="top"
            style={{
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            }}
          />
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => setShowBulk(false)}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-semibold">
                Cancel
              </Text>
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

      {/* AI Generate Modal */}
      <Modal visible={showAiGenerate} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => !aiLoading && setShowAiGenerate(false)}
        />
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#4f46e5" />
              <Text className="font-bold text-lg dark:text-white">
                AI Generate
              </Text>
            </View>
            <Pressable
              onPress={() => !aiLoading && setShowAiGenerate(false)}
              className="p-2"
            >
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Topic
              </Text>
              <TextInput
                value={aiTopic}
                onChangeText={setAiTopic}
                placeholder="e.g., Food vocabulary, Travel phrases"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-sm border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                editable={!aiLoading}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Level (from settings)
              </Text>
              <View className="bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-500 rounded-xl py-3 items-center">
                <Text className="text-xs font-bold text-indigo-600">
                  CEFR {userLevel.toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Number of Cards
              </Text>
              <View className="flex-row gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <Pressable
                    key={count}
                    onPress={() => !aiLoading && setAiCardCount(count)}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${aiCardCount === count
                        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                      }`}
                  >
                    <Text
                      className={`text-sm font-bold ${aiCardCount === count
                          ? "text-indigo-600"
                          : "text-slate-400"
                        }`}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => setShowAiGenerate(false)}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
              disabled={aiLoading}
            >
              <Text className="text-slate-600 dark:text-slate-300 font-semibold">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAiGenerate}
              className="flex-1 py-3 bg-indigo-600 rounded-xl flex-row items-center justify-center gap-2"
              disabled={aiLoading}
              style={{ opacity: aiLoading ? 0.7 : 1 }}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Sparkles size={16} color="#fff" />
              )}
              <Text className="text-white font-semibold">
                {aiLoading ? "Generating..." : "Generate"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image Generate Modal */}
      <Modal visible={showImageGenerate} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => !imageLoading && setShowImageGenerate(false)}
        />
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Camera size={20} color="#4f46e5" />
              <Text className="font-bold text-lg dark:text-white">
                Image to Cards
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (!imageLoading) {
                  setShowImageGenerate(false);
                  setImageUri(null);
                  setImageBase64(null);
                }
              }}
              className="p-2"
            >
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <View className="gap-4">
            <View className="flex-row gap-3">
              <Pressable
                onPress={pickImageFromCamera}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl items-center border border-slate-100 dark:border-slate-800"
                disabled={imageLoading}
              >
                <Camera size={24} color="#4f46e5" />
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  Take Photo
                </Text>
              </Pressable>
              <Pressable
                onPress={pickImageFromGallery}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl items-center border border-slate-100 dark:border-slate-800"
                disabled={imageLoading}
              >
                <ImagePlus size={24} color="#4f46e5" />
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  Gallery
                </Text>
              </Pressable>
            </View>

            {imageUri && (
              <View className="items-center">
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-40 rounded-2xl"
                  resizeMode="cover"
                />
              </View>
            )}

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Level (from settings)
              </Text>
              <View className="bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-500 rounded-xl py-3 items-center">
                <Text className="text-xs font-bold text-indigo-600">
                  CEFR {userLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => {
                setShowImageGenerate(false);
                setImageUri(null);
                setImageBase64(null);
              }}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
              disabled={imageLoading}
            >
              <Text className="text-slate-600 dark:text-slate-300 font-semibold">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleImageGenerate}
              className="flex-1 py-3 bg-indigo-600 rounded-xl flex-row items-center justify-center gap-2"
              disabled={imageLoading || !imageBase64}
              style={{ opacity: imageLoading || !imageBase64 ? 0.7 : 1 }}
            >
              {imageLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
              <Text className="text-white font-semibold">
                {imageLoading ? "Analyzing..." : "Generate"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View className="p-6 border-t border-slate-100 dark:border-slate-800 flex-row gap-3 bg-white dark:bg-slate-900">
        {deck && (
          <Pressable
            onPress={() => onDelete(deck.id)}
            className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl"
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
