import React, { useState, useMemo } from 'react';
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
  ArrowUpCircle
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { StateRecord, PartyRecord, StockTransfer, PartyPayment } from '../../types';

export const StatesPartiesView: React.FC = () => {
  const {
    items,
    states,
    parties,
    stockTransfers,
    partyPayments,
    sales,
    saveState,
    saveParty,
    createStockTransfer,
    recordPartyPayment,
    getPartyLedger
  } = useAppData();

  const activeStates = useMemo(() => states.filter(s => !s.is_archived), [states]);
  const activeParties = useMemo(() => parties.filter(p => !p.is_archived), [parties]);

  // Main UI Mode
  const [activeViewTab, setActiveViewTab] = useState<'states' | 'parties'>('states');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'issue' | 'return'>('issue');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'received' | 'paid'>('received');

  // Active party for Ledger view
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<string | null>(null);
  const [ledgerTab, setLedgerTab] = useState<'stock' | 'money'>('stock');
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Target party for transfer / payment action modals
  const [actionPartyId, setActionPartyId] = useState<string>('');

  // State Form fields
  const [stateName, setStateName] = useState('');
  const [stateNotes, setStateNotes] = useState('');

  // Party Form fields
  const [partyStateId, setPartyStateId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyNotes, setPartyNotes] = useState('');
  const [partyOpeningBalance, setPartyOpeningBalance] = useState('0');

  // Stock Transfer Form fields
  const [transferItemId, setTransferItemId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState('');

  // Party Payment Form fields
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute party balances and stock pieces held
  const partySummaries = useMemo(() => {
    const map = new Map<string, {
      heldStock: number;
      receivable: number;
      payable: number;
      netPosition: number;
    }>();

    activeParties.forEach(party => {
      // 1. Stock transfers
      const pTransfers = stockTransfers.filter(t => t.destination_party_id === party.id);
      const pSales = sales.filter(s => s.party_id === party.id && s.status === 'completed');

      let issued = 0;
      let returned = 0;
      let soldFromHeld = 0;

      pTransfers.forEach(t => {
        if (t.transfer_type === 'issue') issued += t.quantity;
        else returned += t.quantity;
      });

      pSales.forEach(s => {
        if (s.deduct_from_party_stock) {
          s.items?.forEach(i => {
            soldFromHeld += i.quantity;
          });
        }
      });

      const heldStock = Math.max(0, issued - returned - soldFromHeld);

      // 2. Financials
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
  }, [activeParties, stockTransfers, partyPayments, sales]);

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

  // Load ledger details for a specific party
  const openPartyLedger = async (partyId: string) => {
    setSelectedPartyForLedger(partyId);
    setIsLedgerLoading(true);
    try {
      const data = await getPartyLedger(partyId);
      setLedgerData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load party ledger.');
    } finally {
      setIsLedgerLoading(false);
    }
  };

  // Refresh active ledger if open
  const refreshLedger = async (partyId: string) => {
    try {
      const data = await getPartyLedger(partyId);
      setLedgerData(data);
    } catch {
      // Silent error on refresh
    }
  };

  // Handlers
  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!stateName.trim()) {
      setErrorMessage('State Name is required.');
      return;
    }

    try {
      await saveState({ name: stateName.trim(), notes: stateNotes.trim() || undefined });
      setStateName('');
      setStateNotes('');
      setIsStateModalOpen(false);
      setSuccessMessage('State registered successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save state.');
    }
  };

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

    try {
      await saveParty({
        state_id: partyStateId,
        name: partyName.trim(),
        phone: partyPhone.trim() || undefined,
        notes: partyNotes.trim() || undefined,
        opening_balance: parseFloat(partyOpeningBalance) || 0
      });
      setPartyName('');
      setPartyPhone('');
      setPartyNotes('');
      setPartyOpeningBalance('0');
      setIsPartyModalOpen(false);
      setSuccessMessage('Party registered successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save party.');
    }
  };

  const handleStockTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const qty = parseFloat(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Please enter a valid transfer quantity.');
      return;
    }
    if (!actionPartyId) {
      setErrorMessage('Party is required.');
      return;
    }
    if (!transferItemId) {
      setErrorMessage('Please select an item.');
      return;
    }

    const party = activeParties.find(p => p.id === actionPartyId);
    if (!party) return;

    try {
      await createStockTransfer({
        transfer_date: transferDate,
        destination_state_id: party.state_id,
        destination_party_id: party.id,
        item_id: transferItemId,
        quantity: qty,
        transfer_type: transferType,
        notes: transferNotes.trim() || undefined
      });

      setIsTransferModalOpen(false);
      setTransferQty('');
      setTransferNotes('');
      setSuccessMessage(
        transferType === 'issue'
          ? `Transferred ${qty} pieces to ${party.name}. (Inventory moved without sale/receivable)`
          : `Returned ${qty} pieces from ${party.name} to main warehouse.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      if (selectedPartyForLedger === actionPartyId) {
        await refreshLedger(actionPartyId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Stock transfer failed.');
    }
  };

  const handlePartyPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }
    if (!actionPartyId) {
      setErrorMessage('Party is required.');
      return;
    }

    const party = activeParties.find(p => p.id === actionPartyId);
    if (!party) return;

    try {
      await recordPartyPayment({
        party_id: actionPartyId,
        payment_date: payDate,
        amount: amt,
        payment_type: paymentType,
        payment_method: payMethod,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined
      });

      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      setSuccessMessage(
        paymentType === 'received'
          ? `Recorded payment received of ₹${amt} from ${party.name}.`
          : `Recorded payment of ₹${amt} made to ${party.name}.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      if (selectedPartyForLedger === actionPartyId) {
        await refreshLedger(actionPartyId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment recording failed.');
    }
  };

  // Filtered parties list
  const filteredParties = useMemo(() => {
    return activeParties.filter(p => {
      const matchState = selectedStateFilter === 'all' || p.state_id === selectedStateFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery));
      return matchState && matchSearch;
    });
  }, [activeParties, selectedStateFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2B45]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            States & Parties Management
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Multi-state wholesale networks, stock consignments, returns, and dual party ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setStateName('');
              setStateNotes('');
              setIsStateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-xl text-xs font-semibold border border-[#1E2B45] transition active:scale-95"
          >
            <Plus size={15} className="text-[#D6B36A]" />
            <span>Add State</span>
          </button>

          <button
            onClick={() => {
              setPartyName('');
              setPartyPhone('');
              setPartyNotes('');
              setPartyOpeningBalance('0');
              setPartyStateId(activeStates[0]?.id || '');
              setIsPartyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus size={15} />
            <span>Add Party</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={17} className="text-rose-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1E2B45]">
        <button
          onClick={() => setActiveViewTab('states')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeViewTab === 'states'
              ? 'border-[#D6B36A] text-[#D6B36A]'
              : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
          }`}
        >
          <MapPin size={15} />
          <span>States Overview ({activeStates.length})</span>
        </button>

        <button
          onClick={() => setActiveViewTab('parties')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeViewTab === 'parties'
              ? 'border-[#D6B36A] text-[#D6B36A]'
              : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
          }`}
        >
          <Users size={15} />
          <span>Parties & Ledgers ({activeParties.length})</span>
        </button>
      </div>

      {/* VIEW 1: STATES OVERVIEW */}
      {activeViewTab === 'states' && (
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
                  <button
                    onClick={() => {
                      setSelectedStateFilter(state.id);
                      setActiveViewTab('parties');
                    }}
                    className="text-xs text-[#D6B36A] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View</span>
                    <ChevronRight size={14} />
                  </button>
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

      {/* VIEW 2: PARTIES & LEDGERS */}
      {activeViewTab === 'parties' && (
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

            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-[#7A8699]" />
              <input
                type="text"
                placeholder="Search party name or phone..."
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
              const sm = partySummaries.get(party.id) || {
                heldStock: 0,
                receivable: 0,
                payable: 0,
                netPosition: 0
              };

              return (
                <div
                  key={party.id}
                  className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm hover:border-[#D6B36A]/40 transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Party Name & State Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-[#F5F3EE]">{party.name}</h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#16233B] text-[#D6B36A] text-[10px] font-semibold rounded-md border border-[#1E2B45]">
                          📍 {state?.name || 'Unknown State'}
                        </span>
                      </div>

                      {/* Phone quick buttons */}
                      {party.phone && (
                        <div className="flex items-center gap-1">
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
                        </div>
                      )}
                    </div>

                    {party.notes && (
                      <p className="text-[11px] text-[#7A8699] mt-2 italic">{party.notes}</p>
                    )}

                    {/* Stock & Money Stats */}
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

                  {/* Actions Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E2B45]/60">
                    <button
                      onClick={() => openPartyLedger(party.id)}
                      className="px-2 py-2 bg-[#D6B36A]/15 hover:bg-[#D6B36A]/25 text-[#D6B36A] rounded-lg text-xs font-semibold transition text-center"
                    >
                      Open Ledger
                    </button>

                    <button
                      onClick={() => {
                        setActionPartyId(party.id);
                        setTransferType('issue');
                        setTransferItemId(items[0]?.id || '');
                        setTransferQty('');
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-lg text-xs font-medium transition text-center"
                    >
                      Issue Stock
                    </button>

                    <button
                      onClick={() => {
                        setActionPartyId(party.id);
                        setPaymentType('received');
                        setPayAmount('');
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg text-xs font-medium transition text-center"
                    >
                      Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredParties.length === 0 && (
            <div className="text-center py-12 bg-[#111B2E] border border-dashed border-[#1E2B45] rounded-xl text-[#AAB4C5]">
              <Users size={36} className="mx-auto mb-2 text-[#7A8699]" />
              <p className="text-sm font-medium">No parties found matching criteria.</p>
              <button
                onClick={() => setIsPartyModalOpen(true)}
                className="mt-3 text-xs text-[#D6B36A] font-semibold underline"
              >
                + Register New Party
              </button>
            </div>
          )}
        </div>
      )}

      {/* DUAL PARTY LEDGER MODAL */}
      {selectedPartyForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl relative my-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-[#D6B36A]" />
                <div>
                  <h3 className="font-semibold text-base text-[#F5F3EE]">
                    {ledgerData?.party?.name || 'Party Ledger'}
                  </h3>
                  <p className="text-[11px] text-[#AAB4C5]">
                    📍 {ledgerData?.state?.name || 'State'} &bull; Phone: {ledgerData?.party?.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartyForLedger(null)}
                className="p-1.5 text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-Tab Selector: Stock Ledger vs Money Ledger */}
            <div className="flex items-center justify-between px-6 pt-3 border-b border-[#1E2B45] bg-[#0B1220]/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLedgerTab('stock')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    ledgerTab === 'stock'
                      ? 'border-[#D6B36A] text-[#D6B36A]'
                      : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
                  }`}
                >
                  <Package size={15} />
                  <span>Stock Ledger</span>
                </button>
                <button
                  onClick={() => setLedgerTab('money')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    ledgerTab === 'money'
                      ? 'border-[#D6B36A] text-[#D6B36A]'
                      : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
                  }`}
                >
                  <DollarSign size={15} />
                  <span>Money Ledger</span>
                </button>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2 pb-1">
                {ledgerTab === 'stock' ? (
                  <>
                    <button
                      onClick={() => {
                        setActionPartyId(selectedPartyForLedger);
                        setTransferType('issue');
                        setTransferItemId(items[0]?.id || '');
                        setTransferQty('');
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#D6B36A] text-[#0B1220] rounded-lg text-xs font-bold transition active:scale-95"
                    >
                      + Issue Stock
                    </button>
                    <button
                      onClick={() => {
                        setActionPartyId(selectedPartyForLedger);
                        setTransferType('return');
                        setTransferItemId(ledgerData?.stockSummary?.items[0]?.item_id || items[0]?.id || '');
                        setTransferQty('');
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#16233B] text-[#F5F3EE] rounded-lg text-xs font-medium transition active:scale-95"
                    >
                      ↺ Record Return
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActionPartyId(selectedPartyForLedger);
                        setPaymentType('received');
                        setPayAmount('');
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition active:scale-95"
                    >
                      + Money Received
                    </button>
                    <button
                      onClick={() => {
                        setActionPartyId(selectedPartyForLedger);
                        setPaymentType('paid');
                        setPayAmount('');
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#16233B] text-[#F5F3EE] rounded-lg text-xs font-medium transition active:scale-95"
                    >
                      - Money Paid
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {isLedgerLoading ? (
                <div className="py-16 text-center text-[#AAB4C5]">
                  <div className="w-8 h-8 border-2 border-[#D6B36A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs">Loading party ledger...</p>
                </div>
              ) : ledgerTab === 'stock' ? (
                /* TAB A: STOCK LEDGER */
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B1220] p-4 rounded-xl border border-[#1E2B45]">
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Total Pieces Issued</p>
                      <p className="text-base font-bold text-[#F5F3EE]">
                        {(ledgerData?.transfers || [])
                          .filter((t: any) => t.transfer_type === 'issue')
                          .reduce((s: number, t: any) => s + t.quantity, 0)}{' '}
                        pcs
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Pieces Returned</p>
                      <p className="text-base font-bold text-sky-400">
                        {(ledgerData?.transfers || [])
                          .filter((t: any) => t.transfer_type === 'return')
                          .reduce((s: number, t: any) => s + t.quantity, 0)}{' '}
                        pcs
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Pieces Sold / Settled</p>
                      <p className="text-base font-bold text-purple-400">
                        {(ledgerData?.stockSummary?.items || []).reduce(
                          (s: number, i: any) => s + i.sold_qty,
                          0
                        )}{' '}
                        pcs
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#D6B36A] font-semibold">Currently Held Stock</p>
                      <p className="text-base font-bold text-[#D6B36A]">
                        {ledgerData?.stockSummary?.total_held_pieces || 0} pcs
                      </p>
                    </div>
                  </div>

                  {/* Stock Held Breakdown Table */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider mb-2">
                      Held Inventory Breakdown By Item
                    </h4>
                    <div className="border border-[#1E2B45] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0B1220] text-[#AAB4C5] border-b border-[#1E2B45]">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Item Name</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Issued</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Returned</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Sold</th>
                            <th className="py-2.5 px-3 font-semibold text-right text-[#D6B36A]">Currently Held</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2B45]">
                          {(ledgerData?.stockSummary?.items || []).map((item: any) => (
                            <tr key={item.item_id} className="hover:bg-[#16233B]/50">
                              <td className="py-2 px-3 font-medium text-[#F5F3EE]">{item.item_name}</td>
                              <td className="py-2 px-3 text-right text-[#AAB4C5]">{item.issued_qty}</td>
                              <td className="py-2 px-3 text-right text-sky-400">{item.returned_qty}</td>
                              <td className="py-2 px-3 text-right text-purple-400">{item.sold_qty}</td>
                              <td className="py-2 px-3 text-right font-bold text-[#D6B36A]">{item.held_qty}</td>
                            </tr>
                          ))}
                          {(!ledgerData?.stockSummary?.items || ledgerData?.stockSummary?.items.length === 0) && (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-[#7A8699]">
                                No stock has been issued to this party yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Transfer Movements History */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider mb-2">
                      Stock Movement History
                    </h4>
                    <div className="space-y-2">
                      {(ledgerData?.transfers || []).map((t: StockTransfer) => (
                        <div
                          key={t.id}
                          className="bg-[#0B1220] border border-[#1E2B45] p-3 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                t.transfer_type === 'issue'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-sky-500/10 text-sky-400'
                              }`}
                            >
                              {t.transfer_type === 'issue' ? (
                                <ArrowUpRight size={16} />
                              ) : (
                                <ArrowDownLeft size={16} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#F5F3EE]">
                                {t.transfer_type === 'issue' ? 'Issued to Party:' : 'Returned to Warehouse:'}{' '}
                                {t.item_name}
                              </p>
                              <p className="text-[10px] text-[#7A8699]">
                                {formatDate(t.transfer_date)} {t.notes ? `&bull; ${t.notes}` : ''}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold ${
                              t.transfer_type === 'issue' ? 'text-amber-400' : 'text-sky-400'
                            }`}
                          >
                            {t.transfer_type === 'issue' ? `+${t.quantity} pcs` : `-${t.quantity} pcs`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB B: MONEY LEDGER */
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B1220] p-4 rounded-xl border border-[#1E2B45]">
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Opening Balance</p>
                      <p className="text-sm font-bold text-[#F5F3EE]">
                        ₹{(ledgerData?.moneySummary?.opening_balance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Total Sales Invoices</p>
                      <p className="text-sm font-bold text-amber-400">
                        ₹{(ledgerData?.moneySummary?.total_sales || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7A8699]">Total Received</p>
                      <p className="text-sm font-bold text-emerald-400">
                        ₹{(ledgerData?.moneySummary?.total_received || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#D6B36A] font-semibold">Net Position</p>
                      {ledgerData?.moneySummary?.net_position > 0 ? (
                        <p className="text-sm font-bold text-amber-400">
                          Owes ₹{ledgerData.moneySummary.net_position.toLocaleString('en-IN')}
                        </p>
                      ) : ledgerData?.moneySummary?.net_position < 0 ? (
                        <p className="text-sm font-bold text-emerald-400">
                          Advance ₹{Math.abs(ledgerData.moneySummary.net_position).toLocaleString('en-IN')}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-[#7A8699]">Settled (₹0)</p>
                      )}
                    </div>
                  </div>

                  {/* Financial Statement Records */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider mb-2">
                      Chronological Financial Entries
                    </h4>

                    <div className="space-y-2">
                      {/* Sales Invoices */}
                      {(ledgerData?.sales || []).map((s: any) => (
                        <div
                          key={s.id}
                          className="bg-[#0B1220] border border-[#1E2B45] p-3 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                              <DollarSign size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-[#F5F3EE]">
                                Sale Invoice: {s.invoice_number}
                              </p>
                              <p className="text-[10px] text-[#7A8699]">
                                {formatDate(s.sale_date)} &bull; Status: {s.payment_status} &bull; Received: ₹
                                {s.amount_received || 0}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F5F3EE]">₹{s.grand_total?.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-amber-400">Due: ₹{s.amount_due || 0}</p>
                          </div>
                        </div>
                      ))}

                      {/* Direct Payments */}
                      {(ledgerData?.payments || []).map((p: PartyPayment) => (
                        <div
                          key={p.id}
                          className="bg-[#0B1220] border border-[#1E2B45] p-3 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                p.payment_type === 'received'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {p.payment_type === 'received' ? (
                                <ArrowDownCircle size={16} />
                              ) : (
                                <ArrowUpCircle size={16} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#F5F3EE]">
                                {p.payment_type === 'received'
                                  ? 'Payment Received from Party'
                                  : 'Payment Made to Party'}
                              </p>
                              <p className="text-[10px] text-[#7A8699]">
                                {formatDate(p.payment_date)} &bull; {p.payment_method}{' '}
                                {p.reference ? `(${p.reference})` : ''} {p.notes ? `&bull; ${p.notes}` : ''}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold ${
                              p.payment_type === 'received' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {p.payment_type === 'received' ? `-₹${p.amount}` : `+₹${p.amount}`}
                          </span>
                        </div>
                      ))}

                      {(!ledgerData?.sales || ledgerData.sales.length === 0) &&
                        (!ledgerData?.payments || ledgerData.payments.length === 0) && (
                          <div className="py-6 text-center text-[#7A8699]">
                            No sales or payment records found for this party.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE STATE MODAL */}
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
                  placeholder="e.g. Maharashtra, Gujarat, Rajasthan..."
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
                <span className="text-[10px] text-[#7A8699]">Duplicate names are strictly prevented</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Central wholesale trading hub..."
                  value={stateNotes}
                  onChange={e => setStateNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStateModalOpen(false)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow"
                >
                  Save State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PARTY MODAL */}
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
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">State *</label>
                <select
                  required
                  value={partyStateId}
                  onChange={e => setPartyStateId(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
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
                  placeholder="e.g. Ambika Silver Art Surat"
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={partyPhone}
                  onChange={e => setPartyPhone(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Opening Balance (₹) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={partyOpeningBalance}
                  onChange={e => setPartyOpeningBalance(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                />
                <span className="text-[10px] text-[#7A8699]">
                  Positive = Party owes us (Receivable), Negative = We owe party
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Consignment counter, sample pieces..."
                  value={partyNotes}
                  onChange={e => setPartyNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(false)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER / RETURN MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-[#D6B36A]" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">
                  {transferType === 'issue' ? 'Issue Stock to Party' : 'Record Stock Return from Party'}
                </h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <div className="p-2.5 bg-[#D6B36A]/10 border border-[#D6B36A]/20 rounded-xl text-[#D6B36A] text-[11px]">
              ⚠️ <strong>Physical Movement Only:</strong>{' '}
              {transferType === 'issue'
                ? 'Decreases warehouse stock and increases party held stock. This is NOT a sale; no receivable is created.'
                : 'Restores stock back into main warehouse from party held stock.'}
            </div>

            <form onSubmit={handleStockTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Party</label>
                <select
                  disabled
                  value={actionPartyId}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] opacity-80"
                >
                  {activeParties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Select Item *</label>
                <select
                  required
                  value={transferItemId}
                  onChange={e => setTransferItemId(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
                  {items
                    .filter(i => !i.is_archived)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Warehouse Available: {item.current_stock})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Quantity (pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 10"
                    value={transferQty}
                    onChange={e => setTransferQty(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Approval / Exhibition / Consignment dispatch..."
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow"
                >
                  Confirm {transferType === 'issue' ? 'Issue' : 'Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PARTY PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-[#D6B36A]" />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">
                  {paymentType === 'received' ? 'Record Money Received' : 'Record Money Paid'}
                </h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePartyPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Party</label>
                <select
                  disabled
                  value={actionPartyId}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] opacity-80"
                >
                  {activeParties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Payment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('received')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      paymentType === 'received'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-[#0B1220] border-[#1E2B45] text-[#AAB4C5]'
                    }`}
                  >
                    + Money Received (From Party)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('paid')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      paymentType === 'paid'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-400 font-bold'
                        : 'bg-[#0B1220] border-[#1E2B45] text-[#AAB4C5]'
                    }`}
                  >
                    - Money Paid (To Party)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Reference / UTR</label>
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
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Settlement for March consignment..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-lg text-xs font-bold shadow"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
