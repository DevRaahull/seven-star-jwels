import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Receipt,
  FileBarChart,
  CheckCircle2
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ActiveNavTab, Sale, Purchase } from '../../types';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveNavTab) => void;
  openInvoiceModal: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  openInvoiceModal
}) => {
  const { stats, sales, purchases, items } = useAppData();

  const recentSales = sales.slice(0, 5);
  const recentPurchases = purchases.slice(0, 5);
  const activeItems = items.filter(i => !i.is_archived);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            Wholesale Jewellery Dashboard
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Real-time summary of sales, stock inward, inventory, and net business result.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('create_purchase')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold shadow transition active:scale-95"
          >
            <Plus size={15} />
            <span>New Purchase</span>
          </button>

          <button
            onClick={() => setActiveTab('create_sale')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow transition active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Sale (Bill)</span>
          </button>
        </div>
      </div>

      {/* Exactly 6 Essential Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. This Month's Sales */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">This Month&apos;s Sales</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {formatCurrency(stats.month_sales)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Gross wholesale sales with GST
          </span>
        </div>

        {/* 2. This Month's Purchases */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">This Month&apos;s Purchases</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {formatCurrency(stats.month_purchases)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Stock inward from suppliers
          </span>
        </div>

        {/* 3. Current Stock Summary */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">Current Stock Summary</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Boxes size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#D6B36A] mt-2">
            {formatCurrency(stats.current_stock_value)}
          </p>
          <span className="text-[11px] text-[#AAB4C5] mt-0.5 block">
            {stats.current_stock_units} total pieces in hand
          </span>
        </div>

        {/* 4. This Month's Income */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">This Month&apos;s Income</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {formatCurrency(stats.month_income)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Taxable sales (excluding tax)
          </span>
        </div>

        {/* 5. This Month's Expenditure */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">This Month&apos;s Expenditure</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {formatCurrency(stats.month_expenditure)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            COGS of sold items + Operating costs
          </span>
        </div>

        {/* 6. This Month's Net Result */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#2A3B5E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#D6B36A] font-semibold">This Month&apos;s Net Result</span>
            <div className="p-2 rounded-lg bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/30">
              <FileBarChart size={16} />
            </div>
          </div>
          <p className={`text-xl font-bold font-mono mt-2 ${stats.month_net_result >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(stats.month_net_result)}
          </p>
          <span className="text-[11px] text-[#AAB4C5] mt-0.5 block">
            Net operating profit for this month
          </span>
        </div>
      </div>

      {/* Below Cards: Recent Purchases & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#F5F3EE] text-sm tracking-wide flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#D6B36A]" />
              <span>Recent Purchases</span>
            </h3>
            <button
              onClick={() => setActiveTab('purchase')}
              className="text-xs text-[#D6B36A] hover:underline font-medium"
            >
              View Register
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2B45] text-[#7A8699] uppercase font-semibold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Bill No.</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2B45]/50">
                {recentPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7A8699]">
                      No purchases recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-[#16233B]/50 transition">
                      <td className="py-2.5 text-[#AAB4C5] whitespace-nowrap">{formatDate(p.purchase_date)}</td>
                      <td className="py-2.5 font-medium text-[#F5F3EE] truncate max-w-[130px]">{p.supplier_name}</td>
                      <td className="py-2.5 font-mono text-[#AAB4C5]">{p.supplier_invoice_number}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#F5F3EE]">{formatCurrency(p.grand_total)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          p.payment_status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : p.payment_status === 'Partially Paid'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#F5F3EE] text-sm tracking-wide flex items-center gap-2">
              <Receipt size={16} className="text-[#D6B36A]" />
              <span>Recent Sales</span>
            </h3>
            <button
              onClick={() => setActiveTab('create_sale')}
              className="text-xs text-[#D6B36A] hover:underline font-medium"
            >
              View All Invoices
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2B45] text-[#7A8699] uppercase font-semibold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Buyer</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2B45]/50">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7A8699]">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map(s => {
                    const isPaid = s.payment_status === 'Payment Complete' || s.payment_status === 'Paid';
                    const isAdvance = s.payment_status === 'Advance Paid';

                    return (
                      <tr
                        key={s.id}
                        onClick={() => openInvoiceModal(s)}
                        className="hover:bg-[#16233B]/60 transition cursor-pointer"
                      >
                        <td className="py-2.5 text-[#AAB4C5] whitespace-nowrap">{formatDate(s.sale_date)}</td>
                        <td className="py-2.5 font-mono text-[#D6B36A] font-medium">{s.invoice_number}</td>
                        <td className="py-2.5 font-medium text-[#F5F3EE] truncate max-w-[130px]">{s.customer_name}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#F5F3EE]">{formatCurrency(s.grand_total)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isAdvance
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {s.payment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Small Inventory Status Summary */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#F5F3EE] text-sm tracking-wide flex items-center gap-2">
            <Boxes size={16} className="text-[#D6B36A]" />
            <span>Inventory Status Summary</span>
          </h3>
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs text-[#D6B36A] hover:underline font-medium"
          >
            Full Stock Movement
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
            <span className="text-[#7A8699]">Active Products:</span>
            <p className="font-bold text-[#F5F3EE] text-base mt-0.5">{activeItems.length} items</p>
          </div>
          <div className="p-3 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
            <span className="text-[#7A8699]">Total Stock Units:</span>
            <p className="font-bold text-[#D6B36A] text-base font-mono mt-0.5">{stats.current_stock_units} pcs</p>
          </div>
          <div className="p-3 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
            <span className="text-[#7A8699]">Total Asset Value:</span>
            <p className="font-bold text-[#F5F3EE] text-base font-mono mt-0.5">{formatCurrency(stats.current_stock_value)}</p>
          </div>
          <div className="p-3 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
            <span className="text-[#7A8699]">Valuation Method:</span>
            <p className="font-medium text-emerald-400 mt-1">Purchase Cost</p>
          </div>
        </div>
      </div>
    </div>
  );
};
