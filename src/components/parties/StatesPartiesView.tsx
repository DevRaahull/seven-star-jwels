import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Users,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Phone,
  MessageCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  ChevronRight,
  Package,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Edit2,
  Calendar,
  Info,
  Clock,
  Building2,
  RotateCcw,
  Check
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { StateRecord, PartyRecord, StockTransfer, PartyPayment, StockTransferType } from '../../types';

export const StatesPartiesView: React.FC = () => {
  const {
    items,
    states,
    parties,
    stockTransfers,
    partyPayments,
    sales,
    saveState,
    archiveState,
    saveParty,
    archiveParty,
    createStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    recordPartyPayment,
    getPartyLedger
  } = useAppData();

  const activeStates = useMemo(() => states.filter(s => !s.is_archived), [states]);
  const activeParties = useMemo(() => parties.filter(p => !p.is_archived), [parties]);

  // Main UI Mode & Navigation
  // 'states' | 'parties' | 'state_detail' | 'party_detail'
  const [activeViewTab, setActiveViewTab] = useState<'states' | 'parties'>('states');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Filters & Search
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isStockTxModalOpen, setIsStockTxModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);

  // Deletion modals state
  const [stateToDelete, setStateToDelete] = useState<{ id: string; name: string; partyCount: number } | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<{ id: string; name: string; heldStock: number } | null>(null);
  const [transferToDelete, setTransferToDelete] = useState<StockTransfer | null>(null);

  // State Form fields
  const [stateName, setStateName] = useState('');
  const [stateNotes, setStateNotes] = useState('');

  // Party Form fields
  const [partyStateId, setPartyStateId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyNotes, setPartyNotes] = useState('');
  const [partyOpeningBalance, setPartyOpeningBalance] = useState('0');
  const [partyOpeningStock, setPartyOpeningStock] = useState('0');

  // Stock Transaction Form fields
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txRefNo, setTxRefNo] = useState('');
  const [txItemId, setTxItemId] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txRate, setTxRate] = useState('');
  const [txType, setTxType] = useState<StockTransferType>('handover');
  const [txNotes, setTxNotes] = useState('');
  const [txStatus, setTxStatus] = useState<'completed' | 'pending'>('completed');

  // Party Payment Form fields
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payType, setPayType] = useState<'received' | 'paid'>('received');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Party Detail & Ledger View sub-tab
  const [partyDetailTab, setPartyDetailTab] = useState<'stock' | 'money'>('stock');
  const [partyLedger, setPartyLedger] = useState<any | null>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Transaction history filters inside Party Detail
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txStartDate, setTxStartDate] = useState<string>('');
  const [txEndDate, setTxEndDate] = useState<string>('');

  // Feedback notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill rate when item is selected in stock modal
  useEffect(() => {
    if (txItemId) {
      const it = items.find(i => i.id === txItemId);
      if (it && !editingTransferId && (!txRate || txRate === '0')) {
        const defaultRate = it.default_sale_rate || it.purchase_rate || 0;
        setTxRate(defaultRate.toString());
      }
    }
  }, [txItemId, items, editingTransferId]);

  // Compute party balances and stock pieces held for summaries
  const partySummaries = useMemo(() => {
    const map = new Map<string, {
      heldStock: number;
      receivable: number;
      payable: number;
      netPosition: number;
    }>();

    activeParties.forEach(party => {
      const pTransfers = stockTransfers.filter(t => t.destination_party_id === party.id);
      const pSales = sales.filter(s => s.party_id === party.id && s.status === 'completed');

      let issued = 0;
      let returned = 0;
      let soldFromHeld = 0;

      pTransfers.forEach(t => {
        if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
          issued += t.quantity;
        } else if (t.transfer_type === 'return') {
          returned += t.quantity;
        } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
          soldFromHeld += t.quantity;
        }
      });

      pSales.forEach(s => {
        if (s.deduct_from_party_stock) {
          s.items?.forEach(i => {
            soldFromHeld += i.quantity;
          });
        }
      });

      const heldStock = Math.max(0, issued - returned - soldFromHeld);

      const opening = Number(party.opening_balance) || 0;
      const salesTotal = pSales.reduce((sum, s) => sum + s.grand_total, 0);
      const salesReceived = pSales.reduce((sum, s) => sum + (s.amount_received || 0), 0);

      const pPayments = partyPayments.filter(p => p.party_id === party.id);
      const directReceived = pPayments
        .filter(p => p.payment_type === 'received')
        .reduce((sum, p) => sum + p.amount, 0);
      const directPaid = pPayments
        .filter(p => p.payment_type === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalReceived = salesReceived + directReceived;
      const netPos = Math.round((opening + salesTotal + directPaid - totalReceived) * 100) / 100;

      map.set(party.id, {
        heldStock,
        receivable: netPos > 0 ? netPos : 0,
        payable: netPos < 0 ? Math.abs(netPos) : 0,
        netPosition: netPos
      });
    });

    return map;
  }, [activeParties, stockTransfers, sales, partyPayments]);

  // Compute state summaries
  const stateSummaries = useMemo(() => {
    return activeStates.map(state => {
      const stateParties = activeParties.filter(p => p.state_id === state.id);
      let totalHeldStock = 0;
      let totalReceivable = 0;
      let totalPayable = 0;

      stateParties.forEach(p => {
        const sm = partySummaries.get(p.id);
        if (sm) {
          totalHeldStock += sm.heldStock;
          totalReceivable += sm.receivable;
          totalPayable += sm.payable;
        }
      });

      return {
        ...state,
        partyCount: stateParties.length,
        totalHeldStock,
        totalReceivable,
        totalPayable
      };
    });
  }, [activeStates, activeParties, partySummaries]);

  // Filtered parties list for table/grid
  const filteredParties = useMemo(() => {
    return activeParties.filter(p => {
      const matchState =
        selectedStateFilter === 'all' || p.state_id === selectedStateFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery)) ||
        (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchState && matchSearch;
    });
  }, [activeParties, selectedStateFilter, searchQuery]);

  // Load active party ledger
  const loadPartyLedger = async (partyId: string) => {
    setIsLedgerLoading(true);
    try {
      const data = await getPartyLedger(partyId);
      setPartyLedger(data);
    } catch (err: any) {
      console.warn('Failed to load party ledger:', err);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      loadPartyLedger(selectedPartyId);
    } else {
      setPartyLedger(null);
    }
  }, [selectedPartyId, stockTransfers, partyPayments, sales]);

  // Active state record if opened
  const activeStateRecord = useMemo(() => {
    return activeStates.find(s => s.id === selectedStateId);
  }, [activeStates, selectedStateId]);

  // Active party record if opened
  const activePartyRecord = useMemo(() => {
    return activeParties.find(p => p.id === selectedPartyId);
  }, [activeParties, selectedPartyId]);

  // --- HANDLERS ---

  // 1. Save State
  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!stateName.trim()) {
      setErrorMessage('State Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveState({
        name: stateName.trim(),
        notes: stateNotes.trim() || undefined
      });
      setStateName('');
      setStateNotes('');
      setIsStateModalOpen(false);
      setSuccessMessage(`State "${saved.name}" registered successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save state.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Save Party
  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!partyName.trim()) {
      setErrorMessage('Party Name is required.');
      return;
    }
    if (!partyStateId) {
      setErrorMessage('Please select a State for this party.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveParty({
        state_id: partyStateId,
        name: partyName.trim(),
        phone: partyPhone.trim() || undefined,
        address: partyAddress.trim() || undefined,
        notes: partyNotes.trim() || undefined,
        opening_balance: parseFloat(partyOpeningBalance) || 0,
        opening_stock: parseFloat(partyOpeningStock) || 0
      });
      setPartyName('');
      setPartyPhone('');
      setPartyAddress('');
      setPartyNotes('');
      setPartyOpeningBalance('0');
      setPartyOpeningStock('0');
      setIsPartyModalOpen(false);
      setSuccessMessage(`Party "${saved.name}" registered successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save party.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Confirm Delete State
  const handleConfirmDeleteState = async () => {
    if (!stateToDelete) return;
    setErrorMessage(null);
    try {
      await archiveState(stateToDelete.id);
      setSuccessMessage(`State "${stateToDelete.name}" removed successfully.`);
      setStateToDelete(null);
      if (selectedStateId === stateToDelete.id) {
        setSelectedStateId(null);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove state.');
    }
  };

  // 4. Confirm Delete Party
  const handleConfirmDeleteParty = async () => {
    if (!partyToDelete) return;
    setErrorMessage(null);
    try {
      await archiveParty(partyToDelete.id);
      setSuccessMessage(`Party "${partyToDelete.name}" removed successfully.`);
      setPartyToDelete(null);
      if (selectedPartyId === partyToDelete.id) {
        setSelectedPartyId(null);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove party.');
    }
  };

  // 5. Stock Transaction Submit (Create / Edit)
  const handleStockTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const qty = parseFloat(txQty);
    const rate = parseFloat(txRate) || 0;

    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Please enter a valid transfer quantity.');
      return;
    }
    if (!txItemId) {
      setErrorMessage('Please select a jewellery item.');
      return;
    }
    if (!selectedPartyId) {
      setErrorMessage('No party selected.');
      return;
    }

    const party = activeParties.find(p => p.id === selectedPartyId);
    if (!party) return;

    setIsSubmitting(true);
    try {
      if (editingTransferId) {
        await updateStockTransfer(editingTransferId, {
          transfer_date: txDate,
          reference_no: txRefNo.trim() || undefined,
          item_id: txItemId,
          quantity: qty,
          rate: rate,
          transfer_type: txType,
          status: txStatus,
          notes: txNotes.trim() || undefined
        });
        setSuccessMessage('Stock transaction updated successfully.');
      } else {
        await createStockTransfer({
          transfer_date: txDate,
          reference_no: txRefNo.trim() || undefined,
          destination_state_id: party.state_id,
          destination_party_id: party.id,
          item_id: txItemId,
          quantity: qty,
          rate: rate,
          transfer_type: txType,
          status: txStatus,
          notes: txNotes.trim() || undefined
        });
        setSuccessMessage(
          txType === 'handover' || txType === 'issue'
            ? `Handed over ${qty} pcs to ${party.name} (Valued at ₹${(qty * rate).toLocaleString('en-IN')}).`
            : txType === 'return'
            ? `Returned ${qty} pcs from ${party.name} to main warehouse.`
            : `Recorded ${qty} pcs ${txType} for ${party.name}.`
        );
      }

      setIsStockTxModalOpen(false);
      setEditingTransferId(null);
      setTxQty('');
      setTxRate('');
      setTxNotes('');
      setTxRefNo('');
      await loadPartyLedger(selectedPartyId);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Stock transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete Stock Transaction
  const handleConfirmDeleteTransfer = async () => {
    if (!transferToDelete) return;
    setErrorMessage(null);
    try {
      await deleteStockTransfer(transferToDelete.id);
      setSuccessMessage(`Stock transaction #${transferToDelete.reference_no || transferToDelete.id.slice(0, 8)} deleted and inventory reversed.`);
      setTransferToDelete(null);
      if (selectedPartyId) {
        await loadPartyLedger(selectedPartyId);
      }
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete transaction.');
    }
  };

  // 7. Party Payment Submit
  const handlePartyPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }
    if (!selectedPartyId) {
      setErrorMessage('Party is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPartyPayment({
        party_id: selectedPartyId,
        payment_date: payDate,
        amount: amt,
        payment_type: payType,
        payment_method: payMethod,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined
      });

      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      setSuccessMessage(
        payType === 'received'
          ? `Recorded ₹${amt.toLocaleString('en-IN')} received from party.`
          : `Recorded ₹${amt.toLocaleString('en-IN')} paid to party.`
      );
      await loadPartyLedger(selectedPartyId);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Stock Transaction Modal
  const openEditStockTx = (t: StockTransfer) => {
    setEditingTransferId(t.id);
    setTxDate(t.transfer_date ? t.transfer_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setTxRefNo(t.reference_no || '');
    setTxItemId(t.item_id);
    setTxQty(t.quantity.toString());
    setTxRate((t.rate || 0).toString());
    setTxType(t.transfer_type);
    setTxStatus((t.status as any) || 'completed');
    setTxNotes(t.notes || '');
    setIsStockTxModalOpen(true);
  };

  // Filtered party transfer history
  const filteredPartyTransfers = useMemo(() => {
    if (!partyLedger?.transfers) return [];
    return partyLedger.transfers.filter((t: StockTransfer) => {
      // Type filter
      if (txTypeFilter !== 'all') {
        if (txTypeFilter === 'handover' && t.transfer_type !== 'handover' && t.transfer_type !== 'issue') return false;
        if (txTypeFilter === 'return' && t.transfer_type !== 'return') return false;
        if (txTypeFilter === 'settled' && t.transfer_type !== 'settled' && t.transfer_type !== 'sale') return false;
        if (txTypeFilter === 'adjustment' && t.transfer_type !== 'adjustment') return false;
      }
      // Date filter
      if (txStartDate && new Date(t.transfer_date) < new Date(txStartDate + 'T00:00:00')) return false;
      if (txEndDate && new Date(t.transfer_date) > new Date(txEndDate + 'T23:59:59')) return false;
      return true;
    });
  }, [partyLedger?.transfers, txTypeFilter, txStartDate, txEndDate]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2B45]">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-[#AAB4C5] mb-1">
            <button
              onClick={() => {
                setSelectedStateId(null);
                setSelectedPartyId(null);
                setActiveViewTab('states');
              }}
              className="hover:text-[#D6B36A] transition font-medium"
            >
              States Overview
            </button>

            {selectedStateId && (
              <>
                <ChevronRight size={13} className="text-[#7A8699]" />
                <button
                  onClick={() => {
                    setSelectedPartyId(null);
                  }}
                  className={`hover:text-[#D6B36A] transition font-medium ${
                    !selectedPartyId ? 'text-[#D6B36A] font-bold' : ''
                  }`}
                >
                  {activeStateRecord?.name || 'State'}
                </button>
              </>
            )}

            {selectedPartyId && (
              <>
                <ChevronRight size={13} className="text-[#7A8699]" />
                <span className="text-[#D6B36A] font-bold">
                  {activePartyRecord?.name || 'Party Ledger'}
                </span>
              </>
            )}
          </div>

          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            {selectedPartyId
              ? `${activePartyRecord?.name} — Stock & Financial Ledger`
              : selectedStateId
              ? `${activeStateRecord?.name} — Wholesale Parties`
              : 'States & Parties Management'}
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Multi-state wholesale networks, consignment handovers, balance stock, and dual ledgers.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!selectedPartyId && (
            <>
              <button
                onClick={() => {
                  setStateName('');
                  setStateNotes('');
                  setIsStateModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-xl text-xs font-semibold border border-[#1E2B45] transition active:scale-95"
              >
                <Plus size={15} className="text-[#D6B36A]" />
                <span>Create State</span>
              </button>

              <button
                onClick={() => {
                  setPartyName('');
                  setPartyPhone('');
                  setPartyAddress('');
                  setPartyNotes('');
                  setPartyOpeningBalance('0');
                  setPartyOpeningStock('0');
                  setPartyStateId(selectedStateId || activeStates[0]?.id || '');
                  setIsPartyModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                <Plus size={15} />
                <span>{selectedStateId ? `Create Party for ${activeStateRecord?.name}` : 'Create Party'}</span>
              </button>
            </>
          )}

          {selectedPartyId && (
            <button
              onClick={() => {
                setSelectedPartyId(null);
              }}
              className="px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold border border-[#1E2B45] transition"
            >
              ← Back to Parties List
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} className="text-rose-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X size={15} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={15} />
          </button>
        </div>
      )}

      {/* VIEW A: PARTY DETAIL & DUAL LEDGER VIEW */}
      {selectedPartyId ? (
        <div className="space-y-6">
          {/* Party Profile Banner */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B45]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#D6B36A]/10 text-[#D6B36A] rounded-xl border border-[#D6B36A]/20">
                  <Users size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#F5F3EE]">{activePartyRecord?.name}</h3>
                    <span className="px-2 py-0.5 bg-[#16233B] text-[#D6B36A] text-[10px] font-semibold rounded-md border border-[#1E2B45]">
                      📍 {activeStateRecord?.name || 'State'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#AAB4C5] mt-1">
                    {activePartyRecord?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-emerald-400" />
                        {activePartyRecord.phone}
                      </span>
                    )}
                    {activePartyRecord?.address && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} className="text-[#D6B36A]" />
                        {activePartyRecord.address}
                      </span>
                    )}
                    {Number(activePartyRecord?.opening_balance) !== 0 && (
                      <span>
                        Opening Dues: ₹{Number(activePartyRecord?.opening_balance).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons inside party banner */}
              <div className="flex items-center gap-2">
                {activePartyRecord?.phone && (
                  <>
                    <a
                      href={`tel:${activePartyRecord.phone}`}
                      className="p-2 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-xl transition border border-[#1E2B45]"
                      title="Call Party"
                    >
                      <Phone size={15} />
                    </a>
                    <a
                      href={`https://wa.me/${activePartyRecord.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-xl transition border border-[#1E2B45]"
                      title="WhatsApp Chat"
                    >
                      <MessageCircle size={15} />
                    </a>
                  </>
                )}

                <button
                  onClick={() => {
                    setEditingTransferId(null);
                    setTxDate(new Date().toISOString().split('T')[0]);
                    setTxRefNo(`TR-${Date.now().toString().slice(-6)}`);
                    setTxItemId(items[0]?.id || '');
                    setTxQty('');
                    setTxRate(items[0]?.default_sale_rate?.toString() || '0');
                    setTxType('handover');
                    setTxStatus('completed');
                    setTxNotes('');
                    setIsStockTxModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow transition active:scale-95"
                >
                  <Plus size={15} />
                  <span>Add Stock Transaction</span>
                </button>

                <button
                  onClick={() => {
                    setPayType('received');
                    setPayAmount('');
                    setPayRef('');
                    setPayNotes('');
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-xl text-xs font-semibold border border-[#1E2B45] transition"
                >
                  <DollarSign size={15} />
                  <span>Payment</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs: Stock Ledger vs Financial Money Ledger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPartyDetailTab('stock')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  partyDetailTab === 'stock'
                    ? 'border-[#D6B36A] text-[#D6B36A]'
                    : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
                }`}
              >
                <Package size={15} />
                <span>Stock Ledger (Consignments)</span>
              </button>

              <button
                onClick={() => setPartyDetailTab('money')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  partyDetailTab === 'money'
                    ? 'border-[#D6B36A] text-[#D6B36A]'
                    : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
                }`}
              >
                <DollarSign size={15} />
                <span>Financial Ledger (Money & Dues)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: STOCK LEDGER */}
          {partyDetailTab === 'stock' && (
            <div className="space-y-6">
              {/* THREE ESSENTIAL DISPLAYS (A, B, C) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* DISPLAY A: STOCK HANDOVER */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
                      A. Total Stock Handover
                    </span>
                    <span className="p-1.5 bg-[#D6B36A]/10 text-[#D6B36A] rounded-lg">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-2xl font-bold text-[#F5F3EE] font-mono">
                      {partyLedger?.stockSummary?.total_handover_qty || 0}{' '}
                      <span className="text-xs font-sans font-normal text-[#AAB4C5]">pieces</span>
                    </p>
                    <p className="text-sm font-semibold text-[#D6B36A] mt-0.5 font-mono">
                      Total Value: ₹{(partyLedger?.stockSummary?.total_handover_value || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#7A8699] mt-2">
                      Total jewellery handed over at actual recorded rates. Not treated as a sale.
                    </p>
                  </div>
                </div>

                {/* DISPLAY B: BALANCED STOCK (HELD) */}
                <div className="bg-[#111B2E] border border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                      B. Balanced Stock (Held)
                    </span>
                    <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Package size={16} />
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-2xl font-bold text-amber-400 font-mono">
                      {partyLedger?.stockSummary?.total_balance_qty || 0}{' '}
                      <span className="text-xs font-sans font-normal text-amber-200/70">pieces held</span>
                    </p>
                    <p className="text-sm font-semibold text-[#F5F3EE] mt-0.5 font-mono">
                      Valued (FIFO): ₹{(partyLedger?.stockSummary?.total_balance_value || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#7A8699] mt-2">
                      Formula: Opening + Handover − Returned − Sold. Valued via original batch rates.
                    </p>
                  </div>
                </div>

                {/* DISPLAY C: DUE STOCK */}
                <div className="bg-[#111B2E] border border-sky-500/30 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                      C. Due Stock
                    </span>
                    <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Clock size={16} />
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-2xl font-bold text-sky-400 font-mono">
                      {partyLedger?.stockSummary?.total_due_qty || 0}{' '}
                      <span className="text-xs font-sans font-normal text-sky-200/70">pieces due</span>
                    </p>
                    <p className="text-sm font-semibold text-[#F5F3EE] mt-0.5 font-mono">
                      Due Value: ₹{(partyLedger?.stockSummary?.total_due_value || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#7A8699] mt-2">
                      Stock awaiting business settlement or return. Tracked separately from money.
                    </p>
                  </div>
                </div>
              </div>

              {/* ITEM-WISE DETAILED LEDGER TABLE */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider">
                    Item-wise Consignment & Balance Breakdown
                  </h4>
                  <span className="text-[11px] text-[#AAB4C5]">
                    {partyLedger?.stockSummary?.items?.length || 0} unique jewellery items
                  </span>
                </div>

                <div className="border border-[#1E2B45] rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-[#0B1220] text-[#AAB4C5] border-b border-[#1E2B45]">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Jewellery Item</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Handover Qty</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Handover Value</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Returned</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Sold / Settled</th>
                        <th className="py-2.5 px-3 font-semibold text-right text-amber-300">Balance Stock</th>
                        <th className="py-2.5 px-3.5 font-semibold text-right text-[#D6B36A]">Balance Value (FIFO)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B45]">
                      {(partyLedger?.stockSummary?.items || []).map((i: any) => (
                        <tr key={i.item_id} className="hover:bg-[#16233B]/40 transition">
                          <td className="py-2.5 px-3.5 font-medium text-[#F5F3EE]">{i.item_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#F5F3EE]">{i.handover_qty} pcs</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#AAB4C5]">₹{i.handover_value.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-sky-400">{i.returned_qty} pcs</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-400">{i.sold_settled_qty} pcs</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">{i.balance_qty} pcs</td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#D6B36A]">
                            ₹{i.balance_value.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      {(!partyLedger?.stockSummary?.items || partyLedger.stockSummary.items.length === 0) && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#7A8699]">
                            No stock transactions recorded for this party yet. Click "+ Add Stock Transaction" above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STOCK TRANSACTION HISTORY & AUDIT TRAIL */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B45]">
                  <div>
                    <h4 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider">
                      Stock Transaction History & Audit
                    </h4>
                    <p className="text-[11px] text-[#AAB4C5] mt-0.5">
                      Full historical log of stock handovers, returns, settlements, and adjustments.
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={txTypeFilter}
                      onChange={e => setTxTypeFilter(e.target.value)}
                      className="bg-[#0B1220] border border-[#1E2B45] text-[#F5F3EE] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="all">All Types</option>
                      <option value="handover">Handovers</option>
                      <option value="return">Returns</option>
                      <option value="settled">Settled / Sold</option>
                      <option value="adjustment">Adjustments</option>
                    </select>

                    <div className="flex items-center gap-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2 py-1 text-xs">
                      <span className="text-[#7A8699]">From:</span>
                      <input
                        type="date"
                        value={txStartDate}
                        onChange={e => setTxStartDate(e.target.value)}
                        className="bg-transparent text-[#F5F3EE] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2 py-1 text-xs">
                      <span className="text-[#7A8699]">To:</span>
                      <input
                        type="date"
                        value={txEndDate}
                        onChange={e => setTxEndDate(e.target.value)}
                        className="bg-transparent text-[#F5F3EE] focus:outline-none"
                      />
                    </div>

                    {(txTypeFilter !== 'all' || txStartDate || txEndDate) && (
                      <button
                        onClick={() => {
                          setTxTypeFilter('all');
                          setTxStartDate('');
                          setTxEndDate('');
                        }}
                        className="text-xs text-[#D6B36A] hover:underline px-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* History Table */}
                <div className="border border-[#1E2B45] rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[760px]">
                    <thead className="bg-[#0B1220] text-[#AAB4C5] border-b border-[#1E2B45]">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Date & Ref #</th>
                        <th className="py-2.5 px-3 font-semibold">Transaction Type</th>
                        <th className="py-2.5 px-3 font-semibold">Jewellery Item</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Rate (₹)</th>
                        <th className="py-2.5 px-3.5 font-semibold text-right">Total (₹)</th>
                        <th className="py-2.5 px-3 font-semibold">Notes</th>
                        <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B45]">
                      {filteredPartyTransfers.map((t: StockTransfer) => {
                        const isHandover = t.transfer_type === 'handover' || t.transfer_type === 'issue';
                        const isReturn = t.transfer_type === 'return';
                        const isSettled = t.transfer_type === 'settled' || t.transfer_type === 'sale';

                        return (
                          <tr key={t.id} className="hover:bg-[#16233B]/40 transition">
                            <td className="py-2.5 px-3.5">
                              <span className="font-medium text-[#F5F3EE] block">
                                {formatDate(t.transfer_date)}
                              </span>
                              <span className="text-[10px] text-[#7A8699] font-mono block">
                                #{t.reference_no || t.id.slice(0, 8)}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isHandover
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : isReturn
                                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                    : isSettled
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {isHandover && '📦 Handover'}
                                {isReturn && '↺ Return'}
                                {isSettled && '✓ Settled'}
                                {!isHandover && !isReturn && !isSettled && '⚙ Adjustment'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-medium text-[#F5F3EE]">{t.item_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F5F3EE]">
                              {t.quantity} pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#AAB4C5]">
                              ₹{(t.rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#D6B36A]">
                              ₹{(t.total_value || (t.quantity * (t.rate || 0))).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#7A8699] max-w-[150px] truncate">
                              {t.notes || '—'}
                            </td>

                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditStockTx(t)}
                                  className="p-1.5 text-[#AAB4C5] hover:text-[#D6B36A] hover:bg-[#16233B] rounded-lg transition"
                                  title="Edit entry"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => setTransferToDelete(t)}
                                  className="p-1.5 text-[#7A8699] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                  title="Delete entry & reverse stock"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredPartyTransfers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-[#7A8699]">
                            No stock transactions found matching the filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL MONEY LEDGER */}
          {partyDetailTab === 'money' && (
            <div className="space-y-6">
              {/* Notice */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2.5">
                <Info size={16} className="text-blue-400 shrink-0" />
                <span>
                  <strong>Strict Separation of Money and Stock:</strong> Consignment stock handovers do not create receivables or sales. Financial receivables occur only upon invoice billing or recorded financial transactions.
                </span>
              </div>

              {/* Financial Balance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#111B2E] border border-[#1E2B45] p-4 rounded-xl">
                  <span className="text-[10px] text-[#7A8699] block">Opening Dues</span>
                  <span className="text-base font-bold font-mono text-[#F5F3EE] mt-0.5 block">
                    ₹{(partyLedger?.moneySummary?.opening_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#111B2E] border border-[#1E2B45] p-4 rounded-xl">
                  <span className="text-[10px] text-[#7A8699] block">Total Invoiced Sales</span>
                  <span className="text-base font-bold font-mono text-[#D6B36A] mt-0.5 block">
                    ₹{(partyLedger?.moneySummary?.total_sales || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#111B2E] border border-[#1E2B45] p-4 rounded-xl">
                  <span className="text-[10px] text-[#7A8699] block">Total Money Received</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                    ₹{(partyLedger?.moneySummary?.total_received || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#111B2E] border border-[#1E2B45] p-4 rounded-xl">
                  <span className="text-[10px] text-[#7A8699] block">Net Financial Position</span>
                  {(partyLedger?.moneySummary?.net_position || 0) > 0 ? (
                    <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
                      Owes ₹{(partyLedger?.moneySummary?.net_position || 0).toLocaleString('en-IN')}
                    </span>
                  ) : (partyLedger?.moneySummary?.net_position || 0) < 0 ? (
                    <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                      Advance ₹{Math.abs(partyLedger?.moneySummary?.net_position || 0).toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-base font-bold font-mono text-[#7A8699] mt-0.5 block">Settled (₹0)</span>
                  )}
                </div>
              </div>

              {/* Payments History Table */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider">
                    Recorded Payments & Financial Settlements
                  </h4>
                  <button
                    onClick={() => {
                      setPayType('received');
                      setPayAmount('');
                      setPayRef('');
                      setPayNotes('');
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    + Record Payment
                  </button>
                </div>

                <div className="border border-[#1E2B45] rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-[#0B1220] text-[#AAB4C5] border-b border-[#1E2B45]">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Payment Date</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Method</th>
                        <th className="py-2.5 px-3 font-semibold">Reference #</th>
                        <th className="py-2.5 px-3.5 font-semibold text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B45]">
                      {(partyLedger?.payments || []).map((p: PartyPayment) => (
                        <tr key={p.id} className="hover:bg-[#16233B]/40 transition">
                          <td className="py-2.5 px-3.5 font-medium text-[#F5F3EE]">{formatDate(p.payment_date)}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.payment_type === 'received'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {p.payment_type === 'received' ? '↓ Received' : '↑ Paid'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#AAB4C5]">{p.payment_method}</td>
                          <td className="py-2.5 px-3 font-mono text-[#7A8699]">{p.reference || '—'}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#F5F3EE]">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#7A8699]">{p.notes || '—'}</td>
                        </tr>
                      ))}
                      {(!partyLedger?.payments || partyLedger.payments.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[#7A8699]">
                            No direct financial payments recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN LIST VIEWS: STATES OR ALL PARTIES */
        <div className="space-y-6">
          {/* Main View Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1E2B45]">
            <button
              onClick={() => {
                setActiveViewTab('states');
                setSelectedStateId(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeViewTab === 'states' && !selectedStateId
                  ? 'border-[#D6B36A] text-[#D6B36A]'
                  : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
              }`}
            >
              <MapPin size={15} />
              <span>States Overview ({activeStates.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveViewTab('parties');
                setSelectedStateId(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeViewTab === 'parties' && !selectedStateId
                  ? 'border-[#D6B36A] text-[#D6B36A]'
                  : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
              }`}
            >
              <Users size={15} />
              <span>All Wholesale Parties ({activeParties.length})</span>
            </button>

            {selectedStateId && (
              <button
                className="px-4 py-2.5 text-xs font-semibold border-b-2 border-[#D6B36A] text-[#D6B36A] flex items-center gap-2"
              >
                <Building2 size={15} />
                <span>{activeStateRecord?.name} Parties ({filteredParties.length})</span>
              </button>
            )}
          </div>

          {/* VIEW: SPECIFIC STATE OPENED */}
          {selectedStateId && activeStateRecord && (
            <div className="space-y-5">
              {/* State Header Card */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#D6B36A]/10 text-[#D6B36A] rounded-xl border border-[#D6B36A]/20">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#F5F3EE]">{activeStateRecord.name}</h3>
                      <p className="text-xs text-[#AAB4C5]">
                        {filteredParties.length} Parties Registered in this State
                        {activeStateRecord.notes ? ` • ${activeStateRecord.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPartyStateId(activeStateRecord.id);
                        setPartyName('');
                        setPartyPhone('');
                        setPartyAddress('');
                        setPartyNotes('');
                        setPartyOpeningBalance('0');
                        setPartyOpeningStock('0');
                        setIsPartyModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow transition active:scale-95"
                    >
                      <Plus size={15} />
                      <span>Create Party for {activeStateRecord.name}</span>
                    </button>

                    <button
                      onClick={() => setStateToDelete({ id: activeStateRecord.id, name: activeStateRecord.name, partyCount: filteredParties.length })}
                      className="p-2 bg-[#16233B] hover:bg-rose-500/10 text-[#7A8699] hover:text-rose-400 rounded-xl transition border border-[#1E2B45]"
                      title="Remove State"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* State Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1E2B45]/60 text-center">
                  <div className="bg-[#0B1220] p-2.5 rounded-xl">
                    <p className="text-[10px] text-[#7A8699]">Held Consignment Stock</p>
                    <p className="text-sm font-bold text-[#F5F3EE] mt-0.5">
                      {filteredParties.reduce((sum, p) => sum + (partySummaries.get(p.id)?.heldStock || 0), 0)} pcs
                    </p>
                  </div>
                  <div className="bg-[#0B1220] p-2.5 rounded-xl">
                    <p className="text-[10px] text-[#7A8699]">Total Receivables</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">
                      ₹{filteredParties.reduce((sum, p) => sum + (partySummaries.get(p.id)?.receivable || 0), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-[#0B1220] p-2.5 rounded-xl">
                    <p className="text-[10px] text-[#7A8699]">Total Payables</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      ₹{filteredParties.reduce((sum, p) => sum + (partySummaries.get(p.id)?.payable || 0), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parties under this state */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParties.map(party => {
                  const sm = partySummaries.get(party.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };
                  return (
                    <div
                      key={party.id}
                      className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm hover:border-[#D6B36A]/40 transition space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm text-[#F5F3EE]">{party.name}</h4>
                            {party.address && (
                              <p className="text-[11px] text-[#AAB4C5] mt-0.5">{party.address}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {party.phone && (
                              <a
                                href={`tel:${party.phone}`}
                                className="p-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg transition"
                                title="Call party"
                              >
                                <Phone size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => setPartyToDelete({ id: party.id, name: party.name, heldStock: sm.heldStock })}
                              className="p-1.5 bg-[#16233B] hover:bg-rose-500/10 text-[#7A8699] hover:text-rose-400 rounded-lg transition"
                              title="Remove Party"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Stock & Finance preview */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1E2B45]/60">
                          <div className="bg-[#0B1220] p-2 rounded-lg text-center">
                            <p className="text-[10px] text-[#7A8699]">Held Stock</p>
                            <p className="text-xs font-bold text-[#F5F3EE] mt-0.5">{sm.heldStock} pcs</p>
                          </div>
                          <div className="bg-[#0B1220] p-2 rounded-lg text-center">
                            <p className="text-[10px] text-[#7A8699]">Net Dues</p>
                            {sm.netPosition > 0 ? (
                              <p className="text-xs font-bold text-amber-400 mt-0.5">
                                Owes ₹{sm.netPosition.toLocaleString('en-IN')}
                              </p>
                            ) : sm.netPosition < 0 ? (
                              <p className="text-xs font-bold text-emerald-400 mt-0.5">
                                Adv ₹{Math.abs(sm.netPosition).toLocaleString('en-IN')}
                              </p>
                            ) : (
                              <p className="text-xs font-bold text-[#7A8699] mt-0.5">₹0</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedPartyId(party.id)}
                        className="w-full py-2 bg-[#D6B36A]/15 hover:bg-[#D6B36A]/25 text-[#D6B36A] rounded-xl text-xs font-bold transition text-center"
                      >
                        Open Stock & Financial Ledger →
                      </button>
                    </div>
                  );
                })}

                {filteredParties.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-[#111B2E] border border-dashed border-[#1E2B45] rounded-xl text-[#AAB4C5]">
                    <Users size={36} className="mx-auto mb-2 text-[#7A8699]" />
                    <p className="text-sm font-medium">No parties registered in {activeStateRecord.name} yet.</p>
                    <button
                      onClick={() => {
                        setPartyStateId(activeStateRecord.id);
                        setPartyName('');
                        setPartyPhone('');
                        setPartyAddress('');
                        setPartyNotes('');
                        setPartyOpeningBalance('0');
                        setPartyOpeningStock('0');
                        setIsPartyModalOpen(true);
                      }}
                      className="mt-3 text-xs text-[#D6B36A] font-semibold underline"
                    >
                      + Create First Party for {activeStateRecord.name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: STATES OVERVIEW (ALL STATES) */}
          {activeViewTab === 'states' && !selectedStateId && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateSummaries.map(state => (
                  <div
                    key={state.id}
                    className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm hover:border-[#D6B36A]/40 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#D6B36A]/10 text-[#D6B36A] rounded-lg">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-[#F5F3EE]">{state.name}</h3>
                          <p className="text-[11px] text-[#AAB4C5]">{state.partyCount} Registered Parties</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStateId(state.id);
                            setSelectedStateFilter(state.id);
                          }}
                          className="text-xs text-[#D6B36A] hover:bg-[#D6B36A]/10 px-2 py-1 rounded-lg flex items-center gap-1 font-medium transition"
                          title="Open State & View Parties"
                        >
                          <span>Parties</span>
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => setStateToDelete({ id: state.id, name: state.name, partyCount: state.partyCount })}
                          className="p-1.5 text-[#7A8699] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Remove State"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {state.notes && (
                      <p className="text-[11px] text-[#7A8699] italic">{state.notes}</p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E2B45]/60 text-center">
                      <div className="bg-[#0B1220] p-2 rounded-lg">
                        <p className="text-[10px] text-[#7A8699]">Held Stock</p>
                        <p className="text-xs font-bold text-[#F5F3EE] mt-0.5">{state.totalHeldStock} pcs</p>
                      </div>
                      <div className="bg-[#0B1220] p-2 rounded-lg">
                        <p className="text-[10px] text-[#7A8699]">Receivable</p>
                        <p className="text-xs font-bold text-amber-400 mt-0.5">₹{state.totalReceivable.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-[#0B1220] p-2 rounded-lg">
                        <p className="text-[10px] text-[#7A8699]">Payable</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{state.totalPayable.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {stateSummaries.length === 0 && (
                <div className="text-center py-12 bg-[#111B2E] border border-dashed border-[#1E2B45] rounded-xl text-[#AAB4C5]">
                  <MapPin size={36} className="mx-auto mb-2 text-[#7A8699]" />
                  <p className="text-sm font-medium">No states registered yet.</p>
                  <button
                    onClick={() => setIsStateModalOpen(true)}
                    className="mt-3 text-xs text-[#D6B36A] font-semibold underline"
                  >
                    + Register First State
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ALL WHOLESALE PARTIES */}
          {activeViewTab === 'parties' && !selectedStateId && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedStateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      selectedStateFilter === 'all'
                        ? 'bg-[#D6B36A] text-[#0B1220] font-bold'
                        : 'bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE]'
                    }`}
                  >
                    All States ({activeParties.length})
                  </button>
                  {activeStates.map(state => {
                    const count = activeParties.filter(p => p.state_id === state.id).length;
                    return (
                      <button
                        key={state.id}
                        onClick={() => setSelectedStateFilter(state.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                          selectedStateFilter === state.id
                            ? 'bg-[#D6B36A] text-[#0B1220] font-bold'
                            : 'bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE]'
                        }`}
                      >
                        {state.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#7A8699]" />
                  <input
                    type="text"
                    placeholder="Search party, phone, address..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111B2E] border border-[#1E2B45] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              {/* Party Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParties.map(party => {
                  const state = activeStates.find(s => s.id === party.state_id);
                  const sm = partySummaries.get(party.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };

                  return (
                    <div
                      key={party.id}
                      className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm hover:border-[#D6B36A]/40 transition space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm text-[#F5F3EE]">{party.name}</h3>
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#16233B] text-[#D6B36A] text-[10px] font-semibold rounded-md border border-[#1E2B45]">
                              📍 {state?.name || 'Unknown State'}
                            </span>
                            {party.address && (
                              <p className="text-[11px] text-[#AAB4C5] mt-1">{party.address}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {party.phone && (
                              <>
                                <a
                                  href={`tel:${party.phone}`}
                                  className="p-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg transition"
                                  title="Call party directly"
                                >
                                  <Phone size={14} />
                                </a>
                                <a
                                  href={`https://wa.me/${party.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg transition"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                </a>
                              </>
                            )}
                            <button
                              onClick={() => setPartyToDelete({ id: party.id, name: party.name, heldStock: sm.heldStock })}
                              className="p-1.5 bg-[#16233B] hover:bg-rose-500/10 text-[#7A8699] hover:text-rose-400 rounded-lg transition"
                              title="Remove Party"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {party.notes && (
                          <p className="text-[11px] text-[#7A8699] mt-2 italic">{party.notes}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1E2B45]/60">
                          <div className="bg-[#0B1220] p-2.5 rounded-lg text-center">
                            <p className="text-[10px] text-[#7A8699]">Held Stock Pieces</p>
                            <p className="text-sm font-bold text-[#F5F3EE] mt-0.5">{sm.heldStock} pcs</p>
                          </div>

                          <div className="bg-[#0B1220] p-2.5 rounded-lg text-center">
                            <p className="text-[10px] text-[#7A8699]">Financial Position</p>
                            {sm.netPosition > 0 ? (
                              <p className="text-sm font-bold text-amber-400 mt-0.5">
                                Owes ₹{sm.netPosition.toLocaleString('en-IN')}
                              </p>
                            ) : sm.netPosition < 0 ? (
                              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                                Advance ₹{Math.abs(sm.netPosition).toLocaleString('en-IN')}
                              </p>
                            ) : (
                              <p className="text-sm font-bold text-[#7A8699] mt-0.5">Settled (₹0)</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedPartyId(party.id)}
                        className="w-full py-2 bg-[#D6B36A]/15 hover:bg-[#D6B36A]/25 text-[#D6B36A] rounded-xl text-xs font-bold transition text-center"
                      >
                        Open Stock & Financial Ledger →
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredParties.length === 0 && (
                <div className="text-center py-12 bg-[#111B2E] border border-dashed border-[#1E2B45] rounded-xl text-[#AAB4C5]">
                  <Users size={36} className="mx-auto mb-2 text-[#7A8699]" />
                  <p className="text-sm font-medium">No parties found matching criteria.</p>
                  <button
                    onClick={() => {
                      setPartyName('');
                      setPartyPhone('');
                      setPartyAddress('');
                      setPartyNotes('');
                      setPartyOpeningBalance('0');
                      setPartyOpeningStock('0');
                      setPartyStateId(activeStates[0]?.id || '');
                      setIsPartyModalOpen(true);
                    }}
                    className="mt-3 text-xs text-[#D6B36A] font-semibold underline"
                  >
                    + Register New Party
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. CREATE STATE MODAL */}
      {isStateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#D6B36A]" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">Register New State</h3>
              </div>
              <button onClick={() => setIsStateModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveState} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">State Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Rajasthan, Maharashtra, Gujarat..."
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
                <span className="text-[10px] text-[#7A8699]">Unique state name for multi-state management</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Key consignment trading region..."
                  value={stateNotes}
                  onChange={e => setStateNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save State'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE PARTY MODAL */}
      {isPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#D6B36A]" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">Register New Party</h3>
              </div>
              <button onClick={() => setIsPartyModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Parent State *</label>
                <select
                  required
                  value={partyStateId}
                  onChange={e => setPartyStateId(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
                  <option value="">Select State</option>
                  {activeStates.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Party Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Royal Jewellers, Test Party..."
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={partyPhone}
                    onChange={e => setPartyPhone(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Address / City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarafa Bazaar, Jaipur"
                    value={partyAddress}
                    onChange={e => setPartyAddress(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={partyOpeningBalance}
                    onChange={e => setPartyOpeningBalance(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Opening Stock (Pieces)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={partyOpeningStock}
                    onChange={e => setPartyOpeningStock(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Regular wholesale buyer, consignment partner..."
                  value={partyNotes}
                  onChange={e => setPartyNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD / EDIT STOCK TRANSACTION MODAL */}
      {isStockTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#D6B36A]" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">
                  {editingTransferId ? 'Edit Stock Transaction' : 'Record Stock Transaction'}
                </h3>
              </div>
              <button onClick={() => setIsStockTxModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockTxSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Transaction Type *</label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as StockTransferType)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="handover">📦 Stock Handover (Issue to Party)</option>
                    <option value="return">↺ Stock Return (Back to Warehouse)</option>
                    <option value="settled">✓ Sold / Settled Stock</option>
                    <option value="adjustment">⚙ Stock Correction / Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Reference # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TR-1001"
                    value={txRefNo}
                    onChange={e => setTxRefNo(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Status / Settlement</label>
                  <select
                    value={txStatus}
                    onChange={e => setTxStatus(e.target.value as any)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="completed">Completed / Settled</option>
                    <option value="pending">Pending Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Select Jewellery Item *</label>
                <select
                  required
                  value={txItemId}
                  onChange={e => setTxItemId(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
                  <option value="">Select Item from Inventory</option>
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Warehouse Stock: {it.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Quantity (Pieces) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 100"
                    value={txQty}
                    onChange={e => setTxQty(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Rate per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 50.00"
                    value={txRate}
                    onChange={e => setTxRate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              {/* Automatic Total Value Display */}
              <div className="p-3 bg-[#0B1220] border border-[#1E2B45] rounded-xl flex items-center justify-between">
                <span className="text-xs text-[#AAB4C5]">Total Transaction Value:</span>
                <span className="text-base font-bold font-mono text-[#D6B36A]">
                  ₹{((parseFloat(txQty) || 0) * (parseFloat(txRate) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exhibition batch, Karigar delivery..."
                  value={txNotes}
                  onChange={e => setTxNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockTxModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTransferId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. RECORD PARTY PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">Record Financial Settlement</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePartyPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Payment Type</label>
                  <select
                    value={payType}
                    onChange={e => setPayType(e.target.value as any)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="received">↓ Money Received from Party</option>
                    <option value="paid">↑ Money Paid to Party</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Reference / UTR #</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR123456"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared bill balance..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE STATE CONFIRMATION MODAL */}
      {stateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle size={20} />
              <h3 className="font-semibold text-sm text-[#F5F3EE]">Remove State?</h3>
            </div>
            <p className="text-xs text-[#AAB4C5]">
              Are you sure you want to remove state <strong>"{stateToDelete.name}"</strong>?
              {stateToDelete.partyCount > 0 && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ This state contains {stateToDelete.partyCount} registered parties. Removing it will archive the state while preserving historical records.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStateToDelete(null)}
                className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteState}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE PARTY CONFIRMATION MODAL */}
      {partyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle size={20} />
              <h3 className="font-semibold text-sm text-[#F5F3EE]">Remove Party?</h3>
            </div>
            <p className="text-xs text-[#AAB4C5]">
              Are you sure you want to remove party <strong>"{partyToDelete.name}"</strong>?
              {partyToDelete.heldStock > 0 && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ Party currently holds {partyToDelete.heldStock} pieces of consignment stock. It will be archived while preserving all transaction history.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPartyToDelete(null)}
                className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteParty}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE STOCK TRANSACTION CONFIRMATION MODAL */}
      {transferToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle size={20} />
              <h3 className="font-semibold text-sm text-[#F5F3EE]">Delete Stock Transaction?</h3>
            </div>
            <p className="text-xs text-[#AAB4C5]">
              Are you sure you want to delete transaction #{transferToDelete.reference_no || transferToDelete.id.slice(0, 8)}?
              <span className="block mt-2 text-amber-400">
                ⚠️ Inventory stock impact ({transferToDelete.quantity} pcs of {transferToDelete.item_name}) will automatically be reversed in warehouse inventory and party ledger.
              </span>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTransferToDelete(null)}
                className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteTransfer}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Delete & Reverse Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
