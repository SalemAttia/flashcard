import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { ChatMessage } from "../types";

import { sanitize } from "../utils/firestore";

export function useChatHistory() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoaded(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "data", "chatHistory");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setMessages((snap.data().messages as ChatMessage[]) ?? []);
        } else {
          setMessages([]);
        }
        setLoaded(true);
      },
      (error) => {
        console.error("Error in useChatHistory listener:", error);
        setLoaded(true);
      },
    );

    return unsub;
  }, [user]);

  const setHistory = useCallback(
    async (nextMessages: ChatMessage[]) => {
      if (!user) return;
      await setDoc(
        doc(db, "users", user.uid, "data", "chatHistory"),
        sanitize({
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    [user],
  );

  const addMessages = useCallback(
    async (newMessages: ChatMessage[]) => {
      if (!user) return;
      // Use a copy of the current messages to avoid race conditions
      // Note: Since we need to wait for setDoc, we can't easily use functional updates for the setDoc part
      // but we can at least take the latest messages from the hook's state.
      // A better way is to pass the current messages from the component.
      const next = [...messages, ...newMessages];
      setMessages(next);
      await setHistory(next);
    },
    [user, messages, setHistory],
  );

  const addMessage = useCallback(
    async (message: ChatMessage, currentMessages?: ChatMessage[]) => {
      const base = currentMessages || messages;
      const next = [...base, message];
      setMessages(next);
      await setHistory(next);
    },
    [messages, setHistory],
  );

  const clearHistory = useCallback(async () => {
    setMessages([]);
    await setHistory([]);
  }, [setHistory]);

  return {
    messages,
    setMessages,
    addMessage,
    addMessages,
    clearHistory,
    loaded,
  };
}
