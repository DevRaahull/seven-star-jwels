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
  CheckCircle2,
  Wallet,
  Layers,
  ShieldCheck,
  ChevronRight,
  Handshake,
  Coins,
  Scale,
  CornerUpRight,
  Users
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ActiveNavTab, Sale, Purchase } from '../../types';
import {
  SolitaireDiamondRing,
  GoldBullionBars,
  SparklingDiamonds
} from '../common/JewelleryAssets';

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
    <div className="space-y-6 pb-12 relative">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gold-gradient tracking-wide uppercase drop-shadow-sm">
            Wholesale Jewellery Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[#AAB4C5] mt-1 font-light">
            Real-time summary of sales, stock inward, inventory, and net business result.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('create_purchase')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#D6B36A]/40 bg-[#111B2E]/90 hover:bg-[#16233B] hover:border-[#D6B36A] text-[#F5F3EE] text-xs font-semibold shadow-sm transition active:scale-95 duration-150"
          >
            <Plus size={15} className="text-[#D6B36A]" />
            <span>+ New Purchase</span>
          </button>

          <button
            onClick={() => setActiveTab('create_sale')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#F5E6B3] via-[#D6B36A] to-[#B08E46] text-[#070B14] hover:brightness-110 text-xs font-bold shadow-[0_0_20px_rgba(214,179,106,0.35)] transition active:scale-95 duration-150"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>+ New Sale (Bill)</span>
          </button>
        </div>
      </div>

      {/* Exactly 6 Essential Cards (Matching Luxury Concept Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 relative z-10">
        {/* 1. This Month's Sales */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-[#D6B36A] border border-[#D6B36A]/25">
              <TrendingUp size={18} />
            </div>
            <span className="text-xs font-medium text-[#AAB4C5] tracking-wide">
              This Month&apos;s Sales
            </span>
          </div>

          <div className="relative mt-3 z-10">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EE] tracking-tight">
              {formatCurrency(stats.month_sales)}
            </p>
            <span className="text-[11px] text-[#7A8699] mt-1 block">
              Gross wholesale sales with GST
            </span>
          </div>

          {/* Decorative Solitaire Ring Floating Asset */}
          <div className="absolute right-2 bottom-2 pointer-events-none opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 scale-75 sm:scale-100 origin-bottom-right">
            <SolitaireDiamondRing size={72} />
          </div>
        </div>

        {/* 2. This Month's Purchases */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/25">
              <ShoppingBag size={18} />
            </div>
            <span className="text-xs font-medium text-[#AAB4C5] tracking-wide">
              This Month&apos;s Purchases
            </span>
          </div>

          <div className="relative mt-3 z-10">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EE] tracking-tight">
              {formatCurrency(stats.month_purchases)}
            </p>
            <span className="text-[11px] text-[#7A8699] mt-1 block">
              Stock inward from suppliers
            </span>
          </div>

          {/* Decorative Gold Bullion Bars Floating Asset */}
          <div className="absolute right-2 bottom-2 pointer-events-none opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 scale-75 sm:scale-100 origin-bottom-right">
            <GoldBullionBars size={72} />
          </div>
        </div>

        {/* 3. Current Stock Summary */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-[#D6B36A] border border-[#D6B36A]/25">
              <Boxes size={18} />
            </div>
            <span className="text-xs font-medium text-[#AAB4C5] tracking-wide">
              Current Stock Summary
            </span>
          </div>

          <div className="relative mt-3 z-10">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#D6B36A] tracking-tight">
              {formatCurrency(stats.current_stock_value)}
            </p>
            <span className="text-[11px] text-[#AAB4C5] mt-1 block">
              {stats.current_stock_units} total pieces in hand
            </span>
          </div>

          {/* Decorative Sparkling Diamonds Floating Asset */}
          <div className="absolute right-2 bottom-2 pointer-events-none opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 scale-75 sm:scale-100 origin-bottom-right">
            <SparklingDiamonds size={72} />
          </div>
        </div>

        {/* 4. This Month's Income */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              <Coins size={18} />
            </div>
            <span className="text-xs font-medium text-[#AAB4C5] tracking-wide">
              This Month&apos;s Income
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EE] tracking-tight">
              {formatCurrency(stats.month_income)}
            </p>
            <span className="text-[11px] text-[#7A8699] mt-1 block">
              Taxable sales (excluding tax)
            </span>
          </div>
        </div>

        {/* 5. This Month's Expenditure */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <ArrowDownRight size={18} />
            </div>
            <span className="text-xs font-medium text-[#AAB4C5] tracking-wide">
              This Month&apos;s Expenditure
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EE] tracking-tight">
              {formatCurrency(stats.month_expenditure)}
            </p>
            <span className="text-[11px] text-[#7A8699] mt-1 block">
              COGS of sold items + Operating costs
            </span>
          </div>
        </div>

        {/* 6. This Month's Net Result */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/95 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/20 hover:border-[#D6B36A]/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(214,179,106,0.12)] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/30">
              <Scale size={18} />
            </div>
            <span className="text-xs font-semibold text-[#D6B36A] tracking-wide">
              This Month&apos;s Net Result
            </span>
          </div>

          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${stats.month_net_result >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(stats.month_net_result)}
            </p>
            <span className="text-[11px] text-[#AAB4C5] mt-1 block">
              Net operating profit for this month
            </span>
          </div>
        </div>
      </div>

      {/* Authoritative Financial Synchronization Bar: Cash Inflow & Collections */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/90 via-[#0E1729]/95 to-[#070C16] border border-[#D6B36A]/25 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition hover:border-[#D6B36A]/45">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2B45]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D6B36A]/15 border border-[#D6B36A]/40 flex items-center justify-center text-[#D6B36A] shrink-0">
              <Handshake size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[#F5F3EE]">
                  Cash Realization & Collections
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-medium text-emerald-400">
                  <ShieldCheck size={12} />
                  Authoritative Ledger Synced
                </span>
              </div>
              <p className="text-[11px] text-[#AAB4C5] mt-0.5">
                Payments collected from wholesale parties, state heads & direct customer sales.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('states_parties')}
            className="flex items-center gap-1.5 text-xs text-[#D6B36A] hover:text-[#FFF0C7] font-semibold transition self-start sm:self-auto group"
          >
            <span>States & Parties Ledger</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 text-xs">
          <div className="p-3.5 bg-[#070C16]/80 border border-[#1E2B45]/80 hover:border-[#D6B36A]/30 rounded-xl transition flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#7A8699] text-[11px]">
              <CornerUpRight size={13} className="text-emerald-400" />
              <span>This Month&apos;s Inflow</span>
            </div>
            <p className="font-bold text-emerald-400 font-mono text-lg sm:text-xl mt-1.5">
              {formatCurrency(stats.month_cash_received || 0)}
            </p>
            <span className="text-[10px] text-[#7A8699] mt-0.5">Sales + party receipts</span>
          </div>

          <div className="p-3.5 bg-[#070C16]/80 border border-[#1E2B45]/80 hover:border-[#D6B36A]/30 rounded-xl transition flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#7A8699] text-[11px]">
              <Coins size={13} className="text-[#D6B36A]" />
              <span>Total Cash Collected</span>
            </div>
            <p className="font-bold text-[#F5F3EE] font-mono text-lg sm:text-xl mt-1.5">
              {formatCurrency(stats.total_cash_received || 0)}
            </p>
            <span className="text-[10px] text-[#7A8699] mt-0.5">All-time verified inflows</span>
          </div>

          <div className="p-3.5 bg-[#070C16]/80 border border-[#1E2B45]/80 hover:border-[#D6B36A]/30 rounded-xl transition flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#7A8699] text-[11px]">
              <Users size={13} className="text-[#D6B36A]" />
              <span>Party / State Receipts</span>
            </div>
            <p className="font-bold text-[#D6B36A] font-mono text-lg sm:text-xl mt-1.5">
              {formatCurrency(stats.party_payments_received_total || 0)}
            </p>
            <span className="text-[10px] text-[#7A8699] mt-0.5">Synced from States & Parties</span>
          </div>

          <div className="p-3.5 bg-[#070C16]/80 border border-[#1E2B45]/80 hover:border-[#D6B36A]/30 rounded-xl transition flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#7A8699] text-[11px]">
              <Receipt size={13} className="text-amber-400" />
              <span>Party Receivables</span>
            </div>
            <p className="font-bold text-amber-400 font-mono text-lg sm:text-xl mt-1.5">
              {formatCurrency(stats.party_receivables_total || 0)}
            </p>
            <span className="text-[10px] text-[#7A8699] mt-0.5">Outstanding unsettled balances</span>
          </div>
        </div>
      </div>

      {/* Below Cards: Recent Purchases & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 relative z-10">
        {/* Recent Purchases */}
        <div className="bg-[#111B2E]/90 border border-[#1E2B45] hover:border-[#D6B36A]/30 rounded-2xl p-4 sm:p-5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex flex-col transition">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B45]/60">
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

          <div className="overflow-x-auto flex-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[420px] sm:min-w-full text-left text-xs">
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
        <div className="bg-[#111B2E]/90 border border-[#1E2B45] hover:border-[#D6B36A]/30 rounded-2xl p-4 sm:p-5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex flex-col transition">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B45]/60">
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

          <div className="overflow-x-auto flex-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[420px] sm:min-w-full text-left text-xs">
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111B2E]/90 via-[#0E1729]/95 to-[#070C16] border border-[#1E2B45] hover:border-[#D6B36A]/30 p-4 sm:p-5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B45]/60">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
          <div className="p-3 sm:p-3.5 bg-[#070C16]/80 border border-[#1E2B45] rounded-xl">
            <span className="text-[#7A8699]">Active Products:</span>
            <p className="font-bold text-[#F5F3EE] text-base sm:text-lg mt-0.5">{activeItems.length} items</p>
          </div>
          <div className="p-3 sm:p-3.5 bg-[#070C16]/80 border border-[#1E2B45] rounded-xl">
            <span className="text-[#7A8699]">Total Stock Units:</span>
            <p className="font-bold text-[#D6B36A] text-base sm:text-lg font-mono mt-0.5">{stats.current_stock_units} pcs</p>
          </div>
          <div className="p-3 sm:p-3.5 bg-[#070C16]/80 border border-[#1E2B45] rounded-xl">
            <span className="text-[#7A8699]">Total Asset Value:</span>
            <p className="font-bold text-[#F5F3EE] text-base sm:text-lg font-mono mt-0.5">{formatCurrency(stats.current_stock_value)}</p>
          </div>
          <div className="p-3 sm:p-3.5 bg-[#070C16]/80 border border-[#1E2B45] rounded-xl">
            <span className="text-[#7A8699]">Valuation Method:</span>
            <p className="font-medium text-emerald-400 mt-1">Purchase Cost</p>
          </div>
        </div>
      </div>
    </div>
  );
};
