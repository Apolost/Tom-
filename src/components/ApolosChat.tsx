import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, ChevronUp, ChevronDown, Monitor, RefreshCw } from 'lucide-react';
import { dbService } from '../database';
import { ChatMessage, RegisteredUser } from '../types';

interface ApolosChatProps {
  currentUser: RegisteredUser | null;
  onOpenLogin: () => void;
  isAdminLogged?: boolean;
}

export const ApolosChat: React.FC<ApolosChatProps> = ({ currentUser, onOpenLogin, isAdminLogged = false }) => {
  // Ordinary floating chat for users
  const [isOpen, setIsOpen] = useState(false);
  
  // Right slide drawer chat for Admin
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<'All' | 'Admin' | string>('All');
  
  // Admin drawer has its own separate active recipient to not clash
  const [adminActiveRecipient, setAdminActiveRecipient] = useState<string>('All');

  const [inputText, setInputText] = useState('');
  const [adminInputText, setAdminInputText] = useState('');
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);

  // Načtení zpráv a uživatelů
  const loadChatData = () => {
    const chatMsgs = dbService.getChatMessages();
    setMessages(chatMsgs);

    const allUsers = dbService.getUsers();
    setUsersList(allUsers);
  };

  useEffect(() => {
    loadChatData();
    // Pravidelný interval pro simulaci "živého" chatování
    const interval = setInterval(() => {
      loadChatData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Automatické skrolování dolů při nových zprávách (uživatel)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeRecipient, isOpen]);

  // Automatické skrolování dolů při nových zprávách (admin drawer)
  useEffect(() => {
    if (adminMessagesEndRef.current) {
      adminMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, adminActiveRecipient, isAdminDrawerOpen]);

  const handleSendMessage = (e: React.FormEvent, senderName: string, recipient: string, text: string, clearFn: () => void) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMsg = dbService.addChatMessage(
      senderName,
      recipient,
      text.trim()
    );

    setMessages((prev) => [...prev, newMsg]);
    clearFn();

    // Simulovaná odpověď od Admina nebo ostatních uživatelů
    if (recipient === 'Admin' && senderName !== 'Administrátor') {
      setTimeout(() => {
        const reply = dbService.addChatMessage(
          'Administrátor',
          senderName,
          `Ahoj ${senderName}, děkuji za zprávu. Vaše podněty a prompty prověřím hned, jak to bude možné.`
        );
        setMessages((prev) => [...prev, reply]);
      }, 1500);
    } else if (recipient !== 'All' && senderName !== 'Administrátor') {
      const targetUser = recipient;
      setTimeout(() => {
        const greetings = [
          `Čau ${senderName}! Skvělý prompt se ti podařilo sdílet!`,
          `Ahoj! Zrovna testuju tvoje prompty na Claude, fungují skvěle.`,
          `Super, díky za zprávu! Kouknu na to.`,
          `Ahoj, jsem teď off, ale jak se vrátím, vyzkouším.`
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const reply = dbService.addChatMessage(
          targetUser,
          senderName,
          randomGreeting
        );
        setMessages((prev) => [...prev, reply]);
      }, 2000);
    } else if (recipient === 'All') {
      // Pro Komunitní chat (Všichni) - občas odpoví náhodný uživatel
      setTimeout(() => {
        const systemUsers = usersList.filter(u => u.nickname !== senderName);
        if (systemUsers.length > 0) {
          const randomUser = systemUsers[Math.floor(Math.random() * systemUsers.length)].nickname;
          const replies = [
            `Ahoj všichni! Zkoušel už někdo ten nový prompt pro Midjourney?`,
            `Ty prompty tady jsou fakt top, hodně mi to šetří čas v práci.`,
            `Nevíte někdo, jak nejlíp donutit Gemini psát čistý kód bez zbytečných keců?`,
            `Vítejte v novém chatu! 🚀`,
            `Ten Admin to tu schvaluje celkem rychle, super práce!`
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const reply = dbService.addChatMessage(
            randomUser,
            'All',
            randomReply
          );
          setMessages((prev) => [...prev, reply]);
        }
      }, 3500);
    }
  };

  // --- FILTROVÁNÍ PRO UŽIVATELE ---
  const activeConversationMessages = currentUser ? messages.filter((msg) => {
    if (activeRecipient === 'All') {
      return msg.recipient === 'All';
    } else if (activeRecipient === 'Admin') {
      return (
        (msg.sender === currentUser.nickname && msg.recipient === 'Admin') ||
        (msg.sender === 'Administrátor' && msg.recipient === currentUser.nickname)
      );
    } else {
      return (
        (msg.sender === currentUser.nickname && msg.recipient === activeRecipient) ||
        (msg.sender === activeRecipient && msg.recipient === currentUser.nickname)
      );
    }
  }) : [];

  // --- FILTROVÁNÍ PRO ADMINA ---
  const adminConversationMessages = messages.filter((msg) => {
    if (adminActiveRecipient === 'All') {
      return msg.recipient === 'All';
    } else {
      // Private messages with chosen user
      return (
        (msg.sender === 'Administrátor' && msg.recipient === adminActiveRecipient) ||
        (msg.sender === adminActiveRecipient && msg.recipient === 'Administrátor') ||
        (msg.sender === adminActiveRecipient && msg.recipient === 'Admin')
      );
    }
  });

  return (
    <>
      {/* ========================================== */}
      {/* 1. STANDARDNÍ BUBBLING CHAT PRO PŘIHLÁŠENÉ ČLENY */}
      {/* ========================================== */}
      {currentUser && (
        <div className="fixed bottom-4 right-4 z-[90] font-sans flex flex-col items-end">
          {/* TLAČÍTKO CHATU (COLLAPSED) */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-full shadow-2xl hover:brightness-110 active:scale-95 transition-all text-xs font-black uppercase tracking-wider cursor-pointer border border-[#8b5cf6]/30 group"
              id="chat-toggle-button"
            >
              <MessageSquare size={16} className="text-white animate-bounce-soft" />
              <span>Komunitní Chat</span>
              <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono">
                {usersList.length + 1}
              </span>
            </button>
          )}

          {/* ROZBALENÝ PANEL */}
          {isOpen && (
            <div 
              id="apolos-live-chat"
              className="w-[380px] sm:w-[500px] h-[480px] bg-white dark:bg-[#0b091a] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
            >
              {/* Hlavička */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-4 py-3 text-white flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wider uppercase bg-gradient-to-r from-violet-300 via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
                      Apolos Komunita & Admin Chat
                    </h3>
                    <p className="text-[9px] text-[#8b5cf6] font-mono leading-none mt-0.5 uppercase font-bold">
                      Přihlášen jako: {currentUser.nickname}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={loadChatData}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer text-xs"
                    title="Obnovit chat"
                  >
                    <RefreshCw size={12} className="hover:rotate-180 duration-500 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                    title="Minimalizovat"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Dvojpanel - Levý: Kontakty / Pravý: Chat zprávy */}
              <div className="flex-1 flex overflow-hidden">
                {/* LEVÁ LIŠTA - SEZNAM LIDÍ A CHATŮ */}
                <div className="w-[120px] sm:w-[160px] border-r border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 flex flex-col justify-between overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <div className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 px-1 mb-1 tracking-widest">
                      Kanály
                    </div>
                    
                    {/* Komunitní chat */}
                    <button
                      onClick={() => setActiveRecipient('All')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer truncate ${
                        activeRecipient === 'All'
                          ? 'bg-[#8b5cf6]/15 text-[#8b5cf6]'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full" />
                      <span className="truncate">Všichni (Komunita)</span>
                    </button>

                    {/* Zpráva Adminovi */}
                    <button
                      onClick={() => setActiveRecipient('Admin')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer truncate ${
                        activeRecipient === 'Admin'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span className="truncate">Napsat Adminovi</span>
                    </button>

                    <div className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 px-1 pt-3 mb-1 tracking-widest">
                      Přihlášení členové
                    </div>

                    {/* Seznam registrovaných */}
                    {usersList.filter(u => u.nickname !== currentUser.nickname).length === 0 ? (
                      <div className="text-[9px] text-slate-400 dark:text-zinc-600 text-center py-3 italic leading-tight">
                        Žádní další uživatelé
                      </div>
                    ) : (
                      usersList
                        .filter(u => u.nickname !== currentUser.nickname)
                        .map((user) => (
                          <button
                            key={user.nickname}
                            onClick={() => setActiveRecipient(user.nickname)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] sm:text-xs transition flex items-center gap-1.5 cursor-pointer truncate font-semibold ${
                              activeRecipient === user.nickname
                                ? 'bg-[#8b5cf6]/15 text-[#8b5cf6]'
                                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                            }`}
                          >
                            <User size={10} className="text-slate-400" />
                            <span className="truncate">{user.nickname}</span>
                          </button>
                        ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-zinc-800 text-[8px] text-slate-400 dark:text-zinc-500 text-center font-mono uppercase tracking-wider">
                    Studio Apolos
                  </div>
                </div>

                {/* PRAVÝ PANEL - AKTIVNÍ CHAT */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0a1f]/30">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#8b5cf6] truncate">
                      {activeRecipient === 'All' 
                        ? '📢 Komunitní kanál (veřejný)' 
                        : activeRecipient === 'Admin' 
                        ? '🔒 Konverzace s Administrátorem' 
                        : `💬 Soukromá zpráva: ${activeRecipient}`}
                    </span>
                  </div>

                  {/* Seznam zpráv */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {activeConversationMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <MessageSquare size={18} className="text-slate-300 dark:text-zinc-700 mb-1" />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                          Žádné zprávy v tomto chatu
                        </p>
                      </div>
                    ) : (
                      activeConversationMessages.map((msg) => {
                        const isMe = msg.sender === currentUser.nickname;
                        const isSystem = msg.sender === 'Systém';
                        
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && !isSystem && (
                              <span className="text-[8px] font-black text-[#8b5cf6] mb-0.5 px-1 uppercase tracking-wider">
                                {msg.sender === 'Administrátor' ? '👔 Admin' : msg.sender}
                              </span>
                            )}
                            
                            <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed break-words font-medium ${
                              isSystem
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 mx-auto text-center font-bold text-[9px] w-full rounded-md py-1'
                                : isMe
                                ? 'bg-[#8b5cf6] text-white rounded-tr-none'
                                : msg.sender === 'Administrátor'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-tl-none font-semibold'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none'
                            }`}>
                              {msg.content}
                            </div>
                            
                            <span className="text-[7px] text-slate-400 px-1 mt-0.5 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Psaní zprávy */}
                  <form 
                    onSubmit={(e) => handleSendMessage(e, currentUser.nickname, activeRecipient, inputText, () => setInputText(''))} 
                    className="p-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/20 flex gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Napište zprávu..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] font-semibold text-slate-900 dark:text-zinc-100"
                    />
                    <button
                      type="submit"
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white p-1.5 rounded-xl cursor-pointer transition shrink-0"
                    >
                      <Send size={13} fill="currentColor" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. PINNED POSUVNÝ DRAW-PANEL PRO PŘIHLÁŠENÉHO ADMINA */}
      {/* ========================================== */}
      {isAdminLogged && (
        <>
          {/* Pinned Tab Tab-button na pravé hraně obrazovky (tak jak připnutí z prava) */}
          <button
            onClick={() => setIsAdminDrawerOpen(true)}
            className="fixed top-1/2 right-0 -translate-y-1/2 z-[130] bg-rose-600 hover:bg-rose-500 border-l border-y border-[#8b5cf6]/30 text-white rounded-l-2xl shadow-2xl px-2.5 py-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 transform translate-x-1 hover:translate-x-0 group"
            id="admin-live-chat-pinned"
            title="Otevřít administrátorský komunitní chat"
          >
            <MessageSquare size={16} className="text-white animate-pulse group-hover:scale-110 duration-200" />
            <span className="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none leading-none">
              Komunitní Chat
            </span>
          </button>

          {/* Posuvný Admin Chat Panel */}
          <div 
            className={`fixed top-0 right-0 h-full w-[360px] sm:w-[500px] z-[210] bg-white dark:bg-[#0b0920] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isAdminDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Hlavička Draweru */}
            <div className="bg-gradient-to-r from-rose-950 to-slate-950 px-4 py-3.5 text-white flex items-center justify-between border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <h3 className="text-xs font-extrabold tracking-wider uppercase bg-gradient-to-r from-rose-300 via-amber-300 to-[#c084fc] bg-clip-text text-transparent">
                    Apolos Admin Komunita
                  </h3>
                  <p className="text-[9px] text-[#f43f5e] font-mono leading-none mt-0.5 uppercase font-bold">
                    Přihlášen: Hlavní Administrátor
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadChatData}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-slate-300 hover:text-white transition cursor-pointer text-xs"
                  title="Obnovit chat"
                >
                  <RefreshCw size={12} className="hover:rotate-180 duration-500 transition-transform" />
                </button>
                <button 
                  onClick={() => setIsAdminDrawerOpen(false)}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Zavřít panel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Speciální dvousloupcový workspace pro robustní chat */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Seznam kanálů a uživatelů */}
              <div className="w-[120px] sm:w-[160px] border-r border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 flex flex-col justify-between overflow-y-auto">
                <div className="p-2 space-y-1">
                  <div className="text-[8px] font-black uppercase text-rose-500 dark:text-rose-400 px-1 mb-1 tracking-widest">
                    Kanály
                  </div>
                  
                  {/* Komunitní chat */}
                  <button
                    onClick={() => setAdminActiveRecipient('All')}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer truncate ${
                      adminActiveRecipient === 'All'
                        ? 'bg-rose-500/10 text-rose-500 border-l-2 border-rose-500 pl-1.5'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    <span className="truncate">Všichni (Komunita)</span>
                  </button>

                  <div className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 px-1 pt-3 mb-1 tracking-widest">
                    Členové k odpovědi
                  </div>

                  {/* Seznam registrovaných */}
                  {usersList.length === 0 ? (
                    <div className="text-[9px] text-zinc-500 text-center py-4 italic">
                      Žádní registrovaní členové
                    </div>
                  ) : (
                    usersList.map((user) => (
                      <button
                        key={user.nickname}
                        onClick={() => setAdminActiveRecipient(user.nickname)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] sm:text-xs transition flex items-center gap-1.5 cursor-pointer truncate font-semibold ${
                          adminActiveRecipient === user.nickname
                            ? 'bg-rose-500/10 text-rose-500 border-l-2 border-rose-500 pl-1.5'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <User size={10} className="text-zinc-500 shrink-0" />
                        <span className="truncate">{user.nickname}</span>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-zinc-800 text-[8px] text-zinc-500 text-center font-mono uppercase tracking-wider">
                  Admin Control panel
                </div>
              </div>

              {/* Chat prostor */}
              <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0a1f]/35">
                <div className="px-3 py-1.5 bg-zinc-900/10 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-black text-rose-500 truncate uppercase tracking-wider">
                    {adminActiveRecipient === 'All' 
                      ? '📣 Globální komunikační kanál' 
                      : `💬 Privátní sezení s: ${adminActiveRecipient}`}
                  </span>
                </div>

                {/* Zprávy */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {adminConversationMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <MessageSquare size={18} className="text-zinc-600 mb-1" />
                      <p className="text-[10px] font-bold text-zinc-400">
                        Žádná komunikace v tomto vlákně.
                      </p>
                    </div>
                  ) : (
                    adminConversationMessages.map((msg) => {
                      const isMe = msg.sender === 'Administrátor' || msg.sender === 'System' || msg.sender === 'Admin';
                      const isSystem = msg.sender === 'Systém';
                      
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && !isSystem && (
                            <span className="text-[8px] font-black text-rose-400 mb-0.5 px-1 uppercase tracking-wider">
                              {msg.sender}
                            </span>
                          )}
                          
                          <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed break-words font-medium ${
                            isSystem
                              ? 'bg-zinc-800 text-zinc-400 mx-auto text-center font-bold text-[9px] w-full rounded-md py-1'
                              : isMe
                              ? 'bg-rose-600 text-white rounded-tr-none shadow-md'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-200/50 dark:border-zinc-700/30'
                          }`}>
                            {msg.content}
                          </div>
                          
                          <span className="text-[7px] text-zinc-500 px-1 mt-0.5 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={adminMessagesEndRef} />
                </div>

                {/* Input pro zasílání zpráv z Admin Draweru */}
                <form 
                  onSubmit={(e) => handleSendMessage(e, 'Administrátor', adminActiveRecipient, adminInputText, () => setAdminInputText(''))} 
                  className="p-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/20 flex gap-1.5"
                >
                  <input
                    type="text"
                    placeholder={`Napište jako Administrátor pro ${adminActiveRecipient}...`}
                    value={adminInputText}
                    onChange={(e) => setAdminInputText(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold text-slate-900 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-xl cursor-pointer transition shrink-0 shadow-md"
                  >
                    <Send size={13} fill="currentColor" />
                  </button>
                </form>

              </div>
            </div>
          </div>

          {/* Backdrop pro Admin sidebar */}
          {isAdminDrawerOpen && (
            <div 
              onClick={() => setIsAdminDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-[200] cursor-pointer"
            />
          )}
        </>
      )}
    </>
  );
};
