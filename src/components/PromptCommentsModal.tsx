import React, { useState, useEffect } from 'react';
import { X, MessageSquare, ThumbsUp, ThumbsDown, Send, Sparkles, User, HelpCircle } from 'lucide-react';
import { Prompt, PromptComment, RegisteredUser } from '../types';
import { dbService } from '../database';

interface PromptCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  currentUser: RegisteredUser | null;
}

export const PromptCommentsModal: React.FC<PromptCommentsModalProps> = ({
  isOpen,
  onClose,
  prompt,
  currentUser,
}) => {
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [error, setError] = useState('');
  
  // Track voted comments in this session to prevent spamming votes
  const [votedComments, setVotedComments] = useState<Record<string, 'like' | 'dislike'>>({});

  // Loading existing comments when prompt becomes active
  const loadComments = () => {
    if (prompt) {
      const c = dbService.getComments(prompt.id);
      setComments(c);
    }
  };

  useEffect(() => {
    if (prompt) {
      loadComments();
      const votes = localStorage.getItem(`voted_comments_${prompt.id}`);
      if (votes) {
        try {
          setVotedComments(JSON.parse(votes));
        } catch {
          setVotedComments({});
        }
      } else {
        setVotedComments({});
      }
    }
  }, [prompt]);

  if (!isOpen || !prompt) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCommentContent.trim()) {
      setError('Text komentáře je povinný.');
      return;
    }

    // Determine author name
    let authorName = 'Anonymní uživatel';
    if (currentUser) {
      authorName = currentUser.nickname;
    } else if (nicknameInput.trim()) {
      authorName = nicknameInput.trim();
    }

    const sanitizedContent = dbService.sanitizeInput(newCommentContent);

    dbService.addComment(prompt.id, authorName, sanitizedContent);
    setNewCommentContent('');
    // Clear custom guest nickname after submit if desired, or keep it set
    setError('');
    loadComments();
    
    // Dispatch a custom event to alert the listing to re-render comment count if needed
    window.dispatchEvent(new Event('apolos_comments_updated'));
  };

  const handleVote = (commentId: string, type: 'like' | 'dislike') => {
    // Check if already voted on this comment in this local session
    if (votedComments[commentId]) {
      return; // Already voted
    }

    dbService.voteComment(commentId, type);
    
    // Save locally
    const updatedVotes = { ...votedComments, [commentId]: type };
    setVotedComments(updatedVotes);
    localStorage.setItem(`voted_comments_${prompt.id}`, JSON.stringify(updatedVotes));
    
    loadComments();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Container */}
      <div 
        id="prompt-comments-modal"
        className="relative w-full max-w-lg bg-white dark:bg-[#0d0920] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-zinc-100 transform transition-all text-xs flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-4 pr-6">
          <div className="flex items-center gap-1.5">
            <MessageSquare size={16} className="text-[#8b5cf6]" />
            <h2 className="text-base font-black uppercase tracking-wider bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Komentáře k promptu
            </h2>
          </div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1 line-clamp-1 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
            "{prompt.title}"
          </h3>
        </div>

        {/* Comment Entry Area */}
        <form onSubmit={handleSubmitComment} className="space-y-3 bg-slate-50 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 mb-4 shrink-0">
          <div className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wide flex items-center gap-1">
            <Sparkles size={11} className="animate-pulse" />
            <span>Přidat nový komentář</span>
          </div>

          {error && (
            <div className="text-[10px] text-rose-500 font-bold">
              {error}
            </div>
          )}

          {!currentUser ? (
            <div className="flex gap-2.5 items-center">
              <label className="block text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider whitespace-nowrap">
                Přezdívka (nepovinné):
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Anonym..."
                maxLength={20}
                className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] font-bold text-[11px]"
              />
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
              <User size={12} className="text-[#8b5cf6]" />
              <span>Přihlášen jako: <strong className="text-[#8b5cf6]">{currentUser.nickname}</strong></span>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              placeholder="Napište zde svůj názor nebo postřeh k promptu..."
              required
              rows={2}
              className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-lg font-semibold text-xs focus:ring-1 focus:ring-[#8b5cf6] resize-none h-14"
            />
            <button
              type="submit"
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white p-2 rounded-lg aspect-square flex items-center justify-center transition-all cursor-pointer shadow-md duration-200 self-end"
            >
              <Send size={15} />
            </button>
          </div>
        </form>

        {/* Comments Feed List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 max-h-[340px] scrollbar-thin">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 border-b border-slate-100 dark:border-zinc-800/40 pb-1 flex justify-between">
            <span>Seznam komentářů ({comments.length})</span>
            <span>Od nejnovějšího</span>
          </div>

          {comments.map((cmt) => {
            const hasLiked = votedComments[cmt.id] === 'like';
            const hasDisliked = votedComments[cmt.id] === 'dislike';
            const alreadyVoted = !!votedComments[cmt.id];

            return (
              <div 
                key={cmt.id}
                className="bg-slate-50/75 dark:bg-[#110e23]/35 border border-slate-200/85 dark:border-zinc-900 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all duration-300 hover:border-[#8b5cf6]/30"
              >
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200/60 dark:border-zinc-800/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-[#8b5cf6]" />
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {cmt.author}
                    </span>
                    {!currentUser || cmt.author !== currentUser.nickname ? (
                      <span className="text-[8px] bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1 py-0.5 rounded font-black uppercase tracking-wide">
                        Host
                      </span>
                    ) : (
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded font-black uppercase tracking-wide">
                        Člen
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {formatDate(cmt.timestamp)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed font-medium break-words whitespace-pre-wrap">
                  {cmt.content}
                </div>

                {/* Upvote and Downvote (Thumbs up/down) action footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-900/60 flex items-center justify-end gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold mr-auto">
                    Bylo toto užitečné?
                  </span>

                  <button
                    onClick={() => handleVote(cmt.id, 'like')}
                    disabled={alreadyVoted}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs cursor-pointer ${
                      hasLiked 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-black'
                        : alreadyVoted 
                          ? 'bg-slate-100 dark:bg-zinc-900 text-slate-300 dark:text-zinc-700 border-transparent cursor-not-allowed'
                          : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                    }`}
                  >
                    <ThumbsUp size={11} />
                    <span>{cmt.likes}</span>
                  </button>

                  <button
                    onClick={() => handleVote(cmt.id, 'dislike')}
                    disabled={alreadyVoted}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs cursor-pointer ${
                      hasDisliked
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-black'
                        : alreadyVoted
                          ? 'bg-slate-100 dark:bg-zinc-900 text-slate-300 dark:text-zinc-700 border-transparent cursor-not-allowed'
                          : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5'
                    }`}
                  >
                    <ThumbsDown size={11} />
                    <span>{cmt.dislikes}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <div className="p-8 bg-slate-50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-900 rounded-xl text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
              <MessageSquare size={18} className="text-slate-300 dark:text-zinc-700" />
              <span>Žádné komentáře zatím nebyly napsány. Buďte první!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
