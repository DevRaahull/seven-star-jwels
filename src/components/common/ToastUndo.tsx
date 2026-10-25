import React, { useEffect, useState } from 'react';
import { RotateCcw, X, AlertCircle } from 'lucide-react';

interface ToastUndoProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationSec?: number;
}

export const ToastUndo: React.FC<ToastUndoProps> = ({
  message,
  onUndo,
  onDismiss,
  durationSec = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSec);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDismiss();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0B1220]/95 border border-[#D6B36A]/50 rounded-xl p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md animate-slide-up text-left max-w-sm">
      <AlertCircle className="w-5 h-5 text-[#D6B36A] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#F5F3EE] truncate">{message}</p>
        <p className="text-[10px] text-[#AAB4C5] font-mono mt-0.5">Undo available ({timeLeft}s)</p>
      </div>

      <button
        onClick={onUndo}
        className="px-3 py-1.5 rounded-lg bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Undo</span>
      </button>

      <button
        onClick={onDismiss}
        className="p-1 text-[#7A8699] hover:text-[#F5F3EE] transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
