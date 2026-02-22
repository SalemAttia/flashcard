import OpenAI from "openai";
import { GrammarQuestion, GrammarTopicId } from "../types";
import { GrammarTopicConfig } from "../constants/grammarTopics";

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_KEY || OPENAI_KEY === "your-api-key-here") return null;
  return new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true });
}

export async function generateGrammarQuestions(
  topicConfig: GrammarTopicConfig | null,
  options?: { customTopic?: string; questionCount?: number },
): Promise<GrammarQuestion[]> {
  const openai = getOpenAIClient();
  const topicLabel =
    options?.customTopic || topicConfig?.label || "General Danish Grammar";
  const topicLabelDa = topicConfig?.labelDa || topicLabel;
  const count = options?.questionCount || topicConfig?.questionCount || 10;
  const topicId = topicConfig?.id || ("custom" as GrammarTopicId);

  if (!openai) {
    if (topicConfig) {
      return generateLocalGrammarQuestions(topicConfig, count);
    }
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a Danish grammar teacher creating exercises for the topic: "${topicLabel}" (${topicLabelDa}). Respond ONLY with a JSON array, no markdown fences.`,
        },
        {
          role: "user",
          content: `Create exactly ${count} Danish grammar questions on the topic "${topicLabel}".

Mix of types: roughly 70% multiple-choice and 30% fill-in-the-blank.

For each question, return a JSON object:
{
  "type": "multiple-choice" | "fill-in-the-blank",
  "sentence": "The sentence. Use '___' for blanks in fill-in-the-blank questions. For multiple-choice, write the full question.",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "the correct option (must be one of options)",
  "explanation": "Brief explanation in English of why this is correct, mentioning the grammar rule."
}

Rules:
- Sentences should be in Danish.
- Explanations should be in English (the student is learning Danish).
- Options should be plausible distractors.
- Vary difficulty from easy to moderate.
- Return ONLY the JSON array.
- IMPORTANT: Every question MUST have exactly 4 items in the "options" array. Never return a question without options, for both multiple-choice and fill-in-the-blank types.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed: Omit<GrammarQuestion, "id" | "topicId">[] =
      JSON.parse(jsonStr);

    const valid = parsed.filter(
      (q) =>
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctAnswer === "string" &&
        q.correctAnswer.length > 0 &&
        typeof q.sentence === "string",
    );

    if (valid.length === 0) throw new Error("No valid questions in response");

    return valid.map((q, i) => ({
      ...q,
      id: `gq-${i}`,
      topicId: topicId,
    }));
  } catch (error) {
    console.warn(
      "AI grammar question generation failed, using local fallback:",
      error,
    );
    if (topicConfig) {
      return generateLocalGrammarQuestions(topicConfig, count);
    }
    return [];
  }
}

