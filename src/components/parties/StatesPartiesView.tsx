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
  Check,
  LayoutDashboard,
  GitBranch,
  Wallet,
  TrendingUp,
  Boxes,
  ShieldCheck,
  Filter,
  SlidersHorizontal,
  Receipt,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { StateRecord, PartyRecord, PartyRole, StockTransfer, PartyPayment, StockTransferType, StockTransferLevel, DistributionMiniDashboardStats } from '../../types';

export const StatesPartiesView: React.FC = () => {
  const {
    items,
    states,
    parties,
    stockTransfers,
    partyPayments,
    sales,
    expenses,
    saveState,
    archiveState,
    saveParty,
    archiveParty,
    createStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    reconcileStockBalances,
    recordPartyPayment,
    getPartyLedger
  } = useAppData();

  const activeStates = useMemo(() => states.filter(s => !s.is_archived), [states]);
  const activeParties = useMemo(() => parties.filter(p => !p.is_archived), [parties]);

  // Main UI Mode & Navigation
  // 'dashboard' | 'hierarchy' | 'states' | 'parties'
  const [activeViewTab, setActiveViewTab] = useState<'dashboard' | 'hierarchy' | 'states' | 'parties'>('dashboard');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Filters & Search
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mini-Dashboard Filters
  const [dashStateFilter, setDashStateFilter] = useState<string>('all');
  const [dashPartyFilter, setDashPartyFilter] = useState<string>('all');
  const [dashItemFilter, setDashItemFilter] = useState<string>('all');
  const [dashMonth, setDashMonth] = useState<string>('');
  const [dashStartDate, setDashStartDate] = useState<string>('');
  const [dashEndDate, setDashEndDate] = useState<string>('');

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
  const [partyRole, setPartyRole] = useState<PartyRole>('state_head');
  const [parentPartyId, setParentPartyId] = useState<string>('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyNotes, setPartyNotes] = useState('');
  const [partyOpeningBalance, setPartyOpeningBalance] = useState('0');
  const [partyOpeningStock, setPartyOpeningStock] = useState('0');

  // Stock Transaction Form fields
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txRefNo, setTxRefNo] = useState('');
  const [txDirection, setTxDirection] = useState<'owner_to_state_head' | 'state_head_to_distributor' | 'distributor_to_state_head' | 'state_head_to_owner' | 'direct_party'>('owner_to_state_head');
  const [txSourcePartyId, setTxSourcePartyId] = useState<string>('');
  const [txDestPartyId, setTxDestPartyId] = useState<string>('');
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
      let issued = Number(party.opening_stock) || 0;
      let returned = 0;
      let soldFromHeld = 0;

      stockTransfers.forEach(t => {
        if (t.status === 'cancelled' || t.status === 'reversed') return;

        const isReturnToOwner =
          t.transfer_level === 'party_to_owner' ||
          t.destination_party_id === 'owner' ||
          (t.transfer_type === 'return' && (!t.source_party_id || t.source_party_id === t.destination_party_id));

        if (isReturnToOwner && (t.source_party_id === party.id || t.destination_party_id === party.id)) {
          returned += t.quantity;
          return;
        }

        if (t.source_party_id === party.id) {
          returned += t.quantity;
          return;
        }

        if (t.destination_party_id === party.id) {
          if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
            issued += t.quantity;
          } else if (t.transfer_type === 'return' && t.source_party_id && t.source_party_id !== party.id) {
            // Downstream return back to this state head
            issued += t.quantity;
          } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
            soldFromHeld += t.quantity;
          } else if (t.transfer_type === 'adjustment') {
            issued += t.quantity;
          }
        }
      });

      const pSales = sales.filter(s => s.party_id === party.id && s.status === 'completed');
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

  // Mini-Dashboard Real-time Aggregated Metrics
  const miniDashboardStats = useMemo(() => {
    const activeItems = items.filter(i => !i.is_archived && (dashItemFilter === 'all' || i.id === dashItemFilter));
    const activePartiesFiltered = activeParties.filter(p => {
      if (dashStateFilter !== 'all' && p.state_id !== dashStateFilter) return false;
      if (dashPartyFilter !== 'all' && p.id !== dashPartyFilter) return false;
      return true;
    });

    // 1 & 2. Owner physical available stock
    const ownerUnits = activeItems.reduce((sum, i) => sum + i.current_stock, 0);
    const ownerValue = activeItems.reduce((sum, i) => sum + (i.current_stock * (i.purchase_rate || i.default_sale_rate || 0)), 0);

    // Filter transfers by date/item/state/party if specified
    const filteredTransfers = stockTransfers.filter(t => {
      if (t.status === 'cancelled' || t.status === 'reversed') return false;
      if (dashItemFilter !== 'all' && t.item_id !== dashItemFilter) return false;
      if (dashStateFilter !== 'all' && t.destination_state_id !== dashStateFilter) return false;
      if (dashPartyFilter !== 'all' && t.destination_party_id !== dashPartyFilter && t.source_party_id !== dashPartyFilter) return false;
      if (dashStartDate && new Date(t.transfer_date) < new Date(dashStartDate + 'T00:00:00')) return false;
      if (dashEndDate && new Date(t.transfer_date) > new Date(dashEndDate + 'T23:59:59')) return false;
      if (dashMonth && !t.transfer_date.startsWith(dashMonth)) return false;
      return true;
    });

    // 3. Handed over to state heads
    let totalHandedOverToStateHeads = 0;
    filteredTransfers.forEach(t => {
      if ((t.transfer_type === 'handover' || t.transfer_type === 'issue') && (!t.source_party_id || t.transfer_level === 'owner_to_party')) {
        const destParty = activeParties.find(p => p.id === t.destination_party_id);
        if (!destParty || destParty.party_type === 'state_head' || !destParty.party_type) {
          totalHandedOverToStateHeads += t.quantity;
        }
      }
    });

    // 4 & 5. Held stock by state heads and distributors
    let stateHeadsHeldStock = 0;
    let distributorsHeldStock = 0;

    activePartiesFiltered.forEach(p => {
      const sm = partySummaries.get(p.id);
      const held = sm?.heldStock || 0;
      if (p.party_type === 'distributor') {
        distributorsHeldStock += held;
      } else {
        stateHeadsHeldStock += held;
      }
    });

    const totalStockOutsideCustody = stateHeadsHeldStock + distributorsHeldStock;

    // 6. Total payments actually received
    const filteredPayments = partyPayments.filter(pay => {
      if (pay.payment_type !== 'received') return false;
      const party = activeParties.find(p => p.id === pay.party_id);
      if (dashStateFilter !== 'all' && party?.state_id !== dashStateFilter) return false;
      if (dashPartyFilter !== 'all' && pay.party_id !== dashPartyFilter) return false;
      if (dashStartDate && new Date(pay.payment_date) < new Date(dashStartDate + 'T00:00:00')) return false;
      if (dashEndDate && new Date(pay.payment_date) > new Date(dashEndDate + 'T23:59:59')) return false;
      if (dashMonth && !pay.payment_date.startsWith(dashMonth)) return false;
      return true;
    });
    const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // 7. Outstanding financial receivables
    let totalReceivables = 0;
    activePartiesFiltered.forEach(p => {
      const sm = partySummaries.get(p.id);
      if (sm && sm.receivable > 0) {
        totalReceivables += sm.receivable;
      }
    });

    // 8. Total recorded distribution expenses
    const filteredExpenses = expenses.filter(e => {
      if (e.is_cancelled) return false;
      if (dashStateFilter !== 'all' && e.state_id && e.state_id !== dashStateFilter) return false;
      if (dashPartyFilter !== 'all' && e.party_id && e.party_id !== dashPartyFilter) return false;
      if (dashStartDate && new Date(e.expense_date) < new Date(dashStartDate + 'T00:00:00')) return false;
      if (dashEndDate && new Date(e.expense_date) > new Date(dashEndDate + 'T23:59:59')) return false;
      if (dashMonth && !e.expense_date.startsWith(dashMonth)) return false;
      if (dashStateFilter === 'all' && dashPartyFilter === 'all') {
        return e.state_id || e.party_id || ['Transport', 'Packaging'].includes(e.category);
      }
      return true;
    });
    const totalDistributionExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      owner_available_stock_units: ownerUnits,
      owner_available_stock_value: Math.round(ownerValue * 100) / 100,
      total_handed_over_to_state_heads: totalHandedOverToStateHeads,
      current_stock_held_by_state_heads: stateHeadsHeldStock,
      current_stock_held_by_distributors: distributorsHeldStock,
      total_stock_outside_custody: totalStockOutsideCustody,
      total_payments_received: Math.round(totalPaymentsReceived * 100) / 100,
      outstanding_financial_receivables: Math.round(totalReceivables * 100) / 100,
      total_distribution_expenses: Math.round(totalDistributionExpenses * 100) / 100
    };
  }, [items, activeParties, stockTransfers, partyPayments, expenses, partySummaries, dashStateFilter, dashPartyFilter, dashItemFilter, dashMonth, dashStartDate, dashEndDate]);

  // Sender available stock in transfer modal
  const senderAvailableStock = useMemo(() => {
    if (!txItemId) return null;
    const it = items.find(i => i.id === txItemId);
    if (!it) return null;

    if (txDirection === 'owner_to_state_head') {
      return { label: 'Owner Warehouse Stock', qty: it.current_stock };
    }
    if (txDirection === 'state_head_to_distributor' || txDirection === 'state_head_to_owner') {
      const shId = txSourcePartyId || selectedPartyId;
      const sh = activeParties.find(p => p.id === shId);
      const held = partySummaries.get(shId || '')?.heldStock || 0;
      return { label: `${sh?.name || 'State Head'} Held Stock`, qty: held };
    }
    if (txDirection === 'distributor_to_state_head') {
      const distId = txSourcePartyId || selectedPartyId;
      const dist = activeParties.find(p => p.id === distId);
      const held = partySummaries.get(distId || '')?.heldStock || 0;
      return { label: `${dist?.name || 'Distributor'} Held Stock`, qty: held };
    }
    if (txType === 'return' || txType === 'settled') {
      const p = activeParties.find(p => p.id === selectedPartyId);
      const held = partySummaries.get(selectedPartyId || '')?.heldStock || 0;
      return { label: `${p?.name || 'Party'} Held Stock`, qty: held };
    }
    return { label: 'Owner Warehouse Stock', qty: it.current_stock };
  }, [txItemId, txDirection, txSourcePartyId, selectedPartyId, items, activeParties, partySummaries, txType]);

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
        party_type: partyRole,
        parent_party_id: partyRole === 'distributor' ? (parentPartyId || undefined) : undefined,
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
      setSuccessMessage(`Party "${saved.name}" (${saved.party_type === 'state_head' ? 'State Head' : 'Distributor'}) registered successfully.`);
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

  // Helper openers for hierarchy transfers
  const openTransferModal = (params: {
    direction: 'owner_to_state_head' | 'state_head_to_distributor' | 'distributor_to_state_head' | 'state_head_to_owner' | 'direct_party';
    sourcePartyId?: string;
    destPartyId?: string;
    type?: StockTransferType;
  }) => {
    setEditingTransferId(null);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxRefNo('');
    setTxItemId('');
    setTxQty('');
    setTxRate('');
    setTxNotes('');
    setTxDirection(params.direction);
    setTxSourcePartyId(params.sourcePartyId || '');
    setTxDestPartyId(params.destPartyId || '');
    setTxType(params.type || (params.direction.includes('return') ? 'return' : 'handover'));
    setTxStatus('completed');
    setIsStockTxModalOpen(true);
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

    // Determine target party and direction
    let destId = txDestPartyId || selectedPartyId;
    let srcId = txSourcePartyId || undefined;
    let level: StockTransferLevel = 'owner_to_party';
    let typeToUse: StockTransferType = txType;

    if (txDirection === 'owner_to_state_head') {
      level = 'owner_to_party';
      typeToUse = 'handover';
      srcId = undefined;
    } else if (txDirection === 'state_head_to_distributor') {
      level = 'party_to_party';
      typeToUse = 'handover';
      if (!srcId) {
        setErrorMessage('Source State Head is required.');
        return;
      }
    } else if (txDirection === 'distributor_to_state_head') {
      level = 'party_to_party';
      typeToUse = 'return';
      if (!srcId) {
        setErrorMessage('Returning Distributor is required.');
        return;
      }
    } else if (txDirection === 'state_head_to_owner' || (txDirection === 'direct_party' && typeToUse === 'return')) {
      level = 'party_to_owner';
      typeToUse = 'return';
      srcId = txSourcePartyId || selectedPartyId || destId;
      destId = 'owner';
    }

    let partyRecordForState: PartyRecord | undefined;
    if (level === 'party_to_owner') {
      partyRecordForState = activeParties.find(p => p.id === srcId);
      if (!partyRecordForState) {
        setErrorMessage('Returning party not found.');
        return;
      }
    } else {
      if (!destId) {
        setErrorMessage('Target party is required.');
        return;
      }
      partyRecordForState = activeParties.find(p => p.id === destId);
      if (!partyRecordForState) {
        setErrorMessage('Selected target party not found.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingTransferId) {
        await updateStockTransfer(editingTransferId, {
          transfer_date: txDate,
          reference_no: txRefNo.trim() || undefined,
          item_id: txItemId,
          quantity: qty,
          rate: rate,
          transfer_type: typeToUse,
          status: txStatus,
          notes: txNotes.trim() || undefined
        });
        setSuccessMessage('Stock transaction updated successfully.');
      } else {
        await createStockTransfer({
          transfer_date: txDate,
          reference_no: txRefNo.trim() || undefined,
          destination_state_id: partyRecordForState.state_id,
          destination_party_id: destId,
          source_party_id: srcId,
          transfer_level: level,
          item_id: txItemId,
          quantity: qty,
          rate: rate,
          transfer_type: typeToUse,
          status: txStatus,
          notes: txNotes.trim() || undefined
        });
        setSuccessMessage(
          level === 'party_to_owner' || typeToUse === 'return'
            ? `Returned ${qty} pcs from ${partyRecordForState.name} back to owner warehouse.`
            : typeToUse === 'handover' || typeToUse === 'issue'
            ? `Handed over ${qty} pcs to ${partyRecordForState.name} (Valued at ₹${(qty * rate).toLocaleString('en-IN')}).`
            : `Recorded ${qty} pcs ${typeToUse} for ${partyRecordForState.name}.`
        );
      }

      setIsStockTxModalOpen(false);
      setEditingTransferId(null);
      setTxQty('');
      setTxRate('');
      setTxNotes('');
      setTxRefNo('');
      if (selectedPartyId) {
        await loadPartyLedger(selectedPartyId);
      }
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
      const res = await deleteStockTransfer(transferToDelete.id, 'User deleted entry via States & Parties');
      setSuccessMessage(
        `✓ Stock transaction #${transferToDelete.reference_no || transferToDelete.id.slice(0, 8)} (${transferToDelete.quantity} pcs of ${transferToDelete.item_name}) safely deleted & reversed [Audit Ref: ${res?.reversal_ref || 'REV'}].`
      );
      setTransferToDelete(null);
      if (selectedPartyId) {
        await loadPartyLedger(selectedPartyId);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete transaction.');
    }
  };

  // Authoritative Stock Reconciliation
  const [isReconciling, setIsReconciling] = useState(false);
  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    setErrorMessage(null);
    try {
      const res = await reconcileStockBalances();
      const updatedCount = res.reconciledItems.filter((i: any) => i.difference !== 0).length;
      setSuccessMessage(
        res.isBalanced
          ? '✓ Stock Reconciliation Verified: All warehouse inventory and party held stocks are 100% physically balanced.'
          : `✓ Authoritative Stock Reconciliation Complete: Corrected drift across ${updatedCount} items.`
      );
      if (selectedPartyId) {
        await loadPartyLedger(selectedPartyId);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Reconciliation failed.');
    } finally {
      setIsReconciling(false);
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
          <button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-cyan-400 rounded-xl text-xs font-semibold border border-[#1E2B45] transition active:scale-95 disabled:opacity-50"
            title="Authoritative recomputation of warehouse and party balances from valid persisted transactions"
          >
            <RefreshCw size={14} className={isReconciling ? 'animate-spin' : ''} />
            <span>{isReconciling ? 'Reconciling...' : 'Reconcile Stock'}</span>
          </button>

          {!selectedPartyId && (
            <>
              <button
                onClick={() => openTransferModal({ direction: 'owner_to_state_head' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-xl text-xs font-semibold border border-[#1E2B45] transition active:scale-95"
              >
                <ArrowRightLeft size={15} />
                <span>Stock Movement</span>
              </button>

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
          <div className="flex items-center gap-2 border-b border-[#1E2B45] overflow-x-auto pb-px">
            <button
              onClick={() => {
                setActiveViewTab('dashboard');
                setSelectedStateId(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeViewTab === 'dashboard' && !selectedStateId
                  ? 'border-[#D6B36A] text-[#D6B36A]'
                  : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Distribution Mini-Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveViewTab('hierarchy');
                setSelectedStateId(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeViewTab === 'hierarchy' && !selectedStateId
                  ? 'border-[#D6B36A] text-[#D6B36A]'
                  : 'border-transparent text-[#8A95A8] hover:text-[#F5F3EE]'
              }`}
            >
              <GitBranch size={15} />
              <span>State & Distributor Hierarchy</span>
            </button>

            <button
              onClick={() => {
                setActiveViewTab('states');
                setSelectedStateId(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
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
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
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
                className="px-4 py-2.5 text-xs font-semibold border-b-2 border-[#D6B36A] text-[#D6B36A] flex items-center gap-2 whitespace-nowrap"
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

          {/* ========================================================================= */}
          {/* VIEW: SEPARATE STATES & PARTIES MINI-DASHBOARD */}
          {/* ========================================================================= */}
          {activeViewTab === 'dashboard' && !selectedStateId && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#D6B36A]">
                    <SlidersHorizontal size={15} />
                    <span>Distribution Operations Filters</span>
                  </div>
                  <button
                    onClick={() => {
                      setDashStateFilter('all');
                      setDashPartyFilter('all');
                      setDashItemFilter('all');
                      setDashMonth('');
                      setDashStartDate('');
                      setDashEndDate('');
                    }}
                    className="text-[11px] text-[#AAB4C5] hover:text-[#F5F3EE] flex items-center gap-1 underline transition"
                  >
                    <RotateCcw size={12} />
                    <span>Reset Filters</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                  {/* State Filter */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">State</label>
                    <select
                      value={dashStateFilter}
                      onChange={e => {
                        setDashStateFilter(e.target.value);
                        if (e.target.value !== 'all' && dashPartyFilter !== 'all') {
                          const p = activeParties.find(x => x.id === dashPartyFilter);
                          if (p && p.state_id !== e.target.value) {
                            setDashPartyFilter('all');
                          }
                        }
                      }}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="all">All States ({activeStates.length})</option>
                      {activeStates.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Party Filter */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">Party / Head</label>
                    <select
                      value={dashPartyFilter}
                      onChange={e => setDashPartyFilter(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="all">All Parties ({activeParties.length})</option>
                      {activeParties
                        .filter(p => dashStateFilter === 'all' || p.state_id === dashStateFilter)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.party_type === 'distributor' ? '(Distributor)' : '(State Head)'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Item Filter */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">Jewellery Item</label>
                    <select
                      value={dashItemFilter}
                      onChange={e => setDashItemFilter(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="all">All Items ({items.filter(i => !i.is_archived).length})</option>
                      {items.filter(i => !i.is_archived).map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">Month</label>
                    <input
                      type="month"
                      value={dashMonth}
                      onChange={e => setDashMonth(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">From Date</label>
                    <input
                      type="date"
                      value={dashStartDate}
                      onChange={e => setDashStartDate(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[10px] text-[#7A8699] mb-1 uppercase font-semibold">To Date</label>
                    <input
                      type="date"
                      value={dashEndDate}
                      onChange={e => setDashEndDate(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>
                </div>
              </div>

              {/* 8-9 Mini-Dashboard Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Owner Available Physical Stock */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-[#D6B36A]/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Owner Physical Stock</span>
                    <div className="p-2 rounded-xl bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                      <Boxes size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      {miniDashboardStats.owner_available_stock_units} <span className="text-sm font-normal text-[#AAB4C5]">pcs</span>
                    </p>
                    <p className="text-xs text-[#D6B36A] font-semibold">
                      ₹{miniDashboardStats.owner_available_stock_value.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>In Warehouse Custody</span>
                    <span className="text-emerald-400 font-medium">Available</span>
                  </div>
                </div>

                {/* 2. Total Stock Handed Over to State Heads */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-blue-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Handed Over to State Heads</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      {miniDashboardStats.total_handed_over_to_state_heads} <span className="text-sm font-normal text-[#AAB4C5]">pcs</span>
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      Cumulative handovers from owner
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Level 1 Distribution</span>
                    <span className="text-blue-400 font-medium">Initial Flow</span>
                  </div>
                </div>

                {/* 3. Current Stock Held by State Heads */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-cyan-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Held by State Heads</span>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Building2 size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      {miniDashboardStats.current_stock_held_by_state_heads} <span className="text-sm font-normal text-[#AAB4C5]">pcs</span>
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      In state heads&apos; custody
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Consignment In Hand</span>
                    <span className="text-cyan-400 font-medium">Active</span>
                  </div>
                </div>

                {/* 4. Current Stock Held by Distributors */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-purple-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Held by Distributors</span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      {miniDashboardStats.current_stock_held_by_distributors} <span className="text-sm font-normal text-[#AAB4C5]">pcs</span>
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      Downstream seller channels
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Level 2 Distribution</span>
                    <span className="text-purple-400 font-medium">In Field</span>
                  </div>
                </div>

                {/* 5. Total Stock Outside Owner Custody */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-amber-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Total Outside Custody</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <ArrowRightLeft size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-amber-400">
                      {miniDashboardStats.total_stock_outside_custody} <span className="text-sm font-normal text-[#AAB4C5]">pcs</span>
                    </p>
                    <p className="text-[11px] text-[#7A8699]">
                      Heads ({miniDashboardStats.current_stock_held_by_state_heads}) + Dist ({miniDashboardStats.current_stock_held_by_distributors})
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px]">
                    <span className="text-[#7A8699]">Invariant Check</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <ShieldCheck size={12} />
                      Verified
                    </span>
                  </div>
                </div>

                {/* 6. Total Payments Received */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-emerald-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Payments Received</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-emerald-400">
                      ₹{miniDashboardStats.total_payments_received.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      Collected from states & parties
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Main Dashboard Sync</span>
                    <span className="text-emerald-400 font-medium">Realized</span>
                  </div>
                </div>

                {/* 7. Outstanding Financial Receivables */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-rose-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Outstanding Receivables</span>
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      ₹{miniDashboardStats.outstanding_financial_receivables.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      Legitimate settled dues & invoices
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Real Financial Debt</span>
                    <span className="text-amber-400 font-medium">Pending Inflow</span>
                  </div>
                </div>

                {/* 8. Total Distribution Expenses */}
                <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 shadow-sm hover:border-pink-500/40 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB4C5] font-medium">Recorded Expenses</span>
                    <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      <Receipt size={18} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold font-mono text-[#F5F3EE]">
                      ₹{miniDashboardStats.total_distribution_expenses.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#AAB4C5]">
                      Transit, state ops & logistics
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-[#7A8699]">
                    <span>Distribution Cost</span>
                    <span className="text-pink-400 font-medium">Logged</span>
                  </div>
                </div>
              </div>

              {/* State-wise & Party-wise Breakdown Table */}
              <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F3EE]">State & Party Distribution Summary</h3>
                    <p className="text-xs text-[#AAB4C5]">
                      Real-time breakdown of consignment stock and financial standing by distribution entity.
                    </p>
                  </div>
                  <button
                    onClick={() => openTransferModal({ direction: 'owner_to_state_head' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold transition shadow"
                  >
                    <Plus size={14} />
                    <span>New Stock Movement</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0B1220] text-[#AAB4C5] uppercase text-[10px] tracking-wider border-b border-[#1E2B45]">
                      <tr>
                        <th className="py-2.5 px-3">Party Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Held Stock</th>
                        <th className="py-2.5 px-3 text-right">Dues / Receivables</th>
                        <th className="py-2.5 px-3 text-right">Payments Received</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B45]/60">
                      {activeParties
                        .filter(p => {
                          if (dashStateFilter !== 'all' && p.state_id !== dashStateFilter) return false;
                          if (dashPartyFilter !== 'all' && p.id !== dashPartyFilter) return false;
                          return true;
                        })
                        .map(p => {
                          const state = activeStates.find(s => s.id === p.state_id);
                          const sm = partySummaries.get(p.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };
                          const pReceived = partyPayments
                            .filter(pay => pay.party_id === p.id && pay.payment_type === 'received')
                            .reduce((sum, pay) => sum + pay.amount, 0);

                          return (
                            <tr key={p.id} className="hover:bg-[#16233B]/50 transition">
                              <td className="py-3 px-3 font-semibold text-[#F5F3EE]">
                                <div>{p.name}</div>
                                {p.phone && <div className="text-[10px] text-[#7A8699] font-mono">{p.phone}</div>}
                              </td>
                              <td className="py-3 px-3">
                                {p.party_type === 'distributor' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    Distributor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                                    State Head
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[#AAB4C5]">{state?.name || '—'}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-[#F5F3EE]">
                                {sm.heldStock} <span className="text-[10px] font-normal text-[#7A8699]">pcs</span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {sm.netPosition > 0 ? (
                                  <span className="text-amber-400">₹{sm.netPosition.toLocaleString('en-IN')}</span>
                                ) : sm.netPosition < 0 ? (
                                  <span className="text-emerald-400">Adv ₹{Math.abs(sm.netPosition).toLocaleString('en-IN')}</span>
                                ) : (
                                  <span className="text-[#7A8699]">₹0</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                                ₹{pReceived.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (p.party_type === 'distributor') {
                                        openTransferModal({
                                          direction: 'state_head_to_distributor',
                                          destPartyId: p.id,
                                          sourcePartyId: p.parent_party_id || undefined
                                        });
                                      } else {
                                        openTransferModal({
                                          direction: 'owner_to_state_head',
                                          destPartyId: p.id
                                        });
                                      }
                                    }}
                                    className="px-2 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg text-[11px] font-semibold transition border border-[#1E2B45]"
                                    title="Transfer Stock"
                                  >
                                    + Transfer
                                  </button>
                                  <button
                                    onClick={() => setSelectedPartyId(p.id)}
                                    className="px-2 py-1 bg-[#D6B36A]/10 hover:bg-[#D6B36A]/20 text-[#D6B36A] rounded-lg text-[11px] font-semibold transition"
                                  >
                                    Ledger →
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {activeParties.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#7A8699]">
                            No parties registered yet. Register your first state and party to start tracking distribution.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: STATE & DISTRIBUTOR HIERARCHY TREE */}
          {/* ========================================================================= */}
          {activeViewTab === 'hierarchy' && !selectedStateId && (
            <div className="space-y-6">
              {/* Warehouse Root Card */}
              <div className="bg-[#111B2E] border-2 border-[#D6B36A]/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#D6B36A]/15 text-[#D6B36A] rounded-2xl border border-[#D6B36A]/30 shadow-inner">
                      <Boxes size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#F5F3EE]">Business Owner — Central Warehouse</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Authoritative Root Custody
                        </span>
                      </div>
                      <p className="text-xs text-[#AAB4C5] mt-0.5">
                        Physical inventory available for distribution across state heads and distributor networks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openTransferModal({ direction: 'owner_to_state_head' })}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold transition shadow active:scale-95"
                    >
                      <Plus size={15} />
                      <span>Issue Stock to State Head</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1E2B45] text-xs">
                  <div className="p-2.5 bg-[#0B1220] rounded-xl text-center">
                    <span className="text-[#7A8699] text-[10px] uppercase font-semibold">Warehouse Stock</span>
                    <p className="text-base font-bold font-mono text-[#D6B36A] mt-0.5">
                      {miniDashboardStats.owner_available_stock_units} pcs
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#0B1220] rounded-xl text-center">
                    <span className="text-[#7A8699] text-[10px] uppercase font-semibold">Warehouse Value</span>
                    <p className="text-base font-bold font-mono text-[#F5F3EE] mt-0.5">
                      ₹{miniDashboardStats.owner_available_stock_value.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#0B1220] rounded-xl text-center">
                    <span className="text-[#7A8699] text-[10px] uppercase font-semibold">Stock Outside Custody</span>
                    <p className="text-base font-bold font-mono text-amber-400 mt-0.5">
                      {miniDashboardStats.total_stock_outside_custody} pcs
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#0B1220] rounded-xl text-center">
                    <span className="text-[#7A8699] text-[10px] uppercase font-semibold">Registered States</span>
                    <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                      {activeStates.length} States
                    </p>
                  </div>
                </div>
              </div>

              {/* Hierarchy State Branches */}
              <div className="space-y-6">
                {activeStates.map(state => {
                  const stateParties = activeParties.filter(p => p.state_id === state.id);
                  const stateHeads = stateParties.filter(p => p.party_type === 'state_head' || (!p.party_type && p.parent_party_id === undefined));
                  const unassignedDistributors = stateParties.filter(p => p.party_type === 'distributor' && !p.parent_party_id);

                  return (
                    <div
                      key={state.id}
                      className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-5 shadow-sm space-y-4 transition hover:border-[#2A3B5E]"
                    >
                      {/* State Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B45]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#D6B36A]/10 text-[#D6B36A] rounded-xl border border-[#D6B36A]/20">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#F5F3EE]">{state.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-[#16233B] text-[#AAB4C5] rounded-full border border-[#1E2B45]">
                                {stateParties.length} Parties
                              </span>
                            </div>
                            {state.notes && <p className="text-xs text-[#7A8699] mt-0.5">{state.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPartyRole('state_head');
                              setPartyStateId(state.id);
                              setParentPartyId('');
                              setPartyName('');
                              setPartyPhone('');
                              setPartyAddress('');
                              setPartyNotes('');
                              setPartyOpeningBalance('0');
                              setPartyOpeningStock('0');
                              setIsPartyModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-xl text-xs font-semibold border border-[#1E2B45] transition"
                          >
                            <Plus size={14} />
                            <span>Add State Head</span>
                          </button>
                        </div>
                      </div>

                      {/* State Heads & Distributors */}
                      <div className="space-y-4 pl-2 sm:pl-6 border-l-2 border-[#1E2B45]/80 ml-2 sm:ml-4">
                        {stateHeads.map(head => {
                          const sm = partySummaries.get(head.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };
                          const headDistributors = stateParties.filter(p => p.parent_party_id === head.id);

                          return (
                            <div key={head.id} className="space-y-3">
                              {/* State Head Card */}
                              <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-4 shadow-sm hover:border-[#D6B36A]/40 transition space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-lg">👑</span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-sm font-bold text-[#F5F3EE]">{head.name}</h5>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                                          State Head
                                        </span>
                                      </div>
                                      {head.phone && <p className="text-[11px] text-[#7A8699] font-mono">{head.phone}</p>}
                                    </div>
                                  </div>

                                  {/* Head Quick Action Buttons */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      onClick={() => openTransferModal({ direction: 'owner_to_state_head', destPartyId: head.id })}
                                      className="px-2.5 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg text-xs font-medium border border-[#1E2B45] transition"
                                      title="Issue stock from warehouse to this state head"
                                    >
                                      + Issue (Owner → Head)
                                    </button>

                                    <button
                                      onClick={() => openTransferModal({ direction: 'state_head_to_owner', sourcePartyId: head.id, destPartyId: head.id })}
                                      className="px-2.5 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-cyan-400 rounded-lg text-xs font-medium border border-[#1E2B45] transition"
                                      title="Return stock from this state head back to warehouse"
                                    >
                                      ↺ Return to Owner
                                    </button>

                                    <button
                                      onClick={() => openTransferModal({ direction: 'state_head_to_distributor', sourcePartyId: head.id })}
                                      className="px-2.5 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-purple-400 rounded-lg text-xs font-medium border border-[#1E2B45] transition"
                                      title="Transfer stock to downstream distributor"
                                    >
                                      + To Distributor
                                    </button>

                                    <button
                                      onClick={() => {
                                        setPartyRole('distributor');
                                        setPartyStateId(state.id);
                                        setParentPartyId(head.id);
                                        setPartyName('');
                                        setPartyPhone('');
                                        setPartyAddress('');
                                        setPartyNotes('');
                                        setPartyOpeningBalance('0');
                                        setPartyOpeningStock('0');
                                        setIsPartyModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-emerald-400 rounded-lg text-xs font-medium border border-[#1E2B45] transition"
                                      title="Add a downstream distributor under this state head"
                                    >
                                      + Add Distributor
                                    </button>

                                    <button
                                      onClick={() => setSelectedPartyId(head.id)}
                                      className="px-2.5 py-1 bg-[#D6B36A]/10 hover:bg-[#D6B36A]/20 text-[#D6B36A] rounded-lg text-xs font-bold transition"
                                    >
                                      Ledger →
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E2B45]/60 text-xs">
                                  <div className="bg-[#111B2E] p-2 rounded-lg">
                                    <span className="text-[10px] text-[#7A8699]">Held Stock</span>
                                    <p className="font-bold text-[#F5F3EE] font-mono mt-0.5">{sm.heldStock} pcs</p>
                                  </div>
                                  <div className="bg-[#111B2E] p-2 rounded-lg">
                                    <span className="text-[10px] text-[#7A8699]">Net Dues</span>
                                    <p className={`font-bold font-mono mt-0.5 ${sm.netPosition > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {sm.netPosition > 0 ? `Owes ₹${sm.netPosition.toLocaleString('en-IN')}` : `₹0`}
                                    </p>
                                  </div>
                                  <div className="bg-[#111B2E] p-2 rounded-lg">
                                    <span className="text-[10px] text-[#7A8699]">Distributors</span>
                                    <p className="font-bold text-purple-400 font-mono mt-0.5">{headDistributors.length} active</p>
                                  </div>
                                  <div className="bg-[#111B2E] p-2 rounded-lg">
                                    <span className="text-[10px] text-[#7A8699]">Distributor Stock</span>
                                    <p className="font-bold text-purple-300 font-mono mt-0.5">
                                      {headDistributors.reduce((sum, d) => sum + (partySummaries.get(d.id)?.heldStock || 0), 0)} pcs
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Downstream Distributors under this State Head */}
                              {headDistributors.length > 0 && (
                                <div className="space-y-2 pl-4 sm:pl-8 border-l-2 border-purple-500/30 ml-3">
                                  <span className="text-[10px] text-[#7A8699] uppercase font-bold tracking-wider">
                                    Downstream Distributors ({headDistributors.length})
                                  </span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {headDistributors.map(dist => {
                                      const dsm = partySummaries.get(dist.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };
                                      return (
                                        <div
                                          key={dist.id}
                                          className="bg-[#0B1220]/70 border border-[#1E2B45] rounded-xl p-3 shadow-sm hover:border-purple-500/40 transition space-y-2.5"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-sm">🤝</span>
                                                <h6 className="text-xs font-bold text-[#F5F3EE]">{dist.name}</h6>
                                              </div>
                                              {dist.phone && <p className="text-[10px] text-[#7A8699] font-mono mt-0.5">{dist.phone}</p>}
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                              Distributor
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between text-xs bg-[#111B2E] p-2 rounded-lg font-mono">
                                            <div>
                                              <span className="text-[10px] text-[#7A8699] block font-sans">Held Stock</span>
                                              <span className="font-bold text-[#F5F3EE]">{dsm.heldStock} pcs</span>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-[10px] text-[#7A8699] block font-sans">Net Dues</span>
                                              <span className={dsm.netPosition > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                                                {dsm.netPosition > 0 ? `₹${dsm.netPosition.toLocaleString('en-IN')}` : '₹0'}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-end gap-1.5 pt-1">
                                            <button
                                              onClick={() => openTransferModal({
                                                direction: 'distributor_to_state_head',
                                                sourcePartyId: dist.id,
                                                destPartyId: head.id
                                              })}
                                              className="px-2 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-cyan-400 rounded-lg text-[10px] font-medium border border-[#1E2B45] transition"
                                              title="Return stock back to State Head"
                                            >
                                              ↺ Return to Head
                                            </button>
                                            <button
                                              onClick={() => setSelectedPartyId(dist.id)}
                                              className="px-2 py-1 bg-[#D6B36A]/10 hover:bg-[#D6B36A]/20 text-[#D6B36A] rounded-lg text-[10px] font-bold transition"
                                            >
                                              Ledger →
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Unassigned Distributors if any */}
                        {unassignedDistributors.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-[10px] text-[#7A8699] uppercase font-bold tracking-wider">
                              Direct / Unassigned Distributors in {state.name}
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {unassignedDistributors.map(dist => {
                                const dsm = partySummaries.get(dist.id) || { heldStock: 0, receivable: 0, payable: 0, netPosition: 0 };
                                return (
                                  <div
                                    key={dist.id}
                                    className="bg-[#0B1220]/70 border border-[#1E2B45] rounded-xl p-3 shadow-sm hover:border-[#D6B36A]/40 transition space-y-2.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-sm">🤝</span>
                                          <h6 className="text-xs font-bold text-[#F5F3EE]">{dist.name}</h6>
                                        </div>
                                        {dist.phone && <p className="text-[10px] text-[#7A8699] font-mono mt-0.5">{dist.phone}</p>}
                                      </div>
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        Distributor
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-[#111B2E] p-2 rounded-lg font-mono">
                                      <div>
                                        <span className="text-[10px] text-[#7A8699] block font-sans">Held Stock</span>
                                        <span className="font-bold text-[#F5F3EE]">{dsm.heldStock} pcs</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] text-[#7A8699] block font-sans">Net Dues</span>
                                        <span className={dsm.netPosition > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                                          {dsm.netPosition > 0 ? `₹${dsm.netPosition.toLocaleString('en-IN')}` : '₹0'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                      <button
                                        onClick={() => setSelectedPartyId(dist.id)}
                                        className="px-2 py-1 bg-[#D6B36A]/10 hover:bg-[#D6B36A]/20 text-[#D6B36A] rounded-lg text-[10px] font-bold transition"
                                      >
                                        Ledger →
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {stateParties.length === 0 && (
                          <div className="p-4 bg-[#0B1220] border border-dashed border-[#1E2B45] rounded-xl text-center text-xs text-[#7A8699]">
                            No state heads or distributors registered in {state.name} yet.
                            <button
                              onClick={() => {
                                setPartyRole('state_head');
                                setPartyStateId(state.id);
                                setParentPartyId('');
                                setIsPartyModalOpen(true);
                              }}
                              className="block mx-auto mt-2 text-[#D6B36A] font-semibold hover:underline"
                            >
                              + Assign First State Head
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeStates.length === 0 && (
                  <div className="text-center py-12 bg-[#111B2E] border border-dashed border-[#1E2B45] rounded-2xl text-[#AAB4C5]">
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
                  onChange={e => {
                    setPartyStateId(e.target.value);
                    setParentPartyId('');
                  }}
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
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Hierarchy Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPartyRole('state_head');
                      setParentPartyId('');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      partyRole === 'state_head'
                        ? 'bg-[#D6B36A]/20 border-[#D6B36A] text-[#D6B36A]'
                        : 'bg-[#0B1220] border-[#1E2B45] text-[#AAB4C5] hover:text-[#F5F3EE]'
                    }`}
                  >
                    <span>👑</span>
                    <span>State Head</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyRole('distributor')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      partyRole === 'distributor'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-[#0B1220] border-[#1E2B45] text-[#AAB4C5] hover:text-[#F5F3EE]'
                    }`}
                  >
                    <span>🤝</span>
                    <span>Distributor</span>
                  </button>
                </div>
              </div>

              {partyRole === 'distributor' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Reporting State Head (Optional)</label>
                  <select
                    value={parentPartyId}
                    onChange={e => setParentPartyId(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="">Direct / Unassigned</option>
                    {activeParties
                      .filter(p => (!partyStateId || p.state_id === partyStateId) && (p.party_type === 'state_head' || !p.party_type))
                      .map(sh => (
                        <option key={sh.id} value={sh.id}>
                          {sh.name} ({activeStates.find(s => s.id === sh.state_id)?.name || 'State'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

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
              {/* Transfer Movement Direction */}
              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Transfer Direction / Movement Flow *</label>
                <select
                  value={txDirection}
                  onChange={e => {
                    const dir = e.target.value as any;
                    setTxDirection(dir);
                    if (dir === 'owner_to_state_head') {
                      setTxType('handover');
                    } else if (dir === 'state_head_to_distributor') {
                      setTxType('handover');
                    } else if (dir === 'distributor_to_state_head' || dir === 'state_head_to_owner') {
                      setTxType('return');
                    }
                  }}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
                  <option value="owner_to_state_head">📦 Warehouse Owner → State Head (Handover)</option>
                  <option value="state_head_to_distributor">🔄 State Head → Downstream Distributor (Transfer)</option>
                  <option value="distributor_to_state_head">↺ Distributor → State Head (Channel Return)</option>
                  <option value="state_head_to_owner">↺ State Head → Warehouse Owner (Warehouse Return)</option>
                  <option value="direct_party">📋 Direct Party Stock Transaction</option>
                </select>
              </div>

              {/* Source & Destination Parties based on Direction */}
              {txDirection === 'state_head_to_distributor' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Source State Head *</label>
                    <select
                      required
                      value={txSourcePartyId}
                      onChange={e => setTxSourcePartyId(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="">Select State Head</option>
                      {activeParties.filter(p => p.party_type === 'state_head' || !p.party_type).map(sh => (
                        <option key={sh.id} value={sh.id}>
                          {sh.name} ({activeStates.find(s => s.id === sh.state_id)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Target Distributor *</label>
                    <select
                      required
                      value={txDestPartyId}
                      onChange={e => setTxDestPartyId(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="">Select Distributor</option>
                      {activeParties.filter(p => p.party_type === 'distributor').map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({activeStates.find(s => s.id === d.state_id)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {txDirection === 'distributor_to_state_head' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Returning Distributor *</label>
                    <select
                      required
                      value={txSourcePartyId}
                      onChange={e => setTxSourcePartyId(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="">Select Distributor</option>
                      {activeParties.filter(p => p.party_type === 'distributor').map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({activeStates.find(s => s.id === d.state_id)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Receiving State Head *</label>
                    <select
                      required
                      value={txDestPartyId}
                      onChange={e => setTxDestPartyId(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                    >
                      <option value="">Select State Head</option>
                      {activeParties.filter(p => p.party_type === 'state_head' || !p.party_type).map(sh => (
                        <option key={sh.id} value={sh.id}>
                          {sh.name} ({activeStates.find(s => s.id === sh.state_id)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {txDirection === 'owner_to_state_head' && !selectedPartyId && (
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Destination State Head / Party *</label>
                  <select
                    required
                    value={txDestPartyId}
                    onChange={e => setTxDestPartyId(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="">Select Target Party</option>
                    {activeParties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({activeStates.find(s => s.id === p.state_id)?.name}) {p.party_type === 'distributor' ? '(Distributor)' : '(State Head)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {txDirection === 'state_head_to_owner' && !selectedPartyId && (
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Returning State Head / Party *</label>
                  <select
                    required
                    value={txSourcePartyId || txDestPartyId}
                    onChange={e => {
                      setTxSourcePartyId(e.target.value);
                      setTxDestPartyId(e.target.value);
                    }}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="">Select Returning Party</option>
                    {activeParties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({activeStates.find(s => s.id === p.state_id)?.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Transaction Type *</label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as StockTransferType)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="handover">📦 Stock Handover (Issue to Party)</option>
                    <option value="return">↺ Stock Return (Back)</option>
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

              {/* Sender Available Stock Verification Card */}
              {senderAvailableStock && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0B1220] border border-[#1E2B45] text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#D6B36A]" />
                    <span className="text-[#AAB4C5]">{senderAvailableStock.label}:</span>
                  </div>
                  <span className="font-bold font-mono text-[#D6B36A] text-sm">
                    {senderAvailableStock.qty} pcs available
                  </span>
                </div>
              )}

              {/* Insufficient Stock Real-time Alert */}
              {senderAvailableStock && parseFloat(txQty) > senderAvailableStock.qty && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>Insufficient Stock!</strong> Requested {txQty} pcs exceeds available {senderAvailableStock.qty} pcs with {senderAvailableStock.label}. Transaction will be rejected.
                  </div>
                </div>
              )}

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
      {transferToDelete && (() => {
        const isOwnerToParty = transferToDelete.transfer_level === 'owner_to_party' ||
          (!transferToDelete.source_party_id && (transferToDelete.transfer_type === 'handover' || transferToDelete.transfer_type === 'issue') && transferToDelete.destination_party_id !== 'owner');

        const isPartyToOwner = transferToDelete.transfer_level === 'party_to_owner' ||
          (transferToDelete.transfer_type === 'return' && (transferToDelete.destination_party_id === 'owner' || !transferToDelete.source_party_id || transferToDelete.source_party_id === transferToDelete.destination_party_id));

        const isPartyToParty = transferToDelete.transfer_level === 'party_to_party' ||
          (transferToDelete.source_party_id && transferToDelete.destination_party_id && transferToDelete.destination_party_id !== 'owner' && transferToDelete.source_party_id !== transferToDelete.destination_party_id);

        const senderParty = transferToDelete.source_party_id ? activeParties.find(p => p.id === transferToDelete.source_party_id) : null;
        const receiverParty = transferToDelete.destination_party_id && transferToDelete.destination_party_id !== 'owner'
          ? activeParties.find(p => p.id === transferToDelete.destination_party_id)
          : null;

        const senderName = isOwnerToParty ? 'Central Warehouse (Owner)' : (senderParty?.name || 'Sender Party');
        const receiverName = isPartyToOwner ? 'Central Warehouse (Owner)' : (receiverParty?.name || 'Receiver Party');

        // Check if receiving party has enough stock to reverse
        let dependencyError: string | null = null;
        if (isOwnerToParty && receiverParty) {
          const held = partySummaries.get(receiverParty.id)?.heldStock || 0;
          if (held < transferToDelete.quantity) {
            dependencyError = `Cannot delete: ${receiverParty.name} currently holds ${held} pcs of this item, but this entry issued ${transferToDelete.quantity} pcs. Stock has already been transferred downstream or settled.`;
          }
        } else if (isPartyToParty && receiverParty && (transferToDelete.transfer_type === 'handover' || transferToDelete.transfer_type === 'issue')) {
          const held = partySummaries.get(receiverParty.id)?.heldStock || 0;
          if (held < transferToDelete.quantity) {
            dependencyError = `Cannot delete: ${receiverParty.name} currently holds ${held} pcs, but this transfer issued ${transferToDelete.quantity} pcs. Stock has already been transferred downstream or settled.`;
          }
        } else if (isPartyToOwner) {
          const it = items.find(i => i.id === transferToDelete.item_id);
          const currentWarehouse = it ? it.current_stock : 0;
          if (currentWarehouse < transferToDelete.quantity) {
            dependencyError = `Cannot delete: Warehouse only holds ${currentWarehouse} pcs, but reversing this return requires deducting ${transferToDelete.quantity} pcs.`;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#111B2E] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle size={22} />
                <h3 className="font-semibold text-base text-[#F5F3EE]">Delete Stock Transaction?</h3>
              </div>

              {/* Transaction Metadata Card */}
              <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#1E2B45]">
                  <span className="text-[#AAB4C5]">Reference:</span>
                  <span className="font-bold text-[#F5F3EE] font-mono">#{transferToDelete.reference_no || transferToDelete.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#AAB4C5]">Date:</span>
                  <span className="text-[#F5F3EE]">{transferToDelete.transfer_date ? new Date(transferToDelete.transfer_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#AAB4C5]">Type:</span>
                  <span className="capitalize font-semibold text-[#D6B36A]">{transferToDelete.transfer_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#AAB4C5]">Origin & Target:</span>
                  <span className="text-[#F5F3EE] text-right font-medium">{senderName} → {receiverName}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#1E2B45]">
                  <span className="text-[#AAB4C5]">Item & Qty:</span>
                  <span className="font-bold text-amber-300">{transferToDelete.quantity} pcs × {transferToDelete.item_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#AAB4C5]">Valuation:</span>
                  <span className="text-[#F5F3EE]">₹{((transferToDelete.quantity || 0) * (transferToDelete.rate || 0)).toLocaleString('en-IN')} (@ ₹{transferToDelete.rate || 0}/pc)</span>
                </div>
              </div>

              {/* Explicit Stock Reversal Impact Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span>Expected Stock Impact on Reversal:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#AAB4C5]">
                  {isOwnerToParty && (
                    <>Warehouse inventory will <strong className="text-emerald-400 font-bold">INCREASE by +{transferToDelete.quantity} pcs</strong>, and {receiverName}'s held stock will <strong className="text-rose-400 font-bold">DECREASE by -{transferToDelete.quantity} pcs</strong>.</>
                  )}
                  {isPartyToOwner && (
                    <>Warehouse inventory will <strong className="text-rose-400 font-bold">DECREASE by -{transferToDelete.quantity} pcs</strong>, and {senderName}'s held stock will <strong className="text-emerald-400 font-bold">INCREASE by +{transferToDelete.quantity} pcs</strong>.</>
                  )}
                  {isPartyToParty && (
                    <>{senderName}'s held stock will <strong className="text-emerald-400 font-bold">INCREASE by +{transferToDelete.quantity} pcs</strong>, and {receiverName}'s held stock will <strong className="text-rose-400 font-bold">DECREASE by -{transferToDelete.quantity} pcs</strong>.</>
                  )}
                </p>
              </div>

              {/* Dependency guard error */}
              {dependencyError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Deletion Blocked (Dependency Guard)</strong>
                    <span className="text-[11px]">{dependencyError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setTransferToDelete(null)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={!!dependencyError}
                  onClick={handleConfirmDeleteTransfer}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow"
                >
                  Confirm Delete & Reverse Stock
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
