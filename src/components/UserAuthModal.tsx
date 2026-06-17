import React, { useState } from 'react';
import { X, User, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { dbService } from '../database';
import { RegisteredUser } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: RegisteredUser) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nickname.trim()) {
      setError('Uživatelské jméno je povinné.');
      return;
    }
    if (!password) {
      setError('Heslo je povinné.');
      return;
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError('Hesla se neshodují.');
        return;
      }
      if (password.length < 4) {
        setError('Heslo musí mít alespoň 4 znaky.');
        return;
      }

      try {
        const newUser = dbService.registerUser(nickname, password);
        setSuccess('Registrace byla úspěšná! Nyní se přihlašujete...');
        setTimeout(() => {
          onLoginSuccess(newUser);
          onClose();
          // Reset fields
          setNickname('');
          setPassword('');
          setConfirmPassword('');
          setSuccess('');
        }, 1500);
      } catch (err: any) {
        setError(err.message || 'Registrace se nezdařila.');
      }
    } else {
      // Login
      const users = dbService.getUsers();
      const existingUser = users.find(
        (u) => u.nickname.toLowerCase() === nickname.trim().toLowerCase()
      );

      if (!existingUser || existingUser.passwordHash !== password) {
        setError('Chybné jméno nebo heslo.');
        return;
      }

      setSuccess('Úspěšně přihlášeno!');
      setTimeout(() => {
        onLoginSuccess(existingUser);
        onClose();
        setNickname('');
        setPassword('');
        setSuccess('');
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Card container */}
      <div 
        id="user-auth-modal"
        className="relative w-full max-w-md bg-white dark:bg-[#0c0a1c] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all p-6 text-slate-900 dark:text-zinc-100"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 pb-3 mb-6 mt-2">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 text-center pb-2.5 text-sm font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'login' 
                ? 'border-b-2 border-[#8b5cf6] text-[#8b5cf6]'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            Přihlášení
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 text-center pb-2.5 text-sm font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'register' 
                ? 'border-b-2 border-[#8b5cf6] text-[#8b5cf6]'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            Registrace
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-black bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
            {activeTab === 'login' ? 'Vítej zpět promptere!' : 'Vytvořit nový účet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {activeTab === 'login' 
              ? 'Zadej své údaje pro přístup k vlastní správě a chatu.' 
              : 'Zaregistruj se k publikaci a správě promptů na Studio Apolos.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg">
              {success}
            </div>
          )}

          {/* Nickname */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Uživatelské jméno / Přezdívka *
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Např. apolosprompter"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
              Přihlašovací Heslo *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte heslo..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Password Confirm if Register */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5 tracking-wider">
                Heslo znovu *
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Heslo pro kontrolu..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-md shadow-[#8b5cf6]/20"
          >
            {activeTab === 'login' ? 'Přihlásit se' : 'Uložit a registrovat'}
          </button>
        </form>
      </div>
    </div>
  );
};
