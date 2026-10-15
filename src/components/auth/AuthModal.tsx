import React, { useState } from 'react';
import { Lock, Mail, KeyRound, CheckCircle2, AlertCircle, Shield, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoldLogo } from '../common/GoldLogo';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, registerOwner, isCloudConnected } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDbSettings, setShowDbSettings] = useState(false);
  const [dbUrl, setDbUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('SSJ_SUPABASE_URL') || '' : ''));
  const [dbKey, setDbKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('SSJ_SUPABASE_ANON_KEY') || '' : ''));

  const handleQuickLocalLogin = () => {
    localStorage.setItem('SSJ_AUTH_USER', JSON.stringify({
      id: 'local-owner',
      email: 'owner@sevenstarjewels.com',
      role: 'owner'
    }));
    window.location.reload();
  };

  const handleSaveDbSettings = () => {
    if (dbUrl.trim()) {
      localStorage.setItem('SSJ_SUPABASE_URL', dbUrl.trim());
    } else {
      localStorage.removeItem('SSJ_SUPABASE_URL');
    }
    if (dbKey.trim()) {
      localStorage.setItem('SSJ_SUPABASE_ANON_KEY', dbKey.trim());
    } else {
      localStorage.removeItem('SSJ_SUPABASE_ANON_KEY');
    }
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        const res = await registerOwner(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to create owner account');
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid owner credentials');
        } else if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1220] bg-opacity-95 backdrop-blur-md">
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="text-xs font-serif font-bold text-[#D6B36A] tracking-[0.2em]">
            ॥ श्री ॥
          </div>
          <div className="flex justify-center mb-1">
            <GoldLogo size={48} />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#F5F3EE] tracking-[0.15em] uppercase">
            SEVEN STAR JWELS
          </h2>
          <p className="text-xs text-[#AAB4C5]">
            Authorized Jewellery Business Owner Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
              Owner Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="owner@sevenstarjewels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
                />
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] font-bold rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50 mt-2"
          >
            {isSubmitting
              ? 'Verifying...'
              : isRegistering
              ? 'Create Authorized Owner Account'
              : 'Sign In to Business Portal'}
          </button>
        </form>

        <div className="pt-3 flex flex-col items-center gap-3 text-xs border-t border-[#1E2B45]/60">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-[#AAB4C5] hover:text-[#D6B36A] transition underline"
          >
            {isRegistering
              ? 'Already registered? Sign in instead'
              : 'First-time setup? Register owner account'}
          </button>

          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-[#1E2B45]/40 text-[11px]">
            <button
              type="button"
              onClick={handleQuickLocalLogin}
              className="text-[#D6B36A] hover:underline flex items-center gap-1 font-semibold"
            >
              <Shield size={12} />
              <span>Owner Quick Entry (Local Mode)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDbSettings(!showDbSettings)}
              className="text-[#7A8699] hover:text-[#F5F3EE] flex items-center gap-1"
            >
              <Database size={12} />
              <span>{showDbSettings ? 'Hide DB Config' : 'Fix Database URL'}</span>
            </button>
          </div>

          {showDbSettings && (
            <div className="w-full p-3.5 bg-[#0B1220] border border-[#1E2B45] rounded-xl space-y-3 text-left animate-in fade-in">
              <span className="text-[11px] font-semibold text-[#D6B36A] block">Supabase Connection Settings</span>
              <div>
                <label className="text-[10px] text-[#AAB4C5] block mb-1">Project URL</label>
                <input
                  type="text"
                  placeholder="https://cnksuxyfqlbdkzzzpjgf.supabase.co"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full bg-[#111B2E] border border-[#1E2B45] rounded p-2 text-[11px] text-[#F5F3EE] font-mono focus:border-[#D6B36A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#AAB4C5] block mb-1">Anon Public API Key</label>
                <input
                  type="text"
                  placeholder="eyJ..."
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  className="w-full bg-[#111B2E] border border-[#1E2B45] rounded p-2 text-[11px] text-[#F5F3EE] font-mono focus:border-[#D6B36A] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveDbSettings}
                  className="flex-1 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] font-bold rounded text-[11px] transition shadow"
                >
                  Save & Reconnect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('SSJ_SUPABASE_URL');
                    localStorage.removeItem('SSJ_SUPABASE_ANON_KEY');
                    window.location.reload();
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[11px] transition"
                  title="Clear Cloud Settings and use pure local browser mode"
                >
                  Reset to Local
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
