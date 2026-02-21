import { WritingLevel } from "../types";

export interface LevelConfig {
  value: WritingLevel;
  label: string;
  sublabel: string;
  description: string;
  passMark: number;
  promptCount: number;
  minWords: number;
  color: string;
  evaluationCriteria: {
    grammar: string;
    vocabulary: string;
    spelling: string;
    fluency: string;
  };
}

export const WRITING_LEVELS: LevelConfig[] = [
  {
    value: "a1",
    label: "A1 - Beginner",
    sublabel: "Grundlæggende",
    description: "Write simple words and very short phrases about yourself.",
    passMark: 50,
    promptCount: 3,
    minWords: 5,
    color: "emerald",
    evaluationCriteria: {
      grammar:
        "Very basic sentence structure, singular/plural, present tense",
      vocabulary: "High-frequency everyday words",
      spelling: "Basic phonetic spelling of simple words",
      fluency: "Isolated words and memorized phrases are acceptable",
    },
  },
  {
    value: "a2",
    label: "A2 - Elementary",
    sublabel: "Prøve i Dansk 1",
    description: "Write short simple sentences about familiar topics.",
    passMark: 60,
    promptCount: 4,
    minWords: 20,
    color: "blue",
    evaluationCriteria: {
      grammar:
        "Simple conjunctions (og, men, fordi), present and past tense",
      vocabulary: "Everyday vocabulary covering personal and family info",
      spelling:
        "Correct spelling of common words, Danish special characters (æ, ø, å)",
      fluency: "Simple connected sentences on familiar topics",
    },
  },
  {
    value: "b1",
    label: "B1 - Intermediate",
    sublabel: "Prøve i Dansk 2",
    description:
      "Write clear connected text on subjects that are familiar.",
    passMark: 65,
    promptCount: 4,
    minWords: 60,
    color: "violet",
    evaluationCriteria: {
      grammar:
        "Subordinate clauses, word order (V2 rule), perfect tense, modal verbs",
      vocabulary: "Wider range of vocabulary, some idiomatic phrases",
      spelling: "Accurate spelling including compound words",
      fluency: "Coherent paragraphs with logical connectors",
    },
  },
  {
    value: "b2",
    label: "B2 - Upper-Intermediate",
    sublabel: "Prøve i Dansk 3",
    description:
      "Write detailed texts on a range of subjects expressing viewpoints.",
    passMark: 70,
    promptCount: 3,
    minWords: 120,
    color: "rose",
    evaluationCriteria: {
      grammar:
        "Complex clause structures, passive voice, subjunctive, nuanced tense usage",
      vocabulary:
        "Precise and varied vocabulary, idiomatic and formal registers",
      spelling: "Near-perfect orthography including compound nouns",
      fluency:
        "Well-structured argumentation, cohesion, appropriate register",
    },
  },
];

export function getLevelConfig(level: WritingLevel): LevelConfig {
  return WRITING_LEVELS.find((l) => l.value === level)!;
}
