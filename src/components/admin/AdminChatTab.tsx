import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
}

interface AdminChatTabProps {
  dbService: any;
  allMessages: ChatMessage[];
  setAllMessages: (msgs: ChatMessage[]) => void;
  selectedUserForChat: string | null;
  setSelectedUserForChat: (user: string | null) => void;
  adminChatText: string;
  setAdminChatText: (text: string) => void;
}

export const AdminChatTab: React.FC<AdminChatTabProps> = ({
  dbService,
  allMessages,
  setAllMessages,
  selectedUserForChat,
  setSelectedUserForChat,
  adminChatText,
  setAdminChatText,
}) => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Soukromý chat s členy</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Oprávnění: Administrátor. Zde můžete odpovídat na soukromé dotazy uživatelů.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl min-h-[500px] overflow-hidden">
        {/* LEVÝ PANEL - Seznam členů (4/12 sloupců) */}
        <div className="md:col-span-4 border-r border-slate-100 dark:border-zinc-800 flex flex-col bg-slate-50/50 dark:bg-[#0c0a1f]/10 h-[500px]">
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              Seznam registrovaných členů
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {dbService.getUsers().map((u: any) => {
              const userMsgs = allMessages.filter(m =>
                (m.sender === u.nickname && m.recipient === 'Admin') ||
                (m.sender === 'Administrátor' && m.recipient === u.nickname)
              );
              const lastMsg = userMsgs[userMsgs.length - 1];
              const isActive = selectedUserForChat === u.nickname;

              return (
                <button
                  key={u.nickname}
                  onClick={() => setSelectedUserForChat(u.nickname)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 border ${
                    isActive
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#8b5cf6]'
                      : 'border-transparent text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs flex items-center justify-center font-bold font-sans shrink-0 uppercase">
                    {u.nickname.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate">{u.nickname}</span>
                      {userMsgs.length > 0 && (
                        <span className="text-[9px] bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1 py-0.2 rounded-full font-bold">
                          {userMsgs.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5 leading-tight">
                      {lastMsg ? lastMsg.content : 'Žádná historie zpráv'}
                    </p>
                  </div>
                </button>
              );
            })}

            {dbService.getUsers().length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Žádní registrovaní členové
              </div>
            )}
          </div>
        </div>

        {/* PRAVÝ PANEL - Obsah chatu (8/12 sloupců) */}
        <div className="md:col-span-8 flex flex-col h-[500px]">
          {selectedUserForChat ? (
            <>
              {/* Hlavička aktivního chatu */}
              <div className="p-3 border-b border-slate-150 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Chat s uživatelem: <strong className="text-[#8b5cf6] font-black">{selectedUserForChat}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Simulace odpovědi od daného uživatele hned
                      const replies = [
                        "Ahoj! Mám dotaz k schválení mého nejnovějšího promptu.",
                        "Děkuji za odpověď. Funguje to skvěle!",
                        "Můžete mi prosím poradit, jak změnit moji přezdívku?",
                        "To zní rozumně. Zkusím to poupravit a pošlu znova.",
                        "Super, děkuju moc! Skvělý systém."
                      ];
                      const randomReply = replies[Math.floor(Math.random() * replies.length)];
                      dbService.addChatMessage(selectedUserForChat, 'Admin', randomReply);
                      setAllMessages(dbService.getChatMessages());
                    }}
                    className="px-2 py-1 text-[9px] font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
                    title="Simulovat zprávu od tohoto uživatele k otestování"
                  >
                    Simulovat odpověď
                  </button>
                  <button
                    onClick={() => setSelectedUserForChat(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 font-bold"
                  >
                    Zavřít
                  </button>
                </div>
              </div>

              {/* Zprávy */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-[#0d091a]/20">
                {allMessages.filter(m =>
                  (m.sender === selectedUserForChat && m.recipient === 'Admin') ||
                  (m.sender === 'Administrátor' && m.recipient === selectedUserForChat)
                ).map((msg) => {
                  const isAdmin = msg.sender === 'Administrátor';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[9px] text-slate-400 font-bold px-1 mb-0.5">
                        {isAdmin ? 'Administrátor' : selectedUserForChat} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[80%] text-xs font-semibold break-words leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-md'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-xs border border-slate-200/50 dark:border-zinc-800/80'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {allMessages.filter(m =>
                  (m.sender === selectedUserForChat && m.recipient === 'Admin') ||
                  (m.sender === 'Administrátor' && m.recipient === selectedUserForChat)
                ).length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare size={20} className="text-slate-300 dark:text-zinc-700 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Zatím žádné zprávy</span>
                    <span className="text-[10px] text-slate-400/80 mt-1 max-w-[200px]">Napište zprávu níže pro zahájení rozhovoru s členem {selectedUserForChat}.</span>
                  </div>
                )}
              </div>

              {/* Formulář s odesláním */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!adminChatText.trim()) return;
                  dbService.addChatMessage('Administrátor', selectedUserForChat, adminChatText);
                  setAdminChatText('');
                  setAllMessages(dbService.getChatMessages());
                }}
                className="p-3 border-t border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={adminChatText}
                  onChange={(e) => setAdminChatText(e.target.value)}
                  placeholder={`Napište soukromou zprávu pro ${selectedUserForChat}...`}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition duration-200 cursor-pointer shadow-md flex items-center justify-center aspect-square"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10 dark:bg-zinc-950/5">
              <MessageSquare size={36} className="text-indigo-400/40 animate-pulse mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                Žádný chat není vybrán
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-xs leading-normal">
                Vyberte registrovaného člena z levého panelu a zahajte s ním soukromou konverzaci nebo odpovězte na jeho dotazy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
