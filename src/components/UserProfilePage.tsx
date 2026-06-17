import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Key, Award, Clock, MessageSquare, ArrowLeft, Save, 
  Check, AlertTriangle, Shield, Clipboard, ArrowRight, Eye, Play, ListCollapse, Send, RefreshCw
} from 'lucide-react';
import { dbService } from '../database';
import { RegisteredUser, Prompt } from '../types';

interface UserProfilePageProps {
  currentUser: RegisteredUser;
  prompts: Prompt[];
  onBack: () => void;
  onCopySuccess: (title: string) => void;
  refreshData: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  prompts,
  onBack,
  onCopySuccess,
  refreshData
}) => {
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Active workspace profile tab
  const [activeProfileTab, setActiveProfileTab] = useState<'prompts' | 'approved' | 'chat'>('prompts');

  // Interactive private/channel chat state inside the profile
  const [chatRecipient, setChatRecipient] = useState<string>('Admin');
  const [profileMessages, setProfileMessages] = useState(() => dbService.getChatMessages());
  const [profileChatInput, setProfileChatInput] = useState('');
  const profileChatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll down when messages update or recipient shifts
  useEffect(() => {
    if (profileChatEndRef.current) {
      profileChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [profileMessages, chatRecipient, activeProfileTab]);

  // Synchronize private messages periodically in the background
  useEffect(() => {
    const handleUpdate = () => {
      setProfileMessages(dbService.getChatMessages());
    };
    const interval = setInterval(handleUpdate, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filtering user-specific prompts
  const userPrompts = prompts.filter(p => p.author?.toLowerCase() === currentUser.nickname.toLowerCase());
  const approvedCount = userPrompts.filter(p => p.status === 'approved').length;
  const pendingCount = userPrompts.filter(p => p.status === 'pending').length;

  // Retrieve user messages count
  const allMessages = dbService.getChatMessages();
  const userMessagesCount = allMessages.filter(
    m => m.sender === currentUser.nickname || m.recipient === currentUser.nickname
  ).length;

  // Filter messages for the active profile chat selection
  const filteredProfileMessages = profileMessages.filter(msg => {
    if (chatRecipient === 'All') {
      return msg.recipient === 'All';
    } else if (chatRecipient === 'Admin') {
      return (
        (msg.sender === currentUser.nickname && msg.recipient === 'Admin') ||
        (msg.sender === 'Administrátor' && msg.recipient === currentUser.nickname)
      );
    } else {
      return (
        (msg.sender === currentUser.nickname && msg.recipient === chatRecipient) ||
        (msg.sender === chatRecipient && msg.recipient === currentUser.nickname)
      );
    }
  });

  const handleSendProfileMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileChatInput.trim()) return;

    const newMsg = dbService.addChatMessage(
      currentUser.nickname,
      chatRecipient,
      profileChatInput.trim()
    );

    setProfileMessages(prev => [...prev, newMsg]);
    setProfileChatInput('');
    refreshData();

    // Trigger funny simulation response
    if (chatRecipient === 'Admin') {
      setTimeout(() => {
        const reply = dbService.addChatMessage(
          'Administrátor',
          currentUser.nickname,
          `Ahoj ${currentUser.nickname}, děkuji za zprávu zaslanou přímo z tvého profilu. Tvůj podnět prověřím co nejdříve.`
        );
        setProfileMessages(dbService.getChatMessages());
        refreshData();
      }, 1500);
    } else if (chatRecipient !== 'All') {
      const targetUser = chatRecipient;
      setTimeout(() => {
        const greetings = [
          `Ahoj ${currentUser.nickname}! Skvělý prompt se ti podařilo sdílet!`,
          `Zrovna testuju tvoje prompty v profilu, jedou skvěle.`,
          `Super, díky za zprávu do mých soukromých zpráv! Kouknu na to.`,
          `Ahoj, jsem teď mimo, ale jak se vrátím, vyzkouším.`
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const reply = dbService.addChatMessage(
          targetUser,
          currentUser.nickname,
          randomGreeting
        );
        setProfileMessages(dbService.getChatMessages());
        refreshData();
      }, 2000);
    } else {
      setTimeout(() => {
        const systemUsers = dbService.getUsers().filter(u => u.nickname !== currentUser.nickname);
        if (systemUsers.length > 0) {
          const randomUser = systemUsers[Math.floor(Math.random() * systemUsers.length)].nickname;
          const reply = dbService.addChatMessage(
            randomUser,
            'All',
            `Ahoj lidi! Vidím, že ${currentUser.nickname} píše do chatu přímo ze svého členského profilu. To je skvělé! 🔥`
          );
          setProfileMessages(dbService.getChatMessages());
          refreshData();
        }
      }, 3000);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Všechna pole musí být vyplněna.');
      return;
    }

    // Standard hash lookup or exact check
    const users = dbService.getUsers();
    const dbUser = users.find(u => u.nickname.toLowerCase() === currentUser.nickname.toLowerCase());
    
    if (!dbUser) {
      setPasswordError('Uživatel nebyl nalezen v databázi.');
      return;
    }

    // Verify current password
    if (dbUser.passwordHash !== currentPassword) {
      setPasswordError('Současné heslo je zadáno nesprávně.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Nové heslo musí mít alespoň 4 znaky.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Nová hesla se neshodují.');
      return;
    }

    try {
      dbService.updateUserPassword(currentUser.nickname, newPassword);
      
      // Update the session stored user
      const updatedUser: RegisteredUser = {
        ...currentUser,
        passwordHash: newPassword
      };
      localStorage.setItem('apolos_current_user', JSON.stringify(updatedUser));
      
      setPasswordSuccess('Heslo bylo úspěšně změněno.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshData();
    } catch (err: any) {
      setPasswordError(err.message || 'Chyba při změně hesla.');
    }
  };

  return (
    <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 md:p-8 space-y-8 animate-fade-in backdrop-blur-md">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-900 border border-brand-border hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Zpět na hlavní stranu</span>
          </button>
          
          <div className="h-5 w-px bg-brand-border hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center font-black text-sm uppercase">
              {currentUser.nickname.substring(0, 2)}
            </div>
            <div>
              <h1 className="text-sm font-black text-brand-text uppercase tracking-wider leading-none">
                Můj Profil
              </h1>
              <p className="text-[10px] text-[#8b5cf6] font-extrabold mt-1">
                Aktivní člen: <strong className="text-brand-text font-black">{currentUser.nickname}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center font-mono">
          <span className="text-[9px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1">
            <Shield size={10} />
            Registrovaný člen
          </span>
        </div>
      </div>

      {/* Grid containing analytics and tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column (8/12 - stats and prompts) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stats section (Interactive Tabs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveProfileTab('prompts')}
              className={`p-4 bg-brand-card/60 border rounded-2xl flex items-center gap-3.5 shadow-xs text-left w-full transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                activeProfileTab === 'prompts'
                  ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 shadow-lg shadow-[#8b5cf6]/5'
                  : 'border-brand-border hover:border-[#8b5cf6]/30'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#8b5cf6]/10 text-[#a78bfa]">
                <Award size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-brand-text font-mono leading-none">{userPrompts.length}</span>
                <span className="text-[10px] text-brand-muted uppercase font-black tracking-wider mt-1.5 leading-none">Celkem promptů</span>
              </div>
            </button>

            <button
              onClick={() => setActiveProfileTab('approved')}
              className={`p-4 bg-brand-card/60 border rounded-2xl flex items-center gap-3.5 shadow-xs text-left w-full transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                activeProfileTab === 'approved'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-brand-border hover:border-emerald-500/30'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Check size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-brand-text font-mono leading-none">{approvedCount}</span>
                <span className="text-[10px] text-brand-muted uppercase font-black tracking-wider mt-1.5 leading-none">Schválené</span>
              </div>
            </button>

            <button
              onClick={() => setActiveProfileTab('chat')}
              className={`p-4 bg-brand-card/60 border rounded-2xl flex items-center gap-3.5 shadow-xs text-left w-full transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                activeProfileTab === 'chat'
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/5 animate-pulse-subtle'
                  : 'border-brand-border hover:border-pink-500/30'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
                <MessageSquare size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-brand-text font-mono leading-none">{userMessagesCount}</span>
                <span className="text-[10px] text-brand-muted uppercase font-black tracking-wider mt-1.5 leading-none">Zpráv v chatu</span>
              </div>
            </button>
          </div>

          {/* Dynamic tabs switcher section */}
          {activeProfileTab === 'chat' ? (
            <div className="bg-brand-card/45 border border-brand-border rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h2 className="text-xs font-black text-brand-text uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-pink-500" />
                  <span>Soukromé zprávy s členským profilem</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono font-black uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full">
                    SOUKROMÝ CHAT
                  </span>
                </div>
              </div>

              {/* Chat application structure embedded right in the user profile dashboard layout */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 h-[350px] rounded-2xl overflow-hidden border border-brand-border">
                
                {/* Conversations selection panel (Left bar) */}
                <div className="sm:col-span-4 bg-zinc-950/40 p-2 space-y-1 flex flex-col overflow-y-auto border-r border-[#8b5cf6]/10">
                  <span className="text-[8px] font-black uppercase text-[#a78bfa] px-1 mb-1 tracking-wider block">Adresát zpráv</span>
                  
                  {/* Administrátor private inbox */}
                  <button
                    onClick={() => setChatRecipient('Admin')}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-[10px] font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                      chatRecipient === 'Admin'
                        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${chatRecipient === 'Admin' ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="truncate">Hlavní Administrátor 🔒</span>
                  </button>

                  {/* Public local room channel */}
                  <button
                    onClick={() => setChatRecipient('All')}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-[10px] font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                      chatRecipient === 'All'
                        ? 'bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#c084fc]'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${chatRecipient === 'All' ? 'bg-[#8b5cf6] animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="truncate">Všichni (Komunita) 📢</span>
                  </button>

                  <div className="h-px bg-[#8b5cf6]/10 my-1 pb-1" />
                  <span className="text-[8px] font-black uppercase text-brand-muted px-1 mb-1 tracking-wider block">Ostatní členové</span>

                  {/* Registered members listing */}
                  {dbService.getUsers()
                    .filter(u => u.nickname.toLowerCase() !== currentUser.nickname.toLowerCase())
                    .map(user => (
                      <button
                        key={user.nickname}
                        onClick={() => setChatRecipient(user.nickname)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] transition flex items-center gap-1.5 cursor-pointer font-semibold ${
                          chatRecipient === user.nickname
                            ? 'bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <User size={10} className="text-zinc-600 shrink-0" />
                        <span className="truncate">{user.nickname}</span>
                      </button>
                    ))}
                </div>

                {/* Dialog thread details (Right area) */}
                <div className="sm:col-span-8 flex flex-col h-full bg-zinc-950/20">
                  <div className="px-3 py-1.5 bg-zinc-950/30 border-b border-brand-border/60 flex items-center justify-between text-[10px] text-zinc-400 font-extrabold pb-2">
                    <span className="truncate">
                      {chatRecipient === 'All' 
                        ? '📢 Komunitní kanál (Všichni)' 
                        : chatRecipient === 'Admin' 
                        ? '🔒 Soukromá konverzace s Administrátorem' 
                        : `💬 Zprávový kanál: Celá historie s ${chatRecipient}`}
                    </span>
                    <button 
                      onClick={() => {
                        refreshData();
                        setProfileMessages(dbService.getChatMessages());
                      }}
                      className="text-[#a78bfa] hover:text-white p-0.5 rounded hover:bg-[#8b5cf6]/15 transition cursor-pointer"
                      title="Aktualizovat dialog"
                    >
                      <RefreshCw size={11} className="animate-spin-once" />
                    </button>
                  </div>

                  {/* Messages container list */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[250px]">
                    {filteredProfileMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-60">
                        <MessageSquare size={20} className="text-zinc-700 mb-1" />
                        <span className="text-[10px] font-black text-brand-text">Žádné dosavadní zprávy</span>
                        <p className="text-[9px] text-brand-muted mt-0.5 max-w-[180px]">
                          Zde se zobrazují vaše soukromé chaty. Zašlete první zprávu!
                        </p>
                      </div>
                    ) : (
                      filteredProfileMessages.map(msg => {
                        const isMe = msg.sender === currentUser.nickname;
                        const isSystem = msg.sender === 'Systém';
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && !isSystem && (
                              <span className="text-[8px] font-black text-[#8b5cf6] mb-0.5 px-0.5 uppercase tracking-wider">
                                {msg.sender === 'Administrátor' ? '👔 Admin' : msg.sender}
                              </span>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[10px] leading-relaxed break-words font-semibold ${
                              isMe 
                                ? 'bg-[#8b5cf6] text-white rounded-tr-none' 
                                : msg.sender === 'Administrátor'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-tl-none font-semibold'
                                : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/30'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[7px] text-brand-muted mt-0.5 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={profileChatEndRef} />
                  </div>

                  {/* Message submit form input field */}
                  <form onSubmit={handleSendProfileMessage} className="p-2 border-t border-brand-border bg-zinc-950/40 flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder={`Napsat uživateli ${chatRecipient}...`}
                      value={profileChatInput}
                      onChange={e => setProfileChatInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-brand-border px-3 py-1.5 rounded-xl text-[10px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] font-semibold"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-2 rounded-xl transition cursor-pointer"
                    >
                      <Send size={11} fill="currentColor" />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-brand-card/45 border border-brand-border rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h2 className="text-xs font-black text-brand-text uppercase tracking-widest flex items-center gap-2">
                  <ListCollapse size={14} className="text-[#8b5cf6]" />
                  <span>
                    {activeProfileTab === 'approved' 
                      ? 'Mé schválené prompty v knihovně' 
                      : 'Moje vytvořené prompty'}
                  </span>
                </h2>
                <span className="text-[10px] bg-brand-border text-brand-muted font-bold px-2 py-0.5 rounded-md font-mono">
                  Zobrazeno: {
                    activeProfileTab === 'approved' 
                      ? userPrompts.filter(p => p.status === 'approved').length 
                      : userPrompts.length
                  }
                </span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(activeProfileTab === 'approved' 
                  ? userPrompts.filter(p => p.status === 'approved') 
                  : userPrompts).length > 0 ? (
                  (activeProfileTab === 'approved' 
                    ? userPrompts.filter(p => p.status === 'approved') 
                    : userPrompts).map((p) => {
                    const isApproved = p.status === 'approved';
                    return (
                      <div 
                        key={p.id} 
                        className="p-3 bg-brand-card border border-brand-border hover:border-[#8b5cf6]/30 rounded-2xl transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-extrabold text-xs text-brand-text truncate max-w-[200px]">{p.title}</h4>
                            <span className="text-[8px] font-mono font-black uppercase bg-[#8b5cf6]/10 text-[#a78bfa] border border-[#8b5cf6]/20 px-1.5 py-0.2 rounded">
                              {p.model}
                            </span>
                            <span className="text-[8px] font-mono font-black uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-brand-muted font-semibold truncate italic">{p.description}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                          <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${
                            isApproved 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {isApproved ? 'Schválený' : 'Čeká na schválení'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(p.content);
                                onCopySuccess(p.title);
                              }}
                              className="p-1.5 bg-brand-bg hover:bg-[#8b5cf6]/15 hover:text-[#8b5cf6] border border-brand-border rounded-xl text-brand-muted transition cursor-pointer"
                              title="Zkopírovat obsah"
                            >
                              <Clipboard size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-brand-muted bg-brand-bg/50 border border-brand-border/60 rounded-2xl italic flex flex-col items-center justify-center p-4">
                    <Play size={20} className="text-zinc-600 mb-2 rotate-90" />
                    <span className="text-xs font-bold text-brand-text">Zatím žádné prompty</span>
                    <p className="text-[10px] text-brand-muted max-w-[240px] mt-1">
                      {activeProfileTab === 'approved' 
                        ? 'Nemáte schválené žádné prompty k veřejné publikaci.' 
                        : 'Ještě jste nepublikovali žádné prompty v naší komunitní databázi. Zkuste přidat svůj první!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column (4/12 - password changing) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#120f2b]/50 border border-[#8b5cf6]/15 rounded-3xl p-5 space-y-5 shadow-xs">
            <div className="border-b border-brand-border pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Key size={14} className="text-[#a78bfa]" />
                <span>Zabezpečení & heslo</span>
              </h2>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-xl flex items-center gap-1.5 leading-snug">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-xl flex items-center gap-1.5 leading-snug">
                <Check size={13} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block pl-1">
                  Současné heslo
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-brand-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block pl-1">
                  Nové heslo
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-brand-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block pl-1">
                  Potvrdit nové heslo
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-brand-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Save size={12} />
                <span>Aktualizovat heslo</span>
              </button>
            </form>
          </div>

          {/* Device details & security summary */}
          <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 space-y-3 shadow-xs text-brand-muted text-[10px] leading-relaxed">
            <span className="font-extrabold uppercase text-brand-text tracking-wider text-[9px] block mb-1">
              Informace o relaci
            </span>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-extrabold">Aktivní připojení</span>
            </div>
            <div className="flex justify-between">
              <span>Způsob ověření:</span>
              <span className="font-mono">Local secure hash</span>
            </div>
            <div className="flex justify-between">
              <span>Klientská verze:</span>
              <span className="font-mono">v1.2.9 (PRO)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
