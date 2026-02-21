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
