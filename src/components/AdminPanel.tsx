import React, { useState, useEffect } from 'react';
import { Prompt, AppSettings, AdminLog, RegisteredUser } from '../types';
import { dbService } from '../database';
import {
  X, Check, Trash2, Edit, Plus, Settings, BarChart3, ClipboardList,
  Activity, Star, Search, Shield, Lock, AlertCircle, Save, LogOut, RefreshCcw, Users, MessageSquare, Send
} from 'lucide-react';
import { AdminStatsTab } from './admin/AdminStatsTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminChatTab } from './admin/AdminChatTab';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  settings: AppSettings;
  logs: AdminLog[];
  onDataRefresh: () => void;
  onThemeToggleRequested?: (theme: 'light' | 'dark') => void;
}

const DEMO_ADMIN_PASSWORD = '322032200'; // V produkci by se mělo použít Firebase Auth / server-side ověření!

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  prompts,
  settings,
  logs,
  onDataRefresh,
  onThemeToggleRequested,
}) => {
  // Přihlašovací stav
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_logged') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Navigační záložky admin panelu
  const [activeTab, setActiveTab] = useState<'stats' | 'pending' | 'add' | 'manage' | 'settings' | 'logs' | 'users' | 'chat'>('stats');

  // Stavy pro chat v administraci
  const [selectedUserForChat, setSelectedUserForChat] = useState<string | null>(null);
  const [adminChatText, setAdminChatText] = useState('');
  const [allMessages, setAllMessages] = useState<any[]>([]);

  // Stavy pro zobrazení hesel uživatelů
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Stav pro inspekci vybraného uživatele a jeho promptů
  const [inspectedUser, setInspectedUser] = useState<RegisteredUser | null>(null);

  // Stavy pro úpravy a formuláře
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchManageQuery, setSearchManageQuery] = useState('');
  const [filterModel, setFilterModel] = useState('Vše');
  const [filterCategory, setFilterCategory] = useState('Vše');
  const [filterStatus, setFilterStatus] = useState<string>('Vše');
  const [manageSortBy, setManageSortBy] = useState<'id' | 'copyCount'>('id');

  // Stavy formuláře pro NOVÝ / UPRAVOVANÝ prompt
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSection, setFormSection] = useState('Ostatní');
  const [formTested, setFormTested] = useState(true);
  const [pendingTested, setPendingTested] = useState<Record<string, boolean>>({});

  // Stavy pro editaci obecných nastavení
  const [setAppName, setSetAppName] = useState(settings.appName);
  const [setAppIntro, setSetAppIntro] = useState(settings.appIntro);
  const [setPublicUploadEnabled, setSetPublicUploadEnabled] = useState(settings.publicUploadEnabled);
  const [setNewModelInput, setSetNewModelInput] = useState('');
  const [setNewCategoryInput, setSetNewCategoryInput] = useState('');
  const [setNewSectionInput, setSetNewSectionInput] = useState('');
  const [modelsList, setModelsList] = useState<string[]>(settings.availableModels);
  const [categoriesList, setCategoriesList] = useState<string[]>(settings.availableCategories);
  const [sectionsList, setSectionsList] = useState<string[]>(settings.availableSections || ['Příběhy', 'Osobnosti', 'Exploity', 'Ostatní']);
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark'>(settings.defaultTheme);
  const [userSearchText, setUserSearchText] = useState('');

  // Hlídání zámku přihlášení
  useEffect(() => {
    if (lockExpiresAt) {
      const interval = setInterval(() => {
        const diff = Math.max(0, Math.round((lockExpiresAt - Date.now()) / 1000));
        setTimeLeft(diff);
        if (diff <= 0) {
          setLockExpiresAt(null);
          setFailedAttempts(0);
          setLoginError('');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockExpiresAt]);

  // Inicializace modelů a kategorií u formuláře
  useEffect(() => {
    if (settings) {
      setFormModel(settings.availableModels[0] || 'GPT');
      setFormCategory(settings.availableCategories[0] || 'Programování');
    }
  }, [settings]);

  // Synchronizace nastavení, pokud se změní zvnějšku
  useEffect(() => {
    setSetAppName(settings.appName);
    setSetAppIntro(settings.appIntro);
    setSetPublicUploadEnabled(settings.publicUploadEnabled);
    setModelsList(settings.availableModels);
    setCategoriesList(settings.availableCategories);
    setSectionsList(settings.availableSections || ['Příběhy', 'Osobnosti', 'Exploity', 'Ostatní']);
    setDefaultTheme(settings.defaultTheme);
  }, [settings]);

  // Periodické načítání chatu
  useEffect(() => {
    if (!isOpen || !isAuthenticated || activeTab !== 'chat') return;

    const loadChats = () => {
      setAllMessages(dbService.getChatMessages());
    };

    loadChats();
    const interval = setInterval(loadChats, 3000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, activeTab]);

  if (!isOpen) return null;

  // --- FUNKCE PŘIHLÁŠENÍ ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (lockExpiresAt && Date.now() < lockExpiresAt) {
      return;
    }

    if (password === DEMO_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('is_admin_logged', 'true');
      setPassword('');
      setFailedAttempts(0);
      dbService.addLog('System', 'Úspěšné přihlášení admina', undefined, undefined, 'Administrátor se přihlásil do systému.');
    } else {
      const remainingAttempts = 5 - (failedAttempts + 1);
      if (remainingAttempts <= 0) {
        const lockTime = Date.now() + 30000; // 30 sekund
        setLockExpiresAt(lockTime);
        setTimeLeft(30);
        setLoginError('Příliš mnoho neúspěšných pokusů! Přihlášení bylo zablokováno na 30 sekund.');
        dbService.addLog('System', 'Zablokování přihlášení', undefined, undefined, 'Zablokování z důvodu 5 neúspěšných pokusů.');
      } else {
        setFailedAttempts(prev => prev + 1);
        setLoginError(`Nesprávné heslo! Zbývá ${remainingAttempts} pokusů.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_admin_logged');
    dbService.addLog('System', 'Odhlášení admina', undefined, undefined, 'Administrátor se odhlásil ze systému.');
  };

  // --- STATISTICKÉ UKAZATELE ---
  const stats = {
    total: prompts.length,
    approved: prompts.filter(p => p.status === 'approved').length,
    pending: prompts.filter(p => p.status === 'pending').length,
    rejected: prompts.filter(p => p.status === 'rejected').length,
    copies: prompts.reduce((sum, p) => sum + (p.copyCount || 0), 0),
    topModel: '',
    topCategory: ''
  };

  // Výpočet nejčastějšího modelu a kategorie
  const modelCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  prompts.forEach(p => {
    modelCounts[p.model] = (modelCounts[p.model] || 0) + 1;
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  });

  stats.topModel = Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b, 'Žádný');
  stats.topCategory = Object.keys(catCounts).reduce((a, b) => catCounts[a] > catCounts[b] ? a : b, 'Žádný');

  // --- AKCE PROMPTŮ ---
  const handleApprove = (id: string, isTested?: boolean) => {
    const original = prompts.find(p => p.id === id);
    if (!original) return;
    
    const finalTested = isTested === undefined ? true : isTested;

    // Pokud schvalujeme prompt a má nově navržený model/sekci/kategorii,
    // automaticky je přidáme do dostupných v Settings, aby se zobrazovaly v filtrech
    const updatedModels = [...(settings.availableModels || [])];
    if (original.model && !updatedModels.includes(original.model)) {
      updatedModels.push(original.model);
    }
    const updatedCategories = [...(settings.availableCategories || [])];
    if (original.category && !updatedCategories.includes(original.category)) {
      updatedCategories.push(original.category);
    }
    const updatedSections = [...(settings.availableSections || [])];
    if (original.section && !updatedSections.includes(original.section)) {
      updatedSections.push(original.section);
    }

    dbService.saveSettings({
      ...settings,
      availableModels: updatedModels,
      availableCategories: updatedCategories,
      availableSections: updatedSections
    });

    dbService.updatePrompt(id, { 
      status: 'approved', 
      approvedAt: new Date().toISOString(),
      tested: finalTested
    });
    
    dbService.addLog('Admin', 'Schválení promptu', id, original.title, `Prompt byl schválen (Testováno: ${finalTested ? 'Ano' : 'Ne'}).`);
    onDataRefresh();
  };

  const handleReject = (id: string) => {
    const original = prompts.find(p => p.id === id);
    if (!original) return;
    dbService.updatePrompt(id, { status: 'rejected' });
    dbService.addLog('Admin', 'Zamítnutí promptu', id, original.title, `Prompt byl zamítnut a skryt.`);
    onDataRefresh();
  };

  const handleDelete = (id: string) => {
    const original = prompts.find(p => p.id === id);
    if (!original) return;
    if (confirm(`Opravdu chcete smazat prompt "${original.title}"? Tato akce je nevratná.`)) {
      dbService.deletePrompt(id);
      dbService.addLog('Admin', 'Smazání promptu', id, original.title, `Prompt byl navždy smazán.`);
      onDataRefresh();
    }
  };

  // Spuštění editace promptu
  const handleEditClick = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormTitle(prompt.title);
    setFormAuthor(prompt.author || '');
    setFormModel(prompt.model);
    setFormCategory(prompt.category);
    setFormSection(prompt.section || 'Ostatní');
    setFormTested(prompt.tested !== false);
    setFormTags(prompt.tags.join(', '));
    setFormDescription(prompt.description);
    setFormContent(prompt.content);
    setFormStatus(prompt.status);
    setFormFeatured(prompt.featured);
    setActiveTab('add'); // Sdílí stejný formulář k úpravám
  };

  const handleAddOrEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formDescription.trim() || !formContent.trim()) {
      alert('Vyplňte prosím všechna povinná pole (*)');
      return;
    }

    const compiledTags = formTags
      .split(/[, ]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    const safeTitle = dbService.sanitizeInput(formTitle.trim());
    const safeAuthor = dbService.sanitizeInput(formAuthor.trim()) || 'Admin';

    if (editingPrompt) {
      // UPRAVIT
      dbService.updatePrompt(editingPrompt.id, {
        title: safeTitle,
        author: safeAuthor,
        model: formModel,
        category: formCategory,
        section: formSection,
        tested: formTested,
        tags: compiledTags,
        description: formDescription.trim(),
        content: formContent.trim(),
        status: formStatus,
        featured: formFeatured
      });

      dbService.addLog(
        'Admin',
        'Úprava promptu',
        editingPrompt.id,
        safeTitle,
        `Změněny detaily promptu. Stav nastaven na: ${formStatus}, sekce: ${formSection}, testováno: ${formTested ? 'Ano' : 'Ne'}, featured: ${formFeatured}`
      );

      setEditingPrompt(null);
      alert('Prompt byl úspěšně upraven.');
    } else {
      // PŘIDAT NOVÝ
      const newP = dbService.addPrompt({
        title: safeTitle,
        author: safeAuthor,
        model: formModel,
        category: formCategory,
        section: formSection,
        tested: formTested,
        tags: compiledTags,
        description: formDescription.trim(),
        content: formContent.trim(),
        status: formStatus,
        featured: formFeatured
      });

      dbService.addLog(
        'Admin',
        'Přidání promptu',
        newP.id,
        safeTitle,
        `Vytvořen nový prompt přímo administrátorem se stavem ${formStatus}, sekce: ${formSection}, testováno: ${formTested ? 'Ano' : 'Ne'}.`
      );

      alert('Nový prompt byl úspěšně přidán.');
    }

    // Vyčistit formulář
    setFormTitle('');
    setFormAuthor('');
    setFormTags('');
    setFormDescription('');
    setFormContent('');
    setFormFeatured(false);
    setFormStatus('approved');
    setFormSection('Ostatní');
    setFormTested(true);

    onDataRefresh();
    setActiveTab('manage');
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setFormTitle('');
    setFormAuthor('');
    setFormTags('');
    setFormDescription('');
    setFormContent('');
    setFormFeatured(false);
    setFormStatus('approved');
    setFormSection('Ostatní');
    setFormTested(true);
    setActiveTab('manage');
  };

  // --- AKCE NASTAVENÍ ---
  const handleAddNewModel = () => {
    if (!setNewModelInput.trim()) return;
    const model = setNewModelInput.trim();
    if (modelsList.includes(model)) {
      alert('Tento model již v seznamu existuje.');
      return;
    }
    const updated = [...modelsList, model];
    setModelsList(updated);
    setSetNewModelInput('');

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableModels: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Přidání modelu', undefined, undefined, `Byl přidán model do databáze: ${model}`);
    onDataRefresh();
  };

  const handleRemoveModel = (model: string) => {
    if (modelsList.length <= 1) {
      alert('Seznam musí obsahovat alespoň jeden model.');
      return;
    }
    const updated = modelsList.filter(m => m !== model);
    setModelsList(updated);

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableModels: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Smazání modelu', undefined, undefined, `Byl smazán model z databáze: ${model}`);
    onDataRefresh();
  };

  const handleAddNewCategory = () => {
    if (!setNewCategoryInput.trim()) return;
    const cat = setNewCategoryInput.trim();
    if (categoriesList.includes(cat)) {
      alert('Tato kategorie již v seznamu existuje.');
      return;
    }
    const updated = [...categoriesList, cat];
    setCategoriesList(updated);
    setSetNewCategoryInput('');

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableCategories: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Přidání kategorie', undefined, undefined, `Byla přidána kategorie do databáze: ${cat}`);
    onDataRefresh();
  };

  const handleRemoveCategory = (cat: string) => {
    if (categoriesList.length <= 1) {
      alert('Seznam musí obsahovat alespoň jednu kategorii.');
      return;
    }
    const updated = categoriesList.filter(c => c !== cat);
    setCategoriesList(updated);

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableCategories: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Smazání kategorie', undefined, undefined, `Byla smazána kategorie z databáze: ${cat}`);
    onDataRefresh();
  };

  const handleAddNewSection = () => {
    if (!setNewSectionInput.trim()) return;
    const sec = setNewSectionInput.trim();
    if (sectionsList.includes(sec)) {
      alert('Tato sekce již v seznamu existuje.');
      return;
    }
    const updated = [...sectionsList, sec];
    setSectionsList(updated);
    setSetNewSectionInput('');

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableSections: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Přidání sekce', undefined, undefined, `Byla přidána sekce do databáze: ${sec}`);
    onDataRefresh();
  };

  const handleRemoveSection = (sec: string) => {
    if (sectionsList.length <= 1) {
      alert('Seznam musí obsahovat alespoň jednu sekci.');
      return;
    }
    const updated = sectionsList.filter(s => s !== sec);
    setSectionsList(updated);

    // Okamžité uložení do databáze na pevno
    const updatedSettings = {
      ...settings,
      availableSections: updated
    };
    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Smazání sekce', undefined, undefined, `Byla smazána sekce z databáze: ${sec}`);
    onDataRefresh();
  };

  const handleSaveSettings = () => {
    const updatedSettings: AppSettings = {
      appName: setAppName.trim() || 'AI Prompt Databáze',
      appIntro: setAppIntro.trim(),
      publicUploadEnabled: setPublicUploadEnabled,
      availableModels: modelsList,
      availableCategories: categoriesList,
      availableSections: sectionsList,
      defaultTheme
    };

    dbService.saveSettings(updatedSettings);
    dbService.addLog('Admin', 'Změna nastavení', undefined, undefined, 'Byla upravena globální nastavení aplikace.');
    
    // Volba zavolání výchozího tématu pokud požadováno
    if (onThemeToggleRequested) {
      onThemeToggleRequested(defaultTheme);
    }

    alert('Nastavení aplikace bylo uloženo.');
    onDataRefresh();
  };

  // --- MAZÁNÍ LOGŮ ---
  const handleClearLogs = () => {
    if (confirm('Opravdu chcete vyčistit všechny administrační logy?')) {
      dbService.clearLogs();
      onDataRefresh();
    }
  };

  // --- SPRÁVA REGISTROVANÝCH UŽIVATELŮ ---
  const handleDeleteUser = (nickname: string) => {
    if (confirm(`Opravdu chcete trvale smazat uživatele "${nickname}"? Tato akce je nevratná.`)) {
      const users = dbService.getUsers().filter(u => u.nickname.toLowerCase() !== nickname.toLowerCase());
      localStorage.setItem('registered_users', JSON.stringify(users));
      dbService.addLog('Administrátor', 'Smazání uživatele', undefined, undefined, `Uživatelský účet "${nickname}" byl trvale odstraněn.`);
      onDataRefresh();
    }
  };

  // --- SEZNAM PENDING PROMPTŮ ---
  const pendingPrompts = prompts.filter(p => p.status === 'pending');

  // --- FILTROVÁNÍ PRO MANAGE LIST ---
  const filteredManagePrompts = prompts.filter(p => {
    const matchSearch =
      p.title.toLowerCase().includes(searchManageQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchManageQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchManageQuery.toLowerCase()) ||
      (p.author && p.author.toLowerCase().includes(searchManageQuery.toLowerCase())) ||
      p.tags.some(t => t.toLowerCase().includes(searchManageQuery.toLowerCase()));

    const matchModel = filterModel === 'Vše' || p.model === filterModel;
    const matchCategory = filterCategory === 'Vše' || p.category === filterCategory;
    const matchStatus = filterStatus === 'Vše' || p.status === filterStatus;

    return matchSearch && matchModel && matchCategory && matchStatus;
  }).sort((a, b) => {
    if (manageSortBy === 'copyCount') {
      return (b.copyCount || 0) - (a.copyCount || 0);
    }
    // výchozí řazení podle data vytvoření (nejnovější nahoře)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-hidden">
      <div 
        id="admin-dashboard-container"
        className="w-full h-full max-w-6xl bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[95vh] text-slate-800 dark:text-zinc-200"
      >
        {/* HORNÍ LIŠTA */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Administrační Panel <span className="text-xs text-indigo-500 font-mono ml-3">v1.2.0 Demo</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <LogOut size={13} />
                <span>Odhlásit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-zinc-400 rounded-lg transition"
              title="Zavřít administraci"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NEAUTORIZOVANÝ STAV - LOGIN FORM */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#09090b]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col items-center text-center">
              <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                <Lock size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Vyžadována autorizace
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-xs">
                Použijte administrační heslo pro přístup k pokročilým funkcím schvalování a správě promptů.
              </p>

              <form onSubmit={handleLogin} className="w-full text-left space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium flex gap-2 items-center">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Admin heslo
                  </label>
                  <input
                    type="password"
                    placeholder="Zadejte heslo..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockExpiresAt !== null}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={lockExpiresAt !== null}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {lockExpiresAt ? `Uzamčeno (${timeLeft}s)` : 'Ověřit a Přihlásit'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTORIZOVANÝ STAV - BODY DASHBOARDU */
          <div className="flex-1 flex overflow-hidden">
            {/* BOČNÍ MENU */}
            <div className="w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] flex flex-col justify-between hidden md:flex">
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => { setActiveTab('stats'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>Přehled (Statistiky)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('pending'); setEditingPrompt(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList size={16} />
                    <span>Čeká na schválení</span>
                  </div>
                  {pendingPrompts.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
                      {pendingPrompts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('add')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'add'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Plus size={16} />
                  <span>{editingPrompt ? 'Upravit Prompt' : 'Přidat nový prompt'}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('manage'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'manage'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Search size={16} />
                  <span>Správa promptů</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Settings size={16} />
                  <span>Nastavení aplikace</span>
                </button>

                <button
                  onClick={() => { setActiveTab('logs'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Activity size={16} />
                  <span>Admin logy</span>
                </button>

                <button
                  onClick={() => { setActiveTab('users'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Users size={16} />
                  <span>Registrovaní členové</span>
                </button>

                <button
                  onClick={() => { setActiveTab('chat'); setEditingPrompt(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>Soukromý chat s členy</span>
                </button>
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 text-center text-[10px] text-slate-400">
                AI Prompt Databáze &copy; 2026
              </div>
            </div>

            {/* AKTIVNÍ VÝŘEZ ZÁLOŽEK */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-[#0c0c0e] scrollbar-thin">
              {/* MOBILNÍ NAVIGACE (ZOBRAZI SE POUZE NA MOBILU) */}
              <div className="flex flex-wrap gap-1 mb-6 md:hidden">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Statistiky
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Pending ({pendingPrompts.length})
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'add' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Přidat / Upravit
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'manage' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Správa
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Nastavení
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Logy
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Členové
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  Chat s členy
                </button>
              </div>

              {/* 1. STATS TAB */}
              {activeTab === 'stats' && (
                <AdminStatsTab
                  prompts={prompts}
                  settings={settings}
                  stats={stats}
                  pendingPrompts={pendingPrompts}
                  pendingTested={pendingTested}
                  setPendingTested={setPendingTested}
                  onDataRefresh={onDataRefresh}
                  setActiveTab={setActiveTab}
                  setFilterStatus={setFilterStatus}
                  setManageSortBy={setManageSortBy}
                  handleApprove={handleApprove}
                  handleEditClick={handleEditClick}
                  handleReject={handleReject}
                />
              )}

              {/* 2. PENDING TAB */}
              {activeTab === 'pending' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Očekávající schválení ({pendingPrompts.length})</h2>
                  {pendingPrompts.length === 0 ? (
                    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-500">
                      Žádné uživatelské prompty nečekají na potvrzení.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingPrompts.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{p.title}</h3>
                                <div className="text-xs text-slate-500 mt-1">od <span className="font-semibold text-slate-700 dark:text-zinc-300">{p.author || 'Anonymní'}</span></div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold lowercase">
                                pending
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal mb-3">{p.description}</p>
                            
                            <div className="mb-3">
                              <span className="inline-block text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded font-medium mr-1.5">{p.model}</span>
                              <span className="inline-block text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded font-medium">{p.category}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-xs font-mono p-3 rounded-lg overflow-y-auto max-h-[120px] mb-4 text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                              {p.content}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                            <div className="flex items-center gap-1 mr-2 text-xs">
                              <span className="text-slate-500 font-semibold uppercase text-[10px]">Testováno:</span>
                              <select
                                value={pendingTested[p.id] !== false ? 'true' : 'false'}
                                onChange={(e) => setPendingTested({ ...pendingTested, [p.id]: e.target.value === 'true' })}
                                className="px-1.5 py-0.5 text-xs rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                              >
                                <option value="true">Ano</option>
                                <option value="false">Ne</option>
                              </select>
                            </div>
                            <button
                              onClick={() => handleApprove(p.id, pendingTested[p.id] !== false)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
                            >
                              Schválit
                            </button>
                            <button
                              onClick={() => handleEditClick(p)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer"
                            >
                              Upravit & Schválit
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded cursor-pointer"
                            >
                              Zamítnout
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded cursor-pointer"
                            >
                              Smazat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. ADD / EDIT PROMPT TAB */}
              {activeTab === 'add' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {editingPrompt ? `Upravit prompt (ID: ${editingPrompt.id})` : 'Manuální vložení promptu'}
                    </h2>
                    {editingPrompt && (
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold dark:text-zinc-300 rounded cursor-pointer"
                      >
                        Zrušit úpravy
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddOrEditSubmit} className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Název promptu *
                        </label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Např. GPT-4 SEO Master"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Identifikátor Autora / Přezdívka
                        </label>
                        <input
                          type="text"
                          value={formAuthor}
                          onChange={(e) => setFormAuthor(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Zadajte jméno (default: Admin)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          AI Model *
                        </label>
                        <select
                          value={formModel}
                          onChange={(e) => setFormModel(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {settings.availableModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Kategorie *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {settings.availableCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Sekce *
                        </label>
                        <select
                          value={formSection}
                          onChange={(e) => setFormSection(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {(settings.availableSections || ['Příběhy', 'Osobnosti', 'Exploity', 'Ostatní']).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Testováno *
                        </label>
                        <select
                          value={formTested ? 'true' : 'false'}
                          onChange={(e) => setFormTested(e.target.value === 'true')}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="true">Ano</option>
                          <option value="false">Ne</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Krátký popis *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Zadejte stručný účel a vlastnosti promptu..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Tagy (oddělené čárkami nebo mezerami)
                      </label>
                      <input
                        type="text"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tagy např. coding, marketing, midjourney, seo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        TĚLO PROMPTU *
                      </label>
                      <textarea
                        required
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Sem vložte plnohodnotné znění vašeho promptu..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Stav publikace
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none"
                        >
                          <option value="approved">Schválený (Veřejný)</option>
                          <option value="pending">Čeká na schválení (Pending)</option>
                          <option value="rejected">Zamítnutý (Skrytý)</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="inline-flex items-center cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={formFeatured}
                            onChange={(e) => setFormFeatured(e.target.checked)}
                            className="rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                          />
                          <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                            Zobrazit v Doporučených (Featured)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      {editingPrompt && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg font-semibold text-sm cursor-pointer"
                        >
                          Storno
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save size={16} />
                        <span>{editingPrompt ? 'Uložit změny' : 'Přidat a Publikovat'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 4. MANAGE PROMPTS TAB */}
              {activeTab === 'manage' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kompletní správa ({filteredManagePrompts.length})</h2>
                    <button
                      onClick={() => { setEditingPrompt(null); setActiveTab('add'); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Ručně přidat prompt</span>
                    </button>
                  </div>

                  {/* FILTRY */}
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Hledat podle nadpisu, obsahu, tagu..."
                        value={searchManageQuery}
                        onChange={(e) => setSearchManageQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        value={filterModel}
                        onChange={(e) => setFilterModel(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
                      >
                        <option value="Vše">Všechny Modely</option>
                        {settings.availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
                      >
                        <option value="Vše">Všechny Kategorie</option>
                        {settings.availableCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
                      >
                        <option value="Vše">Všechny Stavy</option>
                        <option value="approved">Schválené</option>
                        <option value="pending">Čekající ke schválení</option>
                        <option value="rejected">Zamítnuté</option>
                      </select>
                    </div>
                  </div>

                  {/* TABULKOVÝ SEZNAM */}
                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    {filteredManagePrompts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Žádné prompty neodpovídají zadanému filtru.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                          <thead className="text-[10px] font-bold uppercase bg-slate-50 dark:bg-zinc-900/40 text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                              <th className="p-4">Stav/Doporučený</th>
                              <th className="p-4">Název</th>
                              <th className="p-4">Model/Kategorie</th>
                              <th className="p-4">Autor</th>
                              <th className="p-4">Kopírováno</th>
                              <th className="p-4 text-right">Akce</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                            {filteredManagePrompts.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/20">
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    {p.status === 'approved' && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Schválený a veřejný" />
                                    )}
                                    {p.status === 'pending' && (
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Čeká na schválení" />
                                    )}
                                    {p.status === 'rejected' && (
                                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Zamítnutý" />
                                    )}
                                    
                                    {p.featured && (
                                      <Star size={13} className="text-amber-500 fill-amber-500" title="Doporučený" />
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-slate-900 dark:text-zinc-100 max-w-[180px] truncate">
                                  {p.title}
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{p.model}</span>
                                    <span className="text-[10px] text-slate-400">{p.category}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-500 truncate max-w-[100px]">{p.author || 'Anonymní'}</td>
                                <td className="p-4 text-center font-mono font-medium">{p.copyCount || 0}x</td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {p.status !== 'approved' && (
                                      <button
                                        onClick={() => handleApprove(p.id)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded cursor-pointer"
                                        title="Schválit"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEditClick(p)}
                                      className="p-1 text-blue-600 hover:bg-blue-500/10 rounded cursor-pointer"
                                      title="Upravit"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer"
                                      title="Smazat"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nastavení aplikace</h2>

                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-6">
                    {/* ZÁKLADNÍ NASTAVENÍ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Název aplikace
                        </label>
                        <input
                          type="text"
                          value={setAppName}
                          onChange={(e) => setSetAppName(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Výchozí grafické téma
                        </label>
                        <select
                          value={defaultTheme}
                          onChange={(e) => setDefaultTheme(e.target.value as any)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none"
                        >
                          <option value="light">Světlý režim (Light)</option>
                          <option value="dark">Tmavý režim (Dark)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Úvodní text (Intro pod nadpisem)
                      </label>
                      <textarea
                        value={setAppIntro}
                        onChange={(e) => setSetAppIntro(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setPublicUploadEnabled}
                          onChange={(e) => setSetPublicUploadEnabled(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                          Povolit veřejné nahrávání promptů uživateli
                        </span>
                      </label>
                    </div>

                    {/* MODELS LIST */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Správa AI Modelů</h3>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {modelsList.map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md font-medium text-slate-700 dark:text-zinc-300"
                          >
                            <span>{m}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveModel(m)}
                              className="text-slate-400 hover:text-rose-500 ml-1.5 focus:outline-none"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex max-w-sm gap-2">
                        <input
                          type="text"
                          placeholder="Přidat model..."
                          value={setNewModelInput}
                          onChange={(e) => setSetNewModelInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewModel}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Přidat
                        </button>
                      </div>
                    </div>

                    {/* CATEGORY LIST */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Správa Kategorií</h3>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {categoriesList.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md font-medium text-slate-700 dark:text-zinc-300"
                          >
                            <span>{c}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(c)}
                              className="text-slate-400 hover:text-rose-500 ml-1.5 focus:outline-none cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex max-w-sm gap-2">
                        <input
                          type="text"
                          placeholder="Přidat kategorii..."
                          value={setNewCategoryInput}
                          onChange={(e) => setSetNewCategoryInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Přidat
                        </button>
                      </div>
                    </div>

                    {/* SECTIONS LIST */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Správa Speciálních Sekcí</h3>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {sectionsList.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md font-medium text-slate-700 dark:text-zinc-300"
                          >
                            <span>{s}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(s)}
                              className="text-slate-400 hover:text-rose-500 ml-1.5 focus:outline-none cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex max-w-sm gap-2">
                        <input
                          type="text"
                          placeholder="Přidat sekci..."
                          value={setNewSectionInput}
                          onChange={(e) => setSetNewSectionInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewSection}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Přidat
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        onClick={handleSaveSettings}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Uložit konfiguraci</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. LOGS TAB */}
              {activeTab === 'logs' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Administrační záznamy (Logs)</h2>
                    <button
                      onClick={handleClearLogs}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Smazat logy
                    </button>
                  </div>

                  <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl">
                    <div className="flow-root">
                      <ul role="list" className="-mb-8">
                        {logs.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-sm">
                            Žádné logy k zobrazení.
                          </div>
                        ) : (
                          logs.map((log, logIdx) => {
                            const date = new Date(log.timestamp);
                            return (
                              <li key={log.id}>
                                <div className="relative pb-8">
                                  {logIdx !== logs.length - 1 ? (
                                    <span className="absolute left-4.5 top-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-zinc-800" aria-hidden="true" />
                                  ) : null}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-9 w-9 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full flex items-center justify-center">
                                        <Activity size={14} className="text-indigo-600 dark:text-indigo-400" />
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-xs text-slate-800 dark:text-zinc-200 font-semibold">
                                          {log.action}{' '}
                                          {log.promptTitle && (
                                            <span className="font-mono text-indigo-500 font-bold">
                                              "{log.promptTitle}"
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                                          {log.details} &bull; Provedl: {log.adminName}
                                        </p>
                                      </div>
                                      <div className="text-right text-[10px] whitespace-nowrap text-slate-400">
                                        {date.toLocaleDateString('cs-CZ')} {date.toLocaleTimeString('cs-CZ')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. USERS TAB */}
              {activeTab === 'users' && (
                <AdminUsersTab
                  userSearchText={userSearchText}
                  setUserSearchText={setUserSearchText}
                  prompts={prompts}
                  visiblePasswords={visiblePasswords}
                  setVisiblePasswords={setVisiblePasswords}
                  handleDeleteUser={handleDeleteUser}
                  inspectedUser={inspectedUser}
                  setInspectedUser={setInspectedUser}
                  getUsers={dbService.getUsers}
                />
              )}

              {/* 8. CHAT TAB */}
              {activeTab === 'chat' && (
                <AdminChatTab
                  dbService={dbService}
                  allMessages={allMessages}
                  setAllMessages={setAllMessages}
                  selectedUserForChat={selectedUserForChat}
                  setSelectedUserForChat={setSelectedUserForChat}
                  adminChatText={adminChatText}
                  setAdminChatText={setAdminChatText}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
