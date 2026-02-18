import React, { useState } from "react";
import { X, Check, RotateCcw, Volume2 } from "lucide-react";
import { Deck, Card as CardType, Language } from "../App";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";

interface StudySessionProps {
  deck: Deck;
  onComplete: (correct: number, total: number) => void;
  onCancel: () => void;
}

export function StudySession({ deck, onComplete, onCancel }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const currentCard = deck.cards[currentIndex];
  const progress = (currentIndex / deck.cards.length) * 100;

  const handleSpeak = (text: string, lang: Language) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const handleSwipe = (correct: boolean) => {
    const newResults = [...results, { id: currentCard.id, correct }];
    setResults(newResults);
    setIsFlipped(false);
    setDirection(correct ? 1 : -1);

    setTimeout(() => {
      if (currentIndex + 1 < deck.cards.length) {
        setCurrentIndex(currentIndex + 1);
        setDirection(0);
      } else {
        const correctCount = newResults.filter((r) => r.correct).length;
        onComplete(correctCount, deck.cards.length);
      }
    }, 200);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50">
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Studying</span>
          <span className="font-semibold text-sm truncate max-w-[200px]">{deck.title}</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4 bg-white">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Progress</span>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">{currentIndex + 1} / {deck.cards.length}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden min-h-[400px]">
        <div className="w-full max-w-sm h-full flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <Flashcard
              key={currentCard.id}
              card={currentCard}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              direction={direction}
              frontLang={deck.frontLang}
              backLang={deck.backLang}
              onSpeak={handleSpeak}
            />
          </AnimatePresence>
        </div>
      </div>

      <footer className="p-8 grid grid-cols-2 gap-4 bg-white border-t border-slate-100 mt-auto">
        <button
          onClick={() => handleSwipe(false)}
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-red-50 text-red-600 font-semibold transition-all active:scale-95 border border-red-100"
        >
          <X size={28} />
          <span className="text-xs uppercase tracking-widest">Incorrect</span>
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-green-50 text-green-600 font-semibold transition-all active:scale-95 border border-green-100"
        >
          <Check size={28} />
          <span className="text-xs uppercase tracking-widest">Correct</span>
        </button>
      </footer>
    </div>
  );
}

function Flashcard({ 
  card, 
  isFlipped, 
  setIsFlipped, 
  direction,
  frontLang,
  backLang,
  onSpeak
}: { 
  card: CardType; 
  isFlipped: boolean; 
  setIsFlipped: (f: boolean) => void;
  direction: number;
  frontLang: Language;
  backLang: Language;
  onSpeak: (text: string, lang: Language) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleSpeakClick = (e: React.MouseEvent, text: string, lang: Language) => {
    e.stopPropagation();
    onSpeak(text, lang);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        x: direction === 1 ? 500 : direction === -1 ? -500 : 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5,
        x: direction === 1 ? 500 : direction === -1 ? -500 : 0
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative w-full aspect-[3/4] max-h-[450px] perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-100 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-200/50">
          <div className="absolute top-6 left-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Term ({frontLang})</div>
          <button 
            onClick={(e) => handleSpeakClick(e, card.front, frontLang)}
            className="absolute top-6 right-6 p-2 text-indigo-400 hover:text-indigo-600 transition-colors bg-indigo-50 rounded-full"
          >
            <Volume2 size={20} />
          </button>
          <h2 
            dir={frontLang === "ar-SA" ? "rtl" : "ltr"}
            className="text-2xl font-medium text-slate-800 leading-relaxed"
          >
            {card.front}
          </h2>
          <div className="absolute bottom-8 text-slate-300 text-xs font-medium flex items-center gap-2">
            <RotateCcw size={12} />
            Tap to flip
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-indigo-600 border-2 border-indigo-500 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-200/50"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="absolute top-6 left-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Definition ({backLang})</div>
          <button 
            onClick={(e) => handleSpeakClick(e, card.back, backLang)}
            className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors bg-white/10 rounded-full"
          >
            <Volume2 size={20} />
          </button>
          <p 
            dir={backLang === "ar-SA" ? "rtl" : "ltr"}
            className="text-xl font-medium text-white leading-relaxed"
          >
            {card.back}
          </p>
          <div className="absolute bottom-8 text-indigo-200/60 text-xs font-medium flex items-center gap-2">
            <RotateCcw size={12} />
            Tap to flip back
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
