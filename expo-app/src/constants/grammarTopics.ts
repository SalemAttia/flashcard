import { GrammarTopicId } from "../types";

export interface GrammarTopicConfig {
  id: GrammarTopicId;
  label: string;
  labelDa: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
  exampleSentence: string;
}

export const GRAMMAR_TOPICS: GrammarTopicConfig[] = [
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
  },
  {
    id: "definite-suffixes",
    label: "Definite Suffixes (-en/-et/-ne)",
    labelDa: "Bestemthed",
    description:
      "In Danish, the definite article is added as a suffix to the noun: hus \u2192 huset, bog \u2192 bogen, huse \u2192 husene. Practice recognizing and applying the correct endings.",
    icon: "Tag",
    color: "lime",
    questionCount: 8,
    exampleSentence: "Hund___ l\u00f8ber i parken.",
  },
  {
    id: "plural-nouns",
    label: "Plural Nouns (-er/-e/-r)",
    labelDa: "Flertalsformer",
    description:
      "Danish plurals follow different patterns: -er (biler), -e (hunde), -r (skoler), or no change (et barn \u2192 b\u00f8rn). Learn the rules and common irregular plurals.",
    icon: "Copy",
    color: "sky",
    questionCount: 8,
    exampleSentence: "Tre ___ (barn) leger udenfor.",
  },
  {
    id: "verb-tenses",
    label: "Verb Tenses",
    labelDa: "Udsagnsord",
    description:
      "Master the four main Danish tenses: present (spiser), past (spiste), perfect (har spist), and future (vil spise). Includes regular and irregular verb conjugations.",
    icon: "Clock",
    color: "violet",
    questionCount: 10,
    exampleSentence: "Jeg ___ (spise) morgenmad i g\u00e5r.",
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
  },
  {
    id: "prepositions",
    label: "Prepositions",
    labelDa: "Forholdsord",
    description:
      "Practice essential Danish prepositions: i (in), p\u00e5 (on/at), til (to), fra (from), med (with), ved (by/at), om (about). Many differ from English usage.",
    icon: "MapPin",
    color: "blue",
    questionCount: 8,
    exampleSentence: "Jeg bor ___ K\u00f8benhavn.",
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
  },
  {
    id: "adjective-agreement",
    label: "Adjective Agreement",
    labelDa: "Till\u00e6gsord",
    description:
      "Danish adjectives change form based on gender and number: en stor bil, et stort hus, de store biler. Learn the -t (neuter) and -e (definite/plural) endings.",
    icon: "Palette",
    color: "pink",
    questionCount: 8,
    exampleSentence: "Den ___ (stor) hund l\u00f8ber.",
  },
  {
    id: "comparison",
    label: "Comparison (bigger, biggest)",
    labelDa: "Komparation",
    description:
      "Form comparative and superlative adjectives: stor \u2192 st\u00f8rre \u2192 st\u00f8rst. Learn regular (-ere/-est) and irregular forms (god \u2192 bedre \u2192 bedst).",
    icon: "BarChart3",
    color: "fuchsia",
    questionCount: 8,
    exampleSentence: "Hun er ___ (god) end mig til dansk.",
  },
  {
    id: "negation",
    label: "Negation (ikke)",
    labelDa: "N\u00e6gtelse",
    description:
      "Placement of 'ikke' differs between main clauses and subordinate clauses. In main clauses: after the verb. In subordinate clauses: before the verb.",
    icon: "Ban",
    color: "red",
    questionCount: 8,
    exampleSentence: "Jeg kan ___ forst\u00e5 det.",
  },
  {
    id: "conjunctions",
    label: "Conjunctions",
    labelDa: "Bindeord",
    description:
      "Coordinating (og, men, eller, for) vs. subordinating (fordi, at, n\u00e5r, hvis, da, selvom) conjunctions. Subordinating conjunctions change word order in the clause.",
    icon: "Link",
    color: "amber",
    questionCount: 8,
    exampleSentence: "Jeg blev hjemme, ___ jeg var syg.",
  },
  {
    id: "modal-verbs",
    label: "Modal Verbs",
    labelDa: "Modalverber",
    description:
      "Master the six Danish modals: kan (can), skal (shall/must), vil (will/want), m\u00e5 (may/must), b\u00f8r (should), and t\u00f8r (dare). Each has specific usage patterns.",
    icon: "Settings",
    color: "teal",
    questionCount: 8,
    exampleSentence: "Du ___ ikke ryge her.",
  },
  {
    id: "conditionals",
    label: "Conditionals (hvis/n\u00e5r)",
    labelDa: "Betingelses\u00e6tninger",
    description:
      "Build conditional sentences with hvis (if) for uncertain conditions and n\u00e5r (when) for expected events. Includes real and unreal conditionals with correct tense pairing.",
    icon: "GitBranch",
    color: "orange",
    questionCount: 8,
    exampleSentence: "Hvis det regner, ___ jeg hjemme.",
  },
  {
    id: "passive-voice",
    label: "Passive Voice",
    labelDa: "Passiv",
    description:
      "Danish has two passive forms: s-passive (bilen s\u00e6lges) for general/habitual actions, and blive-passive (bilen bliver solgt) for specific events.",
    icon: "RefreshCw",
    color: "stone",
    questionCount: 8,
    exampleSentence: "Bogen ___ (skrive) af forfatteren.",
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
    exampleSentence: "B\u00f8rnene ___ (lege) i parken.",
  },
  {
    id: "reflexive-verbs",
    label: "Reflexive Verbs",
    labelDa: "Reflexive verber",
    description:
      "Some Danish verbs require a reflexive pronoun (sig): at vaske sig (to wash oneself), at s\u00e6tte sig (to sit down), at gl\u00e6de sig (to look forward to).",
    icon: "RotateCcw",
    color: "emerald",
    questionCount: 8,
    exampleSentence: "Han vasker ___ om morgenen.",
  },
  {
    id: "relative-clauses",
    label: "Relative Clauses (som/der)",
    labelDa: "Relativs\u00e6tninger",
    description:
      "Use 'der' when the relative pronoun is the subject, and 'som' for both subject and object. In spoken Danish, 'som' is often preferred. Practice building complex sentences.",
    icon: "Workflow",
    color: "blue",
    questionCount: 8,
    exampleSentence: "Manden, ___ bor her, er l\u00e6ge.",
  },
  {
    id: "adverbs",
    label: "Adverbs & Placement",
    labelDa: "Biord",
    description:
      "Learn common Danish adverbs (altid, aldrig, ofte, sj\u00e6ldent, allerede, stadig) and where to place them in main clauses vs. subordinate clauses.",
    icon: "Zap",
    color: "yellow",
    questionCount: 8,
    exampleSentence: "Han har ___ (altid) v\u00e6ret venlig.",
  },
  {
    id: "imperative",
    label: "Imperative (Commands)",
    labelDa: "Bydeform",
    description:
      "Form commands by using the verb stem: at spise \u2192 spis!, at komme \u2192 kom!, at s\u00e6tte \u2192 s\u00e6t! Some verbs have irregular imperative forms.",
    icon: "AlertCircle",
    color: "red",
    questionCount: 8,
    exampleSentence: "___ (s\u00e6tte) dig ned!",
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
  },
];

export function getTopicConfig(id: GrammarTopicId): GrammarTopicConfig {
  return GRAMMAR_TOPICS.find((t) => t.id === id)!;
}
