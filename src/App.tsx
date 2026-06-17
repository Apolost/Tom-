import { useState, useEffect } from 'react';
import { Prompt, AppSettings, AdminLog, RegisteredUser } from './types';
import { dbService } from './database';
import { PromptCard } from './components/PromptCard';
import { AddPromptModal } from './components/AddPromptModal';
import { EditPromptModal } from './components/EditPromptModal';
import { UserAuthModal } from './components/UserAuthModal';
import { ApolosChat } from './components/ApolosChat';
import { AdminPanel } from './components/AdminPanel';
import { PromptCommentsModal } from './components/PromptCommentsModal';
import { AiChatPage } from './components/AiChatPage';
import { UserProfilePage } from './components/UserProfilePage';
import { 
  Search, SlidersHorizontal, Plus, Shield, Moon, Sun, 
  Sparkles, ListCollapse, Play, LayoutGrid, Award, Info, RefreshCw,
  BookOpen, Users, Terminal, Sliders, Lock, LogIn, LogOut, MessageSquare, User,
  Database
} from 'lucide-react';

export default function App() {
  // Inicializace stavu z naší databázové vrstvy
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);

  // Téma - přepínač tmavý / světlý režim
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Filtrování a řazení
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('Vše');
  const [selectedModel, setSelectedModel] = useState('Vše');
  const [selectedCategory, setSelectedCategory] = useState('Vše');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'copies' | 'alphabetical' | 'model'>('newest');
  const [activeView, setActiveView] = useState<'prompts' | 'ai-chat' | 'profile'>('prompts');

  // Sledování přihlášení admina pro okamžitou aktualizaci v reálném čase
  const [isAdminLogged, setIsAdminLogged] = useState(() => {
    return localStorage.getItem('is_admin_logged') === 'true';
  });

  useEffect(() => {
    const checkAdmin = setInterval(() => {
      const logged = localStorage.getItem('is_admin_logged') === 'true';
      if (logged !== isAdminLogged) {
        setIsAdminLogged(logged);
      }
    }, 1000);
    return () => clearInterval(checkAdmin);
  }, [isAdminLogged]);

  // Moduly a Panely
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPromptToEdit, setSelectedPromptToEdit] = useState<Prompt | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSectionsExpanded, setIsSectionsExpanded] = useState(false);

  // Komentáře k promptům
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPromptForComments, setSelectedPromptForComments] = useState<Prompt | null>(null);

  // Přihlášený uživatel
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    const saved = localStorage.getItem('apolos_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Upozornění pro uživatele (Toast / banner)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Responzivní zobrazení filtrů na mobilu
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Automatické odhlášení po 5 minutách nečinnosti (300 000 ms)
  useEffect(() => {
    if (!currentUser && !isAdminLogged) return;

    let lastActivity = Date.now();
    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minut v milisekundách

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Odposlech událostí naznačujících interaktivní aktivitu uživatele
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Kontrola nečinnosti každých 5 sekund
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= INACTIVITY_LIMIT) {
        // Odhlášení běžného uživatele
        if (currentUser) {
          setCurrentUser(null);
          localStorage.removeItem('apolos_current_user');
        }
        
        // Odhlášení administrátora
        if (localStorage.getItem('is_admin_logged') === 'true' || isAdminLogged) {
          localStorage.removeItem('is_admin_logged');
          setIsAdminLogged(false);
          setIsAdminPanelOpen(false);
        }

        setSuccessMessage('Byli jste automaticky odhlášeni z důvodu nečinnosti po dobu 5 minut.');
        setActiveView('prompts');

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    }, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser, isAdminLogged]);

  // Načtení dat při startu aplikace
  const refreshData = () => {
    const loadedPrompts = dbService.getPrompts();
    const loadedSettings = dbService.getSettings();
    const loadedLogs = dbService.getLogs();

    setPrompts(loadedPrompts);
    setSettings(loadedSettings);
    setLogs(loadedLogs);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Téma efekt - inicializace a zápis do DOM
  useEffect(() => {
    if (settings) {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const initialTheme = storedTheme || settings.defaultTheme || 'dark';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, [settings]);

  const applyTheme = (t: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  const handleAdminThemeReset = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // --- KOPÍROVACÍ EVENT ---
  const handleCopySuccess = (promptId: string) => {
    dbService.incrementCopyCount(promptId);
    // Refresh dat, abychom viděli zvednuté copyCount v UI hned
    refreshData();
  };

  const handleAiChatClick = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setSuccessMessage('Pro vstup do AI chatu s free a premium API modelery se prosím přihlaste nebo si založte účet (zabere to 5 vteřin!).');
    } else {
      setActiveView(activeView === 'ai-chat' ? 'prompts' : 'ai-chat');
    }
  };

  // --- NAHRAVÁNÍ PROMPTU OD UŽIVATELE ---
  const handleAddPromptSubmit = (promptData: {
    title: string;
    author: string;
    model: string;
    category: string;
    tags: string[];
    description: string;
    content: string;
  }) => {
    // Příchozí data od uživatele nahráváme standardně jako pending
    dbService.addPrompt({
      ...promptData,
      status: 'pending', // Uživatelský prompt vždy čeká na schválení!
      featured: false
    });

    setSuccessMessage('Děkujeme! Váš prompt byl úspěšně odeslán ke schválení administrátorem.');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);

    refreshData();
  };

  const handleUserEditStart = (prompt: Prompt) => {
    setSelectedPromptToEdit(prompt);
    setIsEditModalOpen(true);
  };

  const handleEditPromptSubmit = (editedData: {
    id: string;
    title: string;
    model: string;
    category: string;
    tags: string[];
    description: string;
    content: string;
  }) => {
    const existing = prompts.find(p => p.id === editedData.id);
    if (existing) {
      dbService.updatePrompt(editedData.id, {
        ...existing,
        ...editedData,
        status: 'pending', // Každá úprava resetuje status na pending pro schválení adminem
      });
      setSuccessMessage('Úprava uložena! Prompt byl odeslán administrátorovi k opětovnému schválení.');
      setTimeout(() => setSuccessMessage(null), 5000);
      refreshData();
    }
    setIsEditModalOpen(false);
    setSelectedPromptToEdit(null);
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-indigo-500" size={24} />
          <span className="text-sm font-semibold">Načítání AI promptů...</span>
        </div>
      </div>
    );
  }

  // --- VYHLEDÁVALACÍ / FILTRAČNÍ ALGORITMUS ---
  // Veřejné zobrazení filtruje pouze stav "approved" nebo vlastní prompty přihlášeného uživatele
  const approvedPrompts = prompts.filter(p => p.status === 'approved' || (currentUser && p.author?.toLowerCase() === currentUser.nickname.toLowerCase()));

  const filteredPrompts = approvedPrompts.filter(p => {
    // Fultext vyhledávání (hledá v názvu, popisu, textu, tagách, modelu, kategorii)
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalizedQuery === '' || 
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.description.toLowerCase().includes(normalizedQuery) ||
      p.content.toLowerCase().includes(normalizedQuery) ||
      (p.author && p.author.toLowerCase().includes(normalizedQuery)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(normalizedQuery))) ||
      p.model.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery);

    // Filtr modelů:
    const matchesModel = selectedModel === 'Vše' || p.model === selectedModel;

    // Filtr kategorií:
    const matchesCategory = selectedCategory === 'Vše' || p.category === selectedCategory;

    // Filtr sekcí (příběhy, osobnosti, exploity):
    const matchesSection = selectedSection === 'Vše' || (p.section || 'Ostatní') === selectedSection;

    return matchesSearch && matchesModel && matchesCategory && matchesSection;
  });

  // ŘAZENÍ:
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'copies') {
      return (b.copyCount || 0) - (a.copyCount || 0);
    }
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title, 'cs');
    }
    if (sortBy === 'model') {
      return a.model.localeCompare(b.model, 'cs');
    }
    return 0;
  });

  // DOPORUČENÉ PROMPTY (FEATURED):
  // "Doporučené prompty se zobrazí nahoře v samostatné sekci."
  const featuredPrompts = sortedPrompts.filter(p => p.featured);
  // Ostatní schválené prompty:
  const standardPrompts = sortedPrompts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text transition-colors duration-300 font-sans flex flex-col justify-between bg-gradient-top-right">
      
      {/* 1. TOAST NOTIFIKACE */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-40 max-w-md p-4 bg-[#8b5cf6] text-white rounded-xl shadow-xl flex items-start gap-3 border border-[#8b5cf6]/30 animate-slide-in">
          <Award className="shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-bold text-sm">Záznam úspěšně uložen</div>
            <div className="text-xs text-violet-100 mt-0.5 leading-normal">{successMessage}</div>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-violet-200 hover:text-white font-bold text-sm focus:outline-none">
            &times;
          </button>
        </div>
      )}

      {/* KRAJNÍ PŘIPNUTÉ FLOATING TLAČÍTKO - FILTRY / MODELY (Připnuté na bok zleva, po kliknutí vyjede sidebar) */}
      <div className="fixed left-0 top-[35%] -translate-y-1/2 z-[90]">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 py-4 px-2.5 rounded-r-2xl bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] text-white font-sans font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-[4px_0_20px_rgba(139,92,246,0.35)] hover:shadow-[4px_0_25px_rgba(139,92,246,0.5)] active:scale-95 border-y border-r border-[#a78bfa]/20 select-none group focus:outline-none"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          title="Otevřít filtry a modely"
        >
          <SlidersHorizontal size={13} className="rotate-90 select-none text-white animate-pulse" />
          <span className="my-1 group-hover:translate-x-0.5 transition-transform duration-200">Filtry / Modely</span>
        </button>
      </div>

      {/* HLAVNÍ STRÁNKA */}
      <div>
        {/* HEADER / HORNÍ LIŠTA */}
        <header className="sticky top-0 z-30 bg-brand-card/85 backdrop-blur-md border-b border-brand-border transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            
            {/* Logo a navigační spouštěč */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="relative group flex items-center justify-center">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-lg blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative w-8 h-8 bg-[#120f24] border border-violet-500/30 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg tracking-wider">
                    <span className="bg-gradient-to-r from-violet-300 via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent font-sans">AP</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent font-sans">
                      Apolos
                    </span>
                    <span className="hidden sm:inline-block text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded bg-[#8b5cf6]/10 text-[#c084fc] border border-purple-500/20">
                      Prompter
                    </span>
                  </div>
                  <span className="text-[8px] font-mono tracking-wider text-brand-muted uppercase mt-0.5 font-bold">
                    Database v1.2
                  </span>
                </div>
              </div>

              {/* Indikátor okamžitého ukládání databáze */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[#10b981] text-[9px] font-black uppercase tracking-wider transition-all" title="Aktivní databáze: Jakákoli změna (prompty, komentáře, chat, klíče) se okamžitě a bezpečně ukládá do lokálního i cloudového úložiště.">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <Database size={10} className="text-emerald-400" />
                <span>DB Auto-Save Aktivní</span>
              </div>
            </div>

            {/* Vyhledávací lišta integrovaná nahoře pro Desktop */}
            <div className="hidden md:flex flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={14} />
              <input
                type="text"
                placeholder="Hledejte klíčová slova, tagy, modely..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-14 py-1.5 text-xs rounded-lg border border-brand-border bg-brand-card text-brand-text placeholder-brand-muted/70 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted hover:text-brand-text"
                >
                  Vymazat
                </button>
              )}
            </div>

            {/* Ovládací prvky vpravo */}
            <div className="flex items-center gap-2">
              {/* Tlačítko přidat pro velké obrazovky */}
              {settings && settings.publicUploadEnabled && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="hidden sm:flex items-center gap-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow shadow-[#8b5cf6]/10 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Přidat prompt</span>
                </button>
              )}

              {/* Tlačítko Chat s AI */}
              <button
                onClick={handleAiChatClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none active:scale-95 group relative ${
                  activeView === 'ai-chat'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10'
                }`}
              >
                <MessageSquare size={13} className={`animate-pulse group-hover:rotate-6 transition-transform ${activeView === 'ai-chat' ? 'text-slate-950' : 'text-violet-200'}`} />
                <span>{activeView === 'ai-chat' ? 'Zavřít Chat' : 'Chat s AI'}</span>
                {currentUser && activeView !== 'ai-chat' && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />}
              </button>

              {/* Uživatelská sekce v záhlaví */}
              {currentUser ? (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                  <button
                    onClick={() => setActiveView(activeView === 'profile' ? 'prompts' : 'profile')}
                    className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-md transition cursor-pointer shrink-0 ${
                      activeView === 'profile' 
                        ? 'bg-[#8b5cf6] text-white shadow-md' 
                        : 'bg-zinc-950/40 text-[#c084fc] hover:bg-zinc-900 border border-[#8b5cf6]/15 hover:text-white'
                    }`}
                    title="Můj Profil"
                  >
                    <User size={10} />
                    <span>Profil</span>
                  </button>

                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-extrabold text-[#c084fc] leading-none truncate max-w-[105px]">
                      {currentUser.nickname}
                    </span>
                    <span className="text-[8px] font-mono text-brand-muted leading-none font-bold mt-1">
                      Moje prompty: {prompts.filter(p => p.author?.toLowerCase() === currentUser.nickname.toLowerCase()).length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('apolos_current_user');
                      setSuccessMessage('Byli jste odhlášeni.');
                      setActiveView('prompts');
                    }}
                    className="p-1 rounded bg-brand-bg hover:bg-zinc-800 text-rose-500 hover:text-rose-600 transition cursor-pointer ml-1"
                    title="Odhlásit se"
                  >
                    <LogOut size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <LogIn size={11} />
                  <span>Přihlásit se</span>
                </button>
              )}

              {/* Téma přepínač */}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-card bg-brand-card/40 transition cursor-pointer"
                title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
                id="theme-toggler"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Tlačítko filtrů pro mobilní zobrazení */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-brand-border text-brand-muted hover:bg-brand-card bg-brand-card/30 transition cursor-pointer"
                title="Zobrazit filtry"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>

          </div>
        </header>

        {/* ÚVODNÍ HERO A PANEL VYHLEDÁVÁNÍ PRO MOBIL */}
        <section className="bg-gradient-to-b from-[#8b5cf6]/8 via-[#8b5cf6]/1 to-transparent pt-8 pb-3 relative overflow-hidden">
          {/* Světelný efekt na pozadí */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[120px] bg-[#8b5cf6]/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Větší prostor pro prompty - smazány nadbytečné texty */}
            <div className="h-2" />

            {/* Vyhledávání pro mobilní obrazovky */}
            <div className="mt-4 max-w-sm mx-auto relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={14} />
              <input
                type="text"
                placeholder="Hledat prompty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-8 py-2 text-xs rounded-lg border border-brand-border bg-brand-card text-brand-text focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-brand-muted"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Mobilní plné nahrávání tlačítko */}
            {settings.publicUploadEnabled && (
              <div className="mt-3 sm:hidden space-y-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Přidat vlastní prompt</span>
                </button>

                <button
                  onClick={handleAiChatClick}
                  className={`w-full py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeView === 'ai-chat'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  }`}
                >
                  <MessageSquare size={13} className="animate-pulse" />
                  <span>{activeView === 'ai-chat' ? 'Zavřít Chat s AI' : 'Otevřít Chat s AI'}</span>
                </button>
              </div>
            )}

          </div>
        </section>

        {/* 2. DVOUSLOUVCOVÉ USPOŘÁDÁNÍ (Sidebar filtry + Prompty) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* 1.5. VYSOUVACÍ LIŠTA Z LEVA (DRAWER VŽDY AKTIVNÍ) */}
            {isDrawerOpen && (
              <div 
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-[3px] z-[90] cursor-pointer animate-fade-in transition-all duration-300"
                id="drawer-backdrop"
              />
            )}

            <aside 
              className={`fixed top-0 left-0 h-full w-[310px] bg-[#0c091f] text-zinc-100 p-6 z-[100] overflow-y-auto border-r border-[#8b5cf6]/30 shadow-[15px_0_50px_rgba(0,0,0,0.6)] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between ${
                isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              id="sidebar-drawer"
            >
              <div className="space-y-5">
                {/* ID hlavička panelu */}
                <div className="flex items-center justify-between border-b border-[#8b5cf6]/30 pb-3 mb-2">
                  <span className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={13} className="text-[#a78bfa] animate-pulse" />
                    <span>Filtr a Modely</span>
                  </span>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase text-zinc-400 hover:text-white rounded-lg border border-[#8b5cf6]/30 bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Zavřít &times;
                  </button>
                </div>

                {/* FILTR: AI MODELY (HLAVNÍ BODY) */}
                <div className="border border-[#8b5cf6]/20 bg-[#141033] p-4 rounded-xl space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#a78bfa] flex items-center gap-1.5 border-b border-[#8b5cf6]/20 pb-2">
                    <LayoutGrid size={11} className="text-[#a78bfa]" />
                    <span>AI Modely</span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-[190px] overflow-y-auto pr-1">
                    <button
                      onClick={() => { setSelectedModel('Vše'); setIsDrawerOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        selectedModel === 'Vše'
                          ? 'bg-[#8b5cf6]/20 text-white border-l-2 border-[#8b5cf6] pl-2.5 font-black shadow-xs'
                          : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                      }`}
                    >
                      <span>Všechny modely</span>
                      <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({approvedPrompts.length})</span>
                    </button>
                    {settings.availableModels.map((model) => {
                      const modelCount = approvedPrompts.filter(p => p.model === model && (selectedSection === 'Vše' || (p.section || 'Ostatní') === selectedSection)).length;
                      return (
                        <button
                          key={model}
                          onClick={() => { setSelectedModel(model); setIsDrawerOpen(false); }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                            selectedModel === model
                              ? 'bg-[#8b5cf6]/25 text-white border-l-2 border-[#8b5cf6] pl-2.5 font-black shadow-xs'
                              : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                          }`}
                        >
                          <span>{model}</span>
                          <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({modelCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AKORDION: THEMATICKÉ SEKCE ROZBÍHANÉ POD NIMI */}
                <div className="border border-[#8b5cf6]/20 bg-[#141033] rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setIsSectionsExpanded(!isSectionsExpanded)}
                    className="w-full text-left px-3.5 py-3 hover:bg-[#8b5cf6]/10 transition-all text-[11px] font-extrabold uppercase tracking-wider text-white flex items-center justify-between cursor-pointer focus:outline-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#a78bfa] animate-pulse" />
                      <span>Thematické Sekce</span>
                    </span>
                    <span className={`text-[10px] font-mono text-[#a78bfa] transition-transform duration-300 ${isSectionsExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div 
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      isSectionsExpanded ? 'max-h-[350px] border-t border-[#8b5cf6]/20 p-3 bg-[#17133c]/60' : 'max-h-0'
                    }`}
                  >
                    <div className="flex flex-col gap-1 max-h-[290px] overflow-y-auto pr-1">
                      <button
                        onClick={() => { setSelectedSection('Vše'); setIsDrawerOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                          selectedSection === 'Vše'
                            ? 'bg-[#8b5cf6]/20 text-white border-l-2 border-[#8b5cf6] pl-2.5 font-black'
                            : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Sliders size={11} className="text-[#a78bfa]" />
                          Všechny sekce
                        </span>
                        <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({approvedPrompts.length})</span>
                      </button>
                      {(settings.availableSections || ['Příběhy', 'Osobnosti', 'Exploity', 'Ostatní']).map((sec) => {
                        const secCount = approvedPrompts.filter(p => (p.section || 'Ostatní') === sec).length;
                        const isStories = sec === 'Příběhy';
                        const isPers = sec === 'Osobnosti';
                        const isExp = sec === 'Exploity';
                        
                        let icon = <Sliders size={11} className="text-[#a78bfa]" />;
                        if (isStories) icon = <BookOpen size={11} className="text-[#a78bfa]" />;
                        if (isPers) icon = <Users size={11} className="text-[#a78bfa]" />;
                        if (isExp) icon = <Terminal size={11} className="text-[#a78bfa]" />;

                        return (
                          <button
                            key={sec}
                            onClick={() => { setSelectedSection(sec); setIsDrawerOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                              selectedSection === sec
                                ? 'bg-[#8b5cf6]/20 text-white border-l-2 border-[#8b5cf6] pl-2.5 font-black'
                                : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {icon}
                              {sec}
                            </span>
                            <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({secCount})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* FILTR: KATEGORIE PRO CHYTRÉ TŘÍDĚNÍ */}
                <div className="border border-[#8b5cf6]/20 bg-[#141033] p-4 rounded-xl space-y-2.5 shadow-inner">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#a78bfa] flex items-center gap-1.5 border-b border-[#8b5cf6]/20 pb-2">
                    <ListCollapse size={11} className="text-[#a78bfa]" />
                    <span>Kategorie</span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-[170px] overflow-y-auto pr-1">
                    <button
                      onClick={() => { setSelectedCategory('Vše'); setIsDrawerOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === 'Vše'
                          ? 'bg-[#8b5cf6]/25 text-white border-l-2 border-[#8b5cf6] pl-2.5 font-black shadow-xs'
                          : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                      }`}
                    >
                      <span>Všechny kategorie</span>
                      <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({approvedPrompts.length})</span>
                    </button>
                    {settings.availableCategories.map((category) => {
                      const catCount = approvedPrompts.filter(p => p.category === category && (selectedSection === 'Vše' || (p.section || 'Ostatní') === selectedSection)).length;
                      return (
                        <button
                          key={category}
                          onClick={() => { setSelectedCategory(category); setIsDrawerOpen(false); }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                            selectedCategory === category
                              ? 'bg-[#8b5cf6]/25 text-[#a78bfa] border-l-2 border-[#8b5cf6] pl-2.5 font-extrabold'
                              : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                          }`}
                        >
                          <span>{category}</span>
                          <span className="text-[#c084fc]/90 text-[10px] font-mono font-bold">({catCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Informace na konci menu */}
              <div className="border-t border-[#8b5cf6]/20 pt-4 mt-6">
                <div className="text-[9px] font-mono text-zinc-400 text-center leading-relaxed">
                  <div>STUDIO APOLOS &bull; PROMPTER SYSTEM</div>
                  <div className="text-[#a78bfa] font-semibold mt-1">Stiskněte cokoliv pro zavření</div>
                </div>
              </div>
            </aside>

            {/* PRAVÁ ČÁST S HLAVNÍM PROSTŘEDÍM */}
            <main className="flex-1 w-full space-y-5">
              
              {activeView === 'prompts' ? (
                <>
                  {/* LIŠTA S AKTIVNÍM VYHLEDÁVÁNÍM & ŘAZENÍM */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-card/45 border border-brand-border px-3.5 py-2 rounded-xl text-xs">
                    <div className="text-brand-muted flex items-center gap-1.5 font-medium flex-wrap">
                      <span>Nalezeno:</span>
                      <span className="font-bold text-brand-text px-2 py-0.5 bg-brand-card border border-brand-border rounded">
                        {filteredPrompts.length} promptů
                      </span>
                      {(selectedModel !== 'Vše' || selectedCategory !== 'Vše' || searchQuery !== '') && (
                        <button
                          onClick={() => { setSelectedModel('Vše'); setSelectedCategory('Vše'); setSearchQuery(''); }}
                          className="text-[#8b5cf6] hover:underline hover:text-[#7c3aed] ml-1.5 cursor-pointer font-bold"
                        >
                          Zobrazit vše
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-muted uppercase tracking-wider text-[10px] shrink-0">
                        Řadit podle:
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-brand-border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] cursor-pointer shadow-sm transition-all"
                      >
                        <option value="newest" className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold">Nejnovější</option>
                        <option value="oldest" className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold">Nejstarší</option>
                        <option value="copies" className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold">Nejkopírovanější</option>
                        <option value="alphabetical" className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold">Abecedně A-Z</option>
                        <option value="model" className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold">Podle modelu</option>
                      </select>
                    </div>
                  </div>

                  {/* SEKCE A: DOPORUČENÉ PROMPTY (DENSE VIEW) */}
                  {featuredPrompts.length > 0 && (
                    <div className="space-y-3.5 border-b border-brand-border pb-6">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-[#8b5cf6]/30">
                        <Award className="text-[#8b5cf6]" size={16} />
                        <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider">
                          Doporučené prompty dne
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {featuredPrompts.map((prompt) => (
                          <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onCopySuccess={handleCopySuccess}
                            onUserEdit={currentUser && prompt.author?.toLowerCase() === currentUser.nickname.toLowerCase() ? handleUserEditStart : undefined}
                            onOpenComments={(p) => {
                              setSelectedPromptForComments(p);
                              setIsCommentsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEKCE B: VŠECHNY SCHVÁLENÉ PROMPTY */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-brand-border/80">
                      <Play className="text-brand-muted/70 rotate-90" size={11} fill="currentColor" />
                      <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider">
                        {featuredPrompts.length > 0 ? 'Ostatní prompty v databázi' : 'Dostupné prompty'}
                      </h2>
                    </div>

                    {standardPrompts.length === 0 ? (
                      <div className="bg-brand-card/50 border border-brand-border p-12 rounded-xl text-center">
                        {filteredPrompts.length === 0 ? (
                          <div>
                            <Info className="mx-auto text-brand-muted mb-2.5" size={24} />
                            <h3 className="text-sm font-bold text-brand-text">Žádné prompty nebyly nalezeny</h3>
                            <p className="text-[11px] text-brand-muted mt-1 max-w-xs mx-auto">
                              Zkuste vymazat akční filtry nebo vyhledat jiná slova.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-sm font-bold text-brand-text">Žádné další prompty</h3>
                            <p className="text-[11px] text-brand-muted mt-1">
                              Všechny odpovídající prompty jsou zobrazeny v horní doporučené sekci.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {standardPrompts.map((prompt) => (
                          <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onCopySuccess={handleCopySuccess}
                            onUserEdit={currentUser && prompt.author?.toLowerCase() === currentUser.nickname.toLowerCase() ? handleUserEditStart : undefined}
                            onOpenComments={(p) => {
                              setSelectedPromptForComments(p);
                              setIsCommentsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : activeView === 'ai-chat' ? (
                <AiChatPage currentUser={currentUser} onBack={() => setActiveView('prompts')} />
              ) : currentUser ? (
                <UserProfilePage 
                  currentUser={currentUser} 
                  prompts={prompts} 
                  onBack={() => setActiveView('prompts')} 
                  onCopySuccess={(title) => {
                    setSuccessMessage('Zkopírováno: ' + title);
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  refreshData={refreshData}
                />
              ) : (
                <div className="text-center py-12 bg-brand-card/45 border border-brand-border rounded-3xl p-6">
                  <p className="text-xs font-bold text-brand-text">Pro zobrazení profilu se prosím přihlaste.</p>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-[#8b5cf6] text-white text-[10px] font-black uppercase rounded-xl transition hover:bg-[#7c3aed]"
                  >
                    Přihlásit se
                  </button>
                </div>
              )}

            </main>

          </div>
        </div>

      </div>

      {/* 4. FOOTER + SKRYTÉ ADMIN TLAČÍTKO */}
      <footer className="w-full mt-10 border-t border-brand-border bg-brand-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-brand-muted">
          <div>
            &copy; 2026 AI Prompt Databáze. Vyvinuto pro moderní AI vývojáře.
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-md font-semibold">
              Studio Apolos &bull; Profesionální AI Prompty
            </span>
            
            {/* TLAČÍTKO S LOGEM ZÁMKU PRO VSTUP DO ADMINISTRACE */}
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-card/80 hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/30 text-brand-muted hover:text-[#8b5cf6] transition-all cursor-pointer font-bold duration-300 text-[10px]"
              title="Přihlášení Administrátora"
              id="admin-lock-trigger"
            >
              <Lock size={12} className="text-[#8b5cf6]" />
              <span>Administrace</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL PRO PŘIDÁNÍ VLASTNÍHO PROMPTU */}
      <AddPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPromptSubmit}
        availableModels={settings.availableModels}
        availableCategories={settings.availableCategories}
      />

      {/* MODAL PRO EDITACI VLASTNÍHO PROMPTU UŽIVATELEM */}
      <EditPromptModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPromptToEdit(null);
        }}
        onSubmit={handleEditPromptSubmit}
        prompt={selectedPromptToEdit}
        availableModels={settings.availableModels}
        availableCategories={settings.availableCategories}
      />

      {/* MODAL PRO PŘIHLÁŠENÍ / REGISTRACI UŽIVATELE */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('apolos_current_user', JSON.stringify(user));
          setSuccessMessage(`Přihlášeno pod přezdívkou ${user.nickname}!`);
          setTimeout(() => setSuccessMessage(null), 4000);
          refreshData();
        }}
      />

      {/* MODAL PRO KOMENTÁŘE K PROMPTŮM */}
      <PromptCommentsModal
        isOpen={isCommentsOpen}
        onClose={() => {
          setIsCommentsOpen(false);
          setSelectedPromptForComments(null);
        }}
        prompt={selectedPromptForComments}
        currentUser={currentUser}
      />

      {/* KOMUNITNÍ FACEBOOK CHAT */}
      <ApolosChat
        currentUser={currentUser}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        isAdminLogged={isAdminLogged}
      />

      {/* SKRYTÝ ADMIN PANEL */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        prompts={prompts}
        settings={settings}
        logs={logs}
        onDataRefresh={refreshData}
        onThemeToggleRequested={handleAdminThemeReset}
      />

    </div>
  );
}
