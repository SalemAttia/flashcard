import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StickyNote, RotateCcw, MessageCircle } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { ChatMessage, Card, Deck, Language } from "../../src/types";
import {
  buildSystemPrompt,
  sendChatMessage,
  extractFlashcardFromMessage,
} from "../../src/services/chatService";
import { useChatLanguages } from "../../src/store/useChatLanguages";
import { useChatNotes } from "../../src/store/useChatNotes";
import { useDecks } from "../../src/store/useDecks";
import { useChatHistory } from "../../src/store/useChatHistory";

import { LanguageSelector } from "../../src/components/Chat/LanguageSelector";
import { ChatInput } from "../../src/components/Chat/ChatInput";
import { ChatMessageBubble } from "../../src/components/Chat/ChatMessage";
import { SaveCardModal } from "../../src/components/Chat/SaveCardModal";
import { NotesModal } from "../../src/components/Chat/NotesModal";

export default function ChatScreen() {
  const { messages, setMessages, addMessage, clearHistory, loaded } =
    useChatHistory();
  const [isLoading, setIsLoading] = useState(false);

  const [showNotes, setShowNotes] = useState(false);
  const [showSaveCard, setShowSaveCard] = useState(false);
  const [prefilledFront, setPrefilledFront] = useState("");
  const [prefilledBack, setPrefilledBack] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const { studyLang, nativeLang, changeStudyLang, changeNativeLang } =
    useChatLanguages();
  const { decks, saveDeck } = useDecks();
  const { notes, addNote, deleteNote } = useChatNotes();

  const systemPrompt = useMemo(
    () => buildSystemPrompt(studyLang, nativeLang),
    [studyLang, nativeLang],
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMessage];
      // We set local state immediately for responsiveness, though the hook also syncs
      setIsLoading(true);
      scrollToEnd();

      try {
        await addMessage(userMessage);
        const reply = await sendChatMessage(nextMessages, systemPrompt);

        const assistantMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        };

        await addMessage(assistantMessage, nextMessages);
      } catch (error) {
        console.error("Chat error:", error);
        Toast.show({ type: "error", text1: "Failed to send message" });
      } finally {
        setIsLoading(false);
        scrollToEnd();
      }
    },
    [messages, systemPrompt, scrollToEnd, addMessage],
  );

  const handleOpenSaveCard = useCallback(
    async (message: ChatMessage) => {
      setPrefilledFront("");
      setPrefilledBack("");
      setIsExtracting(true);
      setShowSaveCard(true);

      const extracted = await extractFlashcardFromMessage(
        message.content,
        studyLang,
        nativeLang,
      );

      setIsExtracting(false);
      if (extracted) {
        setPrefilledFront(extracted.front);
        setPrefilledBack(extracted.back);
      }
    },
    [studyLang, nativeLang],
  );

  const handleSaveCard = useCallback(
    (
      deckId: string | null,
      newDeckTitle: string | null,
      front: string,
      back: string,
    ) => {
      if (!front.trim() || !back.trim()) return;

      const newCard: Card = {
        id: Math.random().toString(36).substr(2, 9),
        front: front.trim(),
        back: back.trim(),
      };

      if (deckId) {
        const existingDeck = decks.find((d) => d.id === deckId);
        if (!existingDeck) return;
        saveDeck(
          { ...existingDeck, cards: [...existingDeck.cards, newCard] },
          deckId,
        );
      } else if (newDeckTitle?.trim()) {
        const newDeck: Deck = {
          id: "",
          title: newDeckTitle.trim(),
          description: "Created from Chat",
          frontLang: studyLang,
          backLang: nativeLang,
          cards: [newCard],
        };
        saveDeck(newDeck, null);
      }

      setShowSaveCard(false);
      Toast.show({ type: "success", text1: "Flashcard saved!" });
    },
    [decks, saveDeck, studyLang, nativeLang],
  );

  const handleAddNote = useCallback(
    (message: ChatMessage) => {
      addNote(message.content, { sourceMessageId: message.id });
      Toast.show({ type: "success", text1: "Saved to notes" });
    },
    [addNote],
  );

  const handleChangeStudyLang = useCallback(
    (lang: Language) => {
      changeStudyLang(lang);
      clearHistory();
      Toast.show({ type: "info", text1: "Language changed — starting fresh" });
    },
    [changeStudyLang],
  );

  const handleChangeNativeLang = useCallback(
    (lang: Language) => {
      changeNativeLang(lang);
      clearHistory();
      Toast.show({ type: "info", text1: "Language changed — starting fresh" });
    },
    [changeNativeLang],
  );

  const handleNewChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="flex-1 w-full max-w-2xl self-center">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Chat
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Your AI language tutor
          </Text>
        </View>
        <View className="flex-row gap-2 items-center">
          <Pressable
            onPress={() => setShowNotes(true)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900"
          >
            <StickyNote size={20} color="#64748b" />
          </Pressable>
          <Pressable
            onPress={handleNewChat}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900"
          >
            <RotateCcw size={20} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Language selector */}
      <LanguageSelector
        studyLang={studyLang}
        nativeLang={nativeLang}
        onChangeStudy={handleChangeStudyLang}
        onChangeNative={handleChangeNativeLang}
      />

      {/* Messages + input */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-4 py-20">
              <MessageCircle size={48} color="#e2e8f0" />
              <Text className="text-slate-400 text-sm text-center px-8 leading-5">
                Ask me about vocabulary, translations, grammar, or send a
                sentence for corrections.
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoading ? (
              <View className="items-start py-2">
                <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 py-3">
                  <ActivityIndicator size="small" color="#4f46e5" />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ChatMessageBubble
              message={item}
              onSaveCard={handleOpenSaveCard}
              onAddNote={handleAddNote}
            />
          )}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </KeyboardAvoidingView>

      {/* Modals */}
      <SaveCardModal
        visible={showSaveCard}
        initialFront={prefilledFront}
        initialBack={prefilledBack}
        isExtracting={isExtracting}
        studyLang={studyLang}
        nativeLang={nativeLang}
        decks={decks}
        onSave={handleSaveCard}
        onClose={() => setShowSaveCard(false)}
      />

      <NotesModal
        visible={showNotes}
        notes={notes}
        onDeleteNote={deleteNote}
        onClose={() => setShowNotes(false)}
      />
      </View>
    </SafeAreaView>
  );
}
