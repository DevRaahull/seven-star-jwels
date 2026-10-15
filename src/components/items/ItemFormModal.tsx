import React, { useState, useEffect } from 'react';
import { X, Plus, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Item } from '../../types';
import { useAppData } from '../../context/AppDataContext';

interface ItemFormModalProps {
  itemToEdit: Item | null;
  onClose: () => void;
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

export const ItemFormModal: React.FC<ItemFormModalProps> = ({ itemToEdit, onClose }) => {
  const { items, saveItem, isOnline } = useAppData();

  const isEditing = !!itemToEdit;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [defaultSaleRate, setDefaultSaleRate] = useState('');
  const [openingStock, setOpeningStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setSku(itemToEdit.sku || '');
      setCategory(itemToEdit.category || 'General');
      setPurchaseRate(itemToEdit.purchase_rate.toString());
      setDefaultSaleRate(itemToEdit.default_sale_rate.toString());
      setOpeningStock(itemToEdit.current_stock.toString());
      setLowStockThreshold(itemToEdit.low_stock_threshold.toString());
      setDescription(itemToEdit.description || '');
    } else {
      setName('');
      setSku('');
      setCategory('General');
      setPurchaseRate('');
      setDefaultSaleRate('');
      setOpeningStock('0');
      setLowStockThreshold('5');
      setDescription('');
    }
  }, [itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Item Name is required and cannot be empty.');
      return;
    }

    const pRate = purchaseRate.trim() ? parseFloat(purchaseRate) : 0;
    if (isNaN(pRate) || pRate < 0) {
      setErrorMessage('Purchase Rate per Unit must be a non-negative number.');
      return;
    }

    const sRate = defaultSaleRate.trim() ? parseFloat(defaultSaleRate) : 0;
    if (isNaN(sRate) || sRate < 0) {
      setErrorMessage('Default Sale Rate per Unit must be a non-negative number.');
      return;
    }

    const stock = openingStock.trim() ? parseFloat(openingStock) : 0;
    if (isNaN(stock) || stock < 0) {
      setErrorMessage('Stock quantity must be a non-negative number.');
      return;
    }

    const threshold = lowStockThreshold.trim() ? parseFloat(lowStockThreshold) : 5;
    if (isNaN(threshold) || threshold < 0) {
      setErrorMessage('Low-Stock Threshold must be 0 or greater.');
      return;
    }

    // Check duplicate SKU if provided
    if (sku.trim()) {
      const duplicateSku = items.find(
        i => i.sku?.toLowerCase() === sku.trim().toLowerCase() && (!isEditing || i.id !== itemToEdit.id)
      );
      if (duplicateSku) {
        setErrorMessage(`Item code / SKU "${sku.trim()}" is already assigned to "${duplicateSku.name}".`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await saveItem({
        id: itemToEdit?.id,
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category || 'General',
        purchase_rate: pRate,
        default_sale_rate: sRate,
        current_stock: stock,
        opening_stock: stock,
        low_stock_threshold: threshold,
        description: description.trim() || undefined,
        is_archived: itemToEdit?.is_archived || false
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45]">
          <div className="flex items-center gap-2.5">
            <Package size={20} className="text-[#D6B36A]" />
            <div>
              <h3 className="font-semibold text-base text-[#F5F3EE]">
                {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <p className="text-[11px] text-[#AAB4C5]">Only Item Name is required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-2.5 bg-[#D6B36A]/10 border border-[#D6B36A]/20 rounded-xl text-[#D6B36A] text-[11px]">
            💡 <strong>Quick Creation:</strong> Just type the <strong>Item Name</strong> and tap Save. Rates and stock can be entered now or customized directly on each purchase/sales bill.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name (Required) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#D6B36A] mb-1">
                Item Name * (Required)
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Stone Nose Pin, 92.5 Silver Ring..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B1220] border-2 border-[#D6B36A]/50 focus:border-[#D6B36A] rounded-lg px-3 py-2 text-sm text-[#F5F3EE] focus:outline-none transition shadow-inner"
              />
            </div>

            {/* SKU / Code */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                SKU / Item Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. NP-STN-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Category (Optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Purchase Rate per Unit (Optional) */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Purchase Rate per Unit (₹) (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 (Optional)"
                value={purchaseRate}
                onChange={(e) => setPurchaseRate(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
              <span className="text-[10px] text-[#7A8699]">Cost per unit. Default is ₹0</span>
            </div>

            {/* Default Sale Rate per Unit (Optional) */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Default Sale Rate per Unit (₹) (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 (Optional)"
                value={defaultSaleRate}
                onChange={(e) => setDefaultSaleRate(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
              <span className="text-[10px] text-[#7A8699]">Standard price. Default is ₹0</span>
            </div>

            {/* Opening Stock Quantity (Optional) */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                {isEditing ? 'Current Stock Quantity' : 'Opening Stock Quantity (Optional)'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0 (Optional)"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
              <span className="text-[10px] text-[#7A8699]">Default is 0 pieces</span>
            </div>

            {/* Low-Stock Threshold */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Low-Stock Threshold Alert (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
              <span className="text-[10px] text-[#7A8699]">Default is 5 pieces</span>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Description / Hallmark Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 925 sterling silver, oxidised finish, approx 2.4g weight..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg p-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E2B45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-semibold shadow transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              <span>{isEditing ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
