import { useState, useEffect, useCallback, useMemo } from "react";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import {
  ChecklistItem,
  ChecklistItemId,
  CustomTask,
  DailyProgress,
  SubCheckItem,
  TimeOfDay,
} from "../types";

import { sanitize } from "../utils/firestore";

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "study_deck", label: "Study a Deck", sublabel: "Review your flashcards", timeOfDay: "morning" },
  { id: "grammar_quiz", label: "Grammar Quiz", sublabel: "Practice grammar rules", timeOfDay: "morning" },
  { id: "writing_test", label: "Writing Practice", sublabel: "Write in Danish", timeOfDay: "afternoon" },
  { id: "chat_session", label: "Chat in Danish", sublabel: "Have a conversation", timeOfDay: "afternoon" },
];

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isConsecutiveDay(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  const diff = Math.abs(a.getTime() - b.getTime());
  return diff === 86400000;
}

function freshItems(): ChecklistItem[] {
  return DEFAULT_ITEMS.map((item) => ({ ...item, completedAt: undefined }));
}

function freshDay(date: string): DailyProgress {
  return { date, items: freshItems(), customItems: [] };
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

/** Inject recurring tasks into a day's customItems if not already present */
function injectRecurringTasks(day: DailyProgress, recurringTasks: CustomTask[], dateStr?: string): DailyProgress {
  if (!recurringTasks || recurringTasks.length === 0) return day;
  const dayOfWeek = getDayOfWeek(dateStr ?? day.date);
  const existingRecurringIds = new Set(
    day.customItems.filter((t) => t.recurring).map((t) => t.id)
  );
  const toInject = recurringTasks.filter((rt) => {
    if (existingRecurringIds.has(rt.id)) return false;
    if (rt.activeDays && rt.activeDays.length > 0) {
      return rt.activeDays.includes(dayOfWeek);
    }
    return true;
  });
  if (toInject.length === 0) return day;
  const freshRecurring = toInject.map((rt) => ({
    ...rt,
    completedAt: undefined,
    subChecklist: rt.subChecklist?.map((s) => ({ ...s, checked: false })),
  }));
  return {
    ...day,
    customItems: [...day.customItems, ...freshRecurring],
  };
}

export function useDailyProgress() {
  const { user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | undefined>(undefined);
  const [recurringTasks, setRecurringTasks] = useState<CustomTask[]>([]);
  const [hiddenDefaultItems, setHiddenDefaultItems] = useState<ChecklistItemId[]>([]);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [daysMap, setDaysMap] = useState<Record<string, DailyProgress>>({});
  const [loaded, setLoaded] = useState(false);

  // 1. Listen to global progress data
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "data", "progress");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStreakCount(data.streakCount ?? 0);
        setLastCompletedDate(data.lastCompletedDate);
        setRecurringTasks(data.recurringTasks ?? []);
        setHiddenDefaultItems(data.hiddenDefaultItems ?? []);
      }
      setLoaded(true);
    }, (error) => {
      console.error("Error in global progress listener:", error);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  // 2. Listen to ALL days (to support calendar/summary)
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, "users", user.uid, "days");
    const unsub = onSnapshot(colRef, (snap) => {
      const map: Record<string, DailyProgress> = {};
      snap.docs.forEach(d => {
        map[d.id] = d.data() as DailyProgress;
      });
      setDaysMap(map);
    }, (error) => {
      console.error("Error in days collection listener:", error);
    });
    return unsub;
  }, [user]);

  // 3. Cross-reference auto-complete (Today only)
  useEffect(() => {
    if (!user || !loaded || selectedDate !== getToday()) return;

    const today = getToday();
    const dayProgress = daysMap[today] ?? freshDay(today);

    const checkAutoComplete = async () => {
      const now = new Date().toISOString();
      const autoCompleted: Partial<Record<ChecklistItemId, boolean>> = {};

      const decksSnap = await getDocs(collection(db, "users", user.uid, "decks"));
      if (decksSnap.docs.some(d => d.data().lastStudied?.startsWith(today))) {
        autoCompleted.study_deck = true;
      }

      const grammarSnap = await getDoc(doc(db, "users", user.uid, "results", "grammar"));
      if (grammarSnap.exists() && grammarSnap.data().completedAt?.startsWith(today)) {
        autoCompleted.grammar_quiz = true;
      }

      const writingSnap = await getDoc(doc(db, "users", user.uid, "results", "writing"));
      if (writingSnap.exists() && writingSnap.data().completedAt?.startsWith(today)) {
        autoCompleted.writing_test = true;
      }

      if (Object.keys(autoCompleted).length > 0) {
        const updatedItems = dayProgress.items.map(item =>
          autoCompleted[item.id] && !item.completedAt
            ? { ...item, completedAt: now }
            : item
        );
        const updatedDay = { ...dayProgress, items: updatedItems };
        // Avoid infinite loop by only updating if something actually changed
        if (updatedItems.some((item, idx) => item.completedAt !== dayProgress.items[idx].completedAt)) {
          await setDoc(doc(db, "users", user.uid, "days", today), sanitize(updatedDay));
        }
      }
    };

    checkAutoComplete();
  }, [user, loaded, selectedDate, daysMap]);

  const dayProgressRaw = useMemo(() => daysMap[selectedDate] ?? freshDay(selectedDate), [daysMap, selectedDate]);
  const dayProgress = useMemo(() => {
    const withRec = injectRecurringTasks(dayProgressRaw, recurringTasks, selectedDate);
    const hidden = new Set(hiddenDefaultItems);
    return {
      ...withRec,
      items: withRec.items.filter(i => !hidden.has(i.id))
    };
  }, [dayProgressRaw, recurringTasks, selectedDate, hiddenDefaultItems]);

  const updateDayInFirestore = useCallback(async (day: DailyProgress) => {
    if (!user) return;
    const dayRef = doc(db, "users", user.uid, "days", day.date);
    await setDoc(dayRef, sanitize(day));

    // Update streak if needed
    const coreAllDone = day.items.every(i => i.completedAt);
    if (coreAllDone && lastCompletedDate !== day.date) {
      const streakContinues = lastCompletedDate && isConsecutiveDay(lastCompletedDate, day.date);
      const newStreak = streakContinues ? streakCount + 1 : 1;
      await setDoc(doc(db, "users", user.uid, "data", "progress"), sanitize({
        streakCount: newStreak,
        lastCompletedDate: day.date,
        recurringTasks,
        hiddenDefaultItems
      }), { merge: true });
    }
  }, [user, streakCount, lastCompletedDate, recurringTasks, hiddenDefaultItems]);

  const completeItem = useCallback(async (id: ChecklistItemId) => {
    // Note: ChecklistItem completion still uses the raw storage to avoid saving injected items into the core items list unnecessarily
    // but here we use dayProgress to ensure we have the right context.
    const updatedItems = dayProgress.items.map(item =>
      item.id === id ? { ...item, completedAt: new Date().toISOString() } : item
    );
    // Since dayProgress.items is already filtered, we need to be careful.
    // Actually, it's better to update dayProgressRaw and save that.
    const rawItems = dayProgressRaw.items.map(item =>
      item.id === id ? { ...item, completedAt: new Date().toISOString() } : item
    );
    await updateDayInFirestore({ ...dayProgressRaw, items: rawItems });
  }, [dayProgress, dayProgressRaw, updateDayInFirestore]);

  const uncompleteItem = useCallback(async (id: ChecklistItemId) => {
    const rawItems = dayProgressRaw.items.map(item =>
      item.id === id ? { ...item, completedAt: undefined } : item
    );
    await updateDayInFirestore({ ...dayProgressRaw, items: rawItems });
  }, [dayProgressRaw, updateDayInFirestore]);

  const addCustomTask = useCallback(async (
    label: string,
    sublabel: string | undefined,
    timeOfDay: TimeOfDay,
    recurring?: boolean,
    subChecklist?: SubCheckItem[],
    activeDays?: number[]
  ) => {
    if (!user) return;
    const task: CustomTask = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      sublabel,
      timeOfDay,
      recurring,
      activeDays: recurring && activeDays?.length ? activeDays : undefined,
      subChecklist: subChecklist?.length ? subChecklist : undefined,
    };

    const updatedDay = { ...dayProgress, customItems: [...dayProgress.customItems, task] };
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize(updatedDay));

    if (recurring) {
      const nextRecurring = [...recurringTasks, task];
      await setDoc(doc(db, "users", user.uid, "data", "progress"), sanitize({ recurringTasks: nextRecurring }), { merge: true });
    }
  }, [user, dayProgress, selectedDate, recurringTasks]);

  const removeCustomTask = useCallback(async (taskId: string) => {
    if (!user) return;
    const updatedCustom = dayProgress.customItems.filter(t => t.id !== taskId);
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize({ ...dayProgress, customItems: updatedCustom }));
  }, [user, dayProgress, selectedDate]);

  const removeRecurringTask = useCallback(async (taskId: string) => {
    if (!user) return;
    const nextRecurring = recurringTasks.filter(t => t.id !== taskId);
    await setDoc(doc(db, "users", user.uid, "data", "progress"), sanitize({ recurringTasks: nextRecurring }), { merge: true });

    const updatedCustom = dayProgress.customItems.filter(t => t.id !== taskId);
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize({ ...dayProgress, customItems: updatedCustom }));
  }, [user, recurringTasks, dayProgress, selectedDate]);

  const toggleCustomTask = useCallback(async (taskId: string) => {
    if (!user) return;
    const existsInRaw = dayProgressRaw.customItems.some(t => t.id === taskId);
    const baseItems = existsInRaw ? dayProgressRaw.customItems : dayProgress.customItems;

    const updatedCustom = baseItems.map(t =>
      t.id === taskId ? { ...t, completedAt: t.completedAt ? undefined : new Date().toISOString() } : t
    );
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize({ ...dayProgressRaw, customItems: updatedCustom }));
  }, [user, dayProgressRaw, dayProgress, selectedDate]);

  const toggleSubCheckItem = useCallback(async (taskId: string, subItemId: string) => {
    if (!user) return;
    const existsInRaw = dayProgressRaw.customItems.some(t => t.id === taskId);
    const baseItems = existsInRaw ? dayProgressRaw.customItems : dayProgress.customItems;

    const updatedCustom = baseItems.map(t => {
      if (t.id !== taskId || !t.subChecklist) return t;
      return {
        ...t,
        subChecklist: t.subChecklist.map(s =>
          s.id === subItemId ? { ...s, checked: !s.checked } : s
        ),
      };
    });
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize({ ...dayProgressRaw, customItems: updatedCustom }));
  }, [user, dayProgressRaw, dayProgress, selectedDate]);

  const editCustomTask = useCallback(async (taskId: string, updates: Partial<CustomTask>) => {
    if (!user) return;
    const existsInRaw = dayProgressRaw.customItems.some(t => t.id === taskId);
    const baseItems = existsInRaw ? dayProgressRaw.customItems : dayProgress.customItems;

    const updatedCustom = baseItems.map(t => t.id === taskId ? { ...t, ...updates } : t);
    await setDoc(doc(db, "users", user.uid, "days", selectedDate), sanitize({ ...dayProgressRaw, customItems: updatedCustom }));

    if (updates.recurring !== undefined || recurringTasks.some(t => t.id === taskId)) {
      const nextRecurring = recurringTasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
      await setDoc(doc(db, "users", user.uid, "data", "progress"), sanitize({ recurringTasks: nextRecurring }), { merge: true });
    }
  }, [user, dayProgressRaw, dayProgress, selectedDate, recurringTasks]);

  const toggleDefaultItemVisibility = useCallback(async (itemId: ChecklistItemId) => {
    if (!user) return;
    const isHidden = hiddenDefaultItems.includes(itemId);
    const nextHidden = isHidden ? hiddenDefaultItems.filter(id => id !== itemId) : [...hiddenDefaultItems, itemId];
    await setDoc(doc(db, "users", user.uid, "data", "progress"), sanitize({ hiddenDefaultItems: nextHidden }), { merge: true });
  }, [user, hiddenDefaultItems]);

  const hasTasksForDate = useCallback(
    (date: string): boolean => {
      const day = daysMap[date];
      if (!day) return (recurringTasks ?? []).length > 0;
      return day.items.some((i) => i.completedAt) || day.customItems.length > 0;
    },
    [daysMap, recurringTasks]
  );

  const getDateProgress = useCallback(
    (date: string): { completed: number; total: number } => {
      const hidden = new Set(hiddenDefaultItems);
      const base = daysMap[date];
      if (!base) {
        const visibleCoreCount = DEFAULT_ITEMS.filter((i) => !hidden.has(i.id)).length;
        const dayOfWeek = getDayOfWeek(date);
        const recurringCount = (recurringTasks ?? []).filter((rt) => {
          if (rt.activeDays && rt.activeDays.length > 0) return rt.activeDays.includes(dayOfWeek);
          return true;
        }).length;
        return { completed: 0, total: visibleCoreCount + recurringCount };
      }
      const day = injectRecurringTasks(base, recurringTasks, date);
      const visibleItems = day.items.filter((i) => !hidden.has(i.id));
      const coreCompleted = visibleItems.filter((i) => i.completedAt).length;
      const customCompleted = day.customItems.filter((i) => i.completedAt).length;
      return {
        completed: coreCompleted + customCompleted,
        total: visibleItems.length + day.customItems.length,
      };
    },
    [daysMap, recurringTasks, hiddenDefaultItems]
  );

  const completedCount = useMemo(() => {
    const core = dayProgress.items.filter(i => i.completedAt).length;
    const custom = dayProgress.customItems.filter(i => i.completedAt).length;
    return core + custom;
  }, [dayProgress]);

  const totalCount = useMemo(() => dayProgress.items.length + dayProgress.customItems.length, [dayProgress]);
  const allCoreDone = useMemo(() => dayProgress.items.every(i => i.completedAt), [dayProgress]);
  const allDone = completedCount === totalCount && totalCount > 0;

  return {
    dayProgress,
    streakCount,
    loaded,
    selectedDate,
    setSelectedDate,
    completeItem,
    uncompleteItem,
    addCustomTask,
    removeCustomTask,
    removeRecurringTask,
    toggleCustomTask,
    toggleSubCheckItem,
    editCustomTask,
    completedCount,
    totalCount,
    allDone,
    allCoreDone,
    hiddenDefaultItems,
    toggleDefaultItemVisibility,
    defaultItems: DEFAULT_ITEMS,
    hasTasksForDate,
    getDateProgress,
  };
}
