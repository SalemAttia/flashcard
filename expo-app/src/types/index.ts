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
