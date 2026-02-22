import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookOpen,
  GraduationCap,
  PenLine,
  MessageCircle,
  Flame,
  Check,
  Plus,
  X,
  CircleDot,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Cloud,
  Moon,
  Repeat,
  ChevronDown,
  ChevronUp,
  Square,
  CheckSquare,
  Pencil,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  FadeInDown,
  runOnJS,
} from "react-native-reanimated";
import { useDailyProgress } from "../../src/store/useDailyProgress";
import {
  ChecklistItem,
  ChecklistItemId,
  CustomTask,
  SubCheckItem,
  TimeOfDay,
} from "../../src/types";

// --- Config ---

const CHECKLIST_CONFIG: Record<
  ChecklistItemId,
  { icon: typeof BookOpen; color: string; bg: string }
> = {
  study_deck: { icon: BookOpen, color: "#4f46e5", bg: "#eef2ff" },
  grammar_quiz: { icon: GraduationCap, color: "#7c3aed", bg: "#f5f3ff" },
  writing_test: { icon: PenLine, color: "#d97706", bg: "#fffbeb" },
  chat_session: { icon: MessageCircle, color: "#0284c7", bg: "#f0f9ff" },
};

const TIME_OF_DAY_CONFIG: Record<
  TimeOfDay,
  { label: string; icon: typeof Sun; color: string; bg: string }
> = {
  morning: { label: "Morning", icon: Sun, color: "#f59e0b", bg: "#fffbeb" },
  afternoon: { label: "Afternoon", icon: Cloud, color: "#3b82f6", bg: "#eff6ff" },
  evening: { label: "Evening", icon: Moon, color: "#8b5cf6", bg: "#f5f3ff" },
};

