import React from 'react';
import { Prompt, AppSettings } from '../../types';
import { RefreshCcw, Star, BarChart3 } from 'lucide-react';

interface AdminStatsTabProps {
  onDataRefresh: () => void;
  setActiveTab: (tab: string) => void;
  setFilterStatus: (status: string) => void;
  setManageSortBy: (sort: string) => void;
  stats: {
    total: number;
    approved: number;
    pending: number;
    copies: number;
    topModel: string;
    topCategory: string;
  };
  settings: AppSettings;
  prompts: Prompt[];
  pendingPrompts: Prompt[];
  pendingTested: Record<string, boolean>;
  setPendingTested: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleApprove: (id: string, tested: boolean) => void;
  handleEditClick: (prompt: Prompt) => void;
  handleReject: (id: string) => void;
}

export const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  onDataRefresh,
  setActiveTab,
  setFilterStatus,
  setManageSortBy,
  stats,
  settings,
  prompts,
  pendingPrompts,
  pendingTested,
  setPendingTested,
  handleApprove,
  handleEditClick,
  handleReject,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Přehled a statistika</h2>
        <button
          onClick={onDataRefresh}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-800"
        >
          <RefreshCcw size={14} />
        </button>
      </div>

      {/* KARTY STATISTIK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => { setActiveTab('manage'); setFilterStatus('Vše'); setManageSortBy('id'); }}
          className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl text-left cursor-pointer transition-all hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/10 hover:shadow-md group block w-full focus:outline-none"
        >
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition-colors">Celkem promptů</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Všechny nahrané záznamy</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">&rarr;</span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('manage'); setFilterStatus('approved'); setManageSortBy('id'); }}
          className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl text-left cursor-pointer transition-all hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/10 hover:shadow-md group block w-full focus:outline-none"
        >
          <div className="text-emerald-500 text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Schválené</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.approved}</div>
          <div className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
            <span>Viditelné pro veřejnost</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">&rarr;</span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('pending'); }}
          className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl text-left cursor-pointer transition-all hover:border-amber-500 hover:ring-2 hover:ring-amber-500/10 hover:shadow-md group block w-full focus:outline-none"
        >
          <div className="text-amber-500 text-xs font-semibold uppercase tracking-wider group-hover:text-amber-400 transition-colors">Čekají ke schválení</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.pending}</div>
          <div className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
            <span>Čekají v sekci moderace</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500">&rarr;</span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('manage'); setFilterStatus('Vše'); setManageSortBy('copyCount'); }}
          className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl text-left cursor-pointer transition-all hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/10 hover:shadow-md group block w-full focus:outline-none"
        >
          <div className="text-indigo-500 text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition-colors">Počet kopírování</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.copies}</div>
          <div className="text-[11px] text-indigo-500 mt-1 flex items-center gap-1">
            <span>Celkové stažení clipboardem</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">&rarr;</span>
          </div>
        </button>
      </div>

      {/* VÝZNAMNÉ PARAMETRY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Nejčastější model</div>
            <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{stats.topModel}</div>
          </div>
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
            <Star size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Nejčastější kategorie</div>
            <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{stats.topCategory}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      {/* DYNAMICKÉ BENTO GRAFY DISTRIBUCE PROMPTŮ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Distribuce podle AI modelů</div>
          <div className="space-y-2.5">
            {settings.availableModels.map((model) => {
              const count = prompts.filter(p => p.model === model).length;
              const percentage = prompts.length > 0 ? Math.round((count / prompts.length) * 100) : 0;
              return (
                <div key={model} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-zinc-300">{model}</span>
                    <span className="text-slate-500 font-mono">{count} promptů ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.max(2, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Distribuce podle kategorií</div>
          <div className="space-y-2.5">
            {settings.availableCategories.map((category) => {
              const count = prompts.filter(p => p.category === category).length;
              const percentage = prompts.length > 0 ? Math.round((count / prompts.length) * 100) : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold font-sans">
                    <span className="text-slate-700 dark:text-zinc-300">{category}</span>
                    <span className="text-slate-500 font-mono">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8b5cf6] rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.max(2, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RYCHLÝ PŘEHLED AKTIVIT (PENDING) */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Čekající moderace promptů ({stats.pending})</h3>
        {pendingPrompts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Žádné prompty momentálně nečekají na schválení. Jste kompletně odbaveni! 👍
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {pendingPrompts.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{p.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Autor: <span className="text-slate-700 dark:text-zinc-400">{p.author || 'Anonymní'}</span> &bull; Model: {p.model} &bull; Kat: {p.category}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                  <div className="flex items-center gap-1 mr-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Testováno:</span>
                    <select
                      value={pendingTested[p.id] !== false ? 'true' : 'false'}
                      onChange={(e) => setPendingTested({ ...pendingTested, [p.id]: e.target.value === 'true' })}
                      className="px-1.5 py-0.5 text-xs rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer font-sans"
                    >
                      <option value="true">Ano</option>
                      <option value="false">Ne</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleApprove(p.id, pendingTested[p.id] !== false)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
                  >
                    Schválit
                  </button>
                  <button
                    onClick={() => handleEditClick(p)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer"
                  >
                    Upravit & Schválit
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded cursor-pointer"
                  >
                    Zamítnout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
