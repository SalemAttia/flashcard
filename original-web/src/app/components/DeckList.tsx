import React from "react";
import { Play, Edit2, Calendar, Layout, ClipboardCheck } from "lucide-react";
import { Deck } from "../App";
import { motion } from "motion/react";

interface DeckListProps {
  decks: Deck[];
  onEdit: (deck: Deck) => void;
  onStudy: (deck: Deck) => void;
  onTest: (deck: Deck) => void;
}

export function DeckList({ decks, onEdit, onStudy, onTest }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <Layout size={32} />
        </div>
        <p className="text-center">No decks yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {decks.map((deck, idx) => (
        <motion.div
          key={deck.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 transition-colors shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 leading-snug">{deck.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-1 mt-0.5">{deck.description || "No description"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
              <Layout size={14} />
              {deck.cards.length} Cards
            </div>
            {deck.lastStudied && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <Calendar size={14} />
                Recent
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => onStudy(deck)}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <Play size={16} fill="currentColor" />
              Study
            </button>
            <button
              onClick={() => onTest(deck)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <ClipboardCheck size={16} />
              Test
            </button>
            <button
              onClick={() => onEdit(deck)}
              className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center transition-colors active:scale-[0.98]"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
