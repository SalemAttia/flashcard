import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Language } from "../types";

const STUDY_KEY = "chat_study_lang";
const NATIVE_KEY = "chat_native_lang";

const DEFAULT_STUDY: Language = "da-DK";
const DEFAULT_NATIVE: Language = "en-US";

export function useChatLanguages() {
  const [studyLang, setStudyLang] = useState<Language>(DEFAULT_STUDY);
  const [nativeLang, setNativeLang] = useState<Language>(DEFAULT_NATIVE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STUDY_KEY),
      AsyncStorage.getItem(NATIVE_KEY),
    ]).then(([study, native]) => {
      if (study) setStudyLang(study as Language);
      if (native) setNativeLang(native as Language);
      setLoaded(true);
    });
  }, []);

  const changeStudyLang = (lang: Language) => {
    setStudyLang(lang);
    AsyncStorage.setItem(STUDY_KEY, lang);
  };

  const changeNativeLang = (lang: Language) => {
    setNativeLang(lang);
    AsyncStorage.setItem(NATIVE_KEY, lang);
  };

  return { studyLang, nativeLang, changeStudyLang, changeNativeLang, loaded };
}
