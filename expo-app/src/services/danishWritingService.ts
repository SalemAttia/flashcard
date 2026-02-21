import OpenAI from "openai";
import { Deck, WritingPrompt, WritingEvaluation, WritingLevel } from "../types";
import { LevelConfig } from "../constants/writingLevels";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") return null;
  return new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true });
}

export async function generateWritingPrompts(
  levelConfig: LevelConfig,
  deck?: Deck | null
): Promise<WritingPrompt[]> {
  const openai = getOpenAIClient();

  if (!openai) {
    return generateLocalPrompts(levelConfig, deck);
  }

  const vocabContext = deck
    ? `\nVocabulary context from the student's flashcard deck "${deck.title}":\n${deck.cards.map((c) => `- ${c.front} → ${c.back}`).join("\n")}\nUse some of these words naturally in the prompts.`
    : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a Danish language examiner creating writing prompts for a ${levelConfig.label} (CEFR ${levelConfig.value.toUpperCase()}, ${levelConfig.sublabel}) student. Respond ONLY with a JSON array, no markdown fences.`,
        },
        {
          role: "user",
          content: `Create exactly ${levelConfig.promptCount} Danish writing prompts for level ${levelConfig.value.toUpperCase()}.
${vocabContext}

Each prompt must have:
- "instruction": string (in English, telling the student what to write in Danish)
- "contextWords": string[] (3-5 Danish words to incorporate, ${deck ? "from the vocabulary list" : "common Danish words appropriate for this level"})
- "hints": string[] (1-3 helpful Danish phrase starters or grammar hints)
- "minWords": ${levelConfig.minWords}

Level expectations:
- Grammar focus: ${levelConfig.evaluationCriteria.grammar}
- Vocabulary focus: ${levelConfig.evaluationCriteria.vocabulary}

Return ONLY the JSON array.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed: Omit<WritingPrompt, "id" | "level">[] = JSON.parse(jsonStr);

    return parsed.map((p, i) => ({
      ...p,
      id: `wp-${i}`,
      level: levelConfig.value,
      minWords: p.minWords || levelConfig.minWords,
    }));
  } catch (error) {
    console.warn("AI prompt generation failed, using local fallback:", error);
    return generateLocalPrompts(levelConfig, deck);
  }
}

function generateLocalPrompts(
  levelConfig: LevelConfig,
  deck?: Deck | null
): WritingPrompt[] {
  const contextWords = deck
    ? deck.cards.slice(0, 5).map((c) => c.back)
    : [];

  const promptsByLevel: Record<WritingLevel, Array<{ instruction: string; hints: string[] }>> = {
    a1: [
      { instruction: "Write 3-5 simple sentences introducing yourself in Danish. Include your name and where you are from.", hints: ["Jeg hedder...", "Jeg er fra...", "Jeg bor i..."] },
      { instruction: "Write a short list of your favorite foods in Danish using simple sentences.", hints: ["Jeg kan lide...", "Min favorit er...", "Jeg spiser..."] },
      { instruction: "Describe your family members in short Danish sentences.", hints: ["Min mor hedder...", "Jeg har...", "Han/Hun er..."] },
    ],
    a2: [
      { instruction: "Write a short paragraph about your daily routine in Danish. What do you do in the morning and evening?", hints: ["Om morgenen...", "Derefter...", "Om aftenen..."] },
      { instruction: "Write about your last weekend in Danish. What did you do?", hints: ["I weekenden...", "Jeg gik til...", "Det var..."] },
      { instruction: "Describe your home in Danish. What rooms do you have and what is in them?", hints: ["Mit hus har...", "I stuen er der...", "Køkkenet er..."] },
      { instruction: "Write about your best friend in Danish. How did you meet and what do you do together?", hints: ["Min bedste ven hedder...", "Vi mødte hinanden...", "Vi kan lide at..."] },
    ],
    b1: [
      { instruction: "Write a letter to a friend in Danish describing a recent trip you took. Include details about what you saw and experienced.", hints: ["Kære...", "Jeg rejste til...", "Det mest interessante var..."] },
      { instruction: "Write a paragraph giving your opinion on the importance of learning languages. Support your view with reasons.", hints: ["Jeg mener at...", "For det første...", "Derudover..."] },
      { instruction: "Describe a problem in your neighborhood and suggest a solution in Danish.", hints: ["Et problem i mit kvarter er...", "Dette påvirker...", "En løsning kunne være..."] },
      { instruction: "Write about a Danish tradition or cultural event that interests you. Explain what happens and why it is important.", hints: ["En vigtig tradition er...", "Folk fejrer det ved at...", "Det er vigtigt fordi..."] },
    ],
    b2: [
      { instruction: "Write an essay discussing the advantages and disadvantages of social media in modern Danish society. Present balanced arguments.", hints: ["På den ene side...", "Ikke desto mindre...", "Alt i alt..."] },
      { instruction: "Write a detailed response to a job advertisement in Danish. Explain your qualifications and motivation.", hints: ["Med henvisning til...", "Jeg har erfaring med...", "Jeg ser frem til..."] },
      { instruction: "Write about the challenges of integrating into a new culture, drawing on personal experience or observations about Denmark.", hints: ["Integration indebærer...", "En af de største udfordringer...", "Samfundet bør..."] },
    ],
  };

  const templates = promptsByLevel[levelConfig.value];

  return templates.map((t, i) => ({
    id: `wp-${i}`,
    level: levelConfig.value,
    instruction: t.instruction,
    contextWords: contextWords.length > 0 ? contextWords : undefined,
    hints: t.hints,
    minWords: levelConfig.minWords,
  }));
}

