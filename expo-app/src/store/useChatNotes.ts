import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatNote } from "../types";

const STORAGE_KEY = "chat_notes";

export function useChatNotes() {
  const [notes, setNotes] = useState<ChatNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setNotes(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, loaded]);

  const addNote = useCallback(
    (text: string, options?: { title?: string; sourceMessageId?: string }) => {
      const newNote: ChatNote = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        title: options?.title,
        timestamp: new Date().toISOString(),
        sourceMessageId: options?.sourceMessageId,
      };
      setNotes((prev) => [newNote, ...prev]);
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNote = useCallback(
    (id: string, changes: Partial<Pick<ChatNote, "title" | "text">>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...changes } : n))
      );
    },
    []
  );

  return { notes, addNote, deleteNote, updateNote, loaded };
}
