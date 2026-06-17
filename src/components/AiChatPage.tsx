import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Sparkles, Send, RefreshCw, Layers, ArrowLeft, Copy, Clock, Check, 
  BookOpen, Terminal, Globe, Cpu, Lock, Star, ChevronRight, Zap, Plus, X, Search, Filter,
  Key, Eye, EyeOff, Settings
} from 'lucide-react';
import { dbService } from '../database';

interface AiChatPageProps {
  currentUser: { nickname: string } | null;
  onBack: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  modelName: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  isPremium: boolean;
  temperature: number;
  rpmLimit: string;
  category: 'free_api' | 'api';
  sizeB: number;
}

const MODELS_LIST: Model[] = [
  // Free APIs - Bez registrace a bez klíče (přidány nové modely)
  {
    id: 'pollinations-openai',
    name: 'gpt-4o-mini',
    description: 'Stabilní, mimořádně rychlý open-source endpoint s GPT-4o-Mini jádrem určený pro konverzace a strukturování nápadů přes volnou bránu Pollinations.',
    capabilities: ['GPT-4o Engine', 'Bez klíče', 'Vysoká stabilita', 'Jednoduchá shrnutí'],
    isPremium: false,
    temperature: 0.7,
    rpmLimit: 'Neomezeno',
    category: 'free_api',
    sizeB: 8
  },
  {
    id: 'pollinations-llama',
    name: 'llama-3.1-70b',
    description: 'Masivní model od společnosti Meta o síle 70 miliard parametrů. Excelentní v logických syntézách a technické češtině.',
    capabilities: ['Llama 3.1 70B', 'Bez registrace', 'Hluboká logika', 'Markdown'],
    isPremium: false,
    temperature: 0.7,
    rpmLimit: 'Neomezeno',
    category: 'free_api',
    sizeB: 70
  },
  {
    id: 'pollinations-qwen',
    name: 'qwen-2.5-72b',
    description: 'Vlajková open-source loď s 72 miliardami parametrů. Nabízí nekompromisní plynulost, přirozenou češtinu a gramatickou dokonalost bez registrace.',
    capabilities: ['Qwen 2.5 72B', 'Bez klíče', 'Plynulá čeština', 'Složitější texty'],
    isPremium: false,
    temperature: 0.7,
    rpmLimit: 'Neomezeno',
    category: 'free_api',
    sizeB: 72
  },
  {
    id: 'pollinations-qwen-coder',
    name: 'qwen-2.5-coder-32b',
    description: 'Špičkový asistent pro vývojáře optimalizovaný pro analýzu kódu, detekci bugů a refaktorování bez nutnosti API klíče a účtu.',
    capabilities: ['Qwen Coder 32B', 'Bez registrace', 'Kódování & Refaktoring', 'Detekce chyb'],
    isPremium: false,
    temperature: 0.2,
    rpmLimit: 'Neomezeno',
    category: 'free_api',
    sizeB: 32
  },
  {
    id: 'pollinations-mistral',
    name: 'mistral-nemo-12b',
    description: 'Americko-francouzský model navržený pro rychlé a přímočaré interakce bez jakýchkoli limitů.',
    capabilities: ['Mistral Nemo', 'Bez klíče', 'Stručná věcnost', 'Rychlý chat'],
    isPremium: false,
    temperature: 0.5,
    rpmLimit: 'Neomezeno',
    category: 'free_api',
    sizeB: 12
  },
  // Ostatní Free APIs (s možností přidat vlastní klíč)
  {
    id: 'google-gemma-2-9b-free',
    name: 'google/gemma-2-9b-it:free',
    description: 'Moderní model od Google vyvinutý pro vysoce bezpečnou asistenci, kontextuální uvažování a jasné vědecké odpovědi.',
    capabilities: ['Bezpečnost', 'Garantovaná fakta', 'Akademický styl'],
    isPremium: false,
    temperature: 0.65,
    rpmLimit: '50 RPM',
    category: 'free_api',
    sizeB: 9
  },
  {
    id: 'meta-llama-3-8b-free',
    name: 'meta-llama/llama-3-8b-instruct:free',
    description: 'Legendární model od společnosti Meta s vynikající kreativitou, stylem a precizním strukturovaným výstupem.',
    capabilities: ['Markdown', 'Kreativita', 'Zodpovídání dotazů'],
    isPremium: false,
    temperature: 0.7,
    rpmLimit: '40 RPM',
    category: 'free_api',
    sizeB: 8
  },
  {
    id: 'qwen-3.6-27b-free',
    name: 'Qwen3.6-27B',
    description: 'Univerzální instruktážní model vynikající v porozumění českému a slovenskému kontextu a gramatice.',
    capabilities: ['Překlad', 'Plynulá čeština', 'Lokální kontext'],
    isPremium: false,
    temperature: 0.75,
    rpmLimit: '90 RPM',
    category: 'free_api',
    sizeB: 27
  },
  {
    id: 'gpt-oss-20b-free',
    name: 'gpt-oss-20b',
    description: 'Vyvážený středně velký open-source model optimalizovaný pro rychlé interakce a každodenní spolehlivost.',
    capabilities: ['Rychlá odezva', 'Shrnutí textů', 'Asistence'],
    isPremium: false,
    temperature: 0.6,
    rpmLimit: '120 RPM',
    category: 'free_api',
    sizeB: 20
  },
  {
    id: 'mistral-7b-free',
    name: 'mistralai/mistral-7b-instruct:free',
    description: 'Chytrý francouzský model uznávaný pro logickou stručnost a precizní dodržování formátu instrukcí.',
    capabilities: ['Stručnost', 'Formátování', 'Markdown tabulky'],
    isPremium: false,
    temperature: 0.4,
    rpmLimit: '60 RPM',
    category: 'free_api',
    sizeB: 7
  },
  {
    id: 'phi-3-mini-free',
    name: 'microsoft/Phi-3-mini-4k-instruct',
    description: 'Zázrak od Microsoftu vyškolený speciálně na vysoce kvalitních datech. Skvělý v matematice a logice.',
    capabilities: ['Matematika', 'Krokové řešení', 'Logika'],
    isPremium: false,
    temperature: 0.3,
    rpmLimit: '200 RPM',
    category: 'free_api',
    sizeB: 3.8
  },
  {
    id: 'llama-3.2-3b-free',
    name: 'meta-llama/Llama-3.2-3B-Instruct',
    description: 'Extrémně malý a pohotový model pro super-rychlou bleskovou odezvu a okamžité odpovědi.',
    capabilities: ['Blesková rychlost', 'Jednoduchá shrnutí'],
    isPremium: false,
    temperature: 0.5,
    rpmLimit: '300 RPM',
    category: 'free_api',
    sizeB: 3
  },
  {
    id: 'qwen-3.5-9b-free',
    name: 'Qwen3.5-9B',
    description: 'Odlehčený model s extrémně nízkou latencí, ideální pro automatizované skripty a plynulý chat v reálném čase.',
    capabilities: ['Nízká latence', 'Rychlý chat'],
    isPremium: false,
    temperature: 0.5,
    rpmLimit: '180 RPM',
    category: 'free_api',
    sizeB: 9
  },
  {
    id: 'whisper-large-v3-free',
    name: 'whisper-large-v3',
    description: 'Nejmodernější audio-to-text open-source model na světě pro rozpoznávání řeči a plynulý přepis audia.',
    capabilities: ['Přepis audia', 'Titulkování', 'Vícejazyčnost'],
    isPremium: false,
    temperature: 0.0,
    rpmLimit: '45 RPM',
    category: 'free_api',
    sizeB: 1.5
  },

  // API (Premium / Advanced / Paid)
  {
    id: 'qwen-3.5-397b-api',
    name: 'Qwen3.5-397B-A17B',
    description: 'Extrémní Mixture-of-Experts (MoE) s 397 miliardami celkových parametrů, poskytující nekompromisní logické uvažování.',
    capabilities: ['Kvantová logika', 'Složitá matematika', 'Hluboká analýza'],
    isPremium: true,
    temperature: 0.8,
    rpmLimit: '30 RPM',
    category: 'api',
    sizeB: 397
  },
  {
    id: 'gpt-oss-120b-api',
    name: 'gpt-oss-120b',
    description: 'Masivní open-source vlajková loď navržená pro vysoce komplexní uvažování, syntézy a kreativní psaní dlouhých textů.',
    capabilities: ['Pokročilá analytika', 'Syntéza textů', 'Komplexní logika'],
    isPremium: true,
    temperature: 0.7,
    rpmLimit: '60 RPM',
    category: 'api',
    sizeB: 120
  },
  {
    id: 'llama-3-70b-api',
    name: 'llama3-70b-8192',
    description: 'Vysokorychlostní masivní model od Meta AI s kontextem 8K běžící na bleskově rychlých LPU čipech.',
    capabilities: ['Rychlost 500 slov/s', 'Analýza souvislostí', 'Dlouhý text'],
    isPremium: true,
    temperature: 0.7,
    rpmLimit: '30 RPM',
    category: 'api',
    sizeB: 70
  },
  {
    id: 'mixtral-8x7b-api',
    name: 'mixtral-8x7b-32768',
    description: 'MoE model s kolosálním kontextovým oknem 32K tokenů pro rozbor obsáhlých dokumentů, manuálů a celých knih.',
    capabilities: ['Kontext 32K tokenů', 'Čtení souborů', 'Programování'],
    isPremium: true,
    temperature: 0.6,
    rpmLimit: '30 RPM',
    category: 'api',
    sizeB: 56
  },
  {
    id: 'qwen-3-coder-30b-api',
    name: 'Qwen3-Coder-30B-A3B-Instruct',
    description: 'Nejmodernější specializovaný programátorský model s vylepšeným popisem funkcí a hlubokými souvislostmi.',
    capabilities: ['Pokročilý kód', 'Refaktorování', 'Algoritmy'],
    isPremium: true,
    temperature: 0.1,
    rpmLimit: '30 RPM',
    category: 'api',
    sizeB: 30
  }
];

