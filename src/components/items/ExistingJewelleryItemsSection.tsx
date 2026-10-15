import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
  History,
  Package,
  Layers,
  Tag,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Item } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/formatters';

interface ExistingJewelleryItemsSectionProps {
  onEditName: (item: Item) => void;
  onViewUsage: (item: Item) => void;
  highlightItemId?: string | null;
}

export const ExistingJewelleryItemsSection: React.FC<ExistingJewelleryItemsSectionProps> = ({
  onEditName,
  onViewUsage,
  highlightItemId
}) => {
  const { items, archiveOrDeleteItem, getItemUsage } = useAppData();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'stock_desc' | 'stock_asc' | 'newest'>('name_asc');

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    return items
      .filter(item => {
        // Status filter
        if (statusFilter === 'active' && item.is_archived) return false;
        if (statusFilter === 'archived' && !item.is_archived) return false;

        // Category filter
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesSku = (item.sku || '').toLowerCase().includes(q);
          const matchesCat = (item.category || '').toLowerCase().includes(q);
          if (!matchesName && !matchesSku && !matchesCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'name_desc') {
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'stock_desc') {
          return b.current_stock - a.current_stock;
        }
        if (sortBy === 'stock_asc') {
          return a.current_stock - b.current_stock;
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
        return 0;
      });
  }, [items, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Handle Archive / Restore toggle
  const handleArchiveToggle = async (item: Item) => {
    try {
      const action = item.is_archived ? 'unarchive' : 'archive';
      await archiveOrDeleteItem(item.id, action);
      setActionSuccessMessage(
        item.is_archived
          ? `Item "${item.name}" restored! Now visible in Create Sale and Purchase dropdowns.`
          : `Item "${item.name}" archived. Hidden from new dropdowns while preserving all past records.`
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      setDeleteErrorMessage(e.message || 'Failed to update item archive status.');
    }
  };

  // Safe Deletion Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteErrorMessage(null);
    try {
      await archiveOrDeleteItem(itemToDelete.id, 'delete');
      setActionSuccessMessage(`Item "${itemToDelete.name}" permanently deleted.`);
      setItemToDelete(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Cannot delete item.');
    }
  };

  return (
    <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl shadow-xl overflow-hidden space-y-0">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#1E2B45] bg-[#0E1726]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D6B36A]/15 border border-[#D6B36A]/30 flex items-center justify-center text-[#D6B36A]">
            <Package size={18} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm lg:text-base text-[#F5F3EE] tracking-wide">
              Existing Jewellery Items ({processedItems.length})
            </h3>
            <p className="text-[11px] text-[#AAB4C5]">
              Sorted alphabetically (A–Z) • Search, rename, view usage, or archive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center bg-[#0B1220] p-1 rounded-xl border border-[#1E2B45] text-xs">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'active'
                  ? 'bg-[#D6B36A] text-[#0B1220] font-bold shadow'
                  : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
              }`}
            >
              Active ({items.filter(i => !i.is_archived).length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'all'
                  ? 'bg-[#D6B36A] text-[#0B1220] font-bold shadow'
                  : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'archived'
                  ? 'bg-rose-500/80 text-white font-bold shadow'
                  : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
              }`}
            >
              Archived ({items.filter(i => i.is_archived).length})
            </button>
          </div>

          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-md bg-[#16233B] text-[#D6B36A] border border-[#1E2B45] hidden sm:inline-block">
            Section B
          </span>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccessMessage && (
        <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {deleteErrorMessage && (
        <div className="m-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{deleteErrorMessage}</span>
          </div>
          <button
            onClick={() => setDeleteErrorMessage(null)}
            className="text-xs text-rose-300/80 hover:text-white underline ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Sort Toolbar */}
      <div className="p-4 border-b border-[#1E2B45] bg-[#0B1220]/40 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8699]" />
          <input
            type="text"
            placeholder="Search items by name, SKU, or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F3EE] placeholder-[#7A8699] focus:outline-none focus:border-[#D6B36A] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A8699] hover:text-[#F5F3EE]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#111B2E] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#111B2E] border border-[#1E2B45] rounded-xl px-3 py-1.5 text-xs text-[#AAB4C5]">
            <ArrowUpDown size={13} className="text-[#D6B36A]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#F5F3EE] focus:outline-none cursor-pointer"
            >
              <option value="name_asc" className="bg-[#111B2E]">Alphabetical: A to Z</option>
              <option value="name_desc" className="bg-[#111B2E]">Alphabetical: Z to A</option>
              <option value="stock_desc" className="bg-[#111B2E]">Stock: Highest First</option>
              <option value="stock_asc" className="bg-[#111B2E]">Stock: Lowest First</option>
              <option value="newest" className="bg-[#111B2E]">Date: Newest Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {processedItems.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#7A8699] space-y-2">
          <Package size={38} className="mx-auto text-[#2A3B5E]" />
          <p className="font-semibold text-sm text-[#AAB4C5]">No Jewellery Items Found</p>
          <p className="max-w-md mx-auto">
            {searchQuery
              ? `No items matched your search "${searchQuery}". Try a different search term or clear the filter.`
              : statusFilter === 'archived'
              ? 'You have no archived jewellery items.'
              : 'Your catalogue is empty. Use Section A above to create your first jewellery item!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 px-3 py-1.5 bg-[#16233B] text-[#D6B36A] hover:bg-[#1E2E4A] rounded-lg transition"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View (screens < 768px) */}
          <div className="md:hidden divide-y divide-[#1E2B45]/50">
            {processedItems.map(item => {
              const usage = getItemUsage(item.id);
              const isHighlighted = highlightItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 space-y-3 transition ${
                    isHighlighted
                      ? 'bg-[#D6B36A]/10 border-l-4 border-[#D6B36A]'
                      : 'hover:bg-[#16233B]/30'
                  }`}
                >
                  {/* Top Row: Hero Item Name & Stock Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm text-[#F5F3EE] tracking-wide">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#16233B] text-[#AAB4C5] border border-[#1E2B45]">
                          {item.category || 'General'}
                        </span>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-[#7A8699]">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          item.is_archived
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.current_stock <= 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.is_archived
                          ? 'Archived'
                          : item.current_stock <= 0
                          ? '0 Out of Stock'
                          : `${item.current_stock} in stock`}
                      </span>
                    </div>
                  </div>

                  {/* Rates Info if available */}
                  {(item.purchase_rate > 0 || item.default_sale_rate > 0) && (
                    <div className="grid grid-cols-2 gap-2 bg-[#0B1220]/70 p-2 rounded-lg text-[11px]">
                      <div>
                        <span className="text-[10px] text-[#7A8699] block">Purchase Cost</span>
                        <span className="font-mono text-[#AAB4C5]">
                          {item.purchase_rate > 0 ? formatCurrency(item.purchase_rate) : '₹0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A8699] block">Default Sale Rate</span>
                        <span className="font-mono text-[#D6B36A] font-medium">
                          {item.default_sale_rate > 0 ? formatCurrency(item.default_sale_rate) : '₹0'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 4 Quick Touch Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => onEditName(item)}
                      className="px-2 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-lg text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 active:scale-95"
                      title="Edit Item Name"
                    >
                      <Edit3 size={14} className="text-[#D6B36A]" />
                      <span>Rename</span>
                    </button>

                    <button
                      onClick={() => onViewUsage(item)}
                      className="px-2 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-lg text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 active:scale-95"
                      title="View Historical Usage"
                    >
                      <History size={14} className="text-blue-400" />
                      <span>Usage</span>
                    </button>

                    <button
                      onClick={() => handleArchiveToggle(item)}
                      className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 active:scale-95 ${
                        item.is_archived
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE]'
                      }`}
                      title={item.is_archived ? 'Restore Item' : 'Archive Item'}
                    >
                      {item.is_archived ? (
                        <>
                          <RotateCcw size={14} className="text-emerald-400" />
                          <span>Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive size={14} className="text-amber-400" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setDeleteErrorMessage(null);
                        setItemToDelete(item);
                      }}
                      className="px-2 py-2 bg-[#16233B] hover:bg-rose-500/20 text-[#AAB4C5] hover:text-rose-300 rounded-lg text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 active:scale-95"
                      title="Delete Item"
                    >
                      <Trash2 size={14} className="text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (screens >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E2B45] text-[#AAB4C5] bg-[#0E1726]/40 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Jewellery Item Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-center">Showroom Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Purchase Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">Default Wholesale Rate</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2B45]/50">
                {processedItems.map(item => {
                  const usage = getItemUsage(item.id);
                  const isHighlighted = highlightItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isHighlighted
                          ? 'bg-[#D6B36A]/10 border-l-4 border-[#D6B36A]'
                          : 'hover:bg-[#16233B]/40'
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#F5F3EE]">
                          {item.name}
                        </div>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-[#7A8699]">
                            SKU: {item.sku}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#16233B] text-[#AAB4C5] border border-[#1E2B45]">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Stock units */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full inline-block ${
                            item.current_stock <= 0
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : item.current_stock <= (item.low_stock_threshold || 5)
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.current_stock} units
                        </span>
                      </td>

                      {/* Purchase Rate */}
                      <td className="py-3.5 px-4 text-right font-mono text-[#AAB4C5]">
                        {item.purchase_rate > 0 ? formatCurrency(item.purchase_rate) : '—'}
                      </td>

                      {/* Sale Rate */}
                      <td className="py-3.5 px-4 text-right font-mono text-[#D6B36A] font-semibold">
                        {item.default_sale_rate > 0 ? formatCurrency(item.default_sale_rate) : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            item.is_archived
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.is_archived ? 'Archived' : 'Active'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditName(item)}
                            className="p-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg transition"
                            title="Edit Name"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => onViewUsage(item)}
                            className="p-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-blue-400 rounded-lg transition"
                            title="View Usage History"
                          >
                            <History size={14} />
                          </button>

                          <button
                            onClick={() => handleArchiveToggle(item)}
                            className={`p-1.5 rounded-lg transition ${
                              item.is_archived
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-[#16233B] hover:bg-[#1E2E4A] text-amber-400'
                            }`}
                            title={item.is_archived ? 'Restore' : 'Archive'}
                          >
                            {item.is_archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                          </button>

                          <button
                            onClick={() => {
                              setDeleteErrorMessage(null);
                              setItemToDelete(item);
                            }}
                            className="p-1.5 bg-[#16233B] hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete / Guard Confirmation Dialog */}
      {itemToDelete && (() => {
        const usage = getItemUsage(itemToDelete.id);
        const canDelete = usage?.canPermanentlyDelete;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  canDelete ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#F5F3EE]">
                    {canDelete ? 'Delete Jewellery Item?' : 'Permanent Deletion Guarded'}
                  </h4>
                  <p className="text-xs text-[#AAB4C5] mt-1">
                    Item: <strong className="text-white">{itemToDelete.name}</strong>
                  </p>
                </div>
              </div>

              {!canDelete ? (
                <div className="space-y-3 text-xs bg-[#0B1220] p-3.5 rounded-xl border border-amber-500/20 text-amber-200">
                  <p className="font-semibold text-amber-300">
                    Why permanent deletion is blocked:
                  </p>
                  <p className="text-[11px] text-amber-200/90">
                    {usage?.deleteBlockReason || 'This item is linked to existing transactions or physical stock in your wholesale ledger.'}
                  </p>
                  <p className="text-[11px] text-[#AAB4C5]">
                    Deleting this item would corrupt historical bills and stock reconciliation. Instead, you can <strong>Archive</strong> it. Archiving safely hides the item from new dropdowns while preserving all past records.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#AAB4C5]">
                  This item has zero physical stock and has never been used in any purchases, sales, or consignments. Are you sure you want to permanently delete it?
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>

                {!canDelete ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleArchiveToggle(itemToDelete);
                      setItemToDelete(null);
                    }}
                    className="px-4 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Archive size={14} />
                    <span>Archive Item Instead</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Confirm Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
