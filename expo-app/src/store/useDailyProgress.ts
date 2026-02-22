import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChecklistItem,
  ChecklistItemId,
  CustomTask,
  DailyProgress,
  ProgressStore,
  SubCheckItem,
  TimeOfDay,
} from "../types";

const STORAGE_KEY = "daily_progress";

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

function emptyStore(): ProgressStore {
  return { days: {}, streakCount: 0, recurringTasks: [], hiddenDefaultItems: [] };
}

/** Get JS day-of-week number (0=Sun..6=Sat) for a YYYY-MM-DD string */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

/** Ensure ChecklistItem has timeOfDay (migration) */
function migrateChecklistItem(item: any): ChecklistItem {
  if (item.timeOfDay) return item;
  const defaults: Record<string, TimeOfDay> = {
    study_deck: "morning",
    grammar_quiz: "morning",
    writing_test: "afternoon",
    chat_session: "afternoon",
  };
  return { ...item, timeOfDay: defaults[item.id] ?? "morning" };
}

/** Ensure CustomTask has timeOfDay (migration) */
function migrateCustomTask(task: any): CustomTask {
  return { ...task, timeOfDay: task.timeOfDay ?? "morning" };
}

/** Migrate old flat DailyProgress format to new ProgressStore */
function migrateIfNeeded(raw: any): ProgressStore {
  if (raw && raw.days) {
    // Migrate items inside each day
    const days: Record<string, DailyProgress> = {};
    for (const [date, day] of Object.entries(raw.days as Record<string, any>)) {
      days[date] = {
        date: (day as any).date,
        items: ((day as any).items ?? []).map(migrateChecklistItem),
        customItems: ((day as any).customItems ?? []).map(migrateCustomTask),
      };
    }
    return {
      days,
      streakCount: raw.streakCount ?? 0,
      lastCompletedDate: raw.lastCompletedDate,
      recurringTasks: (raw.recurringTasks ?? []).map(migrateCustomTask),
      hiddenDefaultItems: raw.hiddenDefaultItems ?? [],
    };
  }
  // Old format: { date, items, streakCount, lastCompletedDate }
  if (raw && raw.date && raw.items) {
    return {
      days: {
        [raw.date]: {
          date: raw.date,
          items: (raw.items as any[]).map(migrateChecklistItem),
          customItems: [],
        },
      },
      streakCount: raw.streakCount ?? 0,
      lastCompletedDate: raw.lastCompletedDate,
      recurringTasks: [],
    };
  }
  return emptyStore();
}

function updateStreakIfNeeded(
  store: ProgressStore,
  date: string,
  day: DailyProgress
): Pick<ProgressStore, "streakCount" | "lastCompletedDate"> {
  const coreAllDone = day.items.every((i) => i.completedAt);
  if (!coreAllDone || store.lastCompletedDate === date) {
    return { streakCount: store.streakCount, lastCompletedDate: store.lastCompletedDate };
  }
  const prevDate = store.lastCompletedDate;
  const streakContinues = prevDate && isConsecutiveDay(prevDate, date);
  return {
    streakCount: streakContinues ? store.streakCount + 1 : 1,
    lastCompletedDate: date,
  };
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
    // Filter by active days if specified
    if (rt.activeDays && rt.activeDays.length > 0) {
      return rt.activeDays.includes(dayOfWeek);
    }
    return true; // undefined/empty = every day
  });
  if (toInject.length === 0) return day;

  const freshRecurring = toInject.map((rt) => ({
    ...rt,
    completedAt: undefined,
    // Reset sub-checklist items to unchecked for new day
    subChecklist: rt.subChecklist?.map((s) => ({ ...s, checked: false })),
  }));

  return {
    ...day,
    customItems: [...day.customItems, ...freshRecurring],
  };
}

