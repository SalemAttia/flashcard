import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { SavedCustomTopic } from "../types";

import { sanitize } from "../utils/firestore";

const TOPIC_COLORS = [
  "purple",
  "teal",
  "orange",
  "rose",
  "sky",
  "amber",
  "lime",
  "fuchsia",
  "cyan",
  "indigo",
];

export function useCustomGrammarTopics() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<SavedCustomTopic[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setTopics([]);
      setLoaded(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "data", "grammarTopics");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setTopics((snap.data().topics as SavedCustomTopic[]) ?? []);
        } else {
          setTopics([]);
        }
        setLoaded(true);
      },
      (error) => {
        console.error("Error in useCustomGrammarTopics listener:", error);
        setLoaded(true);
      },
    );

    return unsub;
  }, [user]);

  const persist = useCallback(
    async (next: SavedCustomTopic[]) => {
      if (!user) return;
      await setDoc(
        doc(db, "users", user.uid, "data", "grammarTopics"),
        sanitize({ topics: next }),
      );
    },
    [user],
  );

  const saveTopic = useCallback(
    async (title: string, description: string) => {
      if (topics.some((t) => t.title.toLowerCase() === title.toLowerCase()))
        return;
      const color = TOPIC_COLORS[topics.length % TOPIC_COLORS.length];
      const newTopic: SavedCustomTopic = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        createdAt: new Date().toISOString(),
        color,
      };
      const next = [newTopic, ...topics];
      setTopics(next);
      await persist(next);
    },
    [topics, persist],
  );

  const deleteTopic = useCallback(
    async (id: string) => {
      const next = topics.filter((t) => t.id !== id);
      setTopics(next);
      await persist(next);
    },
    [topics, persist],
  );

  const markTopicUsed = useCallback(
    async (id: string) => {
      const next = topics.map((t) =>
        t.id === id ? { ...t, lastUsedAt: new Date().toISOString() } : t,
      );
      setTopics(next);
      await persist(next);
    },
    [topics, persist],
  );

  return { topics, saveTopic, deleteTopic, markTopicUsed, loaded };
}
