import React, { useState, useEffect } from 'react';
import { Calendar, User, Settings, Menu, WifiOff, LogOut, CheckCircle2, Database } from 'lucide-react';
import { formatDate, getDayOfWeek } from '../../lib/formatters';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveNavTab } from '../../types';

interface HeaderProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  toggleMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setActiveTab, toggleMobileNav }) => {
  const { settings, isOnline } = useAppData();
  const { user, logout, isCloudConnected } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="relative bg-[#070C16]/90 backdrop-blur-md border-b border-[#1E2B45]/80 px-4 lg:px-8 py-3.5 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between">
        {/* Mobile Hamburger & Logo preview */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggleMobileNav}
            className="p-2 text-[#AAB4C5] hover:text-[#D6B36A] hover:bg-[#16233B] rounded-lg transition"
            aria-label="Toggle navigation"
          >
            <Menu size={22} />
          </button>
          <span className="font-serif font-bold text-sm text-[#D6B36A] tracking-wider">SEVEN STAR</span>
        </div>

        {/* Center: ॥ श्री ॥ and SEVEN STAR JEWELS */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center">
          {/* Filigree Ornament and Hindi Header */}
          <div className="flex items-center gap-3 text-[#D6B36A] text-xs">
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D6B36A]/60"></span>
            <span className="text-[10px]">❖</span>
            <span className="font-medium tracking-[0.25em]">{settings.hindi_header || '॥ श्री ॥'}</span>
            <span className="text-[10px]">❖</span>
            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D6B36A]/60"></span>
          </div>

          {/* Main Business Title */}
          <h1 className="font-serif font-bold text-2xl lg:text-3xl text-gold-gradient tracking-[0.2em] uppercase drop-shadow-md mt-0.5">
            {settings.business_name || 'SEVEN STAR JEWELS'}
          </h1>

          {/* Subtitle */}
          <p className="text-xs text-[#AAB4C5] tracking-[0.14em] font-light mt-0.5">
            {settings.tagline || 'Jewellery Inventory & Accounting'}
          </p>
        </div>

        {/* Right Section: Date/Day & Profile/Settings icons */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Network status badge if offline */}
          {!isOnline && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400">
              <WifiOff size={13} />
              <span>Offline Mode</span>
            </div>
          )}

          {/* Luxury Date Pill (As seen in concept mockup) */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#111B2E]/90 border border-[#D6B36A]/30 backdrop-blur-md shadow-sm">
            <div className="p-1 rounded-md text-[#D6B36A]">
              <Calendar size={17} />
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-bold text-[#F5F3EE] tracking-wide leading-tight">
                {formatDate(currentDate)}
              </div>
              <div className="text-[10px] text-[#AAB4C5] leading-tight">
                {getDayOfWeek(currentDate)}
              </div>
            </div>
          </div>

          {/* User Profile Menu Button (Circular Gold Accent) */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-[#111B2E] border border-[#D6B36A]/40 text-[#D6B36A] hover:bg-[#D6B36A]/15 hover:border-[#D6B36A] transition flex items-center justify-center shadow-sm"
              title="Owner Profile"
            >
              <User size={16} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111B2E] border border-[#1E2B45] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-[#1E2B45]">
                  <p className="text-xs text-[#AAB4C5]">Signed in as Owner</p>
                  <p className="text-sm font-semibold text-[#F5F3EE] truncate">{user?.email || 'owner@sevenstar.com'}</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-[#D6B36A]">
                    <CheckCircle2 size={12} />
                    <span>{isCloudConnected ? 'Supabase Cloud Sync Active' : 'Local Storage Mode'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] flex items-center gap-2 transition"
                >
                  <Settings size={14} />
                  <span>Business Settings</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('backup');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] flex items-center gap-2 transition"
                >
                  <Database size={14} />
                  <span>Backup & Restore</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Settings gear shortcut (Circular Gold Accent) */}
          <button
            onClick={() => {
              setActiveTab('settings');
            }}
            className="w-9 h-9 rounded-full bg-[#111B2E] border border-[#D6B36A]/40 text-[#D6B36A] hover:bg-[#D6B36A]/15 hover:border-[#D6B36A] transition flex items-center justify-center shadow-sm"
            title="Business Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
