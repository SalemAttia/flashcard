import { GrammarTopicId, WritingLevel } from "../types";

export interface GrammarTopicConfig {
  id: GrammarTopicId;
  label: string;
  labelDa: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
  exampleSentence: string;
  /** CEFR levels this topic is appropriate for (introduced at the first listed level). */
  levels: WritingLevel[];
}

export const GRAMMAR_TOPICS: GrammarTopicConfig[] = [
  // --- A1 topics (introduced at beginner) ---
  {
    id: "articles",
    label: "Articles (en/et/den/det)",
    labelDa: "Kendeord",
    description:
      "Danish nouns have two genders: common (en) and neuter (et). Learn when to use en/et for indefinite and den/det for definite articles with adjectives.",
    icon: "FileText",
    color: "emerald",
    questionCount: 8,
    exampleSentence: "___ hus er stort.",
    levels: ["a1", "a2", "b1", "b2"],
  },
  {
    id: "definite-suffixes",
    label: "Definite Suffixes (-en/-et/-ne)",
    labelDa: "Bestemthed",
    description:
      "In Danish, the definite article is added as a suffix to the noun: hus → huset, bog → bogen, huse → husene. Practice recognizing and applying the correct endings.",
    icon: "Tag",
    color: "lime",
    questionCount: 8,
    exampleSentence: "Hund___ løber i parken.",
    levels: ["a1", "a2", "b1", "b2"],
  },
  {
    id: "plural-nouns",
    label: "Plural Nouns (-er/-e/-r)",
    labelDa: "Flertalsformer",
    description:
      "Danish plurals follow different patterns: -er (biler), -e (hunde), -r (skoler), or no change (et barn → børn). Learn the rules and common irregular plurals.",
    icon: "Copy",
    color: "sky",
    questionCount: 8,
    exampleSentence: "Tre ___ (barn) leger udenfor.",
    levels: ["a1", "a2", "b1", "b2"],
  },
  {
    id: "pronouns",
    label: "Pronouns",
    labelDa: "Stedord",
    description:
      "Cover personal pronouns (jeg/mig, du/dig, han/ham, hun/hende), possessive pronouns (min/mit/mine, din/dit/dine), and reflexive pronouns (sig).",
    icon: "User",
    color: "indigo",
    questionCount: 8,
    exampleSentence: "___ hedder Anna.",
    levels: ["a1", "a2", "b1", "b2"],
  },
  {
    id: "negation",
    label: "Negation (ikke)",
    labelDa: "Nægtelse",
    description:
      "Placement of 'ikke' differs between main clauses and subordinate clauses. In main clauses: after the verb. In subordinate clauses: before the verb.",
    icon: "Ban",
    color: "red",
    questionCount: 8,
    exampleSentence: "Jeg kan ___ forstå det.",
    levels: ["a1", "a2", "b1", "b2"],
  },
  {
    id: "imperative",
    label: "Imperative (Commands)",
    labelDa: "Bydeform",
    description:
      "Form commands by using the verb stem: at spise → spis!, at komme → kom!, at sætte → sæt! Some verbs have irregular imperative forms.",
    icon: "AlertCircle",
    color: "red",
    questionCount: 8,
    exampleSentence: "___ (sætte) dig ned!",
    levels: ["a1", "a2", "b1", "b2"],
  },

  // --- A2 topics (introduced at elementary) ---
  {
    id: "verb-tenses",
    label: "Verb Tenses",
    labelDa: "Udsagnsord",
    description:
      "Master the four main Danish tenses: present (spiser), past (spiste), perfect (har spist), and future (vil spise). Includes regular and irregular verb conjugations.",
    icon: "Clock",
    color: "violet",
    questionCount: 10,
    exampleSentence: "Jeg ___ (spise) morgenmad i går.",
    levels: ["a2", "b1", "b2"],
  },
  {
    id: "word-order",
    label: "Word Order (V2 Rule)",
    labelDa: "Ordstilling",
    description:
      "Danish uses the V2 rule: the verb must always be in the second position in main clauses. When a sentence starts with anything other than the subject, the subject and verb invert.",
    icon: "ArrowRightLeft",
    color: "cyan",
    questionCount: 8,
    exampleSentence: "I morgen ___ jeg til skole.",
    levels: ["a2", "b1", "b2"],
  },
  {
    id: "prepositions",
    label: "Prepositions",
    labelDa: "Forholdsord",
    description:
      "Practice essential Danish prepositions: i (in), på (on/at), til (to), fra (from), med (with), ved (by/at), om (about). Many differ from English usage.",
    icon: "MapPin",
    color: "blue",
    questionCount: 8,
    exampleSentence: "Jeg bor ___ København.",
    levels: ["a2", "b1", "b2"],
  },
  {
    id: "adjective-agreement",
    label: "Adjective Agreement",
    labelDa: "Tillægsord",
    description:
      "Danish adjectives change form based on gender and number: en stor bil, et stort hus, de store biler. Learn the -t (neuter) and -e (definite/plural) endings.",
    icon: "Palette",
    color: "pink",
    questionCount: 8,
    exampleSentence: "Den ___ (stor) hund løber.",
    levels: ["a2", "b1", "b2"],
  },
  {
    id: "conjunctions",
    label: "Conjunctions",
    labelDa: "Bindeord",
    description:
      "Coordinating (og, men, eller, for) vs. subordinating (fordi, at, når, hvis, da, selvom) conjunctions. Subordinating conjunctions change word order in the clause.",
    icon: "Link",
    color: "amber",
    questionCount: 8,
    exampleSentence: "Jeg blev hjemme, ___ jeg var syg.",
    levels: ["a2", "b1", "b2"],
  },
  {
    id: "genitive",
    label: "Genitive (Possession)",
    labelDa: "Ejefald",
    description:
      "Danish adds -s to show possession (like English): Peters bil, hundens mad, landets historie. No apostrophe is used. Practice with names, nouns, and pronouns.",
    icon: "Key",
    color: "violet",
    questionCount: 8,
    exampleSentence: "Det er ___ (Peter) cykel.",
    levels: ["a2", "b1", "b2"],
  },

  // --- B1 topics (introduced at intermediate) ---
  {
    id: "modal-verbs",
    label: "Modal Verbs",
    labelDa: "Modalverber",
    description:
      "Master the six Danish modals: kan (can), skal (shall/must), vil (will/want), må (may/must), bør (should), and tør (dare). Each has specific usage patterns.",
    icon: "Settings",
    color: "teal",
    questionCount: 8,
    exampleSentence: "Du ___ ikke ryge her.",
    levels: ["b1", "b2"],
  },
  {
    id: "comparison",
    label: "Comparison (bigger, biggest)",
    labelDa: "Komparation",
    description:
      "Form comparative and superlative adjectives: stor → større → størst. Learn regular (-ere/-est) and irregular forms (god → bedre → bedst).",
    icon: "BarChart3",
    color: "fuchsia",
    questionCount: 8,
    exampleSentence: "Hun er ___ (god) end mig til dansk.",
    levels: ["b1", "b2"],
  },
  {
    id: "adverbs",
    label: "Adverbs & Placement",
    labelDa: "Biord",
    description:
      "Learn common Danish adverbs (altid, aldrig, ofte, sjældent, allerede, stadig) and where to place them in main clauses vs. subordinate clauses.",
    icon: "Zap",
    color: "yellow",
    questionCount: 8,
    exampleSentence: "Han har ___ (altid) været venlig.",
    levels: ["b1", "b2"],
  },
  {
    id: "reflexive-verbs",
    label: "Reflexive Verbs",
    labelDa: "Reflexive verber",
    description:
      "Some Danish verbs require a reflexive pronoun (sig): at vaske sig (to wash oneself), at sætte sig (to sit down), at glæde sig (to look forward to).",
    icon: "RotateCcw",
    color: "emerald",
    questionCount: 8,
    exampleSentence: "Han vasker ___ om morgenen.",
    levels: ["b1", "b2"],
  },
  {
    id: "subject-verb-agreement",
    label: "Subject-Verb Agreement",
    labelDa: "Subjekt-verbal kongruens",
    description:
      "Unlike English, Danish verbs do not change with person or number (jeg spiser, du spiser, vi spiser). Practice identifying correct verb forms in different structures.",
    icon: "CheckSquare",
    color: "rose",
    questionCount: 8,
    exampleSentence: "Børnene ___ (lege) i parken.",
    levels: ["b1", "b2"],
  },
  {
    id: "conditionals",
    label: "Conditionals (hvis/når)",
    labelDa: "Betingelsessætninger",
    description:
      "Build conditional sentences with hvis (if) for uncertain conditions and når (when) for expected events. Includes real and unreal conditionals with correct tense pairing.",
    icon: "GitBranch",
    color: "orange",
    questionCount: 8,
    exampleSentence: "Hvis det regner, ___ jeg hjemme.",
    levels: ["b1", "b2"],
  },

  // --- B2 topics (introduced at upper-intermediate) ---
  {
    id: "passive-voice",
    label: "Passive Voice",
    labelDa: "Passiv",
    description:
      "Danish has two passive forms: s-passive (bilen sælges) for general/habitual actions, and blive-passive (bilen bliver solgt) for specific events.",
    icon: "RefreshCw",
    color: "stone",
    questionCount: 8,
    exampleSentence: "Bogen ___ (skrive) af forfatteren.",
    levels: ["b2"],
  },
  {
    id: "relative-clauses",
    label: "Relative Clauses (som/der)",
    labelDa: "Relativsætninger",
    description:
      "Use 'der' when the relative pronoun is the subject, and 'som' for both subject and object. In spoken Danish, 'som' is often preferred. Practice building complex sentences.",
    icon: "Workflow",
    color: "blue",
    questionCount: 8,
    exampleSentence: "Manden, ___ bor her, er læge.",
    levels: ["b2"],
  },
];

export function getTopicConfig(id: GrammarTopicId): GrammarTopicConfig {
  return GRAMMAR_TOPICS.find((t) => t.id === id)!;
}

/** Get the intro level for a topic (the first level in its levels array). */
export function getTopicIntroLevel(topic: GrammarTopicConfig): WritingLevel {
  return topic.levels[0];
}
