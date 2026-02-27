import OpenAI from "openai";
import { Language, ChatMessage, WritingLevel } from "../types";
import { LANGUAGES } from "../constants/languages";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") return null;
  return new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true });
}

const LEVEL_INSTRUCTIONS: Record<WritingLevel, string> = {
  a1: "The student is at CEFR A1 (beginner). Use only simple, high-frequency vocabulary. Keep sentences short (5-8 words). Introduce one new word at a time. Always provide pronunciation hints for new words.",
  a2: "The student is at CEFR A2 (elementary). Use everyday vocabulary. Introduce basic past tense and common expressions. Keep explanations brief with clear examples.",
  b1: "The student is at CEFR B1 (intermediate). Use natural Danish with wider vocabulary. Include some idiomatic expressions. Challenge them with subordinate clauses and modal verbs.",
  b2: "The student is at CEFR B2 (upper-intermediate). Speak naturally with varied vocabulary. Include idioms, formal/informal register differences, and complex sentence structures. Discuss abstract topics when relevant.",
};

export function buildSystemPrompt(
  studyLang: Language,
  nativeLang: Language,
  level?: WritingLevel,
): string {
  const study = LANGUAGES.find((l) => l.value === studyLang);
  const native = LANGUAGES.find((l) => l.value === nativeLang);
  const studyName = study?.label ?? studyLang;
  const nativeName = native?.label ?? nativeLang;

  const rtlNote =
    studyLang === "ar-SA" || nativeLang === "ar-SA"
      ? " When writing Arabic text, always use the Arabic script (not romanisation)."
      : "";

  const levelNote = level ? `\n\n${LEVEL_INSTRUCTIONS[level]}` : "";

  return `You are a friendly and knowledgeable ${studyName} language tutor. \
The student's native language is ${nativeName}. Always communicate with the student \
in ${nativeName} unless they ask you to switch.${rtlNote}${levelNote}

Your role:
1. Explain words and phrases in ${studyName} clearly, including pronunciation hints where helpful.
2. Provide translations between ${studyName} and ${nativeName}.
3. Give grammar explanations with concise examples in ${studyName}.
4. Correct the student gently when they make mistakes, and explain why.
5. Suggest related vocabulary when it naturally enriches the answer.

Formatting rules:
- Keep responses concise — no wall-of-text. Use short paragraphs or bullet points.
- Always show ${studyName} words/phrases in **bold**.
- Show translations in parentheses, e.g. **hej** (hello).
- Do not use markdown headers (#, ##). Use bold for emphasis only.`;
}

export async function generateDeckCards(
  topic: string,
  level: WritingLevel,
  count: number = 12,
): Promise<{ front: string; back: string }[]> {
  const openai = getOpenAIClient();
  if (!openai) return [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a Danish language teacher. Generate flashcard word pairs for the topic "${topic}" at CEFR ${level.toUpperCase()} level. Respond ONLY with a JSON array, no markdown fences.`,
        },
        {
          role: "user",
          content: `Create exactly ${count} flashcard pairs for learning Danish "${topic}" vocabulary at ${level.toUpperCase()} level.

Each pair: { "front": "Danish word/phrase", "back": "English translation" }

Rules:
- Front is always in Danish, back is always in English.
- Include the most useful and common words for this topic at this level.
- For A1: very basic, high-frequency words only.
- For A2: everyday vocabulary with some simple phrases.
- For B1: wider vocabulary including some compound words and expressions.
- For B2: advanced vocabulary, idioms, and nuanced terms.
- Return ONLY the JSON array.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed: { front: string; back: string }[] = JSON.parse(jsonStr);
    return parsed.filter((p) => p.front && p.back);
  } catch (error) {
    console.warn("Failed to generate deck cards:", error);
    return [];
  }
}

export async function sendChatMessage(
  history: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const openai = getOpenAIClient();

  if (!openai) {
    return "OpenAI API key is not configured. Set EXPO_PUBLIC_OPENAI_KEY in your .env file to start chatting.";
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    });

    return (
      response.choices[0]?.message?.content?.trim() ??
      "Sorry, I couldn't generate a response. Please try again."
    );
  } catch (error) {
    console.warn("Chat API call failed:", error);
    return "Something went wrong. Please check your connection and try again.";
  }
}

export async function extractFlashcardFromMessage(
  messageContent: string,
  studyLang: Language,
  nativeLang: Language,
): Promise<{ front: string; back: string } | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const study = LANGUAGES.find((l) => l.value === studyLang);
  const native = LANGUAGES.find((l) => l.value === nativeLang);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract flashcard word pairs from language tutor messages. " +
            'Respond ONLY with a JSON object: { "front": string, "back": string }. ' +
            "No markdown fences.",
        },
        {
          role: "user",
          content:
            `From this tutor message, extract the single most important word or phrase ` +
            `to memorise. Front = ${study?.label} word/phrase, Back = ${native?.label} translation.\n\n` +
            `Message:\n${messageContent}`,
        },
      ],
    });

    const raw =
      response.choices[0]?.message?.content
        ?.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "") ?? "{}";

    const parsed = JSON.parse(raw);
    if (parsed.front && parsed.back) {
      return { front: parsed.front, back: parsed.back };
    }
    return null;
  } catch {
    return null;
  }
}
