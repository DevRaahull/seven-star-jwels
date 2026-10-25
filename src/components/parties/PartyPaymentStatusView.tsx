import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  MessageCircle,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  FileText,
  Building2,
  Users,
  Calendar,
  ArrowRight,
  TrendingDown,
  CreditCard,
  ChevronDown,
  Package,
  Layers,
  MapPin
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PartyRecord, StateRecord, Sale, PartyPayment, StockTransfer, PartyFinancialStatus, PartyPaymentStatusOverview } from '../../types';

interface PartyPaymentStatusViewProps {
  initialStateId?: string | null;
  onOpenPartyLedger?: (partyId: string) => void;
}

export const PartyPaymentStatusView: React.FC<PartyPaymentStatusViewProps> = ({ initialStateId, onOpenPartyLedger }) => {
  const {
    parties,
    states,
    sales,
    partyPayments,
    stockTransfers,
    recordPartyPayment,
    refreshData
  } = useAppData();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateId, setSelectedStateId] = useState<string>(initialStateId || 'all');
  const [selectedStateHeadId, setSelectedStateHeadId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'outstanding_desc' | 'outstanding_asc' | 'payment_date_desc' | 'name_asc'>('outstanding_desc');

  // Details Modal & Payment Modal States
  const [selectedPartyDetails, setSelectedPartyDetails] = useState<PartyPaymentStatusOverview | null>(null);
  const [payingParty, setPayingParty] = useState<PartyPaymentStatusOverview | null>(null);

  // Payment Form Fields
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state filter if passed from parent
  useEffect(() => {
    if (initialStateId) {
      setSelectedStateId(initialStateId);
    }
  }, [initialStateId]);

  const activeStates = useMemo(() => states.filter(s => !s.is_archived), [states]);
  const activeParties = useMemo(() => parties.filter(p => !p.is_archived), [parties]);

  // List of unique state heads for filter
  const stateHeadsList = useMemo(() => {
    const list: Array<{ id: string; name: string; state_name: string }> = [];
    activeParties.forEach(p => {
      const isStateHead = p.party_type === 'state_head' || (!p.party_type && !p.parent_party_id);
      const hasDownstream = activeParties.some(other => other.parent_party_id === p.id);
      if (isStateHead || hasDownstream) {
        const state = activeStates.find(s => s.id === p.state_id);
        if (!list.some(sh => sh.id === p.id)) {
          list.push({
            id: p.id,
            name: p.name,
            state_name: state?.name || 'State'
          });
        }
      }
    });
    return list;
  }, [activeParties, activeStates]);

  // Comprehensive Authoritative Calculation of Qualifying Distributor Records (Excluding State Head rows)
  const calculatedPartyRecords = useMemo(() => {
    const list: PartyPaymentStatusOverview[] = [];

    // Filter to only genuine distributor / downstream parties (exclude State Heads from directory rows)
    const qualifyingParties = activeParties.filter(party => {
      const isStateHead = party.party_type === 'state_head' ||
        (!party.parent_party_id && party.party_type !== 'distributor' && activeParties.some(child => child.parent_party_id === party.id));
      return !isStateHead;
    });

    qualifyingParties.forEach(party => {
      const state = activeStates.find(s => s.id === party.state_id);

      // Determine parent State Head if this is a distributor
      let parentPartyId = party.parent_party_id;
      let parentPartyName: string | undefined;

      if (parentPartyId) {
        const found = activeParties.find(par => par.id === parentPartyId);
        parentPartyName = found?.name;
      } else {
        // Check if an incoming stock transfer came from a state head
        const incoming = stockTransfers.find(t => t.destination_party_id === party.id && t.source_party_id && t.status !== 'reversed');
        if (incoming?.source_party_id) {
          parentPartyId = incoming.source_party_id;
          const found = activeParties.find(par => par.id === incoming.source_party_id);
          parentPartyName = found?.name;
        }
        if (!parentPartyName) {
          // Find designated state head in the same state
          const sh = activeParties.find(par => par.state_id === party.state_id && (par.party_type === 'state_head' || activeParties.some(child => child.parent_party_id === par.id)));
          if (sh) {
            parentPartyId = sh.id;
            parentPartyName = sh.name;
          }
        }
      }

      // Invoiced sales for this party
      const partySales = sales.filter(s => {
        if (s.party_id !== party.id || s.status !== 'completed') return false;
        if (endDate && new Date(s.sale_date) > new Date(endDate + 'T23:59:59')) return false;
        if (startDate && new Date(s.sale_date) < new Date(startDate + 'T00:00:00')) return false;
        if (filterMonth && !s.sale_date.startsWith(filterMonth)) return false;
        return true;
      });

      // Payments recorded for this party
      const specificPayments = partyPayments.filter(pay => {
        if (pay.party_id !== party.id) return false;
        if (endDate && new Date(pay.payment_date) > new Date(endDate + 'T23:59:59')) return false;
        if (startDate && new Date(pay.payment_date) < new Date(startDate + 'T00:00:00')) return false;
        if (filterMonth && !pay.payment_date.startsWith(filterMonth)) return false;
        return true;
      });

      // Stock supply transfers for this party
      const partyTransfers = stockTransfers.filter(t => {
        if (t.status === 'reversed' || t.status === 'cancelled') return false;
        if (t.destination_party_id !== party.id && t.source_party_id !== party.id) return false;
        if (endDate && new Date(t.transfer_date) > new Date(endDate + 'T23:59:59')) return false;
        if (startDate && new Date(t.transfer_date) < new Date(startDate + 'T00:00:00')) return false;
        if (filterMonth && !t.transfer_date.startsWith(filterMonth)) return false;
        return true;
      });

      let stockSuppliedQty = 0;
      let stockReturnedQty = 0;
      let stockSettledQty = 0;
      let stockSuppliedValue = 0;
      let pendingSupplyValue = 0;

      partyTransfers.forEach(t => {
        const qty = Number(t.quantity) || 0;
        const rate = Number(t.rate) || 0;
        const val = typeof t.total_value === 'number' && t.total_value > 0 ? t.total_value : (qty * rate);

        if (t.destination_party_id === party.id) {
          if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
            stockSuppliedQty += qty;
            stockSuppliedValue += val;
            if (t.status === 'pending') {
              pendingSupplyValue += val;
            }
          } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
            stockSettledQty += qty;
          } else if (t.transfer_type === 'return') {
            stockSuppliedQty += qty;
          }
        } else if (t.source_party_id === party.id) {
          if (t.transfer_type === 'return') {
            stockReturnedQty += qty;
          }
        }
      });

      partySales.forEach(s => {
        if (s.deduct_from_party_stock && Array.isArray(s.items)) {
          s.items.forEach(it => {
            stockSettledQty += (Number(it.quantity) || 0);
          });
        }
      });

      const stockPendingQty = Math.max(0, stockSuppliedQty - stockReturnedQty - stockSettledQty);

      let stockSettlementStatus: 'Pending Settlement' | 'Partially Settled' | 'Settled' | 'No Consignment' = 'No Consignment';
      if (stockSuppliedQty === 0) {
        stockSettlementStatus = 'No Consignment';
      } else if (stockPendingQty === 0) {
        stockSettlementStatus = 'Settled';
      } else if (stockReturnedQty > 0 || stockSettledQty > 0) {
        stockSettlementStatus = 'Partially Settled';
      } else {
        stockSettlementStatus = 'Pending Settlement';
      }

      // If a distributor has stock supply marked with status 'pending' (or rate > 0 and unsettled)
      const effectivePendingSupply = pendingSupplyValue > 0
        ? pendingSupplyValue
        : (party.party_type === 'distributor' && stockSettlementStatus === 'Pending Settlement' && stockSuppliedValue > 0 ? stockSuppliedValue : 0);

      const openingBalance = Number(party.opening_balance) || 0;
      const totalSalesBilled = partySales.reduce((sum, s) => sum + s.grand_total, 0);
      const totalSalePaymentsReceived = partySales.reduce((sum, s) => sum + (s.amount_received || 0), 0);

      const directReceived = specificPayments
        .filter(pay => pay.payment_type === 'received')
        .reduce((sum, pay) => sum + pay.amount, 0);

      const directPaidOut = specificPayments
        .filter(pay => pay.payment_type === 'paid')
        .reduce((sum, pay) => sum + pay.amount, 0);

      const totalReceived = Math.round((totalSalePaymentsReceived + directReceived) * 100) / 100;
      const totalPaidOut = Math.round(directPaidOut * 100) / 100;

      // Positive opening balance + sales billed + pending supply agreement value
      const totalObligations = Math.round(((openingBalance > 0 ? openingBalance : 0) + totalSalesBilled + effectivePendingSupply) * 100) / 100;

      // Authoritative Net Position: (Opening + Sales + PendingSupply + DirectPaid) - (SalesReceived + DirectReceived)
      const netPosition = Math.round(((openingBalance + totalSalesBilled + effectivePendingSupply + totalPaidOut) - totalReceived) * 100) / 100;
      const outstandingAmount = netPosition > 0 ? netPosition : 0;
      const creditBalance = netPosition < 0 ? Math.abs(netPosition) : 0;

      // Latest payment date & amount
      let latestPaymentDate: string | undefined;
      let latestPaymentAmount: number | undefined;
      const paymentDates: Array<{ date: string; amount: number }> = [];

      partySales.forEach(s => {
        if (s.amount_received && s.amount_received > 0) {
          paymentDates.push({ date: s.sale_date, amount: s.amount_received });
        }
      });
      specificPayments.forEach(pay => {
        if (pay.payment_type === 'received' && pay.amount > 0) {
          paymentDates.push({ date: pay.payment_date, amount: pay.amount });
        }
      });

      if (paymentDates.length > 0) {
        paymentDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        latestPaymentDate = paymentDates[0].date;
        latestPaymentAmount = paymentDates[0].amount;
      }

      // Determine Payment Status Rule
      let status: PartyFinancialStatus = 'no_transactions';
      let statusLabel = 'No Transactions';

      const hasFinancialObligation = totalObligations > 0 || openingBalance !== 0 || effectivePendingSupply > 0 || stockPendingQty > 0;
      const hasPaymentActivity = totalReceived > 0 || totalPaidOut > 0;

      if (!hasFinancialObligation && !hasPaymentActivity) {
        status = 'no_transactions';
        statusLabel = 'No Transactions';
      } else if (netPosition > 0) {
        if (totalReceived > 0) {
          status = 'partial';
          statusLabel = 'Partially Paid';
        } else {
          status = effectivePendingSupply > 0 ? 'pending' : 'due';
          statusLabel = effectivePendingSupply > 0 ? 'Payment Pending' : 'Due';
        }
      } else if (netPosition < 0) {
        status = 'advance';
        statusLabel = 'Advance / Credit';
      } else {
        // netPosition === 0
        status = 'complete';
        statusLabel = 'Payment Complete';
      }

      list.push({
        party_id: party.id,
        party_name: party.name,
        state_id: party.state_id,
        state_name: state?.name || 'Unknown State',
        party_type: party.party_type,
        parent_party_id: parentPartyId,
        parent_party_name: parentPartyName,
        phone: party.phone,
        address: party.address,
        opening_balance: openingBalance,
        stock_supplied_qty: stockSuppliedQty,
        stock_returned_qty: stockReturnedQty,
        stock_settled_qty: stockSettledQty,
        stock_pending_qty: stockPendingQty,
        stock_supplied_value: Math.round(stockSuppliedValue * 100) / 100,
        stock_settlement_status: stockSettlementStatus,
        total_obligations: totalObligations,
        total_sales_billed: totalSalesBilled,
        pending_supply_value: Math.round(effectivePendingSupply * 100) / 100,
        total_received: totalReceived,
        total_paid_out: totalPaidOut,
        net_position: netPosition,
        outstanding_amount: outstandingAmount,
        credit_balance: creditBalance,
        status,
        status_label: statusLabel,
        last_payment_date: latestPaymentDate,
        last_payment_amount: latestPaymentAmount,
        invoices_count: partySales.length,
        payments_count: specificPayments.length,
        transfers_count: partyTransfers.length
      });
    });

    return list;
  }, [activeParties, activeStates, sales, partyPayments, stockTransfers, startDate, endDate, filterMonth]);

  // Filtered and Sorted Overview List
  const filteredRecords = useMemo(() => {
    let result = calculatedPartyRecords.filter(item => {
      // State Filter
      if (selectedStateId !== 'all' && item.state_id !== selectedStateId) return false;

      // State Head Filter
      if (selectedStateHeadId !== 'all') {
        if (item.party_id !== selectedStateHeadId && item.parent_party_id !== selectedStateHeadId) {
          return false;
        }
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'pending' || selectedStatus === 'due') {
          if (item.status !== 'pending' && item.status !== 'due') return false;
        } else if (item.status !== selectedStatus) {
          return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.party_name.toLowerCase().includes(q);
        const matchesState = item.state_name.toLowerCase().includes(q);
        const matchesHead = item.parent_party_name ? item.parent_party_name.toLowerCase().includes(q) : false;
        const matchesPhone = item.phone ? item.phone.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesState && !matchesHead && !matchesPhone) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'outstanding_desc') {
        return b.outstanding_amount - a.outstanding_amount;
      } else if (sortBy === 'outstanding_asc') {
        return a.outstanding_amount - b.outstanding_amount;
      } else if (sortBy === 'payment_date_desc') {
        const dateA = a.last_payment_date ? new Date(a.last_payment_date).getTime() : 0;
        const dateB = b.last_payment_date ? new Date(b.last_payment_date).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === 'name_asc') {
        return a.party_name.localeCompare(b.party_name);
      }
      return 0;
    });

    return result;
  }, [calculatedPartyRecords, selectedStateId, selectedStateHeadId, selectedStatus, searchQuery, sortBy]);

  // Summary Metrics calculated directly from the filtered records
  const summaryMetrics = useMemo(() => {
    let totalOutstanding = 0;
    let dueCount = 0;
    let partialCount = 0;
    let completeCount = 0;
    let advanceCount = 0;
    let totalPaymentsReceived = 0;

    filteredRecords.forEach(r => {
      totalOutstanding += r.outstanding_amount;
      totalPaymentsReceived += r.total_received;

      if (r.status === 'due' || r.status === 'pending') dueCount++;
      else if (r.status === 'partial') partialCount++;
      else if (r.status === 'complete') completeCount++;
      else if (r.status === 'advance') advanceCount++;
    });

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      dueCount,
      partialCount,
      completeCount,
      advanceCount,
      totalPaymentsReceived: Math.round(totalPaymentsReceived * 100) / 100
    };
  }, [filteredRecords]);

  // Active party details record for modal
  const activePartyInDetails = useMemo(() => {
    if (!selectedPartyDetails) return null;
    return calculatedPartyRecords.find(p => p.party_id === selectedPartyDetails.party_id) || selectedPartyDetails;
  }, [selectedPartyDetails, calculatedPartyRecords]);

  // Specific party invoices & payments for the Details Modal
  const activePartyInvoices = useMemo(() => {
    if (!activePartyInDetails) return [];
    return sales
      .filter(s => s.party_id === activePartyInDetails.party_id && s.status === 'completed')
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  }, [activePartyInDetails, sales]);

  const activePartyPaymentsList = useMemo(() => {
    if (!activePartyInDetails) return [];
    return partyPayments
      .filter(pay => pay.party_id === activePartyInDetails.party_id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [activePartyInDetails, partyPayments]);

  const activePartyStockTransfersList = useMemo(() => {
    if (!activePartyInDetails) return [];
    return stockTransfers
      .filter(t => (t.destination_party_id === activePartyInDetails.party_id || t.source_party_id === activePartyInDetails.party_id) && t.status !== 'reversed')
      .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime());
  }, [activePartyInDetails, stockTransfers]);

  // Handle Quick Payment Submit
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingParty) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmittingPay(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await recordPartyPayment({
        party_id: payingParty.party_id,
        amount: amt,
        payment_type: 'received',
        payment_date: payDate,
        payment_method: payMethod,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || `Payment received from ${payingParty.party_name}`
      });

      await refreshData();
      setSuccessMessage(`Payment of ₹${amt.toLocaleString('en-IN')} successfully recorded for ${payingParty.party_name}.`);
      setPayingParty(null);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record party payment.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStateId('all');
    setSelectedStateHeadId('all');
    setSelectedStatus('all');
    setFilterMonth('');
    setStartDate('');
    setEndDate('');
    setSortBy('outstanding_desc');
  };

  const renderStatusBadge = (status: PartyFinancialStatus, label: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={12} className="shrink-0" />
            <span>Payment Pending</span>
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle size={12} className="shrink-0" />
            <span>Due</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={12} className="shrink-0" />
            <span>Partially Paid</span>
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} className="shrink-0" />
            <span>Payment Complete</span>
          </span>
        );
      case 'advance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <TrendingDown size={12} className="shrink-0" />
            <span>Advance / Credit</span>
          </span>
        );
      case 'no_transactions':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/40 text-slate-400 border border-slate-700/50">
            <span>No Transactions</span>
          </span>
        );
    }
  };

  const renderStockSettlementBadge = (status: string) => {
    switch (status) {
      case 'Pending Settlement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending Settlement
          </span>
        );
      case 'Partially Settled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Partially Settled
          </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ Settled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal bg-slate-800/40 text-slate-400 border border-slate-700/50">
            No Consignment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
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

      {/* SECTION: SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Outstanding */}
        <div className="bg-[#111B2E] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
              Total Outstanding
            </span>
            <span className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg sm:text-2xl font-bold font-mono text-amber-300">
              ₹{summaryMetrics.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Active dues across {filteredRecords.filter(r => r.outstanding_amount > 0).length} distributors
            </p>
          </div>
        </div>

        {/* Card 2: Due / Pending Payments */}
        <div className="bg-[#111B2E] border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
              Pending / Due
            </span>
            <span className="p-1.5 sm:p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg sm:text-2xl font-bold font-mono text-rose-400">
              {summaryMetrics.dueCount} <span className="text-xs font-normal text-[#AAB4C5]">distributors</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Full balance unpaid, awaiting collection
            </p>
          </div>
        </div>

        {/* Card 3: Partial Payments */}
        <div className="bg-[#111B2E] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
              Partially Paid
            </span>
            <span className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock size={16} />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg sm:text-2xl font-bold font-mono text-amber-400">
              {summaryMetrics.partialCount} <span className="text-xs font-normal text-[#AAB4C5]">distributors</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Partial payment received, remainder pending
            </p>
          </div>
        </div>

        {/* Card 4: Complete Payments */}
        <div className="bg-[#111B2E] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
              Payment Complete
            </span>
            <span className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400">
              {summaryMetrics.completeCount} <span className="text-xs font-normal text-[#AAB4C5]">distributors</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Fully settled obligations (₹0 balance)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: SEARCH AND FILTERS */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B45]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6B36A]">
            <SlidersHorizontal size={15} />
            <span>Hierarchy & Payment Status Filters</span>
          </div>
          {(searchQuery || selectedStateId !== 'all' || selectedStateHeadId !== 'all' || selectedStatus !== 'all' || filterMonth || startDate || endDate || sortBy !== 'outstanding_desc') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-[#AAB4C5] hover:text-[#D6B36A] transition self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-[#7A8699]" />
            <input
              type="text"
              placeholder="Search distributor, state head, state..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F3EE] placeholder-[#7A8699] focus:outline-none focus:border-[#D6B36A]"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedStateId}
              onChange={e => setSelectedStateId(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="all">📍 All States ({activeStates.length})</option>
              {activeStates.map(s => (
                <option key={s.id} value={s.id}>
                  📍 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* State Head Filter */}
          <div>
            <select
              value={selectedStateHeadId}
              onChange={e => setSelectedStateHeadId(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="all">👤 All State Heads</option>
              {stateHeadsList.map(sh => (
                <option key={sh.id} value={sh.id}>
                  👤 {sh.name} ({sh.state_name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">🟠 Payment Pending</option>
              <option value="due">🔴 Due Payments</option>
              <option value="partial">🟡 Partially Paid</option>
              <option value="complete">🟢 Payment Complete</option>
              <option value="advance">🔵 Advance / Credit</option>
              <option value="no_transactions">⚪ No Transactions</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            >
              <option value="outstanding_desc">Highest Outstanding Due</option>
              <option value="outstanding_asc">Lowest Outstanding Due</option>
              <option value="payment_date_desc">Latest Payment Date</option>
              <option value="name_asc">Party Name (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-semibold text-[#8A95A8] mb-1">Filter Month</label>
            <input
              type="month"
              value={filterMonth}
              onChange={e => {
                setFilterMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#8A95A8] mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setFilterMonth('');
              }}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#8A95A8] mb-1">Outstanding as of Date (End Date)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setFilterMonth('');
              }}
              className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
            />
          </div>
        </div>
      </div>

      {/* SECTION: OVERVIEW TABLE & MOBILE CARDS */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#1E2B45] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-[#F5F3EE] flex items-center gap-2">
              <Receipt size={17} className="text-[#D6B36A]" />
              <span>State & Distributor Payment Status Directory</span>
            </h3>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              Individual distributors listed under their State Head with stock supply valuation, settlements, and collections.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#D6B36A] px-2.5 py-1 bg-[#16233B] border border-[#1E2B45] rounded-lg">
            {filteredRecords.length} {filteredRecords.length === 1 ? 'Distributor' : 'Distributors'}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Receipt size={32} className="mx-auto text-[#7A8699] opacity-60" />
            <p className="text-sm text-[#AAB4C5]">No distributors found matching the selected payment status criteria.</p>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-[#16233B] text-[#D6B36A] hover:bg-[#1E2E4A] rounded-xl text-xs font-semibold border border-[#1E2B45] transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#1E2B45] text-[#8A95A8] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">State & State Head</th>
                    <th className="py-3 px-3">Distributor Party</th>
                    <th className="py-3 px-3">Stock Supplied & Status</th>
                    <th className="py-3 px-3 text-right">Supply / Billed Value</th>
                    <th className="py-3 px-3 text-right">Received</th>
                    <th className="py-3 px-3 text-right">Pending / Due</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-3 text-right">Last Payment</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2B45]">
                  {filteredRecords.map(item => (
                    <tr
                      key={item.party_id}
                      className="hover:bg-[#16233B]/50 transition duration-150 group"
                    >
                      {/* State & State Head */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F5F3EE] flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#D6B36A]" />
                          <span>{item.state_name}</span>
                        </div>
                        <div className="text-[11px] text-[#AAB4C5] mt-0.5">
                          {item.parent_party_name ? (
                            <span className="text-[#8A95A8]">👤 Head: <strong className="text-[#F5F3EE]">{item.parent_party_name}</strong></span>
                          ) : (
                            <span className="text-[#7A8699]">State Network</span>
                          )}
                        </div>
                      </td>

                      {/* Distributor / Party */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-[#F5F3EE] group-hover:text-[#D6B36A] transition">
                            {item.party_name}
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Distributor
                          </span>
                        </div>
                        {item.phone && (
                          <div className="text-[11px] text-[#7A8699] flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Supplied & Settlement Status */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Package size={12} className="text-[#D6B36A]" />
                            <span className="font-semibold text-[#F5F3EE] font-mono">
                              {item.stock_supplied_qty} pcs
                            </span>
                            {item.stock_pending_qty > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono">
                                ({item.stock_pending_qty} held)
                              </span>
                            )}
                          </div>
                          <div>{renderStockSettlementBadge(item.stock_settlement_status)}</div>
                        </div>
                      </td>

                      {/* Total Obligations / Supply Value */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono text-[#F5F3EE] font-bold">
                          ₹{item.total_obligations.toLocaleString('en-IN')}
                        </div>
                        {item.pending_supply_value > 0 && (
                          <div className="text-[10px] text-[#AAB4C5]">
                            Supply: ₹{item.pending_supply_value.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Payments Received */}
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-medium">
                        ₹{item.total_received.toLocaleString('en-IN')}
                      </td>

                      {/* Outstanding Due / Pending */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {item.outstanding_amount > 0 ? (
                          <span className="font-bold text-amber-300">
                            ₹{item.outstanding_amount.toLocaleString('en-IN')}
                          </span>
                        ) : item.credit_balance > 0 ? (
                          <span className="text-cyan-400 font-semibold">
                            (₹{item.credit_balance.toLocaleString('en-IN')} Adv)
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">₹0</span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {renderStatusBadge(item.status, item.status_label)}
                      </td>

                      {/* Last Payment Date */}
                      <td className="py-3.5 px-3 text-right text-[#AAB4C5]">
                        {item.last_payment_date ? (
                          <div>
                            <span className="text-[#F5F3EE]">{formatDate(item.last_payment_date)}</span>
                            {item.last_payment_amount && (
                              <div className="text-[10px] text-emerald-400 font-mono">
                                +₹{item.last_payment_amount.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#5D6B82]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setPayingParty(item);
                              setPayAmount(item.outstanding_amount > 0 ? item.outstanding_amount.toString() : '');
                            }}
                            className="px-2.5 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 rounded-lg font-semibold text-[11px] border border-emerald-500/20 transition whitespace-nowrap"
                          >
                            + Record Pay
                          </button>
                          <button
                            onClick={() => setSelectedPartyDetails(item)}
                            className="px-2.5 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg font-semibold text-[11px] border border-[#1E2B45] transition whitespace-nowrap"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-[#1E2B45]">
              {filteredRecords.map(item => (
                <div key={item.party_id} className="p-4 space-y-3 bg-[#111B2E]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-[#F5F3EE]">{item.party_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Distributor
                        </span>
                      </div>
                      <div className="text-[11px] text-[#AAB4C5] flex items-center gap-1.5 mt-0.5">
                        <span>📍 {item.state_name}</span>
                        {item.parent_party_name && (
                          <span>• Head: <strong className="text-[#F5F3EE]">{item.parent_party_name}</strong></span>
                        )}
                      </div>
                    </div>
                    {renderStatusBadge(item.status, item.status_label)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#0B1220] p-3 rounded-xl border border-[#1E2B45] text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Stock Supplied</span>
                      <span className="font-bold font-mono text-[#F5F3EE]">
                        {item.stock_supplied_qty} pcs
                      </span>
                      <div className="mt-0.5">{renderStockSettlementBadge(item.stock_settlement_status)}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Total Obligation</span>
                      <span className="font-bold font-mono text-[#F5F3EE]">
                        ₹{item.total_obligations.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Received</span>
                      <span className="font-bold font-mono text-emerald-400">
                        ₹{item.total_received.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Pending Due</span>
                      <span className={`font-bold font-mono ${item.outstanding_amount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                        ₹{item.outstanding_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#7A8699]">
                      {item.last_payment_date ? `Last: ${formatDate(item.last_payment_date)}` : 'No payments yet'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPayingParty(item);
                          setPayAmount(item.outstanding_amount > 0 ? item.outstanding_amount.toString() : '');
                        }}
                        className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg font-semibold text-xs border border-emerald-500/30 transition"
                      >
                        + Pay
                      </button>
                      <button
                        onClick={() => setSelectedPartyDetails(item)}
                        className="px-3 py-1.5 bg-[#16233B] text-[#D6B36A] rounded-lg font-semibold text-xs border border-[#1E2B45] transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SECTION: PARTY PAYMENT DETAILS MODAL */}
      {selectedPartyDetails && activePartyInDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-[#111B2E] border border-[#D6B36A]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2B45] flex items-center justify-between bg-[#0B1220]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D6B36A]/10 text-[#D6B36A] rounded-xl border border-[#D6B36A]/20">
                  <Users size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#F5F3EE]">{activePartyInDetails.party_name}</h3>
                    {activePartyInDetails.party_type === 'distributor' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Distributor
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                        State Head
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#AAB4C5] flex items-center gap-2 mt-0.5">
                    <span>📍 {activePartyInDetails.state_name}</span>
                    {activePartyInDetails.parent_party_name && (
                      <span>• Head: <strong className="text-[#F5F3EE]">{activePartyInDetails.parent_party_name}</strong></span>
                    )}
                    {activePartyInDetails.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-emerald-400" />
                        {activePartyInDetails.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartyDetails(null)}
                className="p-1.5 text-[#7A8699] hover:text-[#F5F3EE] rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Financial Balance Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B1220] p-4 rounded-xl border border-[#1E2B45]">
                <div>
                  <span className="text-[10px] text-[#7A8699] uppercase block font-semibold">Total Obligations</span>
                  <span className="text-sm sm:text-base font-bold text-[#F5F3EE] font-mono">
                    ₹{activePartyInDetails.total_obligations.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8699] uppercase block font-semibold">Total Payments</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                    ₹{activePartyInDetails.total_received.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8699] uppercase block font-semibold">Remaining Due</span>
                  <span className={`text-sm sm:text-base font-bold font-mono ${activePartyInDetails.outstanding_amount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                    ₹{activePartyInDetails.outstanding_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8699] uppercase block font-semibold">Current Status</span>
                  <div className="mt-1">
                    {renderStatusBadge(activePartyInDetails.status, activePartyInDetails.status_label)}
                  </div>
                </div>
              </div>

              {/* Action Button inside modal */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs text-[#AAB4C5]">
                  {activePartyInDetails.outstanding_amount > 0 ? (
                    <span className="text-amber-300">
                      ⚠️ ₹{activePartyInDetails.outstanding_amount.toLocaleString('en-IN')} remains outstanding.
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      ✓ All financial obligations are fully settled.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onOpenPartyLedger && (
                    <button
                      onClick={() => {
                        const pid = activePartyInDetails.party_id;
                        setSelectedPartyDetails(null);
                        onOpenPartyLedger(pid);
                      }}
                      className="px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold border border-[#1E2B45] transition"
                    >
                      Open Full Ledger
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPayingParty(activePartyInDetails);
                      setPayAmount(activePartyInDetails.outstanding_amount > 0 ? activePartyInDetails.outstanding_amount.toString() : '');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    <DollarSign size={14} />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Section A: Stock Supply Transactions */}
              {activePartyStockTransfersList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs text-[#D6B36A] uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} />
                    <span>Stock Supply & Consignments ({activePartyStockTransfersList.length})</span>
                  </h4>
                  <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#16233B]/60 border-b border-[#1E2B45] text-[#8A95A8] uppercase tracking-wider text-[9px]">
                            <th className="py-2 px-3">Date & Ref</th>
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-3 text-right">Quantity</th>
                            <th className="py-2 px-3 text-right">Rate</th>
                            <th className="py-2 px-3 text-right">Supply Value</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2B45]">
                          {activePartyStockTransfersList.map(t => (
                            <tr key={t.id} className="hover:bg-[#16233B]/30">
                              <td className="py-2 px-3">
                                <span className="font-mono text-[#F5F3EE] block">{t.reference_no || t.id.slice(0, 8)}</span>
                                <span className="text-[10px] text-[#7A8699]">{formatDate(t.transfer_date)}</span>
                              </td>
                              <td className="py-2 px-3 font-medium text-[#F5F3EE]">
                                {t.item_name}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#D6B36A]">
                                {t.quantity} pcs
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#AAB4C5]">
                                ₹{Number(t.rate || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-amber-300">
                                ₹{Number(t.total_value || (t.quantity * (t.rate || 0))).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {t.status === 'pending' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Pending Settlement
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Section B: Invoiced Obligations */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-[#D6B36A] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>Billed Invoices ({activePartyInvoices.length})</span>
                </h4>
                {activePartyInvoices.length === 0 ? (
                  <div className="p-4 bg-[#0B1220] border border-dashed border-[#1E2B45] rounded-xl text-center text-[#7A8699]">
                    No sales invoices billed to this party.
                  </div>
                ) : (
                  <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#16233B]/60 border-b border-[#1E2B45] text-[#8A95A8] uppercase tracking-wider text-[9px]">
                            <th className="py-2 px-3">Invoice</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3 text-right">Grand Total</th>
                            <th className="py-2 px-3 text-right">Received</th>
                            <th className="py-2 px-3 text-right">Due</th>
                            <th className="py-2 px-3 text-center">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2B45]">
                          {activePartyInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-[#16233B]/30">
                              <td className="py-2 px-3 font-mono font-medium text-[#F5F3EE]">
                                {inv.invoice_number}
                              </td>
                              <td className="py-2 px-3 text-[#AAB4C5]">
                                {formatDate(inv.sale_date)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#F5F3EE]">
                                ₹{inv.grand_total.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-400">
                                ₹{inv.amount_received.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-amber-300 font-bold">
                                ₹{inv.amount_due.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inv.payment_status === 'Payment Complete' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                  {inv.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Section C: Payments History */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-[#D6B36A] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} />
                  <span>Payments Received Ledger ({activePartyPaymentsList.length})</span>
                </h4>
                {activePartyPaymentsList.length === 0 ? (
                  <div className="p-4 bg-[#0B1220] border border-dashed border-[#1E2B45] rounded-xl text-center text-[#7A8699]">
                    No payment receipts recorded for this party yet.
                  </div>
                ) : (
                  <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#16233B]/60 border-b border-[#1E2B45] text-[#8A95A8] uppercase tracking-wider text-[9px]">
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Mode</th>
                            <th className="py-2 px-3">Reference / Notes</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2B45]">
                          {activePartyPaymentsList.map(pay => (
                            <tr key={pay.id} className="hover:bg-[#16233B]/30">
                              <td className="py-2 px-3 text-[#F5F3EE]">
                                {formatDate(pay.payment_date)}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#16233B] text-[#AAB4C5] border border-[#1E2B45]">
                                  {pay.payment_method}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#AAB4C5]">
                                {pay.reference && <span className="font-mono text-[#F5F3EE] mr-1.5">{pay.reference}</span>}
                                {pay.notes || '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                ₹{pay.amount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E2B45] bg-[#0B1220] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPartyDetails(null)}
                className="px-4 py-2 bg-[#1E2B45] hover:bg-[#253655] text-[#F5F3EE] rounded-xl font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: QUICK RECORD PAYMENT MODAL */}
      {payingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-sm text-[#F5F3EE]">Record Payment Collection</h3>
                  <p className="text-[11px] text-[#AAB4C5]">From: {payingParty.party_name}</p>
                </div>
              </div>
              <button onClick={() => setPayingParty(null)} className="text-[#AAB4C5] hover:text-[#F5F3EE]">
                <X size={18} />
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1E2B45] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#7A8699] uppercase block font-semibold">Remaining Due</span>
                <span className="text-sm font-bold font-mono text-amber-300">
                  ₹{payingParty.outstanding_amount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPayAmount(payingParty.outstanding_amount.toString())}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20 transition"
              >
                Full Settle
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 15000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-sm text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Payment Mode</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Reference / UTR # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-123456 / CHQ-8899"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared payment for Goa consignment delivery"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2B45]">
                <button
                  type="button"
                  onClick={() => setPayingParty(null)}
                  className="px-4 py-2 bg-[#1E2B45] hover:bg-[#253655] text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  {isSubmittingPay ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
