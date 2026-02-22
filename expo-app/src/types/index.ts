export type Card = {
  id: string;
  front: string;
  back: string;
};

export type Language = "en-US" | "da-DK" | "ar-SA";

export type Deck = {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  frontLang: Language;
  backLang: Language;
  lastStudied?: string;
};

// Danish Writing Test types

export type WritingLevel = "a1" | "a2" | "b1" | "b2";

export interface WritingPrompt {
  id: string;
  level: WritingLevel;
  instruction: string;
  instructionDa?: string;
  contextWords?: string[];
  hints?: string[];
  minWords: number;
}

export interface WritingEvaluation {
  promptId: string;
  score: number;
  passed: boolean;
  feedback: {
    grammar: string;
    vocabulary: string;
    spelling: string;
    fluency: string;
    overall: string;
  };
  correctedText?: string;
  highlightedErrors?: Array<{
    word: string;
    suggestion: string;
    reason: string;
  }>;
}

export interface WritingTestResult {
  id: string;
  deckId?: string;
  level: WritingLevel;
  completedAt: string;
  prompts: WritingPrompt[];
  responses: Array<{
    promptId: string;
    userText: string;
    evaluation: WritingEvaluation;
    timeSpentMs: number;
  }>;
  overallScore: number;
  passed: boolean;
}

// Custom Grammar Topics

export interface SavedCustomTopic {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  lastUsedAt?: string;
  color: string;
}

// Grammar Quiz types

export type GrammarTopicId =
  | "articles"
  | "prepositions"
  | "verb-tenses"
  | "subject-verb-agreement"
  | "conditionals"
  | "word-order"
  | "pronouns"
  | "adjective-agreement"
  | "modal-verbs"
  | "passive-voice"
  | "conjunctions"
  | "negation"
  | "definite-suffixes"
  | "reflexive-verbs"
  | "relative-clauses"
  | "adverbs"
  | "plural-nouns"
  | "imperative"
  | "genitive"
  | "comparison"
  | "custom";

export type GrammarQuestionType = "multiple-choice" | "fill-in-the-blank";

export interface GrammarQuestion {
  id: string;
  topicId: GrammarTopicId;
  type: GrammarQuestionType;
  sentence: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GrammarAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface GrammarSessionResult {
  id: string;
  topicId: GrammarTopicId;
  customTopic?: string;
  completedAt: string;
  questions: GrammarQuestion[];
  answers: GrammarAnswer[];
  correctCount: number;
  totalCount: number;
  scorePercent: number;
}

// Chat types

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
}

export interface ChatNote {
  id: string;
  text: string;
  title?: string;
  timestamp: string;
  sourceMessageId?: string;
}

// Daily Checklist types

export type ChecklistItemId =
  | "study_deck"
  | "grammar_quiz"
  | "writing_test"
  | "chat_session";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface SubCheckItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistItem {
  id: ChecklistItemId;
  label: string;
  sublabel: string;
  timeOfDay: TimeOfDay;
  completedAt?: string;
  manuallyUncompleted?: boolean;
}

export interface CustomTask {
  id: string;
  label: string;
  sublabel?: string;
  timeOfDay: TimeOfDay;
  recurring?: boolean;
  activeDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat; undefined = every day
  subChecklist?: SubCheckItem[];
  completedAt?: string;
  manuallyUncompleted?: boolean;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  items: ChecklistItem[];
  customItems: CustomTask[];
}

export interface ProgressStore {
  days: Record<string, DailyProgress>; // keyed by YYYY-MM-DD
  streakCount: number;
  lastCompletedDate?: string; // YYYY-MM-DD when all 4 core items were last completed
  recurringTasks?: CustomTask[]; // recurring task templates
  hiddenDefaultItems?: ChecklistItemId[]; // default items the user chose to hide
  onboardingCompleted?: Record<string, boolean>; // track which onboarding tours are finished
  bannersDismissed?: Record<string, boolean>; // track which banners are dismissed
}