const MOTIVATIONAL_PHRASES = [
  "Lad os komme i gang!",
  "Godt arbejde!",
  "Du klarer det godt!",
  "Næsten færdig!",
  "Fantastisk dag!",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateDisplay(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(weekOffset: number = 0): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return days;
}

function getWeekLabel(weekDays: string[]): string {
  const start = new Date(weekDays[0] + "T00:00:00");
  const end = new Date(weekDays[6] + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

// --- Sub-components ---

function WeekSummaryCard({
  weekDays,
  getDateProgress,
}: {
  weekDays: string[];
  getDateProgress: (date: string) => { completed: number; total: number };
}) {
  const today = getToday();
  const todayIdx = weekDays.indexOf(today);
  const daysUpToToday = todayIdx >= 0 ? weekDays.slice(0, todayIdx + 1) : weekDays;

  let totalCompleted = 0;
  let totalTasks = 0;
  let daysFullyDone = 0;

  for (const date of daysUpToToday) {
    const { completed, total } = getDateProgress(date);
    totalCompleted += completed;
    totalTasks += total;
    if (completed === total && total > 0) daysFullyDone++;
  }

  const pct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <View className="mx-6 mb-4 bg-slate-50 rounded-2xl px-4 py-3 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Week Summary
        </Text>
        <Text className="text-slate-700 text-sm">
          <Text className="font-semibold">{totalCompleted}</Text>
          <Text>/{totalTasks} tasks</Text>
          <Text className="text-slate-400"> · </Text>
          <Text className="font-semibold">{daysFullyDone}</Text>
          <Text> perfect {daysFullyDone === 1 ? "day" : "days"}</Text>
        </Text>
      </View>
      <View className="w-12 h-12 rounded-full bg-white items-center justify-center border-2 border-indigo-100">
        <Text className="text-indigo-600 font-bold text-sm">{pct}%</Text>
      </View>
    </View>
  );
}

function WeekCalendarStrip({
  weekDays,
  selectedDate,
  onSelectDate,
  hasTasksForDate,
  onPrevWeek,
  onNextWeek,
  isCurrentWeek,
}: {
  weekDays: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  hasTasksForDate: (date: string) => boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isCurrentWeek: boolean;
}) {
  const today = getToday();

  return (
    <View className="mx-6 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={onPrevWeek} hitSlop={12}>
          <ChevronLeft size={20} color="#64748b" />
        </Pressable>
        <Pressable>
          <Text className="text-slate-600 text-xs font-semibold">
            {isCurrentWeek ? "This Week" : getWeekLabel(weekDays)}
          </Text>
        </Pressable>
        <Pressable onPress={onNextWeek} hitSlop={12}>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>
      </View>

      <View className="flex-row justify-between">
        {weekDays.map((date, i) => {
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const dayNum = parseInt(date.split("-")[2], 10);
          const hasTasks = hasTasksForDate(date);

          return (
            <Pressable
              key={date}
              onPress={() => onSelectDate(date)}
              className="items-center flex-1"
            >
              <Text
                className={`text-xs font-medium mb-1 ${
                  isSelected ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {DAY_NAMES[i]}
              </Text>
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  isSelected
                    ? "bg-indigo-600"
                    : isToday
                      ? "bg-indigo-50"
                      : ""
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected
                      ? "text-white"
                      : isToday
                        ? "text-indigo-600"
                        : "text-slate-700"
                  }`}
                >
                  {dayNum}
                </Text>
              </View>
              {hasTasks && !isSelected && (
                <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1" />
              )}
              {!hasTasks && !isSelected && <View className="w-1.5 h-1.5 mt-1" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StreakBadge({ count }: { count: number }) {
  const scale = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={style}
      className="flex-row items-center bg-orange-50 px-3 py-1.5 rounded-full"
    >
      <Flame size={16} color="#f97316" />
      <Text className="text-orange-600 font-semibold text-sm ml-1">{count}</Text>
    </Animated.View>
  );
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
  allDone: boolean;
}) {
  const containerWidth = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(total > 0 ? completed / total : 0, { duration: 600 });
  }, [completed, total]);

  const barStyle = useAnimatedStyle(() => {
    const w = containerWidth.value * progress.value;
    return {
      width: w,
      height: 10,
      borderRadius: 5,
      backgroundColor: progress.value >= 1 ? "#10b981" : "#6366f1",
    };
  });

  return (
    <View className="mx-6 mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-slate-500 text-xs font-medium">Progress</Text>
        <Text className="text-slate-500 text-xs font-medium">
          {completed}/{total}
        </Text>
      </View>
      <View
        className="h-2.5 bg-slate-100 rounded-full overflow-hidden"
        onLayout={(e) => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={barStyle} />
      </View>
    </View>
  );
}

function MotivationalBanner({ completedCount }: { completedCount: number }) {
  const phrase =
    MOTIVATIONAL_PHRASES[Math.min(completedCount, MOTIVATIONAL_PHRASES.length - 1)];

  return (
    <Animated.View
      key={completedCount}
      entering={FadeInDown.duration(400)}
      className="mx-6 mb-5 bg-indigo-50 rounded-2xl px-4 py-3"
    >
      <Text className="text-indigo-700 font-medium text-center">{phrase}</Text>
    </Animated.View>
  );
}

function AllDoneBanner({ visible }: { visible: boolean }) {
  const translateY = useSharedValue(-120);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 400 }, (finished) => {
          if (finished) runOnJS(setShow)(false);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!show) return null;

  return (
    <Animated.View
      style={[
        style,
        { position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 },
      ]}
      className="bg-emerald-500 px-6 py-4 rounded-b-2xl"
    >
      <Text className="text-white font-bold text-center text-lg">
        Tillykke! All done for today!
      </Text>
    </Animated.View>
  );
}

function ChecklistRow({
  item,
  index,
  onComplete,
  onUncomplete,
  disabled,
}: {
  item: ChecklistItem;
  index: number;
  onComplete: () => void;
  onUncomplete: () => void;
  disabled?: boolean;
}) {
  const config = CHECKLIST_CONFIG[item.id];
  const Icon = config.icon;
  const isCompleted = !!item.completedAt;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 80, withSpring(0));
  }, []);

  useEffect(() => {
    if (isCompleted) {
      checkScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    } else {
      checkScale.value = withTiming(0, { duration: 200 });
    }
  }, [isCompleted]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={rowStyle} className="mx-6 mb-3">
      <Pressable
        onPress={() => {
          if (disabled) return;
          if (isCompleted) {
            onUncomplete();
          } else {
            onComplete();
          }
        }}
        className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 py-3.5"
        style={({ pressed }) => ({
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          opacity: disabled ? 0.5 : isCompleted ? 0.7 : 1,
        })}
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={20} color={config.color} />
        </View>
        <View className="flex-1">
          <Text
            className={`font-medium text-base ${
              isCompleted ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {item.label}
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5">{item.sublabel}</Text>
        </View>
        <Animated.View
          style={checkStyle}
          className={`w-7 h-7 rounded-full items-center justify-center ${
            isCompleted ? "bg-emerald-500" : "border-2 border-slate-200"
          }`}
        >
          {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function CustomTaskRow({
  task,
  index,
  onToggle,
  onRemove,
  onRemoveRecurring,
  onToggleSubItem,
  onEdit,
  disabled,
}: {
  task: CustomTask;
  index: number;
  onToggle: () => void;
  onRemove: () => void;
  onRemoveRecurring?: () => void;
  onToggleSubItem?: (subId: string) => void;
  onEdit?: () => void;
  disabled?: boolean;
}) {
  const isCompleted = !!task.completedAt;
  const [expanded, setExpanded] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const hasSubs = task.subChecklist && task.subChecklist.length > 0;
  const subsChecked = task.subChecklist?.filter((s) => s.checked).length ?? 0;
  const subsTotal = task.subChecklist?.length ?? 0;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 80, withSpring(0));
  }, []);

  useEffect(() => {
    if (isCompleted) {
      checkScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    } else {
      checkScale.value = withTiming(0, { duration: 200 });
    }
  }, [isCompleted]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleDelete = () => {
    if (task.recurring && onRemoveRecurring) {
      setShowDeleteOptions(true);
    } else {
      onRemove();
    }
  };

  return (
    <Animated.View style={rowStyle} className="mx-6 mb-3">
      <Pressable
        onPress={() => {
          if (showDeleteOptions) {
            setShowDeleteOptions(false);
            return;
          }
          if (hasSubs) {
            setExpanded((e) => !e);
          } else if (!disabled) {
            onToggle();
          }
        }}
        onLongPress={() => {
          if (!disabled) onToggle();
        }}
        className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 py-3.5"
        style={({ pressed }) => ({
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          opacity: disabled ? 0.5 : isCompleted ? 0.7 : 1,
        })}
      >
        <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-slate-50">
          <CircleDot size={20} color="#64748b" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className={`font-medium text-base ${
                isCompleted ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {task.label}
            </Text>
            {task.recurring && (
              <View className="ml-2">
                <Repeat size={12} color="#94a3b8" />
              </View>
            )}
          </View>
          {task.sublabel ? (
            <Text className="text-slate-400 text-xs mt-0.5">{task.sublabel}</Text>
          ) : null}
          {hasSubs && (
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-400 text-xs">
                {subsChecked}/{subsTotal} items
              </Text>
              {expanded ? (
                <ChevronUp size={12} color="#94a3b8" className="ml-1" />
              ) : (
                <ChevronDown size={12} color="#94a3b8" className="ml-1" />
              )}
            </View>
          )}
        </View>
        {onEdit && (
          <Pressable onPress={onEdit} hitSlop={8} className="mr-2">
            <Pencil size={14} color="#94a3b8" />
          </Pressable>
        )}
        <Pressable onPress={handleDelete} hitSlop={8} className="mr-2">
          <Trash2 size={16} color="#94a3b8" />
        </Pressable>
        {!hasSubs && (
          <Animated.View
            style={checkStyle}
            className={`w-7 h-7 rounded-full items-center justify-center ${
              isCompleted ? "bg-emerald-500" : "border-2 border-slate-200"
            }`}
          >
            {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
          </Animated.View>
        )}
        {hasSubs && (
          <Pressable onPress={() => { if (!disabled) onToggle(); }}>
            <View
              className={`w-7 h-7 rounded-full items-center justify-center ${
                isCompleted ? "bg-emerald-500" : "border-2 border-slate-200"
              }`}
            >
              {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
            </View>
          </Pressable>
        )}
      </Pressable>

      {/* Inline delete options for recurring tasks */}
      {showDeleteOptions && (
        <View className="mt-1 bg-white border border-slate-100 rounded-xl overflow-hidden">
          <Pressable
            onPress={() => {
              setShowDeleteOptions(false);
              onRemove();
            }}
            className="px-4 py-3 border-b border-slate-100"
          >
            <Text className="text-slate-700 text-sm font-medium">Remove today only</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowDeleteOptions(false);
              if (onRemoveRecurring) onRemoveRecurring();
            }}
            className="px-4 py-3 border-b border-slate-100"
          >
            <Text className="text-red-500 text-sm font-medium">Stop recurring</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDeleteOptions(false)}
            className="px-4 py-3"
          >
            <Text className="text-slate-400 text-sm">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Sub-checklist */}
      {expanded && hasSubs && (
        <View className="ml-14 mr-4 mt-1 mb-1">
          {task.subChecklist!.map((sub) => (
            <Pressable
              key={sub.id}
              onPress={() => {
                if (!disabled && onToggleSubItem) onToggleSubItem(sub.id);
              }}
              className="flex-row items-center py-2"
            >
              {sub.checked ? (
                <CheckSquare size={16} color="#10b981" />
              ) : (
                <Square size={16} color="#cbd5e1" />
              )}
              <Text
                className={`ml-2 text-sm ${
                  sub.checked ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {sub.text}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function TimeOfDayPicker({
  value,
  onChange,
}: {
  value: TimeOfDay;
  onChange: (v: TimeOfDay) => void;
}) {
  const options: TimeOfDay[] = ["morning", "afternoon", "evening"];

  return (
    <View className="flex-row mb-4">
      {options.map((opt) => {
        const config = TIME_OF_DAY_CONFIG[opt];
        const Icon = config.icon;
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mx-1 ${
              selected ? "border-2" : "border border-slate-200"
            }`}
            style={selected ? { borderColor: config.color, backgroundColor: config.bg } : undefined}
          >
            <Icon size={16} color={selected ? config.color : "#94a3b8"} />
            <Text
              className={`ml-1.5 text-xs font-semibold ${
                selected ? "" : "text-slate-400"
              }`}
              style={selected ? { color: config.color } : undefined}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TaskModal({
  visible,
  onClose,
  onAdd,
  onEdit,
  editingTask,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    label: string,
    sublabel: string | undefined,
    timeOfDay: TimeOfDay,
    recurring?: boolean,
    subChecklist?: SubCheckItem[]
  ) => void;
  onEdit?: (
    taskId: string,
    updates: {
      label?: string;
      sublabel?: string;
      timeOfDay?: TimeOfDay;
      recurring?: boolean;
      subChecklist?: SubCheckItem[];
    }
  ) => void;
  editingTask?: CustomTask | null;
}) {
  const isEditing = !!editingTask;
  const [label, setLabel] = useState("");
  const [sublabel, setSublabel] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [recurring, setRecurring] = useState(false);
  const [subItems, setSubItems] = useState<{ id: string; text: string }[]>([]);
  const [newSubText, setNewSubText] = useState("");

  // Populate fields when editing
  useEffect(() => {
    if (editingTask) {
      setLabel(editingTask.label);
      setSublabel(editingTask.sublabel ?? "");
      setTimeOfDay(editingTask.timeOfDay);
      setRecurring(!!editingTask.recurring);
      setSubItems(
        (editingTask.subChecklist ?? []).map((s) => ({ id: s.id, text: s.text }))
      );
    } else {
      setLabel("");
      setSublabel("");
      setTimeOfDay("morning");
      setRecurring(false);
      setSubItems([]);
    }
    setNewSubText("");
  }, [editingTask, visible]);

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const subChecklist: SubCheckItem[] = subItems
      .filter((s) => s.text.trim())
      .map((s) => ({ id: s.id, text: s.text.trim(), checked: false }));

    if (isEditing && onEdit) {
      onEdit(editingTask!.id, {
        label: trimmed,
        sublabel: sublabel.trim() || undefined,
        timeOfDay,
        recurring: recurring || undefined,
        subChecklist: subChecklist.length > 0 ? subChecklist : undefined,
      });
    } else {
      onAdd(
        trimmed,
        sublabel.trim() || undefined,
        timeOfDay,
        recurring || undefined,
        subChecklist.length > 0 ? subChecklist : undefined
      );
    }
    setLabel("");
    setSublabel("");
    setTimeOfDay("morning");
    setRecurring(false);
    setSubItems([]);
    setNewSubText("");
    onClose();
  };

  const addSubItem = () => {
    const trimmed = newSubText.trim();
    if (!trimmed) return;
    setSubItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), text: trimmed },
    ]);
    setNewSubText("");
  };

  const removeSubItem = (id: string) => {
    setSubItems((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-slate-900">
              {isEditing ? "Edit Task" : "Add Task"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Task name */}
          <TextInput
            placeholder="Task name"
            placeholderTextColor="#94a3b8"
            value={label}
            onChangeText={setLabel}
            className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 mb-3"
            autoFocus
          />

          {/* Description */}
          <TextInput
            placeholder="Description (optional)"
            placeholderTextColor="#94a3b8"
            value={sublabel}
            onChangeText={setSublabel}
            className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 mb-4"
          />

          {/* Time of day */}
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Time of Day
          </Text>
          <TimeOfDayPicker value={timeOfDay} onChange={setTimeOfDay} />

          {/* Sub-checklist */}
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Checklist Items
          </Text>
          {subItems.map((item) => (
            <View key={item.id} className="flex-row items-center mb-2">
              <View className="w-5 h-5 rounded border border-slate-200 items-center justify-center mr-2">
                <Square size={12} color="#cbd5e1" />
              </View>
              <Text className="flex-1 text-sm text-slate-700">{item.text}</Text>
              <Pressable onPress={() => removeSubItem(item.id)} hitSlop={8}>
                <X size={14} color="#94a3b8" />
              </Pressable>
            </View>
          ))}
          <View className="flex-row items-center mb-4">
            <TextInput
              placeholder="Add checklist item..."
              placeholderTextColor="#94a3b8"
              value={newSubText}
              onChangeText={setNewSubText}
              onSubmitEditing={addSubItem}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 mr-2"
            />
            <Pressable
              onPress={addSubItem}
              disabled={!newSubText.trim()}
              className={`w-8 h-8 rounded-lg items-center justify-center ${
                newSubText.trim() ? "bg-indigo-100" : "bg-slate-100"
              }`}
            >
              <Plus size={16} color={newSubText.trim() ? "#4f46e5" : "#94a3b8"} />
            </Pressable>
          </View>

          {/* Recurring toggle */}
          <View className="flex-row items-center justify-between mb-5 bg-slate-50 rounded-xl px-4 py-3">
            <View className="flex-row items-center">
              <Repeat size={16} color="#64748b" />
              <Text className="text-sm font-medium text-slate-700 ml-2">
                Repeat daily
              </Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ false: "#e2e8f0", true: "#c7d2fe" }}
              thumbColor={recurring ? "#4f46e5" : "#f4f4f5"}
            />
          </View>

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!label.trim()}
            className={`py-3.5 rounded-2xl items-center ${
              label.trim() ? "bg-indigo-600" : "bg-slate-200"
            }`}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text
              className={`font-medium ${
                label.trim() ? "text-white" : "text-slate-400"
              }`}
            >
              {isEditing ? "Save Changes" : "Add Task"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Time-of-day section ---

function TimeSection({
  timeOfDay,
  coreItems,
  customItems,
  completeItem,
  uncompleteItem,
  toggleCustomTask,
  removeCustomTask,
  removeRecurringTask,
  toggleSubCheckItem,
  onEditTask,
  disabled,
}: {
  timeOfDay: TimeOfDay;
  coreItems: ChecklistItem[];
  customItems: CustomTask[];
  completeItem: (id: ChecklistItemId) => void;
  uncompleteItem: (id: ChecklistItemId) => void;
  toggleCustomTask: (id: string) => void;
  removeCustomTask: (id: string) => void;
  removeRecurringTask: (id: string) => void;
  toggleSubCheckItem: (taskId: string, subId: string) => void;
  onEditTask: (task: CustomTask) => void;
  disabled: boolean;
}) {
  if (coreItems.length === 0 && customItems.length === 0) return null;

  const config = TIME_OF_DAY_CONFIG[timeOfDay];
  const Icon = config.icon;

  return (
    <View className="mb-2">
      <View className="mx-6 mb-3 flex-row items-center">
        <View
          className="w-6 h-6 rounded-lg items-center justify-center mr-2"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={14} color={config.color} />
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
          {config.label}
        </Text>
      </View>

      {coreItems.map((item, index) => (
        <ChecklistRow
          key={item.id}
          item={item}
          index={index}
          onComplete={() => completeItem(item.id)}
          onUncomplete={() => uncompleteItem(item.id)}
          disabled={disabled}
        />
      ))}

      {customItems.map((task, index) => (
        <CustomTaskRow
          key={task.id}
          task={task}
          index={coreItems.length + index}
          onToggle={() => toggleCustomTask(task.id)}
          onRemove={() => removeCustomTask(task.id)}
          onRemoveRecurring={task.recurring ? () => removeRecurringTask(task.id) : undefined}
          onToggleSubItem={(subId) => toggleSubCheckItem(task.id, subId)}
          onEdit={() => onEditTask(task)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

// --- Main Screen ---

export default function HomeScreen() {
  const {
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
    hasTasksForDate,
    getDateProgress,
  } = useDailyProgress();

  const [celebrationShown, setCelebrationShown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomTask | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = getToday();
  const isCurrentWeek = weekOffset === 0;
  const isToday = selectedDate === today;
  const isFutureDate = selectedDate > today;

  // Group items by time of day
  const grouped = useMemo(() => {
    const times: TimeOfDay[] = ["morning", "afternoon", "evening"];
    return times.map((tod) => ({
      timeOfDay: tod,
      coreItems: dayProgress.items.filter((i) => i.timeOfDay === tod),
      customItems: dayProgress.customItems.filter((t) => t.timeOfDay === tod),
    }));
  }, [dayProgress]);

  useEffect(() => {
    if (allDone && !celebrationShown && isToday) {
      setCelebrationShown(true);
      setShowCelebration(true);
    }
  }, [allDone, celebrationShown, isToday]);

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <AllDoneBanner visible={showCelebration} />

      {/* Header */}
      <View className="p-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">
            Hej!
          </Text>
          <Text className="text-slate-500 text-sm mt-0.5">
            {formatDateDisplay(selectedDate)}
          </Text>
        </View>
        <View className="flex-row items-center">
          {!isToday && (
            <Pressable
              onPress={() => {
                setWeekOffset(0);
                setSelectedDate(today);
              }}
              className="bg-indigo-50 px-3 py-1.5 rounded-full mr-2"
            >
              <Text className="text-indigo-600 font-semibold text-xs">Today</Text>
            </Pressable>
          )}
          <StreakBadge count={streakCount} />
        </View>
      </View>

      {/* Calendar Strip */}
      <WeekCalendarStrip
        weekDays={weekDays}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        hasTasksForDate={hasTasksForDate}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => o + 1)}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Week Summary */}
      <WeekSummaryCard weekDays={weekDays} getDateProgress={getDateProgress} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <ProgressBar
          completed={completedCount}
          total={totalCount}
          allDone={allDone}
        />

        {/* Motivational Banner (today only) */}
        {isToday && <MotivationalBanner completedCount={completedCount} />}

        {/* Time-of-day sections */}
        {grouped.map(({ timeOfDay, coreItems, customItems }) => (
          <TimeSection
            key={timeOfDay}
            timeOfDay={timeOfDay}
            coreItems={coreItems}
            customItems={customItems}
            completeItem={completeItem}
            uncompleteItem={uncompleteItem}
            toggleCustomTask={toggleCustomTask}
            removeCustomTask={removeCustomTask}
            removeRecurringTask={removeRecurringTask}
            toggleSubCheckItem={toggleSubCheckItem}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            disabled={isFutureDate}
          />
        ))}

        {/* Add Task Button */}
        <Pressable
          onPress={() => {
            setEditingTask(null);
            setShowTaskModal(true);
          }}
          className="mx-6 mt-2 mb-3 flex-row items-center justify-center py-3 border border-dashed border-slate-200 rounded-2xl"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Plus size={18} color="#94a3b8" />
          <Text className="text-slate-400 font-medium ml-2">Add Task</Text>
        </Pressable>

        <View className="h-8" />
      </ScrollView>

      <TaskModal
        visible={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onAdd={addCustomTask}
        onEdit={editCustomTask}
        editingTask={editingTask}
      />
    </SafeAreaView>
  );
}
