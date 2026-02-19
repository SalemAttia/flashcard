import React from "react";
import { CheckCircle2, RotateCcw, Home, Award, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface SummaryProps {
  results: { correct: number; total: number };
  deckTitle: string;
  onHome: () => void;
  onRetry: () => void;
}

export function Summary({ results, deckTitle, onHome, onRetry }: SummaryProps) {
  const percentage = Math.round((results.correct / results.total) * 100);
  
  return (
    <div className="flex-1 flex flex-col h-screen bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500"
        >
          <Award size={48} />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
          <p className="text-slate-500">You've finished studying <span className="font-semibold text-indigo-600">{deckTitle}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</span>
            <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
          </div>
          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correct</span>
            <span className="text-2xl font-bold text-slate-800">{results.correct}/{results.total}</span>
          </div>
        </div>

        <div className="w-full max-w-sm p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-tight">Next Step</p>
            <p className="text-sm font-medium text-indigo-800">Review your incorrect cards later today.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <button
          onClick={onRetry}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
        >
          <RotateCcw size={20} />
          Study Again
        </button>
        <button
          onClick={onHome}
          className="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors active:scale-[0.98]"
        >
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
