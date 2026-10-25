import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Boxes,
  FileBarChart,
  Users
} from 'lucide-react';
import { ActiveNavTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard' as ActiveNavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_sale' as ActiveNavTab, label: 'Sale', icon: ShoppingCart },
    { id: 'create_purchase' as ActiveNavTab, label: 'Purchase', icon: ShoppingBag },
    { id: 'inventory' as ActiveNavTab, label: 'Stock', icon: Boxes },
    { id: 'states_parties' as ActiveNavTab, label: 'Parties', icon: Users },
    { id: 'reports' as ActiveNavTab, label: 'Reports', icon: FileBarChart }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070C16]/95 backdrop-blur-md border-t border-[#1E2B45]/80 px-1 py-1 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] safe-area-bottom">
      <div className="flex items-center justify-around">
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
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 select-none min-h-[48px] relative ${
                isActive
                  ? 'text-[#F5F3EE]'
                  : 'text-[#8A95A8] hover:text-[#F5F3EE]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#D6B36A] to-transparent rounded-full shadow-[0_0_8px_#D6B36A]" />
              )}
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-[#D6B36A]/20 text-[#D6B36A] scale-105' : ''
                }`}
              >
                <Icon size={19} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-[#D6B36A] font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
