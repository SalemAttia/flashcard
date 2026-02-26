import { WritingLevel } from "../types";

export interface DeckSuggestion {
  id: string;
  title: string;
  titleDa: string;
  description: string;
  level: WritingLevel;
  sampleWords: string[];
}

export const DECK_SUGGESTIONS: DeckSuggestion[] = [
  // A1 — Beginner
  {
    id: "a1-greetings",
    title: "Greetings & Introductions",
    titleDa: "Hilsner og introduktioner",
    description: "Essential phrases for meeting people and basic social interactions.",
    level: "a1",
    sampleWords: ["Hej", "Godmorgen", "Jeg hedder…", "Hvordan har du det?"],
  },
  {
    id: "a1-numbers",
    title: "Numbers 1–100",
    titleDa: "Tal 1–100",
    description: "Learn to count and use numbers in everyday situations.",
    level: "a1",
    sampleWords: ["en", "ti", "tyve", "halvtreds"],
  },
  {
    id: "a1-family",
    title: "Family Members",
    titleDa: "Familiemedlemmer",
    description: "Words for family relationships and describing your family.",
    level: "a1",
    sampleWords: ["mor", "far", "søster", "bror"],
  },
  {
    id: "a1-colors-shapes",
    title: "Colors & Shapes",
    titleDa: "Farver og former",
    description: "Basic colors and common shapes used in daily life.",
    level: "a1",
    sampleWords: ["rød", "blå", "grøn", "cirkel"],
  },

  // A2 — Elementary
  {
    id: "a2-food-drink",
    title: "Food & Drink",
    titleDa: "Mad og drikke",
    description: "Vocabulary for ordering food, cooking, and grocery shopping.",
    level: "a2",
    sampleWords: ["brød", "mælk", "kaffe", "smørrebrød"],
  },
  {
    id: "a2-daily-routine",
    title: "Daily Routine",
    titleDa: "Daglig rutine",
    description: "Describe your day from morning to night.",
    level: "a2",
    sampleWords: ["vågne", "spise morgenmad", "arbejde", "sove"],
  },
  {
    id: "a2-shopping",
    title: "Shopping & Money",
    titleDa: "Indkøb og penge",
    description: "Useful phrases for stores, prices, and transactions.",
    level: "a2",
    sampleWords: ["butik", "pris", "billig", "betale"],
  },
  {
    id: "a2-weather",
    title: "Weather & Seasons",
    titleDa: "Vejr og årstider",
    description: "Talk about the weather and seasonal activities.",
    level: "a2",
    sampleWords: ["regn", "sol", "vinter", "sommer"],
  },

  // B1 — Intermediate
  {
    id: "b1-workplace",
    title: "Workplace Vocabulary",
    titleDa: "Arbejdsplads",
    description: "Professional language for the office, meetings, and emails.",
    level: "b1",
    sampleWords: ["møde", "kollega", "ansøgning", "deadline"],
  },
  {
    id: "b1-health",
    title: "Health & Body",
    titleDa: "Sundhed og krop",
    description: "Medical vocabulary, body parts, and describing symptoms.",
    level: "b1",
    sampleWords: ["læge", "hovedpine", "recept", "sygehus"],
  },
  {
    id: "b1-travel",
    title: "Travel & Directions",
    titleDa: "Rejser og vej",
    description: "Navigate transportation, ask for directions, and book trips.",
    level: "b1",
    sampleWords: ["tog", "lufthavn", "drej til højre", "billet"],
  },
  {
    id: "b1-media",
    title: "Media & Entertainment",
    titleDa: "Medier og underholdning",
    description: "Discuss movies, music, news, and hobbies.",
    level: "b1",
    sampleWords: ["avis", "film", "musik", "udstilling"],
  },

  // B2 — Upper-Intermediate
  {
    id: "b2-politics",
    title: "Politics & Society",
    titleDa: "Politik og samfund",
    description: "Discuss Danish politics, welfare, and societal issues.",
    level: "b2",
    sampleWords: ["regering", "velfærd", "demokrati", "folketing"],
  },
  {
    id: "b2-idioms",
    title: "Danish Idioms",
    titleDa: "Danske talemåder",
    description: "Common Danish expressions and their meanings.",
    level: "b2",
    sampleWords: ["at slå to fluer med ét smæk", "det blæser en halv pelikan"],
  },
  {
    id: "b2-abstract",
    title: "Abstract Concepts",
    titleDa: "Abstrakte begreber",
    description: "Express opinions about complex and abstract topics.",
    level: "b2",
    sampleWords: ["frihed", "ansvar", "retfærdighed", "bæredygtighed"],
  },
  {
    id: "b2-academic",
    title: "Academic Language",
    titleDa: "Akademisk sprog",
    description: "Formal vocabulary for education, research, and essays.",
    level: "b2",
    sampleWords: ["analyse", "konklusion", "hypotese", "perspektiv"],
  },
];
