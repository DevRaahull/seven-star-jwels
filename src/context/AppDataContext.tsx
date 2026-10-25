import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Item,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Expense,
  BusinessSettings,
  WholesaleDashboardStats,
  StockMovementPeriod,
  StateRecord,
  PartyRecord,
  PartyRole,
  StockTransfer,
  StockTransferType,
  StockTransferLevel,
  DistributionMiniDashboardStats,
  PartyPayment,
  PartyStockLedgerSummary,
  PartyMoneyLedgerSummary,
  ItemUsageReport,
  PartyPaymentStatusOverview
} from '../types';
import { storage } from '../lib/storage';

interface AppDataContextType {
  items: Item[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  states: StateRecord[];
  parties: PartyRecord[];
  stockTransfers: StockTransfer[];
  partyPayments: PartyPayment[];
  settings: BusinessSettings;
  loading: boolean;
  isOnline: boolean;
  stats: WholesaleDashboardStats;
  refreshData: () => Promise<void>;
  createPurchase: (purchaseData: any, itemsData: any[]) => Promise<Purchase>;
  updatePurchase: (purchaseId: string, purchaseData: any) => Promise<Purchase>;
  deletePurchase: (purchaseId: string) => Promise<void>;
  createSale: (saleData: any, itemsData: any[]) => Promise<Sale>;
  updateSale: (saleId: string, saleData: any) => Promise<Sale>;
  deleteSale: (saleId: string) => Promise<void>;
  recordSalePayment: (saleId: string, amount: number, paymentMethod?: string, paymentDate?: string, notes?: string) => Promise<Sale>;
  voidSale: (saleId: string, reason: string) => Promise<void>;
  saveItem: (item: any) => Promise<Item>;
  adjustStock: (itemId: string, quantityChange: number, reason: string) => Promise<Item>;
  archiveOrDeleteItem: (itemId: string, action: 'archive' | 'unarchive' | 'delete') => Promise<void>;
  getItemUsage: (itemId: string) => ItemUsageReport | null;
  saveExpense: (expense: any) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<BusinessSettings>;
  restoreBackup: (payload: any) => Promise<{ success: boolean; message: string }>;
  getStockMovementPeriod: (startDate: Date, endDate: Date) => Promise<StockMovementPeriod[]>;
  saveState: (stateData: { id?: string; name: string; state_head_id?: string; notes?: string }) => Promise<StateRecord>;
  archiveState: (id: string) => Promise<void>;
  saveParty: (partyData: {
    id?: string;
    state_id: string;
    name: string;
    party_type?: PartyRole;
    parent_party_id?: string;
    phone?: string;
    address?: string;
    notes?: string;
    opening_balance?: number;
    opening_stock?: number;
  }) => Promise<PartyRecord>;
  archiveParty: (id: string) => Promise<void>;
  createStockTransfer: (data: {
    transfer_date?: string;
    reference_no?: string;
    destination_state_id: string;
    destination_party_id: string;
    source_party_id?: string;
    transfer_level?: StockTransferLevel;
    item_id: string;
    quantity: number;
    rate?: number;
    transfer_type: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled';
    notes?: string;
  }) => Promise<StockTransfer>;
  updateStockTransfer: (id: string, data: {
    transfer_date?: string;
    reference_no?: string;
    item_id?: string;
    quantity?: number;
    rate?: number;
    transfer_type?: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled' | 'reversed';
    notes?: string;
  }) => Promise<StockTransfer>;
  deleteStockTransfer: (id: string, reason?: string) => Promise<any>;
  reconcileStockBalances: () => Promise<{
    reconciledItems: Array<{
      item_id: string;
      item_name: string;
      previous_stock: number;
      reconciled_stock: number;
      difference: number;
    }>;
    isBalanced: boolean;
    timestamp: string;
  }>;
  recordPartyPayment: (data: {
    party_id: string;
    payment_date?: string;
    amount: number;
    payment_type: 'received' | 'paid';
    payment_method?: string;
    reference?: string;
    notes?: string;
  }) => Promise<PartyPayment>;
  getPartyLedger: (partyId: string) => Promise<{
    party: PartyRecord;
    state?: StateRecord;
    stockSummary: PartyStockLedgerSummary;
    moneySummary: PartyMoneyLedgerSummary;
    transfers: StockTransfer[];
    sales: Sale[];
    payments: PartyPayment[];
  }>;
  getPartyHeldStock: (partyId: string, itemId?: string) => Promise<number>;
  getDistributionDashboardStats: (filters?: any) => Promise<DistributionMiniDashboardStats>;
  getPartyPaymentStatusOverview: (filters?: any) => Promise<{
    parties: PartyPaymentStatusOverview[];
    summary: {
      dueCount: number;
      partialCount: number;
      completeCount: number;
      advanceCount: number;
      noTransactionsCount: number;
      totalOutstanding: number;
      totalPaymentsReceived: number;
    };
  }>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [states, setStates] = useState<StateRecord[]>([]);
  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [partyPayments, setPartyPayments] = useState<PartyPayment[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>({} as BusinessSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        fetchedSettings,
        fetchedItems,
        fetchedPurchases,
        fetchedSales,
        fetchedExpenses,
        fetchedStates,
        fetchedParties,
        fetchedTransfers,
        fetchedPartyPayments
      ] = await Promise.all([
        storage.getSettings(),
        storage.getItems(),
        storage.getPurchases(),
        storage.getSales(),
        storage.getExpenses(),
        storage.getStates(),
        storage.getParties(),
        storage.getStockTransfers(),
        storage.getPartyPayments()
      ]);
      setSettings(fetchedSettings);
      setItems(fetchedItems);
      setPurchases(fetchedPurchases);
      setSales(fetchedSales);
      setExpenses(fetchedExpenses);
      setStates(fetchedStates);
      setParties(fetchedParties);
      setStockTransfers(fetchedTransfers);
      setPartyPayments(fetchedPartyPayments);
    } catch (e) {
      console.error('Failed to load application data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute 6 Essential Wholesale Cards for the Dashboard
  const stats: WholesaleDashboardStats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    let monthSales = 0;
    let monthIncome = 0; // Taxable sales revenue excluding GST
    let monthCogs = 0;

    sales.forEach(s => {
      if (s.status !== 'completed') return;
      const sDate = new Date(s.sale_date);
      if (sDate >= currentMonthStart && sDate <= now) {
        monthSales += s.grand_total;
        monthIncome += s.total_taxable;
        monthCogs += s.total_cost;
      }
    });

    let monthPurchases = 0;
    purchases.forEach(p => {
      if (p.status !== 'active') return;
      const pDate = new Date(p.purchase_date);
      if (pDate >= currentMonthStart && pDate <= now) {
        monthPurchases += p.grand_total;
      }
    });

    let monthExpenses = 0;
    expenses.forEach(e => {
      if (e.is_cancelled) return;
      const eDate = new Date(e.expense_date);
      if (eDate >= currentMonthStart && eDate <= now) {
        monthExpenses += e.amount;
      }
    });

    // Expenditure = COGS (cost of inventory actually sold) + Operating Expenses
    const monthExpenditure = monthCogs + monthExpenses;
    const monthNetResult = monthIncome - monthExpenditure;

    const activeItems = items.filter(i => !i.is_archived);
    const stockUnits = activeItems.reduce((sum, i) => sum + i.current_stock, 0);
    const stockValue = activeItems.reduce((sum, i) => sum + (i.current_stock * i.purchase_rate), 0);

    let partyReceivablesTotal = 0;
    let partyPayablesTotal = 0;
    parties.filter(p => !p.is_archived).forEach(p => {
      const pSales = sales.filter(s => s.party_id === p.id && s.status === 'completed');
      const pPayments = partyPayments.filter(pay => pay.party_id === p.id);
      const opening = Number(p.opening_balance) || 0;
      const salesTotal = pSales.reduce((sum, s) => sum + s.grand_total, 0);
      const received =
        pSales.reduce((sum, s) => sum + (s.amount_received || 0), 0) +
        pPayments.filter(pay => pay.payment_type === 'received').reduce((sum, pay) => sum + pay.amount, 0);
      const paid = pPayments.filter(pay => pay.payment_type === 'paid').reduce((sum, pay) => sum + pay.amount, 0);
      const pos = opening + salesTotal + paid - received;
      if (pos > 0) partyReceivablesTotal += pos;
      else if (pos < 0) partyPayablesTotal += Math.abs(pos);
    });

    // Cash received metrics
    let monthSalesReceived = 0;
    let totalSalesReceived = 0;
    sales.forEach(s => {
      if (s.status !== 'completed') return;
      const sReceived = s.amount_received || 0;
      totalSalesReceived += sReceived;
      const sDate = new Date(s.sale_date);
      if (sDate >= currentMonthStart && sDate <= now) {
        monthSalesReceived += sReceived;
      }
    });

    let monthPartyPaymentsReceived = 0;
    let totalPartyPaymentsReceived = 0;
    partyPayments.forEach(p => {
      if (p.payment_type !== 'received') return;
      const amt = p.amount || 0;
      totalPartyPaymentsReceived += amt;
      const pDate = new Date(p.payment_date);
      if (pDate >= currentMonthStart && pDate <= now) {
        monthPartyPaymentsReceived += amt;
      }
    });

    const monthCashReceived = Math.round((monthSalesReceived + monthPartyPaymentsReceived) * 100) / 100;
    const totalCashReceived = Math.round((totalSalesReceived + totalPartyPaymentsReceived) * 100) / 100;

    return {
      month_sales: monthSales,
      month_purchases: monthPurchases,
      current_stock_units: stockUnits,
      current_stock_value: stockValue,
      month_income: monthIncome,
      month_expenditure: monthExpenditure,
      month_net_result: monthNetResult,
      party_receivables_total: Math.round(partyReceivablesTotal * 100) / 100,
      party_payables_total: Math.round(partyPayablesTotal * 100) / 100,
      month_cash_received: monthCashReceived,
      total_cash_received: totalCashReceived,
      party_payments_received_total: Math.round(totalPartyPaymentsReceived * 100) / 100
    };
  }, [sales, purchases, items, expenses, parties, partyPayments]);

  const createPurchase = async (purchaseData: any, itemsData: any[]) => {
    const created = await storage.createPurchase(purchaseData, itemsData);
    await refreshData();
    return created;
  };

  const updatePurchase = async (purchaseId: string, purchaseData: any) => {
    const updated = await storage.updatePurchase(purchaseId, purchaseData);
    await refreshData();
    return updated;
  };

  const deletePurchase = async (purchaseId: string) => {
    await storage.deletePurchase(purchaseId);
    await refreshData();
  };

  const createSale = async (saleData: any, itemsData: any[]) => {
    const created = await storage.createSale(saleData, itemsData);
    await refreshData();
    return created;
  };

  const updateSale = async (saleId: string, saleData: any) => {
    const updated = await storage.updateSale(saleId, saleData);
    await refreshData();
    return updated;
  };

  const deleteSale = async (saleId: string) => {
    await storage.deleteSale(saleId);
    await refreshData();
  };

  const recordSalePayment = async (
    saleId: string,
    amount: number,
    paymentMethod?: string,
    paymentDate?: string,
    notes?: string
  ) => {
    const updated = await storage.recordSalePayment(saleId, amount, paymentMethod, paymentDate, notes);
    await refreshData();
    return updated;
  };

  const voidSale = async (saleId: string, reason: string) => {
    await storage.voidSale(saleId, reason);
    await refreshData();
  };

  const saveItem = async (itemData: any) => {
    const saved = await storage.saveItem(itemData);
    await refreshData();
    return saved;
  };

  const adjustStock = async (itemId: string, quantityChange: number, reason: string) => {
    const updated = await storage.adjustStock(itemId, quantityChange, reason);
    await refreshData();
    return updated;
  };

  const archiveOrDeleteItem = async (itemId: string, action: 'archive' | 'unarchive' | 'delete') => {
    await storage.archiveOrDeleteItem(itemId, action);
    await refreshData();
  };

  const getItemUsage = useCallback((itemId: string): ItemUsageReport | null => {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;

    const itemNameLower = item.name.toLowerCase().trim();

    // Matching purchases
    const matchedPurchases: Array<{ purchase: Purchase; item: PurchaseItem }> = [];
    purchases.forEach(p => {
      p.items?.forEach(it => {
        if (it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemNameLower)) {
          matchedPurchases.push({ purchase: p, item: it });
        }
      });
    });

    // Matching sales
    const matchedSales: Array<{ sale: Sale; item: SaleItem }> = [];
    sales.forEach(s => {
      s.items?.forEach(it => {
        if (it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemNameLower)) {
          matchedSales.push({ sale: s, item: it });
        }
      });
    });

    // Matching stock transfers
    const matchedTransfers = stockTransfers.filter(t => t.item_id === itemId);

    const totalPurchasedQty = matchedPurchases.reduce((sum, p) => sum + (Number(p.item.quantity) || 0), 0);
    const totalSoldQty = matchedSales.reduce((sum, s) => sum + (Number(s.item.quantity) || 0), 0);

    let issued = 0;
    let returned = 0;
    matchedTransfers.forEach(t => {
      if (t.transfer_type === 'issue') issued += Number(t.quantity) || 0;
      else if (t.transfer_type === 'return') returned += Number(t.quantity) || 0;
    });
    const totalTransferredHeldQty = Math.max(0, issued - returned);

    let canPermanentlyDelete = true;
    let deleteBlockReason: string | undefined;

    if (item.current_stock > 0) {
      canPermanentlyDelete = false;
      deleteBlockReason = `Item has ${item.current_stock} physical unit(s) in showroom stock.`;
    } else if (matchedPurchases.length > 0) {
      canPermanentlyDelete = false;
      deleteBlockReason = `Item is used in ${matchedPurchases.length} supplier purchase record(s).`;
    } else if (matchedSales.length > 0) {
      canPermanentlyDelete = false;
      deleteBlockReason = `Item is used in ${matchedSales.length} sales invoice(s).`;
    } else if (matchedTransfers.length > 0) {
      canPermanentlyDelete = false;
      deleteBlockReason = `Item is used in ${matchedTransfers.length} party consignment transfer(s).`;
    }

    return {
      item,
      purchases: matchedPurchases,
      sales: matchedSales,
      transfers: matchedTransfers,
      totalPurchasedQty,
      totalSoldQty,
      totalTransferredHeldQty,
      canPermanentlyDelete,
      deleteBlockReason
    };
  }, [items, purchases, sales, stockTransfers]);

  const saveExpense = async (expenseData: any) => {
    const saved = await storage.saveExpense(expenseData);
    await refreshData();
    return saved;
  };

  const deleteExpense = async (id: string) => {
    await storage.deleteExpense(id);
    await refreshData();
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    const updated = await storage.updateSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  const restoreBackup = async (payload: any) => {
    const res = await storage.restoreFromBackup(payload);
    await refreshData();
    return res;
  };

  const getStockMovementPeriod = async (startDate: Date, endDate: Date) => {
    return await storage.getStockMovementPeriod(startDate, endDate);
  };

  const saveState = async (stateData: { id?: string; name: string; notes?: string }) => {
    const saved = await storage.saveState(stateData);
    await refreshData();
    return saved;
  };

  const archiveState = async (id: string) => {
    await storage.archiveState(id);
    await refreshData();
  };

  const saveParty = async (partyData: {
    id?: string;
    state_id: string;
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
    opening_balance?: number;
    opening_stock?: number;
  }) => {
    const saved = await storage.saveParty(partyData);
    await refreshData();
    return saved;
  };

  const archiveParty = async (id: string) => {
    await storage.archiveParty(id);
    await refreshData();
  };

  const createStockTransfer = async (data: {
    transfer_date?: string;
    reference_no?: string;
    destination_state_id: string;
    destination_party_id: string;
    item_id: string;
    quantity: number;
    rate?: number;
    transfer_type: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled';
    notes?: string;
  }) => {
    const created = await storage.createStockTransfer(data);
    await refreshData();
    return created;
  };

  const updateStockTransfer = async (id: string, data: {
    transfer_date?: string;
    reference_no?: string;
    item_id?: string;
    quantity?: number;
    rate?: number;
    transfer_type?: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled';
    notes?: string;
  }) => {
    const updated = await storage.updateStockTransfer(id, data);
    await refreshData();
    return updated;
  };

  const deleteStockTransfer = async (id: string, reason?: string) => {
    const res = await storage.deleteStockTransfer(id, reason);
    await refreshData();
    return res;
  };

  const reconcileStockBalances = async () => {
    const res = await storage.reconcileStockBalances();
    await refreshData();
    return res;
  };

  const recordPartyPayment = async (data: {
    party_id: string;
    payment_date?: string;
    amount: number;
    payment_type: 'received' | 'paid';
    payment_method?: string;
    reference?: string;
    notes?: string;
  }) => {
    const recorded = await storage.recordPartyPayment(data);
    await refreshData();
    return recorded;
  };

  const getPartyLedger = async (partyId: string) => {
    return await storage.getPartyLedger(partyId);
  };

  const getPartyHeldStock = async (partyId: string, itemId?: string) => {
    return await storage.getPartyHeldStock(partyId, itemId);
  };

  const getDistributionDashboardStats = async (filters?: any) => {
    return await storage.getDistributionDashboardStats(filters);
  };

  const getPartyPaymentStatusOverview = async (filters?: any) => {
    return await storage.getPartyPaymentStatusOverview(filters);
  };

  return (
    <AppDataContext.Provider
      value={{
        items,
        purchases,
        sales,
        expenses,
        states,
        parties,
        stockTransfers,
        partyPayments,
        settings,
        loading,
        isOnline,
        stats,
        refreshData,
        createPurchase,
        updatePurchase,
        deletePurchase,
        createSale,
        updateSale,
        deleteSale,
        recordSalePayment,
        voidSale,
        saveItem,
        adjustStock,
        archiveOrDeleteItem,
        getItemUsage,
        saveExpense,
        deleteExpense,
        updateSettings,
        restoreBackup,
        getStockMovementPeriod,
        saveState,
        archiveState,
        saveParty,
        archiveParty,
        createStockTransfer,
        updateStockTransfer,
        deleteStockTransfer,
        reconcileStockBalances,
        recordPartyPayment,
        getPartyLedger,
        getPartyHeldStock,
        getDistributionDashboardStats,
        getPartyPaymentStatusOverview
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
