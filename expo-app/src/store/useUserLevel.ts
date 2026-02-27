import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { WritingLevel } from "../types";
import { sanitize } from "../utils/firestore";

const DEFAULT_LEVEL: WritingLevel = "a1";

export function useUserLevel() {
  const { user } = useAuth();
  const [level, setLevel] = useState<WritingLevel>(DEFAULT_LEVEL);
  const [loaded, setLoaded] = useState(false);
  const [hasLevel, setHasLevel] = useState(false);

  useEffect(() => {
    if (!user) {
      setLevel(DEFAULT_LEVEL);
      setLoaded(false);
      setHasLevel(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "settings", "level");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setLevel((snap.data().level as WritingLevel) ?? DEFAULT_LEVEL);
          setHasLevel(true);
        } else {
          setHasLevel(false);
        }
        setLoaded(true);
      },
      (error) => {
        console.error("Error in useUserLevel listener:", error);
        setLoaded(true);
      },
    );

    return unsub;
  }, [user]);

  const changeLevel = async (newLevel: WritingLevel) => {
    setLevel(newLevel);
    setHasLevel(true);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "settings", "level"),
      sanitize({ level: newLevel }),
      { merge: true },
    );
  };

  return { level, changeLevel, loaded, hasLevel };
}
