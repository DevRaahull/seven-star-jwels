import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { DashboardView } from './components/dashboard/DashboardView';
import { PurchaseEntryView } from './components/purchases/PurchaseEntryView';
import { SalesEntryView } from './components/sales/SalesEntryView';
import { InventoryView } from './components/inventory/InventoryView';
import { StatesPartiesView } from './components/parties/StatesPartiesView';
import { InvoicesListView } from './components/invoices/InvoicesListView';
import { AccountsReportsView } from './components/accounts/AccountsReportsView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';
import { SettingsView } from './components/settings/SettingsView';
import { InvoiceReceiptModal } from './components/sales/InvoiceReceiptModal';
import { ItemFormModal } from './components/items/ItemFormModal';
import { AuthModal } from './components/auth/AuthModal';
import { ActiveNavTab, Sale } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Sale | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#D6B36A] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-serif text-[#D6B36A] text-sm tracking-widest uppercase">
          SEVEN STAR JWELS
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F5F3EE] flex flex-col antialiased">
      {/* Network offline warning */}
      <OfflineBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileNavOpen}
          closeMobileNav={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          />

          {/* 5 Core Features + Settings & Backup */}
          <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-6 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                openInvoiceModal={(sale) => setViewingInvoice(sale)}
              />
            )}

            {(activeTab === 'create_sale' || activeTab === 'sales') && (
              <SalesEntryView />
            )}

            {(activeTab === 'create_purchase' || activeTab === 'purchase') && (
              <PurchaseEntryView />
            )}

            {activeTab === 'inventory' && (
              <InventoryView />
            )}

            {activeTab === 'states_parties' && (
              <StatesPartiesView />
            )}

            {(activeTab === 'reports' || activeTab === 'accounts') && (
              <AccountsReportsView initialSubTab="bills_ledger" />
            )}

            {activeTab === 'invoices' && (
              <AccountsReportsView initialSubTab="bills_ledger" />
            )}

            {activeTab === 'backup' && (
              <BackupRestoreView />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Main Features) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Quick Create Item Modal */}
      {isCreateItemModalOpen && (
        <ItemFormModal
          itemToEdit={null}
          onClose={() => setIsCreateItemModalOpen(false)}
        />
      )}

      {/* Global Invoice Preview Modal */}
      {viewingInvoice && (
        <InvoiceReceiptModal
          sale={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <MainAppContent />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
