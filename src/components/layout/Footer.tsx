import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto border-t border-[#1E2B45]/80 bg-[#070C16]/80 backdrop-blur-md text-[#AAB4C5] py-6 pb-20 lg:pb-6 px-4 no-print select-none">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
        {/* Subtle Gold Filigree Divider */}
        <div className="flex items-center gap-3 text-[#D6B36A]/50">
          <span className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent to-[#D6B36A]/40" />
          <span className="text-xs tracking-widest font-serif text-[#D6B36A]">❖</span>
          <span className="h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent to-[#D6B36A]/40" />
        </div>

        {/* Business Title & Motto */}
        <div className="space-y-1">
          <p className="font-serif text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#F5F3EE] uppercase">
            SEVEN STAR JEWELS
          </p>
          <p className="text-[11px] text-[#8A95A8] tracking-wider">
            Wholesale Jewellery Inventory, B2B Consignment & Financial Accounting
          </p>
        </div>

        {/* Credit Badge: Developed and Maintained by Rahul Soni */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B2E] border border-[#D6B36A]/30 shadow-sm text-xs">
          <span className="text-[#AAB4C5]">Developed and Maintained by</span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF0C7] via-[#D6B36A] to-[#B08E46] tracking-wide">
            Rahul Soni
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="System Active & Maintained" />
        </div>

        {/* Copyright & Slogan */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#7A8699] pt-1">
          <span>&copy; {new Date().getFullYear()} Seven Star Jewels. All rights reserved.</span>
          <span className="hidden sm:inline text-[#1E2B45]">•</span>
          <span className="font-serif italic text-[#D6B36A]/80">&ldquo;Quality Builds Trust&rdquo;</span>
        </div>
      </div>
    </footer>
  );
};
