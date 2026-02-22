import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { user, isAdmin } = useAuth();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [globalDecks, setGlobalDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [globalLoaded, setGlobalLoaded] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Listen to user's own decks
  useEffect(() => {
    if (!user) {
      setUserDecks([]);
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
        setUserDecks(fetched);
        setLoaded(true);

        // Seed starter deck for brand-new users
        if (!seeded && fetched.length === 0) {
          setSeeded(true);
          const starterRef = doc(colRef, "starter");
          setDoc(starterRef, sanitize(INITIAL_DECKS[0])).catch(() => { });
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

  // Listen to global decks collection
  useEffect(() => {
    const colRef = collection(db, "globalDecks");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const fetched: Deck[] = snap.docs.map((d) => ({
          ...(d.data() as Omit<Deck, "id">),
          id: d.id,
          isGlobal: true,
        }));
        setGlobalDecks(fetched);
        setGlobalLoaded(true);
      },
      (error) => {
        console.error("Error in globalDecks listener:", error);
        setGlobalLoaded(true);
      },
    );

    return unsub;
  }, []);

  // Merge user decks with global decks (avoid duplicates for admin who owns them)
  const decks = useMemo(() => {
    if (!user) return [];
    // For admin: mark their own decks that are also global
    const globalIds = new Set(globalDecks.map((d) => d.id));
    const merged: Deck[] = userDecks.map((d) =>
      globalIds.has(d.id) ? { ...d, isGlobal: true } : d,
    );

    // For non-admin users: add global decks they don't already own
    if (!isAdmin) {
      const userDeckIds = new Set(userDecks.map((d) => d.id));
      for (const gd of globalDecks) {
        if (!userDeckIds.has(gd.id)) {
          merged.push(gd);
        }
      }
    }

    return merged;
  }, [userDecks, globalDecks, user, isAdmin]);

  const saveDeck = useCallback(
    async (deckData: Deck, existingId?: string | null) => {
      if (!user) return;
      const colRef = collection(db, "users", user.uid, "decks");
      if (existingId) {
        await setDoc(doc(colRef, existingId), sanitize(deckData));
        // If this deck is global, update the global copy too
        if (isAdmin && deckData.isGlobal) {
          const globalData = { ...deckData, ownerUid: user.uid };
          await setDoc(doc(db, "globalDecks", existingId), sanitize(globalData));
        }
      } else {
        const { id: _ignore, ...rest } = deckData;
        await addDoc(colRef, sanitize(rest));
      }
    },
    [user, isAdmin],
  );

  const deleteDeck = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid, "decks", id));
      // Also remove from global if it existed there
      if (isAdmin) {
        await deleteDoc(doc(db, "globalDecks", id)).catch(() => { });
      }
    },
    [user, isAdmin],
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

  const toggleGlobal = useCallback(
    async (deckId: string) => {
      if (!user || !isAdmin) return;
      const deck = decks.find((d) => d.id === deckId);
      if (!deck) return;

      if (deck.isGlobal) {
        // Remove from global
        await deleteDoc(doc(db, "globalDecks", deckId));
      } else {
        // Add to global
        const globalData = { ...deck, ownerUid: user.uid, isGlobal: true };
        await setDoc(doc(db, "globalDecks", deckId), sanitize(globalData));
      }
    },
    [user, isAdmin, decks],
  );

  return {
    decks,
    saveDeck,
    deleteDeck,
    markStudied,
    getDeck,
    toggleGlobal,
    loaded: loaded && globalLoaded,
  };
}
