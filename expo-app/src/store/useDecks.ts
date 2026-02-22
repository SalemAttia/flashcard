import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Deck } from "../types";

import { sanitize } from "../utils/firestore";

const INITIAL_DECKS: Deck[] = [
  {
    id: "starter",
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
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!user) {
      setDecks([]);
      setLoaded(false);
      setSeeded(false);
      return;
    }

    const colRef = collection(db, "users", user.uid, "decks");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const fetched: Deck[] = snap.docs.map((d) => ({
          ...(d.data() as Omit<Deck, "id">),
          id: d.id,
        }));
        setDecks(fetched);
        setLoaded(true);

        // Seed starter deck for brand-new users
        if (!seeded && fetched.length === 0) {
          setSeeded(true);
          const starterRef = doc(colRef, "starter");
          setDoc(starterRef, sanitize(INITIAL_DECKS[0])).catch(() => {});
        } else {
          setSeeded(true);
        }
      },
      (error) => {
        console.error("Error in useDecks listener:", error);
        setLoaded(true);
      },
    );

    return unsub;
  }, [user]);

  const saveDeck = useCallback(
    async (deckData: Deck, existingId?: string | null) => {
      if (!user) return;
      const colRef = collection(db, "users", user.uid, "decks");
      if (existingId) {
        await setDoc(doc(colRef, existingId), sanitize(deckData));
      } else {
        const { id: _ignore, ...rest } = deckData;
        await addDoc(colRef, sanitize(rest));
      }
    },
    [user],
  );

  const deleteDeck = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid, "decks", id));
    },
    [user],
  );

  const markStudied = useCallback(
    async (id: string) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid, "decks", id);
      const deck = decks.find((d) => d.id === id);
      if (deck) {
        await setDoc(
          ref,
          sanitize({ ...deck, lastStudied: new Date().toISOString() }),
        );
      }
    },
    [user, decks],
  );

  const getDeck = useCallback(
    (id: string) => decks.find((d) => d.id === id),
    [decks],
  );

  return { decks, saveDeck, deleteDeck, markStudied, getDeck, loaded };
}
