import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Item, DateFilterPreset, StockMovementPeriod } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/exportUtils';
import { ItemFormModal } from '../items/ItemFormModal';
import { StockAdjustModal } from '../items/StockAdjustModal';
import { CreateJewelleryItemSection } from '../items/CreateJewelleryItemSection';
import { ExistingJewelleryItemsSection } from '../items/ExistingJewelleryItemsSection';
import { ItemRenameModal } from '../items/ItemRenameModal';
import { ItemUsageModal } from '../items/ItemUsageModal';

export const InventoryView: React.FC = () => {
  const { items, purchases, sales, archiveOrDeleteItem, getStockMovementPeriod } = useAppData();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Period movement filter
  const [periodPreset, setPeriodPreset] = useState<DateFilterPreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [movementData, setMovementData] = useState<StockMovementPeriod[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Subtab navigation
  const [activeSubTab, setActiveSubTab] = useState<'catalogue' | 'stock_ledger'>('catalogue');
  const [itemToRename, setItemToRename] = useState<Item | null>(null);
  const [itemForUsage, setItemForUsage] = useState<Item | null>(null);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Compute inclusive dates based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (periodPreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (periodPreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodPreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (periodPreset === 'financial_year') {
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(year, 3, 1, 0, 0, 0);
      end = new Date(year + 1, 2, 31, 23, 59, 59);
    } else if (periodPreset === 'custom' && customStart && customEnd) {
      start = new Date(`${customStart}T00:00:00`);
      end = new Date(`${customEnd}T23:59:59`);
    } else {
      // Default to start of current year
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    return { start, end };
  }, [periodPreset, customStart, customEnd]);

  // Load period movements whenever date range or underlying purchases/sales change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMovements(true);

    getStockMovementPeriod(dateRange.start, dateRange.end)
      .then(res => {
        if (isMounted) {
          setMovementData(res);
          setIsLoadingMovements(false);
        }
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setIsLoadingMovements(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dateRange, purchases, sales, items, getStockMovementPeriod]);

  // Overall active inventory metrics
  const activeItems = useMemo(() => items.filter(i => !i.is_archived), [items]);

  const metrics = useMemo(() => {
    let units = 0;
    let costValuation = 0;
    let wholesaleValue = 0;
    let lowCount = 0;

    activeItems.forEach(i => {
      units += i.current_stock;
      costValuation += i.current_stock * i.purchase_rate;
      wholesaleValue += i.current_stock * i.default_sale_rate;
      if (i.current_stock <= (i.low_stock_threshold || 5)) lowCount++;
    });

    return {
      totalItems: activeItems.length,
      totalUnits: units,
      costValuation,
      wholesaleValue,
      lowCount
    };
  }, [activeItems]);

  // Filtered rows combining Item info and Movement data
  const filteredRows = useMemo(() => {
    const movementMap = new Map<string, StockMovementPeriod>();
    movementData.forEach(m => movementMap.set(m.item_id, m));

    return activeItems.filter(item => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Stock status filter
      if (stockStatusFilter === 'in_stock' && item.current_stock <= 0) return false;
      if (stockStatusFilter === 'low_stock' && (item.current_stock <= 0 || item.current_stock > item.low_stock_threshold)) return false;
      if (stockStatusFilter === 'out_of_stock' && item.current_stock > 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = (item.sku || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }

      return true;
    }).map(item => {
      const mov = movementMap.get(item.id);
      return {
        item,
        openingStock: mov ? mov.opening_stock : item.opening_stock,
        purchasedQty: mov ? mov.purchased_qty : 0,
        soldQty: mov ? mov.sold_qty : 0,
        currentStock: item.current_stock,
        stockValuation: item.current_stock * item.purchase_rate,
        potentialSalesValue: item.current_stock * item.default_sale_rate
      };
    });
  }, [activeItems, movementData, categoryFilter, stockStatusFilter, searchQuery]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Item Name',
      'SKU',
      'Category',
      'Opening Stock',
      'Period Inward (Purchased)',
      'Period Outward (Sold)',
      'Current / Closing Stock',
      'Unit Purchase Rate (₹)',
      'Default Sale Rate (₹)',
      'Stock Valuation at Cost (₹)',
      'Potential Wholesale Value (₹)',
      'Status'
    ];

    const rows = filteredRows.map(r => [
      r.item.name,
      r.item.sku || '',
      r.item.category,
      r.openingStock,
      r.purchasedQty,
      r.soldQty,
      r.currentStock,
      r.item.purchase_rate.toFixed(2),
      r.item.default_sale_rate.toFixed(2),
      r.stockValuation.toFixed(2),
      r.potentialSalesValue.toFixed(2),
      r.currentStock <= 0 ? 'Out of Stock' : r.currentStock <= r.item.low_stock_threshold ? 'Low Stock' : 'In Stock'
    ]);

    exportToCsv(`wholesale_inventory_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await archiveOrDeleteItem(itemToDelete.id, 'delete');
      setItemToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2B45]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            Jewellery Items & Inventory
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Add new items, manage design catalogue, monitor showroom stock, and track period movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSubTab === 'stock_ledger' && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-xl text-xs font-semibold shadow transition active:scale-95"
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveSubTab('catalogue');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow transition active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Create New Item</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#111B2E] p-1.5 rounded-xl border border-[#1E2B45] w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('catalogue')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeSubTab === 'catalogue'
              ? 'bg-[#D6B36A] text-[#0B1220] shadow'
              : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
          }`}
        >
          <Boxes size={15} />
          <span>Jewellery Items (Create & Manage)</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeSubTab === 'catalogue' ? 'bg-[#0B1220]/25 text-[#0B1220]' : 'bg-[#16233B] text-[#D6B36A]'
          }`}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('stock_ledger')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeSubTab === 'stock_ledger'
              ? 'bg-[#D6B36A] text-[#0B1220] shadow'
              : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
          }`}
        >
          <Layers size={15} />
          <span>Stock Status & Movements Ledger</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeSubTab === 'stock_ledger' ? 'bg-[#0B1220]/25 text-[#0B1220]' : 'bg-[#16233B] text-[#D6B36A]'
          }`}>
            {metrics.totalUnits}u
          </span>
        </button>
      </div>

      {/* SUBTAB 1: JEWELLERY ITEMS CATALOGUE (SECTION A & SECTION B) */}
      {activeSubTab === 'catalogue' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SECTION A: CREATE NEW JEWELLERY ITEM */}
          <CreateJewelleryItemSection
            onItemCreated={(newItem) => {
              setHighlightItemId(newItem.id);
              setTimeout(() => setHighlightItemId(null), 5000);
            }}
            onFocusExistingItem={(existing) => {
              setHighlightItemId(existing.id);
              setTimeout(() => setHighlightItemId(null), 5000);
            }}
          />

          {/* SECTION B: EXISTING JEWELLERY ITEMS */}
          <ExistingJewelleryItemsSection
            onEditName={(item) => setItemToRename(item)}
            onViewUsage={(item) => setItemForUsage(item)}
            highlightItemId={highlightItemId}
          />
        </div>
      )}

      {/* SUBTAB 2: DETAILED STOCK LEDGER & MOVEMENTS */}
      {activeSubTab === 'stock_ledger' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 4 Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">Unique Jewellery Designs</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Boxes size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {metrics.totalItems} Designs
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Across {categories.length} categories
          </span>
        </div>

        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">Total Units in Stock</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {metrics.totalUnits} Units
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Physical stock in showroom/locker
          </span>
        </div>

        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">Stock Value (at Purchase Cost)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Tag size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#D6B36A] mt-2">
            {formatCurrency(metrics.costValuation)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Realized cost of current inventory
          </span>
        </div>

        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#AAB4C5] font-medium">Potential Wholesale Value</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F3EE] mt-2">
            {formatCurrency(metrics.wholesaleValue)}
          </p>
          <span className="text-[11px] text-[#7A8699] mt-0.5 block">
            Gross realizable at wholesale rates
          </span>
        </div>
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
            <input
              type="text"
              placeholder="Search design name, SKU, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F5F3EE] placeholder-[#7A8699] focus:outline-none focus:border-[#D6B36A] transition"
            />
          </div>

          {/* Period & Category Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-[#AAB4C5]">
              <Calendar size={14} className="text-[#D6B36A]" />
              <span>Period:</span>
            </div>
            <select
              value={periodPreset}
              onChange={e => setPeriodPreset(e.target.value as DateFilterPreset)}
              className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="financial_year">Current Financial Year</option>
              <option value="custom">Custom Date Range</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value as any)}
              className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; 0)</option>
              <option value="low_stock">Low Stock (&le; threshold)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (Strictly Inclusive) */}
        {periodPreset === 'custom' && (
          <div className="pt-2 border-t border-[#1E2B45] flex flex-wrap items-center gap-3 text-xs text-[#AAB4C5]">
            <span>From Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            />
            <span>To Date (Inclusive):</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            />
            <span className="text-[11px] text-[#7A8699]">
              (Filters all purchases and sales between these inclusive dates)
            </span>
          </div>
        )}
      </div>

      {/* Mobile Card View (shown only on mobile screens < 640px) */}
      <div className="sm:hidden space-y-3">
        {filteredRows.length === 0 ? (
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-6 text-center text-xs text-[#7A8699]">
            No jewellery items found matching your criteria.
          </div>
        ) : (
          filteredRows.map(({ item, currentStock, stockValuation }) => {
            const isOutOfStock = currentStock <= 0;
            const isLowStock = currentStock > 0 && currentStock <= (item.low_stock_threshold || 5);

            return (
              <div key={item.id} className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-[#F5F3EE]">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#16233B] text-[#AAB4C5]">
                        {item.category}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] text-[#7A8699] font-mono">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      isOutOfStock
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isLowStock
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isOutOfStock ? '0 (Out)' : isLowStock ? `${currentStock} (Low)` : `${currentStock} In Stock`}
                  </span>
                </div>

                {/* 4 Essential Stats Grid */}
                <div className="grid grid-cols-2 gap-2 bg-[#0B1220]/70 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-[#7A8699] block">Available Qty</span>
                    <span className={`font-mono font-bold text-sm ${
                      isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {currentStock} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8699] block">Stock Valuation</span>
                    <span className="font-mono font-bold text-sm text-[#F5F3EE]">
                      {formatCurrency(stockValuation)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8699] block">Purchase Rate</span>
                    <span className="font-mono text-[#AAB4C5]">
                      {formatCurrency(item.purchase_rate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8699] block">Sale Rate</span>
                    <span className="font-mono font-semibold text-[#D6B36A]">
                      {formatCurrency(item.default_sale_rate)}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1E2B45]/50">
                  <button
                    onClick={() => setItemToAdjust(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg text-xs font-medium transition"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Adjust Stock</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setItemToEdit(item)}
                      className="p-1.5 rounded-lg bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] transition"
                      title="Edit Item"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Period Stock Movement Ledger Table (Desktop & Tablet) */}
      <div className="hidden sm:block bg-[#111B2E] border border-[#1E2B45] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0E1726] border-b border-[#1E2B45] text-[#AAB4C5]">
                <th className="py-3 px-4 font-semibold">Jewellery Item</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold text-right">Opening</th>
                <th className="py-3 px-3 font-semibold text-right text-emerald-400">In (+)</th>
                <th className="py-3 px-3 font-semibold text-right text-rose-400">Out (−)</th>
                <th className="py-3 px-3 font-semibold text-right">Current Stock</th>
                <th className="py-3 px-3 font-semibold text-right">Unit Cost (₹)</th>
                <th className="py-3 px-3 font-semibold text-right">Sale Rate (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Stock Valuation (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2B45]/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-xs text-[#7A8699]">
                    No jewellery items found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ item, openingStock, purchasedQty, soldQty, currentStock, stockValuation }) => {
                  const isOutOfStock = currentStock <= 0;
                  const isLowStock = currentStock > 0 && currentStock <= item.low_stock_threshold;

                  return (
                    <tr key={item.id} className="hover:bg-[#16233B]/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#F5F3EE] block">{item.name}</span>
                        {item.sku && (
                          <span className="text-[10px] text-[#7A8699] font-mono block">
                            SKU: {item.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#AAB4C5]">
                        <span className="px-2 py-0.5 rounded bg-[#16233B] border border-[#1E2B45] text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#AAB4C5]">
                        {openingStock}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        +{purchasedQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400">
                        −{soldQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#F5F3EE]">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#AAB4C5]">
                        {formatCurrency(item.purchase_rate)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#D6B36A]">
                        {formatCurrency(item.default_sale_rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#F5F3EE]">
                        {formatCurrency(stockValuation)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setItemToAdjust(item)}
                            className="p-1.5 rounded-lg bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 transition"
                            title="Adjust Stock Qty"
                          >
                            <SlidersHorizontal size={14} />
                          </button>
                          <button
                            onClick={() => setItemToEdit(item)}
                            className="p-1.5 rounded-lg bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] transition"
                            title="Edit Item Details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
  )}

      {/* Item Rename Modal */}
      {itemToRename && (
        <ItemRenameModal
          item={itemToRename}
          onClose={() => setItemToRename(null)}
          onSuccess={(renamed) => {
            setHighlightItemId(renamed.id);
            setTimeout(() => setHighlightItemId(null), 4000);
          }}
        />
      )}

      {/* Item Usage Modal */}
      {itemForUsage && (
        <ItemUsageModal
          item={itemForUsage}
          onClose={() => setItemForUsage(null)}
          onArchiveToggle={() => {
            setItemForUsage(null);
          }}
        />
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <ItemFormModal
          itemToEdit={null}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {itemToEdit && (
        <ItemFormModal
          itemToEdit={itemToEdit}
          onClose={() => setItemToEdit(null)}
        />
      )}

      {itemToAdjust && (
        <StockAdjustModal
          item={itemToAdjust}
          onClose={() => setItemToAdjust(null)}
        />
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="font-semibold text-base text-[#F5F3EE]">Delete Jewellery Item?</h3>
            </div>

            <p className="text-xs text-[#AAB4C5] leading-relaxed">
              Are you sure you want to permanently delete <strong>{itemToDelete.name}</strong>?
              This item will be removed from your active inventory catalogue.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
