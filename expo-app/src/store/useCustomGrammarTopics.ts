import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedCustomTopic } from "../types";

const STORAGE_KEY = "grammar_custom_topics";
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
  const [topics, setTopics] = useState<SavedCustomTopic[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setTopics(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  }, [topics, loaded]);

  const saveTopic = useCallback((title: string, description: string) => {
    setTopics((prev) => {
      if (prev.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
        return prev;
      }
      const color = TOPIC_COLORS[prev.length % TOPIC_COLORS.length];
      const newTopic: SavedCustomTopic = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        createdAt: new Date().toISOString(),
        color,
      };
      return [newTopic, ...prev];
    });
  }, []);

  const deleteTopic = useCallback((id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markTopicUsed = useCallback((id: string) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, lastUsedAt: new Date().toISOString() } : t
      )
    );
  }, []);

  return { topics, saveTopic, deleteTopic, markTopicUsed, loaded };
}
