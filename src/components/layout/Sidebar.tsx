import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Receipt,
  FileBarChart,
  Database,
  Settings,
  X,
  Users
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { GoldLogo } from '../common/GoldLogo';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  isMobileOpen: boolean;
  closeMobileNav: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  closeMobileNav
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveNavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_sale' as ActiveNavTab, label: 'Create Sale', icon: ShoppingCart },
    { id: 'create_purchase' as ActiveNavTab, label: 'Create Purchase', icon: ShoppingBag },
    { id: 'inventory' as ActiveNavTab, label: 'Inventory', icon: Boxes },
    { id: 'states_parties' as ActiveNavTab, label: 'States & Parties', icon: Users },
    { id: 'reports' as ActiveNavTab, label: 'Reports', icon: FileBarChart }
  ];

  const handleNavClick = (id: ActiveNavTab) => {
    setActiveTab(id);
    closeMobileNav();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111B2E] border-r border-[#1E2B45] text-[#AAB4C5] select-none">
      {/* Top Brand Block */}
      <div className="pt-6 pb-5 px-6 flex flex-col items-center border-b border-[#1E2B45]/60 text-center relative">
        <button
          onClick={closeMobileNav}
          className="lg:hidden absolute top-4 right-4 p-1.5 text-[#AAB4C5] hover:text-white rounded-lg"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div className="relative mb-2">
          <GoldLogo size={46} />
        </div>
        <h2 className="font-serif font-bold text-sm tracking-[0.2em] text-[#D6B36A] uppercase">
          SEVEN STAR JWELS
        </h2>
        <span className="text-[10px] text-[#AAB4C5] uppercase tracking-widest mt-0.5">
          Wholesale Ledger
        </span>
      </div>

      {/* Streamlined 8 Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'create_sale' && (activeTab === 'sales' as any)) ||
            (item.id === 'create_purchase' && (activeTab === 'purchase' as any)) ||
            (item.id === 'reports' && ((activeTab === 'invoices' as any) || (activeTab === 'accounts' as any)));

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#D6B36A]/25 via-[#D6B36A]/15 to-transparent text-[#F5F3EE] border-l-2 border-[#D6B36A] shadow-sm font-semibold'
                  : 'text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B]'
              }`}
            >
              <Icon
                size={18}
                className={isActive ? 'text-[#D6B36A]' : 'text-[#8A95A8]'}
              />
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Brand Motto */}
      <div className="p-4 border-t border-[#1E2B45]/60 text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1.5 text-[#D6B36A]/60">
          <span className="h-[1px] w-5 bg-[#D6B36A]/30"></span>
          <span className="text-[9px]">❖</span>
          <span className="h-[1px] w-5 bg-[#D6B36A]/30"></span>
        </div>

        <p className="font-serif italic text-[11px] text-[#D6B36A] tracking-wider">
          &ldquo;Quality Builds Trust&rdquo;
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-60 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={closeMobileNav}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
