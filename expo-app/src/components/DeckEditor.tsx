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
} from "react-native";
import { ChevronLeft, Plus, Trash2, Save, X, FileText, Sparkles, Camera, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import OpenAI from "openai";
import { Deck, Card, Language } from "../types";
import { LanguagePicker } from "./LanguagePicker";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

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
  const [showAiGenerate, setShowAiGenerate] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [aiCardCount, setAiCardCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [showImageGenerate, setShowImageGenerate] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageLevel, setImageLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
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
            content:
              "You are an expert language educator. Generate flashcard pairs for language learners. Always respond with valid JSON only, no markdown fences.",
          },
          {
            role: "user",
            content: `Generate ${aiCardCount} flashcard pairs for the topic "${aiTopic}" at ${aiLevel} level.
Front language: ${frontLang}
Back language: ${backLang}

Return a JSON array where each object has:
{ "front": "word/phrase in ${frontLang}", "back": "translation in ${backLang}" }

Guidelines:
- For beginner: common, everyday words and simple phrases
- For intermediate: more nuanced vocabulary, common idioms
- For advanced: specialized terms, complex expressions, rare vocabulary
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
      Toast.show({ type: "success", text1: `Generated ${newCards.length} cards` });
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to generate cards. Please try again." });
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
      quality: 0.7,
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
      Toast.show({ type: "error", text1: "Photo library permission is required" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "You are an expert language educator. You analyze images and generate vocabulary flashcard pairs based on objects, scenes, actions, and concepts visible in the image. Always respond with valid JSON only, no markdown fences.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: `Analyze this image and generate vocabulary flashcard pairs at ${imageLevel} level.
Front language: ${frontLang}
Back language: ${backLang}

Return a JSON array where each object has:
{ "front": "word/phrase in ${frontLang}", "back": "translation in ${backLang}" }

Guidelines:
- Identify objects, actions, scenes, colors, materials, and concepts visible in the image
- For beginner: common, everyday nouns and simple adjectives
- For intermediate: more descriptive vocabulary, verbs, prepositions, short phrases
- For advanced: nuanced descriptions, compound words, idioms related to the scene
- Each card should relate to something actually visible in the image
- Ensure variety - don't repeat similar words
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
      Toast.show({ type: "success", text1: `Generated ${newCards.length} cards from image` });
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to analyze image. Please try again." });
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

      {/* AI Generate Modal */}
      <Modal visible={showAiGenerate} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => !aiLoading && setShowAiGenerate(false)}
        />
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#4f46e5" />
              <Text className="font-bold text-lg">AI Generate</Text>
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
                placeholderTextColor="#cbd5e1"
                className="bg-slate-50 rounded-2xl p-4 text-sm border border-slate-100 text-slate-900"
                editable={!aiLoading}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Level
              </Text>
              <View className="flex-row gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => !aiLoading && setAiLevel(level)}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      aiLevel === level
                        ? "bg-indigo-50 border-indigo-500"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${
                        aiLevel === level ? "text-indigo-600" : "text-slate-400"
                      }`}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
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
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      aiCardCount === count
                        ? "bg-indigo-50 border-indigo-500"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        aiCardCount === count ? "text-indigo-600" : "text-slate-400"
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
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
              disabled={aiLoading}
            >
              <Text className="text-slate-600 font-semibold">Cancel</Text>
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
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Camera size={20} color="#4f46e5" />
              <Text className="font-bold text-lg">Image to Cards</Text>
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
                className="flex-1 py-4 bg-slate-50 rounded-2xl items-center border border-slate-100"
                disabled={imageLoading}
              >
                <Camera size={24} color="#4f46e5" />
                <Text className="text-xs font-semibold text-slate-600 mt-1">Take Photo</Text>
              </Pressable>
              <Pressable
                onPress={pickImageFromGallery}
                className="flex-1 py-4 bg-slate-50 rounded-2xl items-center border border-slate-100"
                disabled={imageLoading}
              >
                <ImagePlus size={24} color="#4f46e5" />
                <Text className="text-xs font-semibold text-slate-600 mt-1">Gallery</Text>
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
                Level
              </Text>
              <View className="flex-row gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => !imageLoading && setImageLevel(level)}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      imageLevel === level
                        ? "bg-indigo-50 border-indigo-500"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${
                        imageLevel === level ? "text-indigo-600" : "text-slate-400"
                      }`}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
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
              className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
              disabled={imageLoading}
            >
              <Text className="text-slate-600 font-semibold">Cancel</Text>
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
