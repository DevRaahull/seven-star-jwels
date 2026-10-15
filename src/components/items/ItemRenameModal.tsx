import React, { useState } from 'react';
import { X, Edit3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Item } from '../../types';
import { useAppData } from '../../context/AppDataContext';

interface ItemRenameModalProps {
  item: Item;
  onClose: () => void;
  onSuccess?: (renamedItem: Item) => void;
}

export const ItemRenameModal: React.FC<ItemRenameModalProps> = ({ item, onClose, onSuccess }) => {
  const { items, saveItem } = useAppData();
  const [newName, setNewName] = useState(item.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if target name matches another item
  const duplicate = items.find(
    i => i.id !== item.id && i.name.toLowerCase().trim() === newName.toLowerCase().trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('Item Name cannot be empty.');
      return;
    }

    if (duplicate) {
      setErrorMessage(`Another item already has the name "${duplicate.name}". Please choose a distinct name.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await saveItem({
        ...item,
        name: trimmed
      });

      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to rename item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2B45] bg-[#0E1726]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6B36A]/15 border border-[#D6B36A]/30 flex items-center justify-center text-[#D6B36A]">
              <Edit3 size={17} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#F5F3EE]">Rename Jewellery Item</h3>
              <p className="text-[11px] text-[#AAB4C5]">Preserves transaction history & ID</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#D6B36A] uppercase tracking-wider mb-1.5">
              Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newName}
              onChange={e => {
                setNewName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter new item name"
              className="w-full bg-[#0B1220] border-2 border-[#1E2B45] focus:border-[#D6B36A] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3EE] font-medium outline-none transition"
            />
            <p className="text-[11px] text-[#7A8699] mt-1.5">
              Original: <span className="font-mono text-[#AAB4C5]">{item.name}</span>
            </p>
          </div>

          {duplicate && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Name conflict: &quot;{duplicate.name}&quot; already exists.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1E2B45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim() || !!duplicate}
              className="px-5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] disabled:opacity-50 text-[#0B1220] rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Update Name</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
