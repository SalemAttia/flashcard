import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { ChatNote } from "../types";

import { sanitize } from "../utils/firestore";

export function useChatNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ChatNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoaded(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "data", "chatNotes");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setNotes((snap.data().notes as ChatNote[]) ?? []);
      } else {
        setNotes([]);
      }
      setLoaded(true);
    }, (error) => {
      console.error("Error in useChatNotes listener:", error);
      setLoaded(true);
    });

    return unsub;
  }, [user]);

  // Helper: write notes array back to Firestore
  const persist = useCallback(
    async (next: ChatNote[]) => {
      if (!user) return;
      await setDoc(doc(db, "users", user.uid, "data", "chatNotes"), sanitize({ notes: next }));
    },
    [user]
  );

  const addNote = useCallback(
    async (text: string, options?: { title?: string; sourceMessageId?: string }) => {
      const newNote: ChatNote = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        title: options?.title,
        timestamp: new Date().toISOString(),
        sourceMessageId: options?.sourceMessageId,
      };
      const next = [newNote, ...notes];
      setNotes(next);
      await persist(next);
    },
    [notes, persist]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const next = notes.filter((n) => n.id !== id);
      setNotes(next);
      await persist(next);
    },
    [notes, persist]
  );

  const updateNote = useCallback(
    async (id: string, changes: Partial<Pick<ChatNote, "title" | "text">>) => {
      const next = notes.map((n) => (n.id === id ? { ...n, ...changes } : n));
      setNotes(next);
      await persist(next);
    },
    [notes, persist]
  );

  return { notes, addNote, deleteNote, updateNote, loaded };
}
