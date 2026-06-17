import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Prompt } from '../types';

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promptData: {
    id: string;
    title: string;
    model: string;
    category: string;
    tags: string[];
    description: string;
    content: string;
  }) => void;
  prompt: Prompt | null;
  availableModels: string[];
  availableCategories: string[];
}

export const EditPromptModal: React.FC<EditPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  availableModels,
  availableCategories,
}) => {
  const [title, setTitle] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // Pre-populate modal fields when 'prompt' becomes active
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title || '');
      setModel(prompt.model || availableModels[0] || 'GPT');
      setCategory(prompt.category || availableCategories[0] || 'Programování');
      setTagInput(prompt.tags ? prompt.tags.join(', ') : '');
      setDescription(prompt.description || '');
      setContent(prompt.content || '');
      setError('');
    }
  }, [prompt, availableModels, availableCategories]);

  if (!isOpen || !prompt) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Název promptu je povinný.');
      return;
    }
    if (!description.trim()) {
      setError('Popis promptu je povinný.');
      return;
    }
    if (!content.trim()) {
      setError('Text / instrukce promptu jsou povinné.');
      return;
    }

    const cleanTags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onSubmit({
      id: prompt.id,
      title: title.trim(),
      model,
      category,
      tags: cleanTags,
      description: description.trim(),
      content: content.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Container */}
      <div 
        id="user-edit-modal"
        className="relative w-full max-w-lg bg-white dark:bg-[#0d0920] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-zinc-100 transform transition-all text-xs"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider">
            Upravit můj prompt
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
            Po uložení změn bude váš prompt odeslán ke schválení administrátorem. Do schválení zůstane viditelný pro vás, ale ostatní uvidí původní verzi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={15} />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Název promptu */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Název promptu *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Generátor tiskových zpráv..."
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* AI Model */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
                AI Model *
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] font-bold"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategorie */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
                Kategorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] font-bold"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tagy */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Klíčová slova / Tagy (oddělené čárkou)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Např. marketing, text, seo"
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] font-bold"
            />
          </div>

          {/* Stručný popis */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Stručný popis *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vysvětlete stručně, co prompt dělá..."
              className="w-full bg-slate-50 dark:bg-[#0e0c20] border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] font-semibold h-16 resize-none"
              required
            />
          </div>

          {/* Text / Instrukce promptu */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Samotný prompt / Instrukce pro AI *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Zde vložte kompletní instrukce pro model..."
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#8b5cf6] h-32"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white py-2.5 rounded-xl font-extrabold uppercase tracking-wide cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#8b5cf6]/20"
          >
            Uložit změny a poslat ke schválení
          </button>
        </form>
      </div>
    </div>
  );
};