export async function evaluateWriting(
  prompt: WritingPrompt,
  userText: string,
  levelConfig: LevelConfig
): Promise<WritingEvaluation> {
  const openai = getOpenAIClient();

  if (!openai) {
    return localFallbackEvaluation(prompt, userText, levelConfig);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an expert Danish language examiner grading a ${levelConfig.label} (CEFR ${levelConfig.value.toUpperCase()}, ${levelConfig.sublabel}) writing submission.

Evaluate against these criteria:
- Grammar: ${levelConfig.evaluationCriteria.grammar}
- Vocabulary: ${levelConfig.evaluationCriteria.vocabulary}
- Spelling: ${levelConfig.evaluationCriteria.spelling}
- Fluency: ${levelConfig.evaluationCriteria.fluency}

Pass mark is ${levelConfig.passMark}/100.
Grade strictly but fairly for the level. Respond ONLY with valid JSON, no markdown fences.`,
        },
        {
          role: "user",
          content: `Writing prompt given to student: "${prompt.instruction}"
Student's response in Danish:
"${userText}"

Return a JSON object with this exact schema:
{
  "score": number (0-100),
  "passed": boolean,
  "feedback": {
    "grammar": "specific grammar feedback",
    "vocabulary": "vocabulary usage feedback",
    "spelling": "spelling feedback",
    "fluency": "fluency and coherence feedback",
    "overall": "summary comment"
  },
  "correctedText": "the student's text rewritten correctly in Danish",
  "highlightedErrors": [{ "word": "wrong word", "suggestion": "correct word", "reason": "why" }]
}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonStr);

    return {
      promptId: prompt.id,
      score: parsed.score ?? 0,
      passed: parsed.passed ?? parsed.score >= levelConfig.passMark,
      feedback: {
        grammar: parsed.feedback?.grammar ?? "No feedback available.",
        vocabulary: parsed.feedback?.vocabulary ?? "No feedback available.",
        spelling: parsed.feedback?.spelling ?? "No feedback available.",
        fluency: parsed.feedback?.fluency ?? "No feedback available.",
        overall: parsed.feedback?.overall ?? "No feedback available.",
      },
      correctedText: parsed.correctedText,
      highlightedErrors: parsed.highlightedErrors,
    };
  } catch (error) {
    console.warn("AI evaluation failed, using local fallback:", error);
    return localFallbackEvaluation(prompt, userText, levelConfig);
  }
}

function localFallbackEvaluation(
  prompt: WritingPrompt,
  userText: string,
  levelConfig: LevelConfig
): WritingEvaluation {
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = wordCount >= prompt.minWords;
  const hasDanishChars = /[æøåÆØÅ]/.test(userText);

  let score = 0;
  if (meetsMinWords) score += 40;
  else score += Math.round((wordCount / prompt.minWords) * 40);
  if (hasDanishChars) score += 20;
  if (wordCount > 0) score += 20;
  if (userText.includes(".") || userText.includes("!") || userText.includes("?")) score += 10;
  if (userText[0] === userText[0]?.toUpperCase()) score += 10;

  score = Math.min(score, 100);

  return {
    promptId: prompt.id,
    score,
    passed: score >= levelConfig.passMark,
    feedback: {
      grammar: "AI evaluation unavailable. Basic structure check only.",
      vocabulary: hasDanishChars
        ? "Good — Danish characters (æ, ø, å) detected."
        : "Consider using Danish special characters (æ, ø, å) where appropriate.",
      spelling: "AI evaluation unavailable. Unable to check spelling.",
      fluency: meetsMinWords
        ? `Good length — ${wordCount} words (minimum: ${prompt.minWords}).`
        : `Too short — ${wordCount} words (minimum: ${prompt.minWords}).`,
      overall: "This is a basic evaluation without AI. Connect an OpenAI API key for detailed feedback.",
    },
  };
}
