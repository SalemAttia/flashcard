export type Card = {
  id: string;
  front: string;
  back: string;
};

export type Language = "en-US" | "da-DK" | "ar-SA";

export type Deck = {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  frontLang: Language;
  backLang: Language;
  lastStudied?: string;
};
