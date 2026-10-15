import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Users,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Archive,
  Calendar,
  Layers
} from 'lucide-react';
import { Item } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface ItemUsageModalProps {
  item: Item;
  onClose: () => void;
  onArchiveToggle?: () => void;
}

export const ItemUsageModal: React.FC<ItemUsageModalProps> = ({ item, onClose, onArchiveToggle }) => {
  const { getItemUsage, states, parties } = useAppData();
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'sales' | 'transfers'>('all');

  const report = useMemo(() => {
    return getItemUsage(item.id);
  }, [item.id, getItemUsage]);

  // Helpers for party and state names
  const partyMap = useMemo(() => new Map(parties.map(p => [p.id, p.name])), [parties]);
  const stateMap = useMemo(() => new Map(states.map(s => [s.id, s.name])), [states]);

  if (!report) {
    return null;
  }

  const {
    purchases,
    sales,
    transfers,
    totalPurchasedQty,
    totalSoldQty,
    totalTransferredHeldQty,
    canPermanentlyDelete,
    deleteBlockReason
  } = report;

  const totalTransactions = purchases.length + sales.length + transfers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2B45] bg-[#0E1726]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D6B36A]/15 border border-[#D6B36A]/30 flex items-center justify-center text-[#D6B36A]">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#F5F3EE]">{item.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    item.is_archived
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {item.is_archived ? 'Archived' : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-[#AAB4C5]">
                Category: <span className="text-[#D6B36A] font-medium">{item.category}</span>
                {item.sku && <> | SKU: <span className="font-mono text-[#F5F3EE]">{item.sku}</span></>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#1E2B45] bg-[#0B1220]/40">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3">
            <span className="text-[10px] text-[#AAB4C5] block font-medium">Showroom Stock</span>
            <span className={`text-lg font-bold font-mono ${
              item.current_stock > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {item.current_stock}
            </span>
            <span className="text-[10px] text-[#7A8699] block">Available units</span>
          </div>

          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3">
            <span className="text-[10px] text-[#AAB4C5] block font-medium">Inward (Purchased)</span>
            <span className="text-lg font-bold font-mono text-purple-400">
              {totalPurchasedQty}
            </span>
            <span className="text-[10px] text-[#7A8699] block">{purchases.length} supplier orders</span>
          </div>

          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3">
            <span className="text-[10px] text-[#AAB4C5] block font-medium">Outward (Sold)</span>
            <span className="text-lg font-bold font-mono text-blue-400">
              {totalSoldQty}
            </span>
            <span className="text-[10px] text-[#7A8699] block">{sales.length} customer bills</span>
          </div>

          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3">
            <span className="text-[10px] text-[#AAB4C5] block font-medium">Held at Parties</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {totalTransferredHeldQty}
            </span>
            <span className="text-[10px] text-[#7A8699] block">{transfers.length} consignments</span>
          </div>
        </div>

        {/* Protection / Deletion Status Alert */}
        <div className="px-4 py-2.5 bg-[#0E1726] border-b border-[#1E2B45] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className={canPermanentlyDelete ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-[#AAB4C5]">
              {canPermanentlyDelete ? (
                <span className="text-emerald-300 font-medium">
                  Safe to delete: No past purchases, sales, or physical stock recorded.
                </span>
              ) : (
                <span className="text-amber-300 font-medium">
                  Protected: {deleteBlockReason} Permanent deletion is guarded to preserve your ledger.
                </span>
              )}
            </span>
          </div>

          {onArchiveToggle && (
            <button
              onClick={onArchiveToggle}
              className="px-3 py-1 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold transition shrink-0 ml-2"
            >
              {item.is_archived ? 'Restore / Unarchive' : 'Archive Item'}
            </button>
          )}
        </div>

        {/* Tabs for Transaction Types */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#1E2B45] bg-[#0E1726]/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-[#D6B36A] text-[#D6B36A] font-semibold'
                : 'border-transparent text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            All History ({totalTransactions})
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-2 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'purchases'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Purchases ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-2 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-blue-400 text-blue-300 font-semibold'
                : 'border-transparent text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            <ShoppingCart size={14} />
            <span>Sales Bills ({sales.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-2 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'transfers'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-[#AAB4C5] hover:text-[#F5F3EE]'
            }`}
          >
            <Users size={14} />
            <span>Consignments ({transfers.length})</span>
          </button>
        </div>

        {/* Transaction Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {totalTransactions === 0 ? (
            <div className="text-center py-12 text-[#7A8699] text-xs">
              <Boxes size={36} className="mx-auto text-[#2A3B5E] mb-2" />
              <p className="font-semibold text-[#AAB4C5]">No Transaction Records Yet</p>
              <p className="mt-1">This jewellery item has not been used in any purchases, sales, or stock transfers yet.</p>
            </div>
          ) : (
            <>
              {/* Purchases Section */}
              {(activeTab === 'all' || activeTab === 'purchases') && purchases.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={14} />
                    <span>Supplier Inward Purchases ({purchases.length})</span>
                  </h4>
                  <div className="divide-y divide-[#1E2B45]/50 border border-[#1E2B45] rounded-xl overflow-hidden bg-[#0B1220]/50">
                    {purchases.map(({ purchase, item: pItem }, idx) => (
                      <div key={`pur-${purchase.id}-${idx}`} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F3EE]">{purchase.supplier_name}</span>
                            <span className="font-mono text-[10px] text-[#AAB4C5] bg-[#16233B] px-1.5 py-0.5 rounded">
                              #{purchase.supplier_invoice_number}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7A8699] block mt-0.5">
                            Date: {formatDate(purchase.purchase_date)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-purple-300 block">
                            +{pItem.quantity} units @ {formatCurrency(pItem.unit_purchase_rate)}
                          </span>
                          <span className="text-[11px] text-[#7A8699] block">
                            Total: {formatCurrency(pItem.line_total || pItem.quantity * pItem.unit_purchase_rate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Section */}
              {(activeTab === 'all' || activeTab === 'sales') && sales.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart size={14} />
                    <span>Customer Sales Invoices ({sales.length})</span>
                  </h4>
                  <div className="divide-y divide-[#1E2B45]/50 border border-[#1E2B45] rounded-xl overflow-hidden bg-[#0B1220]/50">
                    {sales.map(({ sale, item: sItem }, idx) => (
                      <div key={`sale-${sale.id}-${idx}`} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F3EE]">
                              {sale.party_name || partyMap.get(sale.party_id) || 'Walk-in Party'}
                            </span>
                            <span className="font-mono text-[10px] text-[#AAB4C5] bg-[#16233B] px-1.5 py-0.5 rounded">
                              #{sale.invoice_number}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7A8699] block mt-0.5">
                            Date: {formatDate(sale.sale_date)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-blue-300 block">
                            -{sItem.quantity} units @ {formatCurrency(sItem.unit_sale_rate)}
                          </span>
                          <span className="text-[11px] text-[#7A8699] block">
                            Total: {formatCurrency(sItem.line_total || sItem.quantity * sItem.unit_sale_rate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consignments / Transfers Section */}
              {(activeTab === 'all' || activeTab === 'transfers') && transfers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} />
                    <span>Party Consignment Movements ({transfers.length})</span>
                  </h4>
                  <div className="divide-y divide-[#1E2B45]/50 border border-[#1E2B45] rounded-xl overflow-hidden bg-[#0B1220]/50">
                    {transfers.map((t, idx) => (
                      <div key={`transfer-${t.id}-${idx}`} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F3EE]">
                              {partyMap.get(t.destination_party_id) || 'Consignment Party'}
                            </span>
                            <span className="text-[10px] text-[#7A8699]">
                              ({stateMap.get(t.destination_state_id) || 'State'})
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7A8699] block mt-0.5">
                            Date: {formatDate(t.transfer_date)} {t.notes && `• ${t.notes}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold block ${
                              t.transfer_type === 'issue' ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {t.transfer_type === 'issue' ? `Issue to Party: -${t.quantity}` : `Return to Showroom: +${t.quantity}`} units
                          </span>
                          <span className="text-[10px] uppercase text-[#7A8699] font-mono">
                            Type: {t.transfer_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E2B45] bg-[#0E1726]/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
          >
            Close Usage Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
