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
  deck?: Deck | null,
  topic?: string | null,
): Promise<WritingPrompt[]> {
  const openai = getOpenAIClient();

  if (!openai) {
    return generateLocalPrompts(levelConfig, deck, topic);
  }

  const vocabContext = deck
    ? `\nVocabulary context from the student's flashcard deck "${deck.title}":\n${deck.cards.map((c) => `- ${c.front} → ${c.back}`).join("\n")}\nUse some of these words naturally in the prompts.`
    : "";

  const topicContext = topic
    ? `\nThe prompts should all relate to this topic: "${topic}".`
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
${vocabContext}${topicContext}

Each prompt must have:
- "instruction": string (the prompt written IN DANISH, telling the student what to write)
- "instructionDa": string (an English translation of the instruction, for the student to reveal if needed)
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
    return generateLocalPrompts(levelConfig, deck, topic);
  }
}

function generateLocalPrompts(
  levelConfig: LevelConfig,
  deck?: Deck | null,
  topic?: string | null,
): WritingPrompt[] {
  const contextWords = deck ? deck.cards.slice(0, 5).map((c) => c.back) : [];

  const promptsByLevel: Record<
    WritingLevel,
    Array<{ instruction: string; instructionDa: string; hints: string[] }>
  > = {
    a1: [
      {
        instruction:
          "Præsenter dig selv på dansk med dit navn og hvor du er fra.",
        instructionDa:
          "Introduce yourself in Danish with your name and where you are from.",
        hints: ["Jeg hedder...", "Jeg er fra...", "Jeg bor i..."],
      },
      {
        instruction: "Skriv en kort liste over dine yndlingsretter på dansk.",
        instructionDa: "Write a short list of your favourite foods in Danish.",
        hints: ["Jeg kan lide...", "Min favorit er...", "Jeg spiser..."],
      },
      {
        instruction:
          "Beskriv dine familiemedlemmer med korte danske sætninger.",
        instructionDa:
          "Describe your family members in short Danish sentences.",
        hints: ["Min mor hedder...", "Jeg har...", "Han/Hun er..."],
      },
    ],
    a2: [
      {
        instruction: "Skriv et kort afsnit om din daglige rutine på dansk.",
        instructionDa:
          "Write a short paragraph about your daily routine in Danish.",
        hints: ["Om morgenen...", "Derefter...", "Om aftenen..."],
      },
      {
        instruction: "Fortæl om din sidste weekend på dansk — hvad lavede du?",
        instructionDa:
          "Write about your last weekend in Danish — what did you do?",
        hints: ["I weekenden...", "Jeg gik til...", "Det var..."],
      },
      {
        instruction:
          "Beskriv dit hjem på dansk. Hvilke rum har du, og hvad er der i dem?",
        instructionDa:
          "Describe your home in Danish. What rooms do you have and what is in them?",
        hints: ["Mit hus har...", "I stuen er der...", "Køkkenet er..."],
      },
      {
        instruction:
          "Skriv om din bedste ven på dansk. Hvordan mødte I hinanden?",
        instructionDa:
          "Write about your best friend in Danish. How did you meet?",
        hints: [
          "Min bedste ven hedder...",
          "Vi mødte hinanden...",
          "Vi kan lide at...",
        ],
      },
    ],
    b1: [
      {
        instruction:
          "Skriv et brev til en ven på dansk om en tur du har taget for nylig.",
        instructionDa:
          "Write a letter to a friend in Danish about a recent trip you took.",
        hints: ["Kære...", "Jeg rejste til...", "Det mest interessante var..."],
      },
      {
        instruction:
          "Skriv et afsnit på dansk om hvorfor det er vigtigt at lære sprog.",
        instructionDa:
          "Write a paragraph in Danish about why learning languages is important.",
        hints: ["Jeg mener at...", "For det første...", "Derudover..."],
      },
      {
        instruction:
          "Beskriv et problem i dit nabolag og foreslå en løsning på dansk.",
        instructionDa:
          "Describe a problem in your neighbourhood and suggest a solution in Danish.",
        hints: [
          "Et problem i mit kvarter er...",
          "Dette påvirker...",
          "En løsning kunne være...",
        ],
      },
      {
        instruction:
          "Skriv om en dansk tradition eller kulturel begivenhed du synes er interessant.",
        instructionDa:
          "Write about a Danish tradition or cultural event you find interesting.",
        hints: [
          "En vigtig tradition er...",
          "Folk fejrer det ved at...",
          "Det er vigtigt fordi...",
        ],
      },
    ],
    b2: [
      {
        instruction:
          "Skriv et essay på dansk om fordele og ulemper ved sociale medier i det moderne danske samfund.",
        instructionDa:
          "Write an essay in Danish about the advantages and disadvantages of social media in modern Danish society.",
        hints: ["På den ene side...", "Ikke desto mindre...", "Alt i alt..."],
      },
      {
        instruction:
          "Skriv et detaljeret svar på en jobannonce på dansk. Forklar dine kvalifikationer og motivation.",
        instructionDa:
          "Write a detailed response to a job advertisement in Danish. Explain your qualifications and motivation.",
        hints: [
          "Med henvisning til...",
          "Jeg har erfaring med...",
          "Jeg ser frem til...",
        ],
      },
      {
        instruction:
          "Skriv om udfordringerne ved at integrere sig i en ny kultur, med fokus på Danmark.",
        instructionDa:
          "Write about the challenges of integrating into a new culture, focusing on Denmark.",
        hints: [
          "Integration indebærer...",
          "En af de største udfordringer...",
          "Samfundet bør...",
        ],
      },
    ],
  };

  const templates = promptsByLevel[levelConfig.value];

  return templates.map((t, i) => ({
    id: `wp-${i}`,
    level: levelConfig.value,
    instruction: t.instruction,
    instructionDa: t.instructionDa,
    contextWords: contextWords.length > 0 ? contextWords : undefined,
    hints: t.hints,
    minWords: levelConfig.minWords,
  }));
}

export async function evaluateWriting(
  prompt: WritingPrompt,
  userText: string,
  levelConfig: LevelConfig,
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
  levelConfig: LevelConfig,
): WritingEvaluation {
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = wordCount >= prompt.minWords;
  const hasDanishChars = /[æøåÆØÅ]/.test(userText);

  let score = 0;
  if (meetsMinWords) score += 40;
  else score += Math.round((wordCount / prompt.minWords) * 40);
  if (hasDanishChars) score += 20;
  if (wordCount > 0) score += 20;
  if (
    userText.includes(".") ||
    userText.includes("!") ||
    userText.includes("?")
  )
    score += 10;
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
      overall:
        "This is a basic evaluation without AI. Connect an OpenAI API key for detailed feedback.",
    },
  };
}
