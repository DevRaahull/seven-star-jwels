import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-[#070C16]/80 border border-dashed border-[#D6B36A]/25 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4 animate-fade-in backdrop-blur-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#111B2E] border border-[#D6B36A]/35 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(214,179,106,0.15)]">
        <Icon className="w-7 h-7 text-[#D6B36A]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#F5F3EE] font-serif tracking-wide">{title}</h3>
        <p className="text-xs text-[#AAB4C5] max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5E6B3] via-[#D6B36A] to-[#B08E46] text-[#070B14] hover:brightness-110 text-xs font-bold transition shadow-[0_0_15px_rgba(214,179,106,0.3)] flex items-center gap-2 group active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2.5 rounded-xl bg-[#111B2E] hover:bg-[#16233B] border border-[#1E2B45] hover:border-[#D6B36A]/40 text-[#AAB4C5] hover:text-[#F5F3EE] text-xs font-semibold transition active:scale-95"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
