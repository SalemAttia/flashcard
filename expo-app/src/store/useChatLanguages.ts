import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Language } from "../types";

import { sanitize } from "../utils/firestore";

const DEFAULT_STUDY: Language = "da-DK";
const DEFAULT_NATIVE: Language = "en-US";

export function useChatLanguages() {
  const { user } = useAuth();
  const [studyLang, setStudyLang] = useState<Language>(DEFAULT_STUDY);
  const [nativeLang, setNativeLang] = useState<Language>(DEFAULT_NATIVE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setStudyLang(DEFAULT_STUDY);
      setNativeLang(DEFAULT_NATIVE);
      setLoaded(false);
      return;
    }

    const ref = doc(db, "users", user.uid, "settings", "languages");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStudyLang((data.studyLang as Language) ?? DEFAULT_STUDY);
          setNativeLang((data.nativeLang as Language) ?? DEFAULT_NATIVE);
        }
        setLoaded(true);
      },
      (error) => {
        console.error("Error in useChatLanguages listener:", error);
        setLoaded(true);
      },
    );

    return unsub;
  }, [user]);

  const changeStudyLang = async (lang: Language) => {
    setStudyLang(lang);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "settings", "languages"),
      sanitize({ studyLang: lang, nativeLang }),
      { merge: true },
    );
  };

  const changeNativeLang = async (lang: Language) => {
    setNativeLang(lang);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "settings", "languages"),
      sanitize({ studyLang, nativeLang: lang }),
      { merge: true },
    );
  };

  return { studyLang, nativeLang, changeStudyLang, changeNativeLang, loaded };
}
