import React, { useState, useMemo } from 'react';
import { Plus, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Package, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Item } from '../../types';

interface CreateJewelleryItemSectionProps {
  onItemCreated?: (newItem: Item) => void;
  onFocusExistingItem?: (existingItem: Item) => void;
}

const CATEGORIES = [
  'General',
  'Nose Pins',
  'Earrings',
  'Rings',
  'Bangles',
  'Anklets',
  'Chains',
  'Pendants',
  'Necklaces',
  'Silver Articles',
  'Gold Plated',
  'Gemstones',
  'Other'
];

export const CreateJewelleryItemSection: React.FC<CreateJewelleryItemSectionProps> = ({
  onItemCreated,
  onFocusExistingItem
}) => {
  const { items, saveItem } = useAppData();

  // Core required field
  const [name, setName] = useState('');

  // Optional fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [defaultSaleRate, setDefaultSaleRate] = useState('');
  const [openingStock, setOpeningStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [description, setDescription] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  // Normalized similarity checker
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const duplicateMatch = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return null;

    const normInput = normalize(trimmed);
    const lowerInput = trimmed.toLowerCase();

    // 1. Exact match (case-insensitive)
    const exact = items.find(i => i.name.toLowerCase().trim() === lowerInput);
    if (exact) {
      return { item: exact, type: 'exact' as const };
    }

    // 2. Normalized match (e.g. "Gold-Ring-22K" vs "Gold Ring 22K")
    const normalizedExact = items.find(i => normalize(i.name) === normInput);
    if (normalizedExact) {
      return { item: normalizedExact, type: 'similar' as const };
    }

    // 3. Close containment (if input is at least 4 chars)
    if (trimmed.length >= 4) {
      const close = items.find(i => {
        const itemNorm = normalize(i.name);
        return itemNorm.includes(normInput) || normInput.includes(itemNorm);
      });
      if (close) {
        return { item: close, type: 'similar' as const };
      }
    }

    return null;
  }, [name, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Item Name is required. Please enter a jewellery item name.');
      return;
    }

    // If duplicate detected and user hasn't explicitly clicked confirm, prompt confirmation
    if (duplicateMatch && !confirmedDuplicate) {
      setErrorMessage(
        duplicateMatch.type === 'exact'
          ? `An item named "${duplicateMatch.item.name}" already exists in your inventory. Click "Confirm & Save Anyway" if you still want to create another one with this name.`
          : `A very similar item "${duplicateMatch.item.name}" already exists. Click "Confirm & Save Anyway" if this is a distinct item.`
      );
      return;
    }

    // Parse optional rates & stock safely (defaulting to 0)
    const pRate = purchaseRate.trim() ? parseFloat(purchaseRate) : 0;
    if (isNaN(pRate) || pRate < 0) {
      setErrorMessage('Purchase rate must be a valid number (0 or higher).');
      return;
    }

    const sRate = defaultSaleRate.trim() ? parseFloat(defaultSaleRate) : 0;
    if (isNaN(sRate) || sRate < 0) {
      setErrorMessage('Sale rate must be a valid number (0 or higher).');
      return;
    }

    const stock = openingStock.trim() ? parseFloat(openingStock) : 0;
    if (isNaN(stock) || stock < 0) {
      setErrorMessage('Opening stock must be 0 or higher.');
      return;
    }

    const threshold = lowStockThreshold.trim() ? parseFloat(lowStockThreshold) : 5;

    setIsSubmitting(true);
    try {
      const saved = await saveItem({
        name: trimmedName,
        category: category || 'General',
        sku: sku.trim() || undefined,
        purchase_rate: pRate,
        default_sale_rate: sRate,
        current_stock: stock,
        opening_stock: stock,
        low_stock_threshold: threshold,
        description: description.trim() || undefined,
        is_archived: false
      });

      setSuccessMessage(`✓ Jewellery item "${saved.name}" created successfully! Available for new purchases and sales.`);
      
      // Reset form
      setName('');
      setSku('');
      setCategory('General');
      setPurchaseRate('');
      setDefaultSaleRate('');
      setOpeningStock('');
      setDescription('');
      setConfirmedDuplicate(false);
      setShowOptionalFields(false);

      if (onItemCreated) {
        onItemCreated(saved);
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save jewellery item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl shadow-xl overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#1E2B45] bg-[#0E1726]/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D6B36A]/15 border border-[#D6B36A]/30 flex items-center justify-center text-[#D6B36A]">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm lg:text-base text-[#F5F3EE] tracking-wide">
              Create New Jewellery Item
            </h3>
            <p className="text-[11px] text-[#AAB4C5]">
              Quick item creation — only <strong className="text-[#D6B36A]">Item Name</strong> is required
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-md bg-[#16233B] text-[#D6B36A] border border-[#1E2B45]">
          Section A
        </span>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Success Message Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Primary Required Field: Item Name */}
        <div>
          <label className="block text-xs font-semibold text-[#D6B36A] uppercase tracking-wider mb-1.5">
            Jewellery Item Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => {
                setName(e.target.value);
                setConfirmedDuplicate(false);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. 22K Gold Antique Ring, Silver Payal, Diamond Pendant..."
              className="w-full bg-[#0B1220] border-2 border-[#1E2B45] focus:border-[#D6B36A] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] placeholder-[#7A8699] font-medium outline-none transition shadow-inner"
            />
            <Package size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8699] pointer-events-none" />
          </div>
          <p className="text-[11px] text-[#7A8699] mt-1">
            Type design name. Rates and SKU are not required and can be set during purchases or sales.
          </p>
        </div>

        {/* Real-Time Duplicate Warning Banner */}
        {duplicateMatch && (
          <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={17} className="shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-300">
                  {duplicateMatch.type === 'exact' ? 'Exact Duplicate Detected!' : 'Similar Item Already Exists!'}
                </p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  An item named <strong className="text-white font-mono underline">{duplicateMatch.item.name}</strong> is already in your database.
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                    Current Stock: {duplicateMatch.item.current_stock} units
                  </span>
                  {duplicateMatch.item.is_archived && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                      (Archived)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
              {onFocusExistingItem && (
                <button
                  type="button"
                  onClick={() => onFocusExistingItem(duplicateMatch.item)}
                  className="px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-amber-300 rounded-lg text-xs font-semibold transition"
                >
                  View Existing &quot;{duplicateMatch.item.name}&quot;
                </button>
              )}

              <button
                type="button"
                onClick={() => setConfirmedDuplicate(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  confirmedDuplicate
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500 hover:bg-amber-400 text-[#0B1220]'
                }`}
              >
                {confirmedDuplicate ? '✓ Confirmed as Distinct Item' : 'Confirm & Save Anyway'}
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Optional Details Accordion */}
        <div className="border border-[#1E2B45]/70 rounded-xl overflow-hidden bg-[#0B1220]/40">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B]/50 transition"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#D6B36A]" />
              <span>Optional Details (Category, SKU, Default Rates, Stock)</span>
            </span>
            {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showOptionalFields && (
            <div className="p-4 border-t border-[#1E2B45]/60 space-y-3 bg-[#0B1220]/60 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. RNG-001"
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                {/* Opening Stock */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">Initial Opening Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={openingStock}
                    onChange={e => setOpeningStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                {/* Purchase Rate */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">Default Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseRate}
                    onChange={e => setPurchaseRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                {/* Default Sale Rate */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">Default Wholesale Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={defaultSaleRate}
                    onChange={e => setDefaultSaleRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                {/* Low stock threshold */}
                <div>
                  <label className="block text-[11px] text-[#AAB4C5] mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] text-[#AAB4C5] mb-1">Description / Notes (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Hallmark 916, stamped, handcrafted filigree"
                  className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#AAB4C5]">
            Item will be instantly available in <strong className="text-[#D6B36A]">Create Sale</strong> and <strong className="text-[#D6B36A]">Create Purchase</strong> dropdowns.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-[#D6B36A] hover:bg-[#c9a356] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B1220] rounded-xl font-bold text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 tracking-wide uppercase"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Item...</span>
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.5} />
                <span>Save Jewellery Item</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
