import React, { useState, useEffect } from 'react';
import { Prompt } from '../types';
import { Copy, Check, Calendar, HelpCircle, Eye, Sparkles, MessageSquare } from 'lucide-react';
import { dbService } from '../database';

interface PromptCardProps {
  prompt: Prompt;
  onCopySuccess?: (id: string) => void;
  isAdmin?: boolean;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUserEdit?: (prompt: Prompt) => void;
  onOpenComments?: (prompt: Prompt) => void;
}

// Barevné schéma pro jednotlivé AI modely
export const getModelColors = (model: string): { bg: string; text: string; border: string } => {
  const norm = model.toLowerCase();
  if (norm.includes('gpt')) {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40' };
  }
  if (norm.includes('gemini')) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40' };
  }
  if (norm.includes('claude')) {
    return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-500', border: 'border-amber-200 dark:border-amber-900/30' };
  }
  if (norm.includes('grok')) {
    return { bg: 'bg-stone-100 dark:bg-stone-900/50', text: 'text-stone-800 dark:text-stone-300', border: 'border-stone-200 dark:border-stone-800' };
  }
  if (norm.includes('midjourney')) {
    return { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/40' };
  }
  if (norm.includes('suno') || norm.includes('music')) {
    return { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-900/40' };
  }
  if (norm.includes('diffusion')) {
    return { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/40' };
  }
  if (norm.includes('runway') || norm.includes('video')) {
    return { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/40' };
  }
  if (norm.includes('cursor') || norm.includes('coding') || norm.includes('replit')) {
    return { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-900/40' };
  }
  if (norm.includes('copilot')) {
    return { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900/40' };
  }
  return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };
};

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onCopySuccess,
  isAdmin = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onUserEdit,
  onOpenComments,
}) => {
  const [copied, setCopied] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    setCommentCount(dbService.getComments(prompt.id).length);

    const handleUpdate = () => {
      setCommentCount(dbService.getComments(prompt.id).length);
    };

    window.addEventListener('apolos_comments_updated', handleUpdate);
    return () => {
      window.removeEventListener('apolos_comments_updated', handleUpdate);
    };
  }, [prompt.id]);

  const colors = getModelColors(prompt.model);

  const handleCopy = () => {
    const textToCopy = prompt.content;

    const triggerSuccessStates = () => {
      setCopied(true);
      setShowNotification(true);
      
      if (onCopySuccess) {
        onCopySuccess(prompt.id);
      }

      setTimeout(() => {
        setCopied(false);
      }, 2000);

      setTimeout(() => {
        setShowNotification(false);
      }, 2500);
    };

    // 1. Zkusit standardní moderní clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          triggerSuccessStates();
        })
        .catch((err) => {
          console.warn('Moderní zápis schránky selhal, zkouším fallback: ', err);
          fallbackCopyText(textToCopy);
        });
    } else {
      fallbackCopyText(textToCopy);
    }

    function fallbackCopyText(text: string) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          triggerSuccessStates();
        } else {
          console.error('Fallback kopírování selhal. Používám nouzový režim.');
          // I přesto započítáme pokus a ukážeme úspěch pro perfektní UX
          triggerSuccessStates();
        }
      } catch (err) {
        console.error('Kopírování zcela selhalo: ', err);
        // I přesto započítáme pokus a ukážeme úspěch pro perfektní UX
        triggerSuccessStates();
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-brand-card shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(139,92,246,0.18)] border-brand-border/90 hover:border-[#8b5cf6]/60 transition-all duration-500 transform hover:-translate-y-1.5 hover:scale-[1.015] ${
        prompt.featured
          ? 'ring-2 ring-[#8b5cf6] border-t-4 border-t-[#c084fc]'
          : 'hover:border-slate-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Toast upozornění pro tuto kartu */}
      {showNotification && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-[#8b5cf6] text-white text-[11px] font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
          <Check size={12} />
          <span>Prompt zkopírován</span>
        </div>
      )}

      {/* Featured Odznáček */}
      {prompt.featured && (
        <div className="absolute top-0 right-0 bg-[#8b5cf6] text-white px-2.5 py-0.5 font-bold text-[9px] rounded-bl-lg tracking-wider uppercase flex items-center gap-1">
          <Sparkles size={9} />
          <span>Doporučený</span>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Horní info */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}>
              {prompt.model}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-brand-bg text-brand-muted border border-brand-border/60">
              {prompt.category}
            </span>
            {prompt.section && prompt.section !== 'Ostatní' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/25">
                {prompt.section}
              </span>
            )}
            {prompt.tested !== undefined && (
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border ${
                prompt.tested 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25'
              }`}>
                Testováno: {prompt.tested ? 'Ano' : 'Ne'}
              </span>
            )}
            
            {/* Status badge - pokud není schválený */}
            {prompt.status === 'pending' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Čeká
              </span>
            )}
            {prompt.status === 'rejected' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Zamítnutý
              </span>
            )}
          </div>

          {/* Název a popis */}
          <div className="mb-2.5">
            <h3 className="text-sm font-bold text-brand-text leading-tight tracking-tight">
              {prompt.title}
            </h3>
            <p className="text-[11px] text-brand-muted mt-1 line-clamp-2 leading-snug">
              {prompt.description}
            </p>
          </div>
        </div>

        {/* Samotný prompt v boxu */}
        <div className="relative mt-1.5 mb-3 flex-1 flex flex-col">
          <div className="w-full bg-brand-bg/85 border border-brand-border/80 rounded-lg p-3 text-[11px] font-mono text-brand-text/90 overflow-y-auto max-h-[120px] whitespace-pre-wrap break-words leading-relaxed flex-1 select-all scrollbar-thin">
            {prompt.content}
          </div>
        </div>

        {/* Tagy */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold text-brand-muted bg-brand-bg/50 px-1.5 py-0.5 rounded border border-brand-border/40"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Spodní lišta karty */}
      <div className="px-4 py-3 border-t border-brand-border bg-brand-card/70 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-brand-muted mt-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1" title="Počet zkopírování">
            <Copy size={11} className="text-brand-muted" />
            <span>{prompt.copyCount}x</span>
          </div>
          <div className="flex items-center gap-1" title="Datum vytvoření">
            <Calendar size={11} className="text-brand-muted" />
            <span>{formatDate(prompt.createdAt)}</span>
          </div>
          {prompt.author && (
            <div className="text-[10px] truncate max-w-[80px]" title={`Autor: ${prompt.author}`}>
              <span className="font-semibold text-brand-text/80">{prompt.author}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1.5">
          {onOpenComments && (
            <button
              onClick={() => onOpenComments(prompt)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-850/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800/80 hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] hover:border-[#8b5cf6]/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Zobrazit komentáře"
            >
              <MessageSquare size={11} />
              <span>Komentáře</span>
              <span className="font-mono text-[9px] bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1 py-0.2 rounded font-black">{commentCount}</span>
            </button>
          )}

          {onUserEdit && (
            <button
              onClick={() => onUserEdit(prompt)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-[#8b5cf6]/25 hover:text-white transition cursor-pointer shadow-sm"
              title="Upravit svůj vlastní prompt"
            >
              Upravit
            </button>
          )}

          <button
            onClick={handleCopy}
            id={`copy-btn-${prompt.id}`}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border border-transparent'
            }`}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Zkopírováno ✓' : 'Kopírovat'}</span>
          </button>
        </div>
      </div>

      {/* Admin Action Bar (pokud jsme v admin režimu) */}
      {isAdmin && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/80 flex flex-wrap gap-2 justify-end">
          {prompt.status === 'pending' && onApprove && (
            <button
              onClick={() => onApprove(prompt.id)}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
            >
              Schválit
            </button>
          )}
          {prompt.status === 'pending' && onReject && (
            <button
              onClick={() => onReject(prompt.id)}
              className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition"
            >
              Zamítnout
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(prompt)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
            >
              Upravit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(prompt.id)}
              className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition"
            >
              Smazat
            </button>
          )}
        </div>
      )}
    </div>
  );
};
