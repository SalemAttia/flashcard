import { WritingLevel } from "../types";

export interface LevelTip {
  level: WritingLevel;
  label: string;
  sublabel: string;
  color: string;
  focusAreas: string[];
  dailyGoal: string;
  nextLevelHint: string;
}

export const LEVEL_TIPS: LevelTip[] = [
  {
    level: "a1",
    label: "A1 - Beginner",
    sublabel: "Grundlæggende",
    color: "emerald",
    focusAreas: [
      "Learn the most common 100 Danish words",
      "Practice basic greetings and introductions",
      "Understand noun genders (en/et words)",
      "Build simple present-tense sentences",
    ],
    dailyGoal: "Learn 5 new words and practice 1 grammar topic",
    nextLevelHint:
      "To reach A2, focus on past tense verbs and expanding everyday vocabulary.",
  },
  {
    level: "a2",
    label: "A2 - Elementary",
    sublabel: "Prøve i Dansk 1",
    color: "blue",
    focusAreas: [
      "Use past tense and present perfect correctly",
      "Learn prepositions and word order rules (V2)",
      "Build vocabulary around daily life topics",
      "Practice writing short messages and notes",
    ],
    dailyGoal: "Study 1 deck and complete a grammar quiz",
    nextLevelHint:
      "To reach B1, practice modal verbs, subordinate clauses, and reading short articles.",
  },
  {
    level: "b1",
    label: "B1 - Intermediate",
    sublabel: "Prøve i Dansk 2",
    color: "violet",
    focusAreas: [
      "Master subordinate clauses and complex word order",
      "Use modal verbs and conditional sentences",
      "Read Danish news articles and short stories",
      "Practice writing structured paragraphs",
    ],
    dailyGoal: "Read a short Danish text and write a summary",
    nextLevelHint:
      "To reach B2, work on passive voice, relative clauses, and formal/informal registers.",
  },
  {
    level: "b2",
    label: "B2 - Upper-Intermediate",
    sublabel: "Prøve i Dansk 3",
    color: "rose",
    focusAreas: [
      "Use passive voice and complex clause structures",
      "Learn Danish idioms and formal expressions",
      "Practice argumentation and essay writing",
      "Understand register differences (formal vs. informal)",
    ],
    dailyGoal: "Write a short essay or have an extended conversation",
    nextLevelHint:
      "You are approaching advanced fluency! Focus on nuance, humor, and cultural references.",
  },
];

export function getLevelTip(level: WritingLevel): LevelTip {
  return LEVEL_TIPS.find((t) => t.level === level)!;
}
