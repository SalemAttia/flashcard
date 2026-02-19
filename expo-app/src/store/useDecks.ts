import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Deck } from "../types";

const STORAGE_KEY = "mindset_decks";

const INITIAL_DECKS: Deck[] = [
  {
    id: "1",
    title: "Basic Phrases",
    description: "Multi-language starter set.",
    frontLang: "en-US",
    backLang: "da-DK",
    cards: [
      { id: "s1", front: "Hello", back: "Hej" },
      { id: "s2", front: "Thank you", back: "Tak" },
      { id: "s3", front: "Good morning", back: "Godmorgen" },
      { id: "s4", front: "Goodbye", back: "Farvel" },
    ],
    lastStudied: new Date().toISOString(),
  },
];

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(INITIAL_DECKS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setDecks(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  }, [decks, loaded]);

  const saveDeck = useCallback(
    (deckData: Deck, existingId?: string | null) => {
      if (existingId) {
        setDecks((prev) =>
          prev.map((d) => (d.id === existingId ? deckData : d))
        );
      } else {
        setDecks((prev) => [
          ...prev,
          { ...deckData, id: Math.random().toString(36).substr(2, 9) },
        ]);
      }
    },
    []
  );

  const deleteDeck = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const markStudied = useCallback((id: string) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, lastStudied: new Date().toISOString() } : d
      )
    );
  }, []);

  const getDeck = useCallback(
    (id: string) => decks.find((d) => d.id === id),
    [decks]
  );

  return { decks, saveDeck, deleteDeck, markStudied, getDeck, loaded };
}