export const AiChatPage: React.FC<AiChatPageProps> = ({ currentUser, onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'free_api' | 'api'>('free_api');
  
  // Sort models in active category by sizeB descending
  const currentModels = MODELS_LIST
    .filter(m => m.category === activeCategory)
    .sort((a, b) => b.sizeB - a.sizeB);

  const [selectedModel, setSelectedModel] = useState<Model>(currentModels[0] || MODELS_LIST[0]);

  // Adjust selected model when view category changes
  useEffect(() => {
    const updatedModels = MODELS_LIST
      .filter(m => m.category === activeCategory)
      .sort((a, b) => b.sizeB - a.sizeB);
    if (updatedModels.length > 0) {
      setSelectedModel(updatedModels[0]);
    }
  }, [activeCategory]);

  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    const key = `apolos_ai_chat_${currentUser?.nickname?.toLowerCase() || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error('Chyba při načítání historie AI chatu', e);
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        content: `Ahoj přihlášený uživateli **${currentUser?.nickname || 'Člene'}**! Vítej v integrovaném AI Chat playgroundu se svobodnými a free API modelery.\n\nKliknutím na **Free API** nebo **API** přepnete dostupný arzenál modelů.\n\n🔒 **Nová funkce - Vlastní API klíče**: U každého modelu s výjimkou integrovaných bezregistračních si nyní můžete přidat svůj vlastní API klíč. Vše se bezpečně ukládá pouze k vašemu konkrétnímu účtu, nikdo jiný je neuvidí!`,
        timestamp: new Date(),
        modelName: MODELS_LIST.filter(m => m.category === 'free_api').sort((a,b)=>b.sizeB - a.sizeB)[0]?.name || 'Systém'
      }
    ];
  });

  // Automatické průběžné okamžité ukládání historie zpráv do lokální databáze
  useEffect(() => {
    const key = `apolos_ai_chat_${currentUser?.nickname?.toLowerCase() || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(chatMessages));
  }, [chatMessages, currentUser]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedPromptSuccess, setSavedPromptSuccess] = useState<string | null>(null);

  // States pro API klíče
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [showKeysMap, setShowKeysMap] = useState<Record<string, boolean>>({});
  const [tempKeyValues, setTempKeyValues] = useState<Record<string, string>>({});

  // Načtení klíčů pro konkrétního přihlášeného uživatele
  useEffect(() => {
    if (currentUser?.nickname) {
      const loadedKeys = dbService.getApiKeys(currentUser.nickname);
      setApiKeys(loadedKeys);
      setTempKeyValues(loadedKeys);
    }
  }, [currentUser]);

  const handleSaveApiKey = (modelId: string, keyValue: string) => {
    if (!currentUser?.nickname) return;
    dbService.saveApiKey(currentUser.nickname, modelId, keyValue);
    const updatedKeys = dbService.getApiKeys(currentUser.nickname);
    setApiKeys(updatedKeys);
    setSavedPromptSuccess(`Klíč pro model byl bezpečně uložen k vašemu účtu.`);
    setTimeout(() => setSavedPromptSuccess(null), 3000);
  };

  const handleRemoveApiKey = (modelId: string) => {
    if (!currentUser?.nickname) return;
    dbService.saveApiKey(currentUser.nickname, modelId, '');
    const updatedKeys = dbService.getApiKeys(currentUser.nickname);
    setApiKeys(updatedKeys);
    setTempKeyValues(prev => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
    setSavedPromptSuccess(`Klíč pro model byl odstraněn.`);
    setTimeout(() => setSavedPromptSuccess(null), 3000);
  };

  // Modal pro vkládání promptů
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [promptFilterCategory, setPromptFilterCategory] = useState('Vše');
  const [promptFilterModel, setPromptFilterModel] = useState('Vše');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Načtení dat o promptech pro modal
  const allPromptsFromDB = dbService.getPrompts().filter(p => p.status === 'approved');
  const dbSettings = dbService.getSettings();
  const allCategories = ['Vše', ...(dbSettings?.availableCategories || [])];
  const allModelFilters = ['Vše', ...(dbSettings?.availableModels || [])];

  // Filtrovaná data promptů k výběru
  const filteredPromptsToSelect = allPromptsFromDB.filter(p => {
    const matchesSearch = promptSearchQuery.trim() === '' || 
      p.title.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(promptSearchQuery.toLowerCase());
    
    const matchesCategory = promptFilterCategory === 'Vše' || p.category === promptFilterCategory;
    const matchesModel = promptFilterModel === 'Vše' || p.model === promptFilterModel;

    return matchesSearch && matchesCategory && matchesModel;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleCopyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePromptFromMessage = (content: string) => {
    try {
      const id = 'prompt_gen_' + Date.now();
      const mockPromptProps = {
        id,
        title: `AI Vygenerovaný prompt (${selectedModel.id})`,
        description: `Prompt automaticky kompilovaný z chatu s modelem ${selectedModel.name}.`,
        content: content,
        model: selectedModel.name.includes('qwen') ? 'Qwen-2.5-Coder' : 'Llama-3',
        category: 'Analytické',
        tags: ['Generovaný', 'Chat', 'AI-Kompilovaný'],
        author: currentUser?.nickname || 'Uživatel',
        status: 'approved' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        copyCount: 0,
        featured: false
      };
      
      const currentPrompts = JSON.parse(localStorage.getItem('prompts') || '[]');
      currentPrompts.push(mockPromptProps);
      localStorage.setItem('prompts', JSON.stringify(currentPrompts));
      
      setSavedPromptSuccess('Elegance! Zpráva byla úspěšně uložena do hlavního seznamu jako schválený prompt.');
      setTimeout(() => setSavedPromptSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      content: inputText,
      timestamp: new Date(),
      modelName: selectedModel.name
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Sestavení historie pro API
      const messagesHistory = chatMessages
        .filter(m => m.id !== 'welcome' && !m.id.startsWith('msg_ai_err_'))
        .slice(-8)
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content
        }));

      // Přidat aktuální
      messagesHistory.push({ role: 'user', content: userMsg.content });

      const modelId = selectedModel.id;
      const isPollination = modelId.startsWith('pollinations-');
      const userApiKey = apiKeys[modelId];

      let responseContent = '';

      if (isPollination) {
        // Skutečné bezregistrační, bezklíčové volání přes Pollinations AI
        const pollModelName = modelId.replace('pollinations-', '');
        
        const response = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: `Jsi skvělý český asistent. Odpovídej vždy plynulou češtinou pro přihlášeného uživatele jménem ${currentUser?.nickname || 'Vážený zákazník'}.` },
              ...messagesHistory
            ],
            model: pollModelName,
            jsonMode: false
          })
        });

        if (!response.ok) {
          throw new Error('Chyba při komunikaci s Pollinations API.');
        }

        responseContent = await response.text();
      } else if (userApiKey && userApiKey.trim() !== '') {
        // Skutečné volání přes OpenRouter s klíčem uživatele
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey.trim()}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Apolos AI Prompt Database'
          },
          body: JSON.stringify({
            model: selectedModel.name,
            messages: [
              { role: 'system', content: `Jsi skvělý český asistent. Odpovídej vždy plynulou češtinou pro přihlášeného uživatele jménem ${currentUser?.nickname || 'Vážený zákazník'}.` },
              ...messagesHistory
            ],
            temperature: selectedModel.temperature
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let parsedErr = 'Nepodařilo se dokončit volání OpenRouter API.';
          try {
            const errObj = JSON.parse(errText);
            parsedErr = errObj?.error?.message || parsedErr;
          } catch (e) {}
          throw new Error(parsedErr);
        }

        const resData = await response.json();
        responseContent = resData?.choices?.[0]?.message?.content || 'Chyba: Nevrátila se žádná platná odpověď.';
      } else {
        // Není vyplněný klíč - použijeme plynulé přemostění přes bezplatný model Pollinations (qwen-2.5-72b)
        // abychom splnili zásadu "no mock data" a uživatel přitom mohl model hned vyzkoušet!
        const response = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: `Jsi model ${selectedModel.name}. Odpovídej plynulou češtinou pro uživatele ${currentUser?.nickname || 'Uživatel'}.` },
              ...messagesHistory
            ],
            model: 'qwen',
            jsonMode: false
          })
        });

        if (!response.ok) {
          throw new Error('Nepodařilo se provést bezklíčové přemostění.');
        }

        const textResponse = await response.text();
        responseContent = `💡 *[Běží v bezplatném režimu Apolos - pro aktivaci originálního modelu ${selectedModel.name} prosím zadejte svůj API klíč]*\n\n${textResponse}`;
      }

      const aiMsg: Message = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        content: responseContent,
        timestamp: new Date(),
        modelName: selectedModel.name
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: 'msg_ai_err_' + Date.now(),
        sender: 'ai',
        content: `❌ **Omlouváme se, nastala chyba spojení:** ${err.message || 'Nepodařilo se kontaktovat server modeláře.'}\n\n*Ujistěte se, že je zadaný API klíč správný, nebo přepněte na jeden z bezregistračních **gpt-4o-mini**, **llama-3.1-70b** či **qwen-2.5-72b** modelů.*`,
        timestamp: new Date(),
        modelName: 'Systémový Diagnostik'
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#0b081e]/40 border border-[#8b5cf6]/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-160px)] min-h-[580px] lg:h-[calc(100vh-140px)] backdrop-blur-xl animate-fade-in duration-300">

      
      {/* Horní ovládací lišta chatu */}
      <div className="p-4 border-b border-[#8b5cf6]/20 bg-[#120f30]/60 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Zpět na prompty</span>
          </button>
          
          <div className="h-4 w-px bg-zinc-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-white leading-none">
                AI Playgroud & API Endpoints
              </span>
              <span className="text-[9px] text-zinc-400 font-bold mt-1">
                Aktivní model: <strong className="text-[#a78bfa] font-extrabold">{selectedModel.name}</strong> ({selectedModel.rpmLimit})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase">
            {activeCategory === 'free_api' ? 'Služba zdarma' : 'Komerční API'}
          </span>
        </div>
      </div>

      {/* Hlavní workspace se splitem */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* LEVÝ PANEL - Sekce API a modely (4/12 sloupců) */}
        <div className="lg:col-span-4 border-r border-[#8b5cf6]/20 bg-[#0a071d]/90 p-4 space-y-4 flex flex-col min-h-0 h-full overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#8b5cf6]/20 pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a78bfa] flex items-center gap-1.5">
              <Layers size={11} className="text-[#a78bfa]" />
              <span>Sekce s API a Free API</span>
            </span>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-2 py-0.5 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/25 text-[#c084fc] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-[#8b5cf6]/25 cursor-pointer"
              title="Správa vlastních API klíčů pro modely"
            >
              <Key size={9} />
              <span>API Klíče</span>
            </button>
          </div>

          {/* Přepínač hlavních API Sekcí - Free API vs API */}
          <div className="grid grid-cols-2 gap-1 px-1 bg-[#130f2d]/50 p-1.5 rounded-xl border border-[#8b5cf6]/10 shrink-0">
            <button
              onClick={() => setActiveCategory('free_api')}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-lg text-center cursor-pointer transition-all duration-300 ${
                activeCategory === 'free_api'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🚀 Free API
            </button>
            <button
              onClick={() => setActiveCategory('api')}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-lg text-center cursor-pointer transition-all duration-300 ${
                activeCategory === 'api'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🔒 API
            </button>
          </div>

          {/* Popis vybrané kategorie */}
          <div className="p-3 bg-[#110d29]/80 rounded-2xl border border-[#8b5cf6]/15 shrink-0">
            <h4 className="text-xs font-black text-white tracking-wide uppercase">
              {activeCategory === 'free_api' ? 'Bezplatné open-source modely' : 'Vysokovýkonná herní a komerční rozhraní'}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed font-semibold">
              {activeCategory === 'free_api' 
                ? 'Rychlá bezplatná API zkoumající open-source inteligenci od Mety, Google, Microsoftu a Qwen.' 
                : 'Masivní prémiové modely s hlubokou analytikou určené pro komerční integrace, programování a quantum logiku.'}
            </p>
          </div>

          {/* Seznam modelů v aktivní sekci - Seřazeno podle velikosti parametrů */}
          <div className="space-y-2 flex-grow overflow-y-auto min-h-0">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block pl-1">
              Dostupné modely seřazené podle velikosti ({currentModels.length}):
            </span>

            <div className="space-y-1.5 pb-2">
              {currentModels.map((m) => {
                const isSelected = selectedModel.id === m.id;
                const hasKey = !!apiKeys[m.id];
                const isPollination = m.id.startsWith('pollinations-');
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/40 shadow-xs'
                        : 'bg-[#151138]/40 border-transparent hover:bg-[#151138]/80 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black truncate max-w-[55%] ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {m.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isPollination ? (
                          <span className="text-[7px] font-bold bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 font-mono">
                            FREE BEZ REG
                          </span>
                        ) : hasKey ? (
                          <span className="text-[7px] font-bold bg-cyan-500/10 text-cyan-455 px-1 py-0.5 rounded border border-cyan-500/25 font-mono flex items-center gap-0.5" title="Vlastní klíč nastaven">
                            <Key size={6} /> KLÍČ OK
                          </span>
                        ) : (
                          <span className="text-[7px] font-bold bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded border border-zinc-700 font-mono">
                            BEZ KLÍČE
                          </span>
                        )}
                        <span className="text-[7px] font-black uppercase tracking-wider bg-[#8b5cf6]/10 text-[#c084fc] px-1 py-0.5 rounded border border-[#8b5cf6]/20 font-mono">
                          {m.sizeB}B params
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-zinc-400 font-semibold line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.capabilities.map((cap) => (
                        <span key={cap} className="text-[8px] font-bold bg-[#8b5cf6]/5 text-[#c084fc] px-1.5 py-0.2 rounded-md border border-[#8b5cf6]/10">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PRAVÝ PANEL - Obsah chatovací konverzace (8/12 sloupců) */}
        <div className="lg:col-span-8 flex flex-col bg-[#070517]/98 min-h-0 h-full overflow-hidden">
          
          {/* Oznámení o úspěšném uložení */}
          {savedPromptSuccess && (
            <div className="p-3 bg-indigo-900/30 border-b border-indigo-500/20 text-indigo-200 text-[10px] font-black uppercase tracking-wider text-center animate-pulse flex items-center justify-center gap-1.5 shrink-0">
              <Zap size={11} className="text-[#a78bfa]" />
              <span>{savedPromptSuccess}</span>
            </div>
          )}

          {/* Kontejner se zprávami s automatickým posunem dolů */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm border ${
                    isAi
                      ? 'bg-[#120f32]/45 border-[#8b5cf6]/15 hover:border-[#8b5cf6]/35 text-zinc-200 rounded-tl-xs'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white rounded-tr-xs'
                  }`}>
                    
                    <div className="flex items-center justify-between gap-6 border-b border-white/5 pb-1.5 mb-2 text-[9px] font-bold text-zinc-400">
                      <span>
                        {isAi ? `Model: ${msg.modelName}` : currentUser?.nickname || 'Člen'}
                      </span>
                      <span>
                        {msg.timestamp.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed font-semibold whitespace-pre-wrap select-text break-words font-sans">
                      {msg.content}
                    </div>

                    {isAi && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-extrabold uppercase tracking-widest text-[#a78bfa] hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedId === msg.id ? 'Zkopírováno' : 'Zkopírovat'}</span>
                        </button>

                        <button
                          onClick={() => handleCreatePromptFromMessage(msg.content)}
                          className="px-2 py-1 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 rounded-lg text-[9px] font-extrabold uppercase tracking-widest text-[#c084fc] hover:text-white transition flex items-center gap-1 cursor-pointer"
                          title="Uloží tento výstup do hlavní databáze jako schválený prompt"
                        >
                          <Plus size={10} />
                          <span>Přidat do promptů</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#120f32]/45 border border-[#8b5cf6]/20 rounded-3xl rounded-tl-xs p-4 text-xs text-zinc-400 font-semibold flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin text-[#c084fc]" />
                  <span>Model {selectedModel.name} právě přemýšlí a generuje odpověď...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Vstupní formulář pro chat s tlačítkem Vložit prompt */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#0d0a21] border-t border-[#8b5cf6]/20 flex flex-col sm:flex-row gap-2 shrink-0"
          >
            <div className="flex-grow flex gap-2">
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-[#a78bfa] hover:text-white border border-[#8b5cf6]/30 px-3.5 py-2.5 rounded-2xl cursor-pointer transition shadow-md flex items-center justify-center gap-2 shrink-0 font-sans"
                title="Otevřít knihovnu a vybrat prompt"
              >
                <BookOpen size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Vložit prompt</span>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Zeptejte se modelu ${selectedModel.name} na cokoliv...`}
                className="flex-grow bg-[#151136]/50 hover:bg-[#151136]/80 text-xs text-white placeholder-zinc-400 px-4 py-2.5 rounded-2xl border border-[#8b5cf6]/10 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] font-semibold"
              />
            </div>
            
            <button
              type="submit"
              disabled={isTyping}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl cursor-pointer transition shadow-md flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-auto w-full sm:w-auto text-[10px] uppercase font-black font-sans"
            >
              <span>Odeslat</span>
              <Send size={12} />
            </button>
          </form>
        </div>

      </div>

      {/* MODAL OKNO S KNIHOVNOU PROMPTŮ K VLOŽENÍ */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={() => setIsPromptModalOpen(false)} />

          {/* Container */}
          <div className="relative w-full max-w-2xl bg-[#0d0920] border border-slate-700 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-zinc-100 transform transition-all text-xs flex flex-col max-h-[85vh]">
            {/* Close Button */}
            <button
              onClick={() => setIsPromptModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#8b5cf6] transition-colors cursor-pointer p-1.5 bg-zinc-900 rounded-full"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="mb-4 pb-3 border-b border-[#8b5cf6]/20">
              <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <BookOpen size={16} className="text-[#8b5cf6]" />
                <span>Knihovna promptů - Vložit do chatu</span>
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                Vyberte si jakýkoliv schválený prompt a proklikem jej vložte do textového vstupu v chatu.
              </p>
            </div>

            {/* Filtry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 bg-[#120f30]/40 p-3 rounded-2xl border border-[#8b5cf6]/10 shrink-0">
              {/* Vyhledávání */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Hledat v názvech..."
                  value={promptSearchQuery}
                  onChange={(e) => setPromptSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-2.5 pr-6 py-1.5 text-[10px] text-zinc-105 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                />
                {promptSearchQuery && (
                  <button onClick={() => setPromptSearchQuery('')} className="absolute right-2 top-1.5 text-[9px] text-zinc-400 font-bold hover:text-white">&times;</button>
                )}
              </div>

              {/* Filtr kategorií */}
              <div>
                <select
                  value={promptFilterCategory}
                  onChange={(e) => setPromptFilterCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-100 font-semibold focus:outline-none cursor-pointer"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'Vše' ? 'Všechny kategorie' : cat}</option>
                  ))}
                </select>
              </div>

              {/* Filtr modelů */}
              <div>
                <select
                  value={promptFilterModel}
                  onChange={(e) => setPromptFilterModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-100 font-semibold focus:outline-none cursor-pointer"
                >
                  {allModelFilters.map(mod => (
                    <option key={mod} value={mod}>{mod === 'Vše' ? 'Všechny modely' : mod}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seznam promptů */}
            <div className="flex-grow space-y-3 overflow-y-auto min-h-0 pr-1">
              {filteredPromptsToSelect.map((p) => (
                <div key={p.id} className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-[#8b5cf6]/30 transition-all">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-xs text-white leading-tight">{p.title}</h4>
                      <span className="text-[8px] font-mono tracking-wider bg-zinc-900 border border-zinc-800 text-[#a78bfa] font-black px-1.5 py-0.2 rounded uppercase">
                        {p.model}
                      </span>
                      <span className="text-[8px] font-mono tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 font-black px-1.5 py-0.2 rounded uppercase">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed italic">{p.description}</p>
                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60 font-mono text-[9px] text-zinc-300 max-h-[80px] overflow-y-auto whitespace-pre-wrap select-none leading-relaxed">
                      {p.content}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setInputText(p.content);
                      setIsPromptModalOpen(false);
                    }}
                    className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider cursor-pointer shrink-0 transition-all font-sans"
                    title="Vložit tento prompt do chatu"
                  >
                    Vložit
                  </button>
                </div>
              ))}

              {filteredPromptsToSelect.length === 0 && (
                <div className="text-center py-12 text-zinc-500 italic max-w-xs mx-auto">
                  Žádné prompty neodpovídají zvoleným filtrům. Zkuste je resetovat.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#8b5cf6]/20 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider cursor-pointer font-sans"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OKNO PRO SEZNAM API KLÍČŮ */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={() => setIsApiKeyModalOpen(false)} />

          {/* Container */}
          <div className="relative w-full max-w-xl bg-[#0d0920] border border-slate-700 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-zinc-100 transform transition-all text-xs flex flex-col max-h-[85vh]">
            
            {/* Close Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#8b5cf6] transition-colors cursor-pointer p-1.5 bg-zinc-900 rounded-full"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="mb-4 pb-3 border-b border-[#8b5cf6]/20">
              <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Key size={16} className="text-[#8b5cf6]" />
                <span>Bezpečné nastavení vlastních API klíčů</span>
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed font-semibold">
                Klíče jsou svázány výhradně s vaším účtem <strong className="text-white bg-indigo-500/20 px-1 rounded">{currentUser?.nickname || 'Uživatel'}</strong>.
                Zadáním vlastního klíče se odemkne plná síla originálního modelu přes OpenRouter. Nikdo jiný – včetně ostatních hráčů a administrátorů – vaše klíče neuvidí, jsou uloženy bezpečně ve vašem prohlížeči.
              </p>
            </div>

            {/* Seznam modelů s možností vložení klíče */}
            <div className="flex-grow space-y-3.5 overflow-y-auto min-h-0 pr-1 max-h-[50vh]">
              {MODELS_LIST.filter(m => !m.id.startsWith('pollinations-')).map((m) => {
                const isSelected = selectedModel.id === m.id;
                const hasKey = !!apiKeys[m.id];
                const currentVal = tempKeyValues[m.id] || '';
                const isVisible = !!showKeysMap[m.id];

                return (
                  <div 
                    key={m.id} 
                    className={`p-3 bg-zinc-950/30 border rounded-2xl flex flex-col gap-2.5 transition-all ${
                      isSelected ? 'border-[#8b5cf6]/40 bg-[#8b5cf6]/5' : 'border-zinc-805 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white text-xs">{m.name}</span>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                          {m.category === 'free_api' ? 'Služba zdarma (volitelné)' : 'Komerční API (vyžadováno pro plný výkon)'}
                        </span>
                      </div>
                      
                      {hasKey ? (
                        <span className="text-[8px] font-black tracking-widest bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase font-mono">
                          Klíč aktivní
                        </span>
                      ) : (
                        <span className="text-[8px] font-black tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-300/80 px-2 py-0.5 rounded-full uppercase font-mono">
                          Chybí klíč
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? "text" : "password"}
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempKeyValues(prev => ({ ...prev, [m.id]: val }));
                          }}
                          placeholder="Vložte sem svůj API_KEY (sk_... nebo orkey_...)"
                          className="w-full bg-zinc-900 hover:bg-zinc-800/85 text-white font-mono placeholder-zinc-650 text-[11px] px-3 py-1.5 rounded-xl border border-slate-800 focus:border-[#8b5cf6] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowKeysMap(prev => ({ ...prev, [m.id]: !prev[m.id] }));
                          }}
                          className="absolute right-2.5 top-2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveApiKey(m.id, currentVal)}
                        className="p-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors font-bold text-[10px]"
                        title="Uložit klíč"
                      >
                        <Check size={12} className="mr-1" />
                        <span>Uložit</span>
                      </button>

                      {hasKey && (
                        <button
                          type="button"
                          onClick={() => handleRemoveApiKey(m.id)}
                          className="p-1.5 px-2 bg-rose-950/40 hover:bg-[#ef4444]/20 border border-[#ef4444]/25 text-rose-300 rounded-xl flex items-center justify-center cursor-pointer transition-colors font-bold text-[10px]"
                          title="Smazat klíč"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#8b5cf6]/20 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-wider cursor-pointer font-sans"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
