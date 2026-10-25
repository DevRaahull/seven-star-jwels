import React, { useState } from 'react';
import { Mail, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth, AUTHORIZED_OWNER_EMAIL } from '../../context/AuthContext';
import { GoldLogo } from '../common/GoldLogo';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState(AUTHORIZED_OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Owner email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials');
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070C16]/95 backdrop-blur-md">
      <div className="bg-gradient-to-b from-[#111B2E] via-[#0E1729] to-[#070C16] border border-[#D6B36A]/30 rounded-2xl w-full max-w-md p-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] space-y-6 relative animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="text-xs font-serif font-bold text-[#D6B36A] tracking-[0.25em]">
            ॥ श्री ॥
          </div>
          <div className="flex justify-center mb-1 drop-shadow-[0_0_12px_rgba(214,179,106,0.35)]">
            <GoldLogo size={52} />
          </div>
          <h2 className="font-serif font-bold text-xl text-gold-gradient tracking-[0.2em] uppercase">
            SEVEN STAR JEWELS
          </h2>
          <p className="text-xs text-[#AAB4C5]">
            Authorized Jewellery Business Owner Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
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
                placeholder="ravidhika08@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
              Owner Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-[#F5E6B3] via-[#D6B36A] to-[#B08E46] text-[#070B14] font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(214,179,106,0.35)] hover:brightness-110 transition active:scale-95 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Business Portal'}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-[#7A8699]">
          <p>Protected Business Management System • SEVEN STAR JEWELS</p>
        </div>
      </div>
    </div>
  );
};