export async function generateGrammarExplanation(
  topicLabel: string,
  topicLabelDa?: string,
): Promise<string> {
  const openai = getOpenAIClient();

  if (!openai) {
    return `**${topicLabel}**\n\nConnect an OpenAI API key to get an AI-generated grammar refresher for this topic.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly Danish grammar teacher. Explain grammar concepts clearly and concisely for language learners. Use simple English with Danish examples. Format with markdown (bold, bullet points).",
        },
        {
          role: "user",
          content: `Give me a short grammar refresher on the Danish topic: "${topicLabel}"${topicLabelDa ? ` (${topicLabelDa})` : ""}.

Include:
1. A brief explanation of the rule (2-3 sentences)
2. The key patterns or forms to remember (use a table or list)
3. 3-4 example sentences in Danish with English translations
4. 1-2 common mistakes to avoid

Keep it concise — this is a quick refresher, not a full lesson.`,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "No explanation available."
    );
  } catch (error) {
    console.warn("AI grammar explanation failed:", error);
    return `**${topicLabel}**\n\nFailed to generate explanation. Please check your internet connection and try again.`;
  }
}

function generateLocalGrammarQuestions(
  topicConfig: GrammarTopicConfig,
  count: number,
): GrammarQuestion[] {
  const fallbacks: Partial<
    Record<GrammarTopicId, Omit<GrammarQuestion, "id" | "topicId">[]>
  > = {
    articles: [
      {
        type: "multiple-choice",
        sentence: "___ hund er stor.",
        options: ["En", "Et", "Den", "Det"],
        correctAnswer: "Den",
        explanation:
          '"Hund" is a common gender (en) noun. When using the definite form with an adjective, we use "den" for common gender nouns.',
      },
      {
        type: "multiple-choice",
        sentence: "Jeg har ___ bil.",
        options: ["en", "et", "den", "det"],
        correctAnswer: "en",
        explanation:
          '"Bil" is a common gender noun, so it takes the indefinite article "en".',
      },
      {
        type: "fill-in-the-blank",
        sentence: "___ barn leger i parken.",
        options: ["Et", "En", "Det", "Den"],
        correctAnswer: "Et",
        explanation:
          '"Barn" is a neuter gender (et) noun, so it takes the indefinite article "et".',
      },
      {
        type: "multiple-choice",
        sentence: "Har du set ___ nye hus?",
        options: ["den", "det", "en", "et"],
        correctAnswer: "det",
        explanation:
          '"Hus" is a neuter gender (et) noun. When using the definite form with an adjective, we use "det" for neuter nouns.',
      },
      {
        type: "fill-in-the-blank",
        sentence: "Hun køber ___ bog.",
        options: ["en", "et", "den", "det"],
        correctAnswer: "en",
        explanation:
          '"Bog" is a common gender noun, so it takes the indefinite article "en".',
      },
    ],
    "verb-tenses": [
      {
        type: "multiple-choice",
        sentence: "Jeg ___ dansk hver dag.",
        options: ["læser", "læste", "har læst", "vil læse"],
        correctAnswer: "læser",
        explanation:
          '"Hver dag" (every day) indicates a habitual action, which requires the present tense "læser".',
      },
      {
        type: "fill-in-the-blank",
        sentence: "I går ___ vi til stranden.",
        options: ["går", "gik", "har gået", "vil gå"],
        correctAnswer: "gik",
        explanation:
          '"I går" (yesterday) indicates past tense. The past tense of "gå" is "gik".',
      },
      {
        type: "multiple-choice",
        sentence: "Hun ___ allerede morgenmad.",
        options: ["spiser", "spiste", "har spist", "vil spise"],
        correctAnswer: "har spist",
        explanation:
          '"Allerede" (already) often signals the perfect tense "har spist" (has eaten).',
      },
      {
        type: "multiple-choice",
        sentence: "I morgen ___ jeg til København.",
        options: ["rejser", "rejste", "har rejst", "vil rejse"],
        correctAnswer: "vil rejse",
        explanation:
          '"I morgen" (tomorrow) indicates future. Danish uses "vil" + infinitive for future plans.',
      },
      {
        type: "fill-in-the-blank",
        sentence: "De ___ (bo) i Danmark i fem år.",
        options: ["bor", "boede", "har boet", "vil bo"],
        correctAnswer: "har boet",
        explanation:
          '"I fem år" (for five years) with a continuing relevance to the present uses the perfect tense "har boet".',
      },
    ],
    prepositions: [
      {
        type: "multiple-choice",
        sentence: "Jeg bor ___ København.",
        options: ["i", "på", "til", "fra"],
        correctAnswer: "i",
        explanation:
          'We use "i" for cities and countries: "Jeg bor i København" (I live in Copenhagen).',
      },
      {
        type: "fill-in-the-blank",
        sentence: "Bogen ligger ___ bordet.",
        options: ["på", "i", "til", "ved"],
        correctAnswer: "på",
        explanation:
          '"På" is used for surfaces. The book is on the table: "på bordet".',
      },
      {
        type: "multiple-choice",
        sentence: "Vi går ___ skole kl. 8.",
        options: ["i", "til", "på", "fra"],
        correctAnswer: "i",
        explanation:
          'Danish uses "i skole" (to/in school) as a fixed expression.',
      },
      {
        type: "fill-in-the-blank",
        sentence: "Hun kommer ___ Sverige.",
        options: ["fra", "i", "til", "på"],
        correctAnswer: "fra",
        explanation:
          '"Fra" means "from". She comes from Sweden: "fra Sverige".',
      },
    ],
    "word-order": [
      {
        type: "multiple-choice",
        sentence: 'Which is the correct word order? "I morgen..."',
        options: [
          "I morgen jeg går til skole.",
          "I morgen går jeg til skole.",
          "I morgen til skole går jeg.",
          "I morgen skole jeg går til.",
        ],
        correctAnswer: "I morgen går jeg til skole.",
        explanation:
          'Danish follows the V2 rule: the verb must be in the second position. When the sentence starts with an adverb ("I morgen"), the verb comes next, then the subject.',
      },
      {
        type: "multiple-choice",
        sentence: "Which is correct?",
        options: [
          "Jeg ikke kan forstå det.",
          "Jeg kan ikke forstå det.",
          "Ikke jeg kan forstå det.",
          "Kan jeg ikke forstå det.",
        ],
        correctAnswer: "Jeg kan ikke forstå det.",
        explanation:
          'In main clauses, "ikke" comes after the finite verb: subject + verb + ikke.',
      },
      {
        type: "fill-in-the-blank",
        sentence: "Derefter ___ hun hjem.",
        options: ["gik", "hun gik", "gik hun", "hun"],
        correctAnswer: "gik",
        explanation:
          'After an adverb like "derefter" (afterwards), the V2 rule places the verb directly after, then the subject: "Derefter gik hun hjem."',
      },
    ],
  };

  const pool = fallbacks[topicConfig.id] || fallbacks.articles || [];

  if (pool.length === 0) {
    console.warn(`No local fallback questions available.`);
    return [];
  }

  if (!fallbacks[topicConfig.id]) {
    console.warn(
      `No local fallback for topic "${topicConfig.id}". Using articles fallback.`,
    );
  }

  // Cycle through available questions to fill the requested count
  const result: GrammarQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const q = pool[i % pool.length];
    result.push({
      ...q,
      id: `gq-${i}`,
      topicId: topicConfig.id,
    });
  }
  return result;
}

export async function generateGrammarTopicTitle(
  rawDescription: string,
): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    return rawDescription
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 30,
      messages: [
        {
          role: "system",
          content:
            "You are a Danish grammar expert. Given a learner's description of a grammar concept, return ONLY a concise English title for that grammar topic. Format: [Category]: [Specifics] or a short noun phrase. Max 8 words. No quotes, no punctuation at end.",
        },
        { role: "user", content: rawDescription },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || rawDescription;
  } catch {
    return rawDescription;
  }
}
