import OpenAI from "openai";
import { Language, ChatMessage } from "../types";
import { LANGUAGES } from "../constants/languages";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") return null;
  return new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true });
}

export function buildSystemPrompt(
  studyLang: Language,
  nativeLang: Language
): string {
  const study = LANGUAGES.find((l) => l.value === studyLang);
  const native = LANGUAGES.find((l) => l.value === nativeLang);
  const studyName = study?.label ?? studyLang;
  const nativeName = native?.label ?? nativeLang;

  const rtlNote =
    studyLang === "ar-SA" || nativeLang === "ar-SA"
      ? " When writing Arabic text, always use the Arabic script (not romanisation)."
      : "";

  return `You are a friendly and knowledgeable ${studyName} language tutor. \
The student's native language is ${nativeName}. Always communicate with the student \
in ${nativeName} unless they ask you to switch.${rtlNote}

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

export async function sendChatMessage(
  history: ChatMessage[],
  systemPrompt: string
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
  nativeLang: Language
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
            'You extract flashcard word pairs from language tutor messages. ' +
            'Respond ONLY with a JSON object: { "front": string, "back": string }. ' +
            'No markdown fences.',
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
