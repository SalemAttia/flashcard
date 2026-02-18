import React, { useState } from "react";
import { ChevronLeft, Plus, Trash2, Save, X, FileText, Globe } from "lucide-react";
import { Deck, Card, Language } from "../App";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface DeckEditorProps {
  deck?: Deck;
  onSave: (deck: Deck) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en-US", label: "English", flag: "🇺🇸" },
  { value: "da-DK", label: "Danish", flag: "🇩🇰" },
  { value: "ar-SA", label: "Arabic", flag: "🇸🇦" },
];

export function DeckEditor({ deck, onSave, onCancel, onDelete }: DeckEditorProps) {
  const [title, setTitle] = useState(deck?.title || "");
  const [description, setDescription] = useState(deck?.description || "");
  const [frontLang, setFrontLang] = useState<Language>(deck?.frontLang || "en-US");
  const [backLang, setBackLang] = useState<Language>(deck?.backLang || "da-DK");
  const [cards, setCards] = useState<Card[]>(deck?.cards || [{ id: "1", front: "", back: "" }]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addCard = () => {
    setCards([...cards, { id: Math.random().toString(36).substr(2, 9), front: "", back: "" }]);
  };

  const removeCard = (id: string) => {
    if (cards.length === 1) return;
    setCards(cards.filter((c) => c.id !== id));
  };

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleBulkImport = () => {
    const lines = bulkText.split("\n").filter(l => l.trim().includes(";") || l.trim().includes(","));
    if (lines.length === 0) {
      toast.error("Invalid format. Use 'Front; Back' format.");
      return;
    }

    const newCards = lines.map(line => {
      const [front, ...backParts] = line.split(/[;,]/);
      return {
        id: Math.random().toString(36).substr(2, 9),
        front: front.trim(),
        back: backParts.join(";").trim()
      };
    });

    setCards([...cards.filter(c => c.front || c.back), ...newCards]);
    setBulkText("");
    setShowBulk(false);
    toast.success(`Imported ${newCards.length} cards`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: deck?.id || "",
      title,
      description,
      frontLang,
      backLang,
      cards: cards.filter((c) => c.front.trim() && c.back.trim()),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="px-4 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-semibold">{deck ? "Edit Set" : "Create New Set"}</h2>
        <button 
          onClick={() => setShowBulk(true)}
          className="text-indigo-600 font-medium text-sm flex items-center gap-1.5"
        >
          <FileText size={16} />
          Bulk
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Set Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Arabic Vocabulary"
              className="w-full text-xl font-medium border-b-2 border-slate-100 focus:border-indigo-600 outline-none py-2 transition-colors placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Front Language</label>
              <div className="relative">
                <select 
                  value={frontLang}
                  onChange={(e) => setFrontLang(e.target.value as Language)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.flag} {l.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Back Language</label>
              <div className="relative">
                <select 
                  value={backLang}
                  onChange={(e) => setBackLang(e.target.value as Language)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.flag} {l.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pb-20">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            Cards
            <span className="text-xs font-normal text-slate-400">({cards.length})</span>
          </h3>
          
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {cards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative group"
                >
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Front ({frontLang})</span>
                      <textarea
                        required
                        dir={frontLang === "ar-SA" ? "rtl" : "ltr"}
                        value={card.front}
                        onChange={(e) => updateCard(card.id, "front", e.target.value)}
                        placeholder="Enter term..."
                        className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-300 resize-none"
                        rows={1}
                      />
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Back ({backLang})</span>
                      <textarea
                        required
                        dir={backLang === "ar-SA" ? "rtl" : "ltr"}
                        value={card.back}
                        onChange={(e) => updateCard(card.id, "back", e.target.value)}
                        placeholder="Enter translation..."
                        className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-300 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <button
              type="button"
              onClick={addCard}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all active:scale-[0.99]"
            >
              <Plus size={20} />
              Add Card
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showBulk && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Bulk Import</h3>
                <button onClick={() => setShowBulk(false)} className="p-2 text-slate-400"><X size={20} /></button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Paste your list below. Use a semicolon (;) or comma (,) to separate the front and back of each card.</p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Hello; Hej&#10;Thank you; Tak"
                className="w-full h-48 bg-slate-50 rounded-2xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-100 resize-none"
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowBulk(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
                >
                  Import Cards
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3">
        {deck && (
          <button
            type="button"
            onClick={() => onDelete(deck.id)}
            className="p-4 bg-red-50 text-red-600 rounded-2xl transition-colors hover:bg-red-100"
          >
            <Trash2 size={24} />
          </button>
        )}
        <button
          type="submit"
          onClick={handleSubmit}
          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
