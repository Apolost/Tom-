import React from 'react';
import { Prompt, RegisteredUser } from '../../types';
import { Search, X } from 'lucide-react';

interface AdminUsersTabProps {
  userSearchText: string;
  setUserSearchText: (text: string) => void;
  prompts: Prompt[];
  visiblePasswords: Record<string, boolean>;
  setVisiblePasswords: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleDeleteUser: (nickname: string) => void;
  inspectedUser: RegisteredUser | null;
  setInspectedUser: (user: RegisteredUser | null) => void;
  getUsers: () => RegisteredUser[];
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  userSearchText,
  setUserSearchText,
  prompts,
  visiblePasswords,
  setVisiblePasswords,
  handleDeleteUser,
  inspectedUser,
  setInspectedUser,
  getUsers,
}) => {
  const usersList = getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registrovaní členové</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Seznam a správa všech přihlášených a registrovaných uživatelů platformy. Klikněte na člena pro detaily a zobrazení jeho příspěvků.
          </p>
        </div>
      </div>

      {/* Vyhledávací filtr */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl flex gap-3 items-center">
        <Search size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder="Hledat uživatele podle jména..."
          value={userSearchText}
          onChange={(e) => setUserSearchText(e.target.value)}
          className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none font-semibold focus:ring-0"
        />
        {userSearchText && (
          <button onClick={() => setUserSearchText('')} className="text-xs text-slate-400 font-bold">Vymazat</button>
        )}
      </div>

      {/* Seznam uživatelů */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usersList
          .filter(u => !userSearchText || u.nickname.toLowerCase().includes(userSearchText.toLowerCase()))
          .map((u) => {
            const userPromptsCount = prompts.filter(p => p.author?.toLowerCase() === u.nickname.toLowerCase()).length;
            const isPasswordShown = !!visiblePasswords[u.nickname];

            return (
              <div 
                key={u.nickname}
                onClick={() => setInspectedUser(u)}
                className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:border-[#8b5cf6]/40 cursor-pointer transition-all duration-300 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl flex items-center justify-center font-bold font-sans">
                      {u.nickname.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-[#8b5cf6] transition-colors">
                        {u.nickname}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Registrován: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('cs') : 'Neznámo'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zobrazování citlivých detailů uživatele (jméno a heslo) */}
                <div className="bg-slate-50 dark:bg-zinc-950/40 p-2.5 rounded-xl space-y-1.5 border border-slate-100 dark:border-zinc-900/60" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[8px]">Uživatelské jméno:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300 select-all font-mono">{u.nickname}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[8px]">Heslo (v databázi):</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-bold text-[#8b5cf6] select-all truncate max-w-[120px]">
                        {isPasswordShown ? u.passwordHash : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVisiblePasswords(prev => ({ ...prev, [u.nickname]: !prev[u.nickname] }))}
                        className="text-[9px] uppercase font-black tracking-wider text-[#8b5cf6] hover:text-[#7c3aed] px-1 py-0.5"
                      >
                        {isPasswordShown ? 'Skrýt' : 'Ukázat'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold mt-1">
                  <span className="text-[#8b5cf6] hover:underline font-extrabold text-[10px]">
                    Zobrazit prompty ({userPromptsCount})
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(u.nickname);
                    }}
                    className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                  >
                    Smazat účet
                  </button>
                </div>
              </div>
            );
          })
        }

        {usersList.length === 0 && (
          <div className="col-span-full bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl text-center text-slate-500 text-xs font-semibold">
            Zatím nejsou registrovaní žádní uživatelé.
          </div>
        )}
      </div>

      {/* MODÁLNÍ OKNO S DETAILEM ČLENA A JEHO PRÍSPĚVKY */}
      {inspectedUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={() => setInspectedUser(null)} />

          {/* Container */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d0920] border border-slate-250 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-zinc-100 transform transition-all text-xs flex flex-col max-h-[85vh]">
            {/* Close button */}
            <button
              onClick={() => setInspectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full"
            >
              <X size={15} />
            </button>

            {/* Header */}
            <div className="mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl flex items-center justify-center font-black text-sm uppercase">
                  {inspectedUser.nickname.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                    Profil člena: <span className="text-[#8b5cf6]">{inspectedUser.nickname}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                    Registrace: {new Date(inspectedUser.createdAt).toLocaleString('cs-CZ')} | Přihlašovací jméno: <span className="font-mono text-indigo-500 font-bold select-all">{inspectedUser.nickname}</span> | Heslo: <span className="font-mono text-indigo-500 font-bold select-all">{inspectedUser.passwordHash}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* List of prompts added by this user */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin max-h-[480px]">
              <div className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider mb-2 flex justify-between">
                <span>Vložené prompty od uživatele ({prompts.filter(p => p.author?.toLowerCase() === inspectedUser.nickname.toLowerCase()).length})</span>
                <span className="text-[#8b5cf6]">Administrační pohled</span>
              </div>

              <div className="space-y-3">
                {prompts.filter(p => p.author?.toLowerCase() === inspectedUser.nickname.toLowerCase()).map((p) => {
                  return (
                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-[#110e24]/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200/50 dark:border-zinc-800/50 pb-1.5">
                        <h5 className="font-black text-slate-800 dark:text-zinc-100 text-xs">
                          {p.title}
                        </h5>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          p.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : p.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                              : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {p.status === 'approved' ? 'Schválen' : p.status === 'pending' ? 'Čeká' : 'Zamítnut'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium italic">
                        {p.description}
                      </p>
                      <pre className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200/50 dark:border-zinc-900 font-mono text-[10px] text-slate-800 dark:text-zinc-200 max-h-[140px] overflow-y-auto whitespace-pre-wrap select-all leading-relaxed font-semibold">
                        {p.content}
                      </pre>
                      <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold pt-1">
                        <span>Model: <strong className="text-slate-600 dark:text-zinc-300 font-black">{p.model}</strong></span>
                        <span>Kategorie: <strong className="text-slate-600 dark:text-zinc-300 font-black">{p.category}</strong></span>
                        <span>Sekce: <strong className="text-slate-600 dark:text-zinc-300 font-black">{p.section || 'Ostatní'}</strong></span>
                      </div>
                    </div>
                  );
                })}

                {prompts.filter(p => p.author?.toLowerCase() === inspectedUser.nickname.toLowerCase()).length === 0 && (
                  <div className="text-center py-10 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-2xl text-slate-400 font-bold italic">
                    Uživatel zatím nevytvořil žádný prompt.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold font-sans cursor-pointer transition-colors text-[10px] uppercase tracking-wider"
              >
                Zavřít panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
