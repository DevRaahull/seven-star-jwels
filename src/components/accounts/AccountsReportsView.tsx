import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  AlertCircle,
  Building,
  CheckCircle2,
  Printer,
  Package,
  Users
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/exportUtils';
import { DateFilterPreset } from '../../types';
import { InvoicesListView } from '../invoices/InvoicesListView';

interface AccountsReportsViewProps {
  initialSubTab?:
    | 'bills_ledger'
    | 'income_expenditure'
    | 'party_stock'
    | 'party_finances'
    | 'monthly_summary'
    | 'balance_sheet'
    | 'custom_report';
}

export const AccountsReportsView: React.FC<AccountsReportsViewProps> = ({ initialSubTab = 'bills_ledger' }) => {
  const { sales, purchases, items, expenses, settings, states, parties, stockTransfers, partyPayments } = useAppData();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<
    | 'bills_ledger'
    | 'income_expenditure'
    | 'party_stock'
    | 'party_finances'
    | 'monthly_summary'
    | 'balance_sheet'
    | 'custom_report'
  >(initialSubTab);

  // Date Filter for Income & Expenditure / Custom Report
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Compute inclusive Date Range
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (filterPreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (filterPreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (filterPreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (filterPreset === 'financial_year') {
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(year, 3, 1, 0, 0, 0);
      end = new Date(year + 1, 2, 31, 23, 59, 59);
    } else if (filterPreset === 'custom' && customStartDate && customEndDate) {
      // Strictly inclusive range!
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59`);
    } else {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    return { start, end };
  }, [filterPreset, customStartDate, customEndDate]);

  // Filtered dataset for selected period
  const periodData = useMemo(() => {
    const { start, end } = dateRange;

    // Helper for strictly inclusive date checking
    const isWithinRange = (dateStr: string) => {
      if (!dateStr) return false;
      const rawDate = dateStr.includes('T') ? dateStr : `${dateStr.slice(0, 10)}T12:00:00`;
      const d = new Date(rawDate);
      return d >= start && d <= end;
    };

    // Filter sales
    const filteredSales = sales.filter(s => {
      if (s.status !== 'completed') return false;
      return isWithinRange(s.sale_date);
    });

    // Filter purchases
    const filteredPurchases = purchases.filter(p => {
      if (p.status !== 'active') return false;
      return isWithinRange(p.purchase_date);
    });

    // Filter expenses
    const filteredExpenses = expenses.filter(e => {
      if (e.is_cancelled) return false;
      return isWithinRange(e.expense_date);
    });

    // Calculations
    let grossSales = 0;
    let taxableSales = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalOutputGst = 0;
    let cogs = 0; // Cost of goods sold
    let salesReceived = 0;
    let salesDue = 0;

    filteredSales.forEach(s => {
      const g = s.grand_total || (s as any).total_amount || 0;
      const t = s.total_taxable || (g / 1.03);
      grossSales += g;
      taxableSales += t;
      totalCgst += s.total_cgst || 0;
      totalSgst += s.total_sgst || 0;
      totalIgst += s.total_igst || 0;
      totalOutputGst += s.total_gst || (g - t);
      cogs += s.total_cost || 0;
      salesReceived += s.amount_received !== undefined ? s.amount_received : g;
      salesDue += s.amount_due !== undefined ? s.amount_due : Math.max(0, g - (s.amount_received || 0));
    });

    let grossPurchases = 0;
    let taxablePurchases = 0;
    let totalInputGst = 0;
    let purchasesPaid = 0;
    let purchasesDue = 0;

    filteredPurchases.forEach(p => {
      grossPurchases += p.grand_total;
      taxablePurchases += p.total_taxable;
      totalInputGst += p.total_gst;
      purchasesPaid += p.amount_paid || 0;
      purchasesDue += p.amount_due || 0;
    });

    let operatingExpenses = 0;
    const expenseBreakdown: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      operatingExpenses += e.amount;
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    // Income & Expenditure logic:
    // Sales Revenue (Taxable, ex-GST) - COGS = Gross Profit
    const grossProfit = Math.round((taxableSales - cogs) * 100) / 100;
    const grossMarginPct = taxableSales > 0 ? (grossProfit / taxableSales) * 100 : 0;

    // Gross Profit - Operating Expenses = Net Result
    const netResult = Math.round((grossProfit - operatingExpenses) * 100) / 100;
    const netMarginPct = taxableSales > 0 ? (netResult / taxableSales) * 100 : 0;

    // Net GST liability
    const netGstPayable = Math.round((totalOutputGst - totalInputGst) * 100) / 100;

    return {
      filteredSales,
      filteredPurchases,
      filteredExpenses,
      grossSales,
      taxableSales,
      totalCgst,
      totalSgst,
      totalIgst,
      totalOutputGst,
      cogs,
      grossProfit,
      grossMarginPct,
      operatingExpenses,
      expenseBreakdown,
      netResult,
      netMarginPct,
      grossPurchases,
      taxablePurchases,
      totalInputGst,
      netGstPayable,
      salesReceived,
      salesDue,
      purchasesPaid,
      purchasesDue
    };
  }, [sales, purchases, expenses, dateRange]);

  // Overall Financial Position / Balance Sheet (As on today)
  const balanceSheet = useMemo(() => {
    // Current Assets:
    // 1. Inventory at Purchase Cost
    const activeItems = items.filter(i => !i.is_archived);
    const inventoryAtCost = activeItems.reduce((sum, i) => sum + (i.current_stock * i.purchase_rate), 0);

    // 2. Customer Receivables (Total outstanding dues across all active sales)
    let customerReceivables = 0;
    let totalCashReceivedFromSales = 0;
    sales.forEach(s => {
      if (s.status !== 'completed') return;
      const g = s.grand_total || (s as any).total_amount || 0;
      const rec = s.amount_received !== undefined ? s.amount_received : g;
      const due = s.amount_due !== undefined ? s.amount_due : Math.max(0, g - rec);
      customerReceivables += due;
      totalCashReceivedFromSales += rec;
    });

    // Current Liabilities:
    // 1. Supplier Payables (Total outstanding dues across all active purchases)
    let supplierPayables = 0;
    let totalPaidToSuppliers = 0;
    let totalInputGstAllTime = 0;
    purchases.forEach(p => {
      if (p.status !== 'active') return;
      supplierPayables += p.amount_due || 0;
      totalPaidToSuppliers += p.amount_paid || 0;
      totalInputGstAllTime += p.total_gst || 0;
    });

    // 2. Output GST liability
    let totalOutputGstAllTime = 0;
    sales.forEach(s => {
      if (s.status !== 'completed') return;
      const g = s.grand_total || (s as any).total_amount || 0;
      const tax = s.total_taxable || (g / 1.03);
      totalOutputGstAllTime += s.total_gst || (g - tax);
    });
    const netGstPayableAllTime = Math.max(0, totalOutputGstAllTime - totalInputGstAllTime);

    // Cash from operations (Receipts from sales - Supplier payments - Expenses)
    const totalExpensesAllTime = expenses
      .filter(e => !e.is_cancelled)
      .reduce((sum, e) => sum + e.amount, 0);

    const trackedNetCashSurplus = totalCashReceivedFromSales - totalPaidToSuppliers - totalExpensesAllTime;

    const totalAssets = inventoryAtCost + customerReceivables;
    const totalLiabilities = supplierPayables + netGstPayableAllTime;
    const netWorth = totalAssets - totalLiabilities;

    return {
      inventoryAtCost,
      customerReceivables,
      supplierPayables,
      netGstPayableAllTime,
      trackedNetCashSurplus,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  }, [items, sales, purchases, expenses]);

  // Monthly Sales & Purchase Aggregates (12 Months)
  const monthlySummary = useMemo(() => {
    const monthsMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      purchasesTotal: number;
      salesTaxable: number;
      salesCgst: number;
      salesSgst: number;
      salesIgst: number;
      salesTotal: number;
      salesReceived: number;
      salesCount: number;
    }>();

    // Last 12 months
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      monthsMap.set(key, {
        monthKey: key,
        monthLabel: label,
        purchasesTotal: 0,
        salesTaxable: 0,
        salesCgst: 0,
        salesSgst: 0,
        salesIgst: 0,
        salesTotal: 0,
        salesReceived: 0,
        salesCount: 0
      });
    }

    // Populate purchases
    purchases.forEach(p => {
      if (p.status !== 'active') return;
      const key = p.purchase_date.slice(0, 7);
      if (monthsMap.has(key)) {
        const row = monthsMap.get(key)!;
        row.purchasesTotal += p.grand_total;
      }
    });

    // Populate sales
    sales.forEach(s => {
      if (s.status !== 'completed') return;
      const key = s.sale_date.slice(0, 7);
      if (monthsMap.has(key)) {
        const row = monthsMap.get(key)!;
        const g = s.grand_total || (s as any).total_amount || 0;
        const tax = s.total_taxable || (g / 1.03);
        const rec = s.amount_received !== undefined ? s.amount_received : g;

        row.salesTaxable += tax;
        row.salesCgst += s.total_cgst || 0;
        row.salesSgst += s.total_sgst || 0;
        row.salesIgst += s.total_igst || 0;
        row.salesTotal += g;
        row.salesReceived += rec;
        row.salesCount += 1;
      }
    });

    return Array.from(monthsMap.values());
  }, [sales, purchases]);

  // Export Monthly Summary to CSV
  const handleExportMonthlyCsv = () => {
    const headers = [
      'Month',
      'Wholesale Inward / Purchases (₹)',
      'Taxable Sales Revenue (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'IGST (₹)',
      'Total Sales with GST (₹)',
      'Payment Received (₹)',
      'Bills Count'
    ];

    const rows = monthlySummary.map(m => [
      m.monthLabel,
      m.purchasesTotal.toFixed(2),
      m.salesTaxable.toFixed(2),
      m.salesCgst.toFixed(2),
      m.salesSgst.toFixed(2),
      m.salesIgst.toFixed(2),
      m.salesTotal.toFixed(2),
      m.salesReceived.toFixed(2),
      m.salesCount
    ]);

    exportToCsv(`monthly_sales_summary_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Stock Held by Each State & Party
  const partyStockHeldData = useMemo(() => {
    return parties
      .filter(p => !p.is_archived)
      .map(party => {
        const state = states.find(s => s.id === party.state_id);
        const pTransfers = stockTransfers.filter(t => t.destination_party_id === party.id);
        const pSales = sales.filter(s => s.party_id === party.id && s.status === 'completed');

        const itemMap = new Map<
          string,
          { itemName: string; issued: number; returned: number; sold: number; held: number }
        >();
        pTransfers.forEach(t => {
          let entry = itemMap.get(t.item_id);
          if (!entry) {
            entry = { itemName: t.item_name, issued: 0, returned: 0, sold: 0, held: 0 };
            itemMap.set(t.item_id, entry);
          }
          if (t.transfer_type === 'issue') entry.issued += t.quantity;
          else entry.returned += t.quantity;
        });

        pSales.forEach(s => {
          if (s.deduct_from_party_stock) {
            s.items?.forEach(line => {
              if (!line.item_id) return;
              let entry = itemMap.get(line.item_id);
              if (!entry) {
                entry = { itemName: line.item_name, issued: 0, returned: 0, sold: 0, held: 0 };
                itemMap.set(line.item_id, entry);
              }
              entry.sold += line.quantity;
            });
          }
        });

        const itemsBreakdown = Array.from(itemMap.values()).map(i => ({
          ...i,
          held: Math.max(0, i.issued - i.returned - i.sold)
        }));

        const totalHeldPieces = itemsBreakdown.reduce((sum, i) => sum + i.held, 0);

        return {
          partyId: party.id,
          partyName: party.name,
          stateName: state?.name || 'Unknown State',
          phone: party.phone,
          itemsBreakdown,
          totalHeldPieces
        };
      });
  }, [parties, states, stockTransfers, sales]);

  // Party Receivables & Payables Report
  const partyFinancesData = useMemo(() => {
    let totalReceivables = 0;
    let totalPayables = 0;

    const list = parties
      .filter(p => !p.is_archived)
      .map(party => {
        const state = states.find(s => s.id === party.state_id);
        const pSales = sales.filter(s => s.party_id === party.id && s.status === 'completed');
        const pPayments = partyPayments.filter(pay => pay.party_id === party.id);

        const opening = Number(party.opening_balance) || 0;
        const salesTotal = pSales.reduce((sum, s) => sum + s.grand_total, 0);
        const salesReceived = pSales.reduce((sum, s) => sum + (s.amount_received || 0), 0);
        const directReceived = pPayments
          .filter(pay => pay.payment_type === 'received')
          .reduce((sum, pay) => sum + pay.amount, 0);
        const directPaid = pPayments
          .filter(pay => pay.payment_type === 'paid')
          .reduce((sum, pay) => sum + pay.amount, 0);

        const totalReceived = salesReceived + directReceived;
        const netPosition = Math.round((opening + salesTotal + directPaid - totalReceived) * 100) / 100;
        const receivable = netPosition > 0 ? netPosition : 0;
        const payable = netPosition < 0 ? Math.abs(netPosition) : 0;

        totalReceivables += receivable;
        totalPayables += payable;

        return {
          partyId: party.id,
          partyName: party.name,
          stateName: state?.name || 'Unknown State',
          phone: party.phone,
          opening,
          salesTotal,
          totalReceived,
          directPaid,
          netPosition,
          receivable,
          payable
        };
      });

    return {
      partiesList: list,
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      totalPayables: Math.round(totalPayables * 100) / 100
    };
  }, [parties, states, sales, partyPayments]);

  // Export Party Stock to CSV
  const handleExportPartyStockCsv = () => {
    const headers = [
      'Party Name',
      'State',
      'Phone',
      'Item Name',
      'Issued (pcs)',
      'Returned (pcs)',
      'Sold/Billed (pcs)',
      'Current Held (pcs)'
    ];
    const rows: any[] = [];
    partyStockHeldData.forEach(p => {
      if (p.itemsBreakdown.length === 0) {
        rows.push([p.partyName, p.stateName, p.phone || '-', 'None', 0, 0, 0, 0]);
      } else {
        p.itemsBreakdown.forEach(item => {
          rows.push([
            p.partyName,
            p.stateName,
            p.phone || '-',
            item.itemName,
            item.issued,
            item.returned,
            item.sold,
            item.held
          ]);
        });
      }
    });
    exportToCsv(`party_stock_held_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Export Party Finances to CSV
  const handleExportPartyFinancesCsv = () => {
    const headers = [
      'Party Name',
      'State',
      'Phone',
      'Opening Balance (₹)',
      'Total Sales (₹)',
      'Total Received (₹)',
      'Direct Paid (₹)',
      'Net Receivable (₹)',
      'Net Payable (₹)'
    ];
    const rows = partyFinancesData.partiesList.map(p => [
      p.partyName,
      p.stateName,
      p.phone || '-',
      p.opening.toFixed(2),
      p.salesTotal.toFixed(2),
      p.totalReceived.toFixed(2),
      p.directPaid.toFixed(2),
      p.receivable.toFixed(2),
      p.payable.toFixed(2)
    ]);
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      partyFinancesData.totalReceivables.toFixed(2),
      partyFinancesData.totalPayables.toFixed(2)
    ]);
    exportToCsv(`party_receivables_payables_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2B45]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            Wholesale Accounts & Reports
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Profit & Loss, Stock Held by Parties, Receivables & Payables, and Invoices.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#111B2E] p-1 rounded-xl border border-[#1E2B45]">
          <button
            onClick={() => setActiveTab('bills_ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'bills_ledger'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Bills Ledger
          </button>
          <button
            onClick={() => setActiveTab('income_expenditure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'income_expenditure'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Profit & Loss (P&L)
          </button>
          <button
            onClick={() => setActiveTab('party_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'party_stock'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Party Stock Held
          </button>
          <button
            onClick={() => setActiveTab('party_finances')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'party_finances'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Party Receivables / Payables
          </button>
          <button
            onClick={() => setActiveTab('balance_sheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'balance_sheet'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('monthly_summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'monthly_summary'
                ? 'bg-[#D6B36A] text-[#0B1220] shadow-sm'
                : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            Monthly Sales
          </button>
        </div>
      </div>

      {/* SUB-TAB 0: BILLS & INVOICES LEDGER WITH RECORD PAYMENT */}
      {activeTab === 'bills_ledger' && (
        <InvoicesListView />
      )}

      {/* SUB-TAB 1: INCOME & EXPENDITURE STATEMENT */}
      {(activeTab === 'income_expenditure' || activeTab === 'custom_report') && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#AAB4C5]">
              <Calendar size={15} className="text-[#D6B36A]" />
              <span className="font-semibold text-[#F5F3EE]">Reporting Window:</span>
              <select
                value={filterPreset}
                onChange={e => setFilterPreset(e.target.value as DateFilterPreset)}
                className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="financial_year">Current Financial Year</option>
                <option value="today">Today</option>
                <option value="custom">Custom Date Range (Inclusive)</option>
              </select>
            </div>

            {filterPreset === 'custom' && (
              <div className="flex items-center gap-2 text-xs text-[#AAB4C5]">
                <span>From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
                <span>To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>
            )}

            <div className="text-xs text-[#7A8699]">
              Inclusive: {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
              <span className="text-xs text-[#AAB4C5] font-medium">Taxable Wholesale Revenue</span>
              <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {formatCurrency(periodData.taxableSales)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Total Billed with GST: {formatCurrency(periodData.grossSales)}
              </span>
            </div>

            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
              <span className="text-xs text-[#AAB4C5] font-medium">Cost of Goods Sold (COGS)</span>
              <p className="text-xl font-bold font-mono text-purple-400 mt-1.5">
                {formatCurrency(periodData.cogs)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Gross Trading Margin: {periodData.grossMarginPct.toFixed(1)}%
              </span>
            </div>

            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
              <span className="text-xs text-[#AAB4C5] font-medium">Net Operating Result</span>
              <p
                className={`text-xl font-bold font-mono mt-1.5 ${
                  periodData.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(periodData.netResult)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Net Margin: {periodData.netMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Full Formal Income & Expenditure Ledger Statement */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#1E2B45] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#D6B36A] uppercase tracking-wider">
                  Statement of Income & Expenditure
                </h3>
                <p className="text-xs text-[#AAB4C5]">
                  For the period from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#16233B] border border-[#1E2B45] text-[#D6B36A]">
                Wholesale Trading Basis
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* SECTION A: TRADING REVENUE & COGS */}
              <div className="space-y-2">
                <div className="flex justify-between py-1 text-sm font-sans font-bold text-[#F5F3EE]">
                  <span>A. REVENUE FROM WHOLESALE OPERATIONS</span>
                  <span></span>
                </div>
                <div className="flex justify-between pl-4 text-[#AAB4C5]">
                  <span className="font-sans">Gross Wholesale Jewellery Sales (including GST):</span>
                  <span>{formatCurrency(periodData.grossSales)}</span>
                </div>
                <div className="flex justify-between pl-4 text-amber-400">
                  <span className="font-sans">Less: Output GST Collected (Pass-Through Tax):</span>
                  <span>−{formatCurrency(periodData.totalOutputGst)}</span>
                </div>
                <div className="flex justify-between pl-4 py-1.5 border-t border-[#1E2B45] font-semibold text-[#F5F3EE]">
                  <span className="font-sans">Net Operational Revenue (Taxable Value):</span>
                  <span>{formatCurrency(periodData.taxableSales)}</span>
                </div>
              </div>

              {/* SECTION B: COST OF GOODS SOLD */}
              <div className="space-y-2 pt-2 border-t border-[#1E2B45]">
                <div className="flex justify-between py-1 text-sm font-sans font-bold text-[#F5F3EE]">
                  <span>B. COST OF INVENTORY SOLD</span>
                  <span></span>
                </div>
                <div className="flex justify-between pl-4 text-[#AAB4C5]">
                  <span className="font-sans">Cost of Goods Sold (Exact purchase cost snapshot of sold units):</span>
                  <span className="text-purple-400">−{formatCurrency(periodData.cogs)}</span>
                </div>
                <div className="flex justify-between pl-4 py-1.5 border-t border-[#1E2B45] font-bold text-[#D6B36A] text-sm">
                  <span className="font-sans">GROSS TRADING PROFIT (A − B):</span>
                  <span>{formatCurrency(periodData.grossProfit)}</span>
                </div>
              </div>

              {/* SECTION C: OPERATING EXPENDITURES */}
              <div className="space-y-2 pt-2 border-t border-[#1E2B45]">
                <div className="flex justify-between py-1 text-sm font-sans font-bold text-[#F5F3EE]">
                  <span>C. OPERATING EXPENDITURES</span>
                  <span className="text-rose-400">−{formatCurrency(periodData.operatingExpenses)}</span>
                </div>
                {Object.keys(periodData.expenseBreakdown).length === 0 ? (
                  <div className="pl-4 text-[#7A8699] font-sans italic">
                    No operating expenses recorded in this period.
                  </div>
                ) : (
                  Object.entries(periodData.expenseBreakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between pl-4 text-[#AAB4C5]">
                      <span className="font-sans">{cat}:</span>
                      <span>{formatCurrency(amt)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* SECTION D: NET OPERATING RESULT */}
              <div className="pt-4 border-t-2 border-[#1E2B45]">
                <div className="flex justify-between py-3 px-4 bg-[#0B1220] rounded-xl border border-[#1E2B45] text-base font-bold">
                  <span className="font-sans text-[#F5F3EE]">NET OPERATING RESULT (PROFIT / LOSS):</span>
                  <span
                    className={periodData.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                  >
                    {formatCurrency(periodData.netResult)}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory Accounting Note */}
            <div className="p-3.5 bg-[#0B1220]/60 border border-[#1E2B45] rounded-xl text-[11px] text-[#AAB4C5] space-y-1">
              <p className="font-semibold text-[#D6B36A]">Accounting Transparency Disclosure:</p>
              <p>
                1. <strong>GST is not revenue or expense</strong>: All GST collected from buyers and paid to suppliers represents government tax liability, tracked separately in your GST register.
              </p>
              <p>
                2. <strong>True COGS matching</strong>: Expenses do not penalize unsold inventory stock. Stock remaining in your safe is an Asset on your Balance Sheet, not an expense.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: STOCK HELD BY STATES & PARTIES */}
      {activeTab === 'party_stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#D6B36A] uppercase tracking-wider flex items-center gap-2">
                <Package size={16} />
                <span>Stock Held by Each State & Party</span>
              </h3>
              <p className="text-xs text-[#AAB4C5] mt-0.5">
                Physical jewellery pieces held across parties without recording sales or receivables.
              </p>
            </div>
            <button
              onClick={handleExportPartyStockCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold transition"
            >
              <FileSpreadsheet size={14} />
              <span>Export Stock CSV</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
              <span className="text-xs text-[#AAB4C5]">Active Consignment Parties</span>
              <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-1">
                {partyStockHeldData.filter(p => p.totalHeldPieces > 0).length}
              </p>
            </div>
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
              <span className="text-xs text-[#AAB4C5]">Total Pieces in Field</span>
              <p className="text-xl font-bold font-mono text-[#D6B36A] mt-1">
                {partyStockHeldData.reduce((sum, p) => sum + p.totalHeldPieces, 0)} pcs
              </p>
            </div>
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <span className="text-xs text-[#AAB4C5]">Total Registered Parties</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {partyStockHeldData.length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0E1726] border-b border-[#1E2B45] text-[#AAB4C5]">
                    <th className="py-3 px-4 font-semibold">Party & State</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                    <th className="py-3 px-4 font-semibold">Item-wise Consignment Breakdown</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Held</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2B45]/60">
                  {partyStockHeldData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#7A8699]">
                        No registered parties found. Add states and parties from the States & Parties tab.
                      </td>
                    </tr>
                  ) : (
                    partyStockHeldData.map(party => (
                      <tr key={party.partyId} className="hover:bg-[#16233B]/40 transition align-top">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#F5F3EE]">{party.partyName}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#16233B] text-[#D6B36A] border border-[#1E2B45]">
                            {party.stateName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#AAB4C5]">
                          {party.phone ? (
                            <a href={`tel:${party.phone}`} className="text-emerald-400 hover:underline">
                              {party.phone}
                            </a>
                          ) : (
                            <span className="text-[#7A8699]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {party.itemsBreakdown.length === 0 ? (
                            <span className="text-[#7A8699] italic">No stock transfers recorded</span>
                          ) : (
                            <div className="space-y-1.5">
                              {party.itemsBreakdown.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap items-center justify-between text-xs bg-[#0B1220]/60 p-1.5 rounded border border-[#1E2B45]">
                                  <span className="font-medium text-[#F5F3EE]">{item.itemName}</span>
                                  <div className="flex items-center gap-2 font-mono text-[11px]">
                                    <span className="text-[#AAB4C5]">Issued: {item.issued}</span>
                                    <span className="text-amber-400">Returned: {item.returned}</span>
                                    <span className="text-blue-400">Sold: {item.sold}</span>
                                    <span className="font-bold text-[#D6B36A] bg-[#D6B36A]/10 px-1.5 py-0.5 rounded border border-[#D6B36A]/30">
                                      Held: {item.held}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-block font-mono text-sm font-bold text-[#D6B36A] bg-[#D6B36A]/10 px-2.5 py-1 rounded-lg border border-[#D6B36A]/30">
                            {party.totalHeldPieces} pcs
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: PARTY RECEIVABLES & PAYABLES */}
      {activeTab === 'party_finances' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#D6B36A] uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={16} />
                <span>Party Receivables & Payables Report</span>
              </h3>
              <p className="text-xs text-[#AAB4C5] mt-0.5">
                Financial balances, sales billed, payments received and settlements across parties.
              </p>
            </div>
            <button
              onClick={handleExportPartyFinancesCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold transition"
            >
              <FileSpreadsheet size={14} />
              <span>Export Finances CSV</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#111B2E] border border-emerald-500/30 rounded-xl p-4">
              <span className="text-xs text-emerald-400 font-medium">Total Party Receivables (Money Due In)</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(partyFinancesData.totalReceivables)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Total unpaid sales balances & debit positions across all parties
              </span>
            </div>
            <div className="bg-[#111B2E] border border-rose-500/30 rounded-xl p-4">
              <span className="text-xs text-rose-400 font-medium">Total Party Payables (Advances / Credit Dues)</span>
              <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {formatCurrency(partyFinancesData.totalPayables)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Advance money received from parties pending billing
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#0E1726] border-b border-[#1E2B45] text-[#AAB4C5] font-sans">
                    <th className="py-3 px-4 font-semibold">Party Name</th>
                    <th className="py-3 px-4 font-semibold">State</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                    <th className="py-3 px-4 font-semibold text-right">Opening (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right">Sales (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-400">Received (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right text-rose-400">Paid Out (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-400">Receivable (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right text-rose-400">Payable (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2B45]/60">
                  {partyFinancesData.partiesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#7A8699] font-sans">
                        No registered parties found.
                      </td>
                    </tr>
                  ) : (
                    partyFinancesData.partiesList.map(p => (
                      <tr key={p.partyId} className="hover:bg-[#16233B]/40 transition">
                        <td className="py-3 px-4 font-sans font-semibold text-[#F5F3EE]">
                          {p.partyName}
                        </td>
                        <td className="py-3 px-4 font-sans text-[#AAB4C5]">
                          {p.stateName}
                        </td>
                        <td className="py-3 px-4 text-[#AAB4C5]">
                          {p.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-[#AAB4C5]">
                          {formatCurrency(p.opening)}
                        </td>
                        <td className="py-3 px-4 text-right text-[#F5F3EE]">
                          {formatCurrency(p.salesTotal)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                          {formatCurrency(p.totalReceived)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-400">
                          {formatCurrency(p.directPaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {p.receivable > 0 ? formatCurrency(p.receivable) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400">
                          {p.payable > 0 ? formatCurrency(p.payable) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {partyFinancesData.partiesList.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#0E1726] border-t-2 border-[#1E2B45] text-xs font-bold">
                      <td colSpan={7} className="py-3.5 px-4 font-sans text-right text-[#D6B36A] uppercase tracking-wider">
                        Consolidated Totals:
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 text-sm">
                        {formatCurrency(partyFinancesData.totalReceivables)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-400 text-sm">
                        {formatCurrency(partyFinancesData.totalPayables)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BALANCE SHEET / FINANCIAL POSITION */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4">
              <span className="text-xs text-[#AAB4C5] font-medium">Total Current Assets</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1.5">
                {formatCurrency(balanceSheet.totalAssets)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Inventory at cost + Buyer receivables
              </span>
            </div>

            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4">
              <span className="text-xs text-[#AAB4C5] font-medium">Total Liabilities</span>
              <p className="text-xl font-bold font-mono text-rose-400 mt-1.5">
                {formatCurrency(balanceSheet.totalLiabilities)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Supplier payables + Net GST payable
              </span>
            </div>

            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4">
              <span className="text-xs text-[#AAB4C5] font-medium">Net Business Position</span>
              <p className="text-xl font-bold font-mono text-[#D6B36A] mt-1.5">
                {formatCurrency(balanceSheet.netWorth)}
              </p>
              <span className="text-[11px] text-[#7A8699] mt-0.5 block">
                Assets minus Liabilities
              </span>
            </div>
          </div>

          {/* Detailed Two-Column Balance Sheet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ASSETS COLUMN */}
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2B45] pb-2">
                <Scale size={16} />
                <span>Current Assets</span>
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-[#AAB4C5]">
                  <div>
                    <span className="font-sans font-semibold text-[#F5F3EE] block">
                      Inventory Valuation (at Purchase Cost)
                    </span>
                    <span className="text-[10px] text-[#7A8699] font-sans">
                      Physical verified jewellery stock
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#F5F3EE]">
                    {formatCurrency(balanceSheet.inventoryAtCost)}
                  </span>
                </div>

                <div className="flex justify-between text-[#AAB4C5] pt-2 border-t border-[#1E2B45]/50">
                  <div>
                    <span className="font-sans font-semibold text-[#F5F3EE] block">
                      Customer Receivables (Sundry Debtors)
                    </span>
                    <span className="text-[10px] text-[#7A8699] font-sans">
                      Pending dues owed by wholesale buyers
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#F5F3EE]">
                    {formatCurrency(balanceSheet.customerReceivables)}
                  </span>
                </div>

                <div className="pt-4 border-t-2 border-emerald-500/40 flex justify-between text-sm font-bold text-emerald-400">
                  <span className="font-sans">TOTAL CURRENT ASSETS:</span>
                  <span>{formatCurrency(balanceSheet.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES COLUMN */}
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-sm text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2B45] pb-2">
                <Scale size={16} />
                <span>Current Liabilities & Dues</span>
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-[#AAB4C5]">
                  <div>
                    <span className="font-sans font-semibold text-[#F5F3EE] block">
                      Supplier Payables (Sundry Creditors)
                    </span>
                    <span className="text-[10px] text-[#7A8699] font-sans">
                      Outstanding payments due to stock suppliers
                    </span>
                  </div>
                  <span className="text-sm font-bold text-rose-400">
                    {formatCurrency(balanceSheet.supplierPayables)}
                  </span>
                </div>

                <div className="flex justify-between text-[#AAB4C5] pt-2 border-t border-[#1E2B45]/50">
                  <div>
                    <span className="font-sans font-semibold text-[#F5F3EE] block">
                      Net Output GST Payable
                    </span>
                    <span className="text-[10px] text-[#7A8699] font-sans">
                      Output tax liability less input tax credit
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {formatCurrency(balanceSheet.netGstPayableAllTime)}
                  </span>
                </div>

                <div className="pt-4 border-t-2 border-rose-500/40 flex justify-between text-sm font-bold text-rose-400">
                  <span className="font-sans">TOTAL LIABILITIES:</span>
                  <span>{formatCurrency(balanceSheet.totalLiabilities)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Honest Financial Disclosure Card */}
          <div className="p-4 bg-[#111B2E] border border-[#1E2B45] rounded-xl text-xs text-[#AAB4C5] space-y-2">
            <h4 className="font-semibold text-[#D6B36A]">Note on Cash & Bank Accounts:</h4>
            <p className="leading-relaxed">
              Based on recorded transactions, cumulative collections received exceed supplier payments and operating expenses by <strong>{formatCurrency(balanceSheet.trackedNetCashSurplus)}</strong>. To maintain 100% financial integrity, SEVEN STAR JWELS does not fabricate bank ledger figures. Reconcile this balance directly with your physical locker cash and current bank account statements.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MONTHLY SALES SUMMARY TABLE */}
      {activeTab === 'monthly_summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider">
              12-Month Wholesale Inward & Outward Summary
            </h3>
            <button
              onClick={handleExportMonthlyCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold transition"
            >
              <FileSpreadsheet size={14} />
              <span>Export Monthly CSV</span>
            </button>
          </div>

          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0E1726] border-b border-[#1E2B45] text-[#AAB4C5]">
                    <th className="py-3 px-4 font-semibold">Month</th>
                    <th className="py-3 px-4 font-semibold text-right text-purple-400">Purchases (Inward)</th>
                    <th className="py-3 px-4 font-semibold text-right">Taxable Sales</th>
                    <th className="py-3 px-4 font-semibold text-right text-amber-400">CGST</th>
                    <th className="py-3 px-4 font-semibold text-right text-amber-400">SGST</th>
                    <th className="py-3 px-4 font-semibold text-right text-amber-400">IGST</th>
                    <th className="py-3 px-4 font-semibold text-right text-[#F5F3EE]">Total Sales</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-400">Received</th>
                    <th className="py-3 px-4 font-semibold text-center">Bills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2B45]/60 font-mono">
                  {monthlySummary.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-[#16233B]/50 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-[#F5F3EE]">
                        {m.monthLabel}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-300">
                        {formatCurrency(m.purchasesTotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#AAB4C5]">
                        {formatCurrency(m.salesTaxable)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400/80">
                        {formatCurrency(m.salesCgst)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400/80">
                        {formatCurrency(m.salesSgst)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400/80">
                        {formatCurrency(m.salesIgst)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#F5F3EE]">
                        {formatCurrency(m.salesTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                        {formatCurrency(m.salesReceived)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans text-[#AAB4C5]">
                        {m.salesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