export function useDailyProgress() {
  const [store, setStore] = useState<ProgressStore>(emptyStore());
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loaded, setLoaded] = useState(false);
  const [crossReferenced, setCrossReferenced] = useState(false);

  // Load effect
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const migrated = migrateIfNeeded(parsed);
          setStore(migrated);
        } catch {
          // corrupted
        }
      }
      setLoaded(true);
    });
  }, []);

  // Cross-reference effect — auto-complete items from other stores (today only)
  useEffect(() => {
    if (!loaded || crossReferenced) return;
    setCrossReferenced(true);

    const today = getToday();

    Promise.all([
      AsyncStorage.getItem("mindset_decks"),
      AsyncStorage.getItem("grammar_last_result"),
      AsyncStorage.getItem("writing_test_last_result"),
    ]).then(([decksRaw, grammarRaw, writingRaw]) => {
      const autoCompleted: Partial<Record<ChecklistItemId, boolean>> = {};

      if (decksRaw) {
        try {
          const decks = JSON.parse(decksRaw) as Array<{ lastStudied?: string }>;
          if (decks.some((d) => d.lastStudied && d.lastStudied.startsWith(today))) {
            autoCompleted.study_deck = true;
          }
        } catch { }
      }

      if (grammarRaw) {
        try {
          const result = JSON.parse(grammarRaw) as { completedAt?: string };
          if (result.completedAt && result.completedAt.startsWith(today)) {
            autoCompleted.grammar_quiz = true;
          }
        } catch { }
      }

      if (writingRaw) {
        try {
          const result = JSON.parse(writingRaw) as { completedAt?: string };
          if (result.completedAt && result.completedAt.startsWith(today)) {
            autoCompleted.writing_test = true;
          }
        } catch { }
      }

      if (Object.keys(autoCompleted).length > 0) {
        setStore((prev) => {
          const now = new Date().toISOString();
          const day = prev.days[today] ?? freshDay(today);
          const updatedItems = day.items.map((item) =>
            autoCompleted[item.id] && !item.completedAt
              ? { ...item, completedAt: now }
              : item
          );
          const updatedDay = { ...day, items: updatedItems };
          const streak = updateStreakIfNeeded(prev, today, updatedDay);
          return {
            ...prev,
            ...streak,
            days: { ...prev.days, [today]: updatedDay },
          };
        });
      }
    });
  }, [loaded, crossReferenced]);

  // Persist effect
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, loaded]);

  const hiddenDefaultItems = useMemo(
    () => store.hiddenDefaultItems ?? [],
    [store.hiddenDefaultItems]
  );

  // Get day for selected date with recurring tasks injected & hidden items filtered
  const dayProgress = useMemo((): DailyProgress => {
    const base = store.days[selectedDate] ?? freshDay(selectedDate);
    const withRecurring = injectRecurringTasks(base, store.recurringTasks ?? [], selectedDate);
    // Filter out hidden default items
    const hidden = new Set(store.hiddenDefaultItems ?? []);
    return {
      ...withRecurring,
      items: withRecurring.items.filter((i) => !hidden.has(i.id)),
    };
  }, [store.days, store.recurringTasks, store.hiddenDefaultItems, selectedDate]);

  const completeItem = useCallback(
    (id: ChecklistItemId) => {
      setStore((prev) => {
        const day = prev.days[selectedDate] ?? freshDay(selectedDate);
        const updatedItems = day.items.map((item) =>
          item.id === id ? { ...item, completedAt: new Date().toISOString() } : item
        );
        const updatedDay = { ...day, items: updatedItems };
        const streak = updateStreakIfNeeded(prev, selectedDate, updatedDay);
        return {
          ...prev,
          ...streak,
          days: { ...prev.days, [selectedDate]: updatedDay },
        };
      });
    },
    [selectedDate]
  );

  const uncompleteItem = useCallback(
    (id: ChecklistItemId) => {
      setStore((prev) => {
        const day = prev.days[selectedDate] ?? freshDay(selectedDate);
        const updatedItems = day.items.map((item) =>
          item.id === id ? { ...item, completedAt: undefined } : item
        );
        let { streakCount, lastCompletedDate } = prev;
        if (lastCompletedDate === selectedDate) {
          streakCount = Math.max(0, streakCount - 1);
          lastCompletedDate = undefined;
        }
        return {
          ...prev,
          streakCount,
          lastCompletedDate,
          days: { ...prev.days, [selectedDate]: { ...day, items: updatedItems } },
        };
      });
    },
    [selectedDate]
  );

  const addCustomTask = useCallback(
    (
      label: string,
      sublabel: string | undefined,
      timeOfDay: TimeOfDay,
      recurring?: boolean,
      subChecklist?: SubCheckItem[],
      activeDays?: number[]
    ) => {
      setStore((prev) => {
        const day = prev.days[selectedDate] ?? freshDay(selectedDate);
        const task: CustomTask = {
          id: Math.random().toString(36).substr(2, 9),
          label,
          sublabel,
          timeOfDay,
          recurring,
          activeDays: recurring && activeDays?.length ? activeDays : undefined,
          subChecklist: subChecklist?.length ? subChecklist : undefined,
        };

        const updatedStore: ProgressStore = {
          ...prev,
          days: {
            ...prev.days,
            [selectedDate]: { ...day, customItems: [...day.customItems, task] },
          },
        };

        // If recurring, also add to recurring templates
        if (recurring) {
          updatedStore.recurringTasks = [...(prev.recurringTasks ?? []), task];
        }

        return updatedStore;
      });
    },
    [selectedDate]
  );

  const removeCustomTask = useCallback(
    (taskId: string) => {
      setStore((prev) => {
        const day = prev.days[selectedDate] ?? freshDay(selectedDate);
        return {
          ...prev,
          days: {
            ...prev.days,
            [selectedDate]: {
              ...day,
              customItems: day.customItems.filter((t) => t.id !== taskId),
            },
          },
        };
      });
    },
    [selectedDate]
  );

  /** Remove a recurring task template (stops it from appearing on future days) */
  const removeRecurringTask = useCallback(
    (taskId: string) => {
      setStore((prev) => {
        const day = prev.days[selectedDate] ?? freshDay(selectedDate);
        return {
          ...prev,
          recurringTasks: (prev.recurringTasks ?? []).filter((t) => t.id !== taskId),
          days: {
            ...prev.days,
            [selectedDate]: {
              ...day,
              customItems: day.customItems.filter((t) => t.id !== taskId),
            },
          },
        };
      });
    },
    [selectedDate]
  );

  const toggleCustomTask = useCallback(
    (taskId: string) => {
      setStore((prev) => {
        const base = prev.days[selectedDate] ?? freshDay(selectedDate);
        const day = injectRecurringTasks(base, prev.recurringTasks ?? [], selectedDate);
        const updatedCustom = day.customItems.map((t) =>
          t.id === taskId
            ? { ...t, completedAt: t.completedAt ? undefined : new Date().toISOString() }
            : t
        );
        return {
          ...prev,
          days: {
            ...prev.days,
            [selectedDate]: { ...day, customItems: updatedCustom },
          },
        };
      });
    },
    [selectedDate]
  );

  /** Toggle a sub-checklist item within a custom task */
  const toggleSubCheckItem = useCallback(
    (taskId: string, subItemId: string) => {
      setStore((prev) => {
        const base = prev.days[selectedDate] ?? freshDay(selectedDate);
        const day = injectRecurringTasks(base, prev.recurringTasks ?? [], selectedDate);
        const updatedCustom = day.customItems.map((t) => {
          if (t.id !== taskId || !t.subChecklist) return t;
          return {
            ...t,
            subChecklist: t.subChecklist.map((s) =>
              s.id === subItemId ? { ...s, checked: !s.checked } : s
            ),
          };
        });
        return {
          ...prev,
          days: {
            ...prev.days,
            [selectedDate]: { ...day, customItems: updatedCustom },
          },
        };
      });
    },
    [selectedDate]
  );

  /** Edit a custom task's label, sublabel, timeOfDay, recurring, subChecklist, and activeDays */
  const editCustomTask = useCallback(
    (
      taskId: string,
      updates: {
        label?: string;
        sublabel?: string;
        timeOfDay?: TimeOfDay;
        recurring?: boolean;
        subChecklist?: SubCheckItem[];
        activeDays?: number[];
      }
    ) => {
      setStore((prev) => {
        const base = prev.days[selectedDate] ?? freshDay(selectedDate);
        const day = injectRecurringTasks(base, prev.recurringTasks ?? [], selectedDate);
        const updatedCustom = day.customItems.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        );
        const updatedStore: ProgressStore = {
          ...prev,
          days: {
            ...prev.days,
            [selectedDate]: { ...day, customItems: updatedCustom },
          },
        };

        // Also update recurring template if the task is recurring
        const task = day.customItems.find((t) => t.id === taskId);
        if (task?.recurring || updates.recurring) {
          const recurringTasks = [...(prev.recurringTasks ?? [])];
          const idx = recurringTasks.findIndex((t) => t.id === taskId);
          if (idx >= 0) {
            recurringTasks[idx] = { ...recurringTasks[idx], ...updates };
          } else if (updates.recurring) {
            const updated = updatedCustom.find((t) => t.id === taskId);
            if (updated) recurringTasks.push(updated);
          }
          // If recurring was turned off, remove from templates
          if (updates.recurring === false) {
            updatedStore.recurringTasks = recurringTasks.filter((t) => t.id !== taskId);
          } else {
            updatedStore.recurringTasks = recurringTasks;
          }
        }

        return updatedStore;
      });
    },
    [selectedDate]
  );

  const completedCount = useMemo(() => {
    const coreCompleted = dayProgress.items.filter((i) => i.completedAt).length;
    const customCompleted = dayProgress.customItems.filter((i) => i.completedAt).length;
    return coreCompleted + customCompleted;
  }, [dayProgress]);

  const totalCount = useMemo(
    () => dayProgress.items.length + dayProgress.customItems.length,
    [dayProgress]
  );

  const allCoreDone = useMemo(
    () => dayProgress.items.every((i) => i.completedAt),
    [dayProgress]
  );

  const allDone = completedCount === totalCount && totalCount > 0;

  const hasTasksForDate = useCallback(
    (date: string): boolean => {
      const day = store.days[date];
      if (!day) return (store.recurringTasks ?? []).length > 0;
      return day.items.some((i) => i.completedAt) || day.customItems.length > 0;
    },
    [store.days, store.recurringTasks]
  );

  const toggleDefaultItemVisibility = useCallback(
    (itemId: ChecklistItemId) => {
      setStore((prev) => {
        const hidden = prev.hiddenDefaultItems ?? [];
        const isHidden = hidden.includes(itemId);
        return {
          ...prev,
          hiddenDefaultItems: isHidden
            ? hidden.filter((id) => id !== itemId)
            : [...hidden, itemId],
        };
      });
    },
    []
  );

  const getDateProgress = useCallback(
    (date: string): { completed: number; total: number } => {
      const hidden = new Set(store.hiddenDefaultItems ?? []);
      const base = store.days[date];
      if (!base) {
        const visibleCoreCount = DEFAULT_ITEMS.filter((i) => !hidden.has(i.id)).length;
        const dayOfWeek = getDayOfWeek(date);
        const recurringCount = (store.recurringTasks ?? []).filter((rt) => {
          if (rt.activeDays && rt.activeDays.length > 0) return rt.activeDays.includes(dayOfWeek);
          return true;
        }).length;
        return { completed: 0, total: visibleCoreCount + recurringCount };
      }
      const day = injectRecurringTasks(base, store.recurringTasks ?? [], date);
      const visibleItems = day.items.filter((i) => !hidden.has(i.id));
      const coreCompleted = visibleItems.filter((i) => i.completedAt).length;
      const customCompleted = day.customItems.filter((i) => i.completedAt).length;
      return {
        completed: coreCompleted + customCompleted,
        total: visibleItems.length + day.customItems.length,
      };
    },
    [store.days, store.recurringTasks, store.hiddenDefaultItems]
  );

  return {
    dayProgress,
    streakCount: store.streakCount,
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
    hasTasksForDate,
    getDateProgress,
    hiddenDefaultItems,
    toggleDefaultItemVisibility,
    defaultItems: DEFAULT_ITEMS,
  };
}
