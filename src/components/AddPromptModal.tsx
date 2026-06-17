import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promptData: {
    title: string;
    author: string;
    model: string;
    category: string;
    section: string;
    tags: string[];
    description: string;
    content: string;
  }) => void;
  availableModels: string[];
  availableCategories: string[];
  availableSections?: string[];
}

export const AddPromptModal: React.FC<AddPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableModels,
  availableCategories,
  availableSections = ['Příběhy', 'Osobnosti', 'Exploity', 'Ostatní'],
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [model, setModel] = useState(availableModels[0] || 'GPT');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');

  const [category, setCategory] = useState(availableCategories[0] || 'Programování');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const [section, setSection] = useState(availableSections[0] || 'Ostatní');
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSectionText, setCustomSectionText] = useState('');

  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Název promptu je povinný.');
      return;
    }
    if (!description.trim()) {
      setError('Krátký popis je povinný.');
      return;
    }
    if (!content.trim()) {
      setError('Samotný prompt je povinný.');
      return;
    }

    const finalModel = isCustomModel ? customModelText.trim() : model;
    if (isCustomModel && !finalModel) {
      setError('Vyplňte prosím název nového AI modelu.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryText.trim() : category;
    if (isCustomCategory && !finalCategory) {
      setError('Vyplňte prosím název nové kategorie.');
      return;
    }

    const finalSection = isCustomSection ? customSectionText.trim() : section;
    if (isCustomSection && !finalSection) {
      setError('Vyplňte prosím název nové sekce.');
      return;
    }

    // Rozparsujeme tagy podle čárek nebo mezer a vyčistíme prázdné
    const tags = tagsInput
      .split(/[, ]+/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter((tag) => tag.length > 0);

    onSubmit({
      title: title.trim(),
      author: author.trim() || 'Anonymní uživatel',
      model: finalModel,
      category: finalCategory,
      section: finalSection,
      tags,
      description: description.trim(),
      content: content.trim(),
    });

    // Reset formuláře
    setTitle('');
    setAuthor('');
    setModel(availableModels[0] || 'GPT');
    setIsCustomModel(false);
    setCustomModelText('');
    setCategory(availableCategories[0] || 'Programování');
    setIsCustomCategory(false);
    setCustomCategoryText('');
    setSection(availableSections[0] || 'Ostatní');
    setIsCustomSection(false);
    setCustomSectionText('');
    setTagsInput('');
    setDescription('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop s klikacím zavřením */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      {/* Tělo modalu */}
      <div 
        id="add-prompt-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
      >
        {/* Hlavička */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Navrhnout vlastní prompt
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Tvůj prompt půjde ke schválení administrátorům a po odsouhlasení bude publikován.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            title="Zavřít"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulář */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-sm font-medium rounded-lg">
              {error}
            </div>
          )}

          {/* Název + Autor v řádku */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                Název promptu *
              </label>
              <input
                type="text"
                placeholder="Např. Seniorní SEO manažer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                Jméno / Přezdívka autora
              </label>
              <input
                type="text"
                placeholder="Anonymní (nepovinné)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Model AI + Kategorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  AI Model *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomModel(!isCustomModel)}
                  className="text-xs text-[#8b5cf6] hover:underline font-semibold cursor-pointer"
                >
                  {isCustomModel ? '← Zpět na seznam' : '+ Přidat model'}
                </button>
              </div>
              {isCustomModel ? (
                <input
                  type="text"
                  placeholder="Zadejte název nového modelu (např. Claude 4)"
                  value={customModelText}
                  onChange={(e) => setCustomModelText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  required
                />
              ) : (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Kategorie *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-xs text-[#8b5cf6] hover:underline font-semibold cursor-pointer"
                >
                  {isCustomCategory ? '← Zpět na seznam' : '+ Přidat kategorii'}
                </button>
              </div>
              {isCustomCategory ? (
                <input
                  type="text"
                  placeholder="Zadejte název nové kategorie (např. Grafika)"
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  required
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sekce (Příběhy, Osobnosti, Exploity...) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Sekce *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSection(!isCustomSection)}
                  className="text-xs text-[#8b5cf6] hover:underline font-semibold cursor-pointer"
                >
                  {isCustomSection ? '← Zpět na seznam' : '+ Přidat sekci'}
                </button>
              </div>
              {isCustomSection ? (
                <input
                  type="text"
                  placeholder="Zadejte název nové sekce (např. Jailbreaky)"
                  value={customSectionText}
                  onChange={(e) => setCustomSectionText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  required
                />
              ) : (
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {availableSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center pt-4 md:pt-5">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Vyberte sekci (např. Příběhy, Osobnosti, Exploity) pro správné zařazení do hlavních záložek webu.
              </span>
            </div>
          </div>

          {/* Popis */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Stručný popis *
            </label>
            <textarea
              placeholder="Řekni ostatním, k čemu se tento prompt hodí a jaké výsledky od něj očekávat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Tagy */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Tagy (oddělte čárkami nebo mezerami)
            </label>
            <input
              type="text"
              placeholder="Např. seo, blog, copywriting, google"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Samotný prompt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Celý text promptu *
            </label>
            <textarea
              placeholder="Sem vlož celý text tvého promptu. Pokud obsahuje dynamické části, které má uživatel nahradit, použij hranaté závorky, např. [MÉ TÉMA]..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Spodní tlačítka */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors cursor-pointer"
            >
              Storno
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Send size={15} />
              <span>Odeslat ke schválení</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
