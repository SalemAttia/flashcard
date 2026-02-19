import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, Layout, Settings, Play, Check, X, RotateCcw, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import { DeckList } from "./components/DeckList";
import { DeckEditor } from "./components/DeckEditor";
import { StudySession } from "./components/StudySession";
import { TestMode } from "./components/TestMode";
import { Summary } from "./components/Summary";
import "../styles/flashcards.css";

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

export type View = "home" | "editor" | "study" | "test" | "summary";

const INITIAL_DECKS: Deck[] = [
  {
    id: "1",
    title: "Basic Phrases",
    description: "Multi-language starter set.",
    frontLang: "en-US",
    backLang: "da-DK",
    cards: [
      { id: "s1", front: "Hello", back: "Hej" },
      { id: "s2", front: "Thank you", back: "Tak" },
      { id: "s3", front: "Good morning", back: "Godmorgen" },
      { id: "s4", front: "Goodbye", back: "Farvel" },
    ],
    lastStudied: new Date().toISOString(),
  },
];

export default function App() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem("mindset_decks");
    return saved ? JSON.parse(saved) : INITIAL_DECKS;
  });
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<{ correct: number; total: number; isTest?: boolean } | null>(null);

  useEffect(() => {
    localStorage.setItem("mindset_decks", JSON.stringify(decks));
  }, [decks]);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  const handleCreateDeck = () => {
    setSelectedDeckId(null);
    setCurrentView("editor");
  };

  const handleEditDeck = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    setCurrentView("editor");
  };

  const handleStartStudy = (deck: Deck) => {
    if (deck.cards.length === 0) {
      toast.error("Add some cards to this deck first!");
      return;
    }
    setSelectedDeckId(deck.id);
    setCurrentView("study");
  };

  const handleStartTest = (deck: Deck) => {
    if (deck.cards.length < 2) {
      toast.error("You need at least 2 cards for a test!");
      return;
    }
    setSelectedDeckId(deck.id);
    setCurrentView("test");
  };

  const handleSaveDeck = (deckData: Deck) => {
    if (selectedDeckId) {
      setDecks(decks.map((d) => (d.id === selectedDeckId ? deckData : d)));
      toast.success("Deck updated successfully");
    } else {
      setDecks([...decks, { ...deckData, id: Math.random().toString(36).substr(2, 9) }]);
      toast.success("New deck created");
    }
    setCurrentView("home");
  };

  const handleDeleteDeck = (id: string) => {
    setDecks(decks.filter((d) => d.id !== id));
    setCurrentView("home");
    toast.success("Deck deleted");
  };

  const handleSessionComplete = (correct: number, total: number, isTest = false) => {
    setSessionResults({ correct, total, isTest });
    setCurrentView("summary");
    
    if (selectedDeckId) {
      setDecks(decks.map(d => 
        d.id === selectedDeckId 
          ? { ...d, lastStudied: new Date().toISOString() } 
          : d
      ));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden bg-white shadow-sm">
        <Toaster position="top-center" />
        
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <header className="p-6 pb-2">
                <h1 className="text-2xl font-semibold tracking-tight">Decks</h1>
                <p className="text-slate-500 text-sm mt-1">Master your learning, card by card.</p>
              </header>
              
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <DeckList 
                  decks={decks} 
                  onEdit={handleEditDeck} 
                  onStudy={handleStartStudy} 
                  onTest={handleStartTest}
                />
              </div>

              <div className="p-6 sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <button
                  onClick={handleCreateDeck}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus size={20} />
                  New Study Set
                </button>
              </div>
            </motion.div>
          )}

          {currentView === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1"
            >
              <DeckEditor
                deck={selectedDeck}
                onSave={handleSaveDeck}
                onCancel={() => setCurrentView("home")}
                onDelete={handleDeleteDeck}
              />
            </motion.div>
          )}

          {currentView === "study" && selectedDeck && (
            <motion.div
              key="study"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col"
            >
              <StudySession
                deck={selectedDeck}
                onComplete={handleSessionComplete}
                onCancel={() => setCurrentView("home")}
              />
            </motion.div>
          )}

          {currentView === "test" && selectedDeck && (
            <motion.div
              key="test"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col"
            >
              <TestMode
                deck={selectedDeck}
                onComplete={(correct, total) => handleSessionComplete(correct, total, true)}
                onCancel={() => setCurrentView("home")}
              />
            </motion.div>
          )}

          {currentView === "summary" && sessionResults && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1"
            >
              <Summary
                results={sessionResults}
                deckTitle={selectedDeck?.title || ""}
                onHome={() => setCurrentView("home")}
                onRetry={() => setCurrentView(sessionResults.isTest ? "test" : "study")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
