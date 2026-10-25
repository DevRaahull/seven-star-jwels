import React, { useState, useMemo } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PartyRecord, StateRecord, Sale, PartyPayment, PartyFinancialStatus, PartyPaymentStatusOverview } from '../../types';

interface PartyPaymentStatusViewProps {
  onOpenPartyLedger?: (partyId: string) => void;
}

export const PartyPaymentStatusView: React.FC<PartyPaymentStatusViewProps> = ({ onOpenPartyLedger }) => {
  const {
    parties,
    states,
    sales,
    partyPayments,
    recordPartyPayment,
    refreshData
  } = useAppData();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateId, setSelectedStateId] = useState<string>('all');
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

  const activeStates = useMemo(() => states.filter(s => !s.is_archived), [states]);
  const activeParties = useMemo(() => parties.filter(p => !p.is_archived), [parties]);

  // Comprehensive Authoritative Calculation of All Parties
  const calculatedPartyRecords = useMemo(() => {
    const list: PartyPaymentStatusOverview[] = [];

    activeParties.forEach(party => {
      const state = activeStates.find(s => s.id === party.state_id);

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

      // Positive opening balance = customer owes us (initial obligation)
      const totalObligations = Math.round(((openingBalance > 0 ? openingBalance : 0) + totalSalesBilled) * 100) / 100;

      // Authoritative Net Position: (Opening + Sales + DirectPaid) - (SalesReceived + DirectReceived)
      const netPosition = Math.round((openingBalance + totalSalesBilled + totalPaidOut - totalReceived) * 100) / 100;
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

      const hasFinancialObligation = openingBalance !== 0 || partySales.length > 0;
      const hasPaymentActivity = totalReceived > 0 || totalPaidOut > 0;

      if (!hasFinancialObligation && !hasPaymentActivity) {
        status = 'no_transactions';
        statusLabel = 'No Transactions';
      } else if (netPosition > 0) {
        if (totalReceived > 0) {
          status = 'partial';
          statusLabel = 'Partially Paid';
        } else {
          status = 'due';
          statusLabel = 'Due';
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
        phone: party.phone,
        address: party.address,
        opening_balance: openingBalance,
        total_obligations: totalObligations,
        total_sales_billed: totalSalesBilled,
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
        payments_count: specificPayments.length
      });
    });

    return list;
  }, [activeParties, activeStates, sales, partyPayments, startDate, endDate, filterMonth]);

  // Filtered and Sorted Overview List
  const filteredRecords = useMemo(() => {
    let result = calculatedPartyRecords.filter(item => {
      // State Filter
      if (selectedStateId !== 'all' && item.state_id !== selectedStateId) return false;

      // Status Filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.party_name.toLowerCase().includes(q);
        const matchesState = item.state_name.toLowerCase().includes(q);
        const matchesPhone = item.phone ? item.phone.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesState && !matchesPhone) return false;
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
  }, [calculatedPartyRecords, selectedStateId, selectedStatus, searchQuery, sortBy]);

  // Summary Metrics computed from Filtered Parties
  const summaryMetrics = useMemo(() => {
    let dueCount = 0;
    let partialCount = 0;
    let completeCount = 0;
    let totalOutstanding = 0;
    let totalPaymentsReceived = 0;

    filteredRecords.forEach(r => {
      if (r.status === 'due') dueCount++;
      else if (r.status === 'partial') partialCount++;
      else if (r.status === 'complete') completeCount++;

      totalOutstanding += r.outstanding_amount;
      totalPaymentsReceived += r.total_received;
    });

    return {
      dueCount,
      partialCount,
      completeCount,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalPaymentsReceived: Math.round(totalPaymentsReceived * 100) / 100
    };
  }, [filteredRecords]);

  // Keep details modal synchronized if record changes
  const activePartyInDetails = useMemo(() => {
    if (!selectedPartyDetails) return null;
    return calculatedPartyRecords.find(p => p.party_id === selectedPartyDetails.party_id) || selectedPartyDetails;
  }, [selectedPartyDetails, calculatedPartyRecords]);

  // Quick Invoices & Payment History for selected party
  const selectedPartySales = useMemo(() => {
    if (!activePartyInDetails) return [];
    return sales.filter(s => s.party_id === activePartyInDetails.party_id && s.status === 'completed');
  }, [activePartyInDetails, sales]);

  const selectedPartyPaymentHistory = useMemo(() => {
    if (!activePartyInDetails) return [];
    return partyPayments
      .filter(p => p.party_id === activePartyInDetails.party_id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [activePartyInDetails, partyPayments]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStateId('all');
    setSelectedStatus('all');
    setFilterMonth('');
    setStartDate('');
    setEndDate('');
    setSortBy('outstanding_desc');
  };

  // Submit Payment Handler
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingParty) return;

    setErrorMessage(null);
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmittingPay(true);
    try {
      await recordPartyPayment({
        party_id: payingParty.party_id,
        payment_date: payDate,
        amount: amt,
        payment_type: 'received',
        payment_method: payMethod,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined
      });

      setSuccessMessage(`✓ Recorded payment of ₹${amt.toLocaleString('en-IN')} from ${payingParty.party_name}. Balances synchronized.`);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      setPayingParty(null);
      await refreshData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: PartyFinancialStatus, label: string) => {
    switch (status) {
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

      {/* SECTION 3: SUMMARY CARDS */}
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
              Active dues across {filteredRecords.filter(r => r.outstanding_amount > 0).length} parties
            </p>
          </div>
        </div>

        {/* Card 2: Due Payments */}
        <div className="bg-[#111B2E] border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#AAB4C5] uppercase tracking-wider">
              Due Payments
            </span>
            <span className="p-1.5 sm:p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg sm:text-2xl font-bold font-mono text-rose-400">
              {summaryMetrics.dueCount} <span className="text-xs font-normal text-[#AAB4C5]">parties</span>
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
              {summaryMetrics.partialCount} <span className="text-xs font-normal text-[#AAB4C5]">parties</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Partial payment received, remainder due
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
              {summaryMetrics.completeCount} <span className="text-xs font-normal text-[#AAB4C5]">parties</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#AAB4C5]">
              Fully settled obligations (0 balance)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: SEARCH AND FILTERS */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B45]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6B36A]">
            <SlidersHorizontal size={15} />
            <span>Party Payment Filters & Criteria</span>
          </div>
          {(searchQuery || selectedStateId !== 'all' || selectedStatus !== 'all' || filterMonth || startDate || endDate || sortBy !== 'outstanding_desc') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-[#AAB4C5] hover:text-[#D6B36A] transition self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-[#7A8699]" />
            <input
              type="text"
              placeholder="Search party, state, phone..."
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
              <option value="all">All States ({activeStates.length})</option>
              {activeStates.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
              <option value="due">🔴 Due Payments Only</option>
              <option value="partial">🟠 Partially Paid</option>
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
            <label className="block text-[10px] font-semibold text-[#8A95A8] mb-1">From Date</label>
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
            <label className="block text-[10px] font-semibold text-[#8A95A8] mb-1">To Date (Outstanding as of)</label>
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

      {/* SECTION 1: OVERVIEW TABLE & MOBILE CARDS */}
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#1E2B45] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-[#F5F3EE] flex items-center gap-2">
              <Receipt size={17} className="text-[#D6B36A]" />
              <span>Party Payment Status Directory</span>
            </h3>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              Authoritative financial obligations, received collections, and outstanding settlement statuses.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#D6B36A] px-2.5 py-1 bg-[#16233B] border border-[#1E2B45] rounded-lg">
            {filteredRecords.length} {filteredRecords.length === 1 ? 'Party' : 'Parties'}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Receipt size={32} className="mx-auto text-[#7A8699] opacity-60" />
            <p className="text-sm text-[#AAB4C5]">No parties found matching the selected payment status criteria.</p>
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
                    <th className="py-3 px-4">Party & Type</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3 text-right">Total Billed</th>
                    <th className="py-3 px-3 text-right">Payments Received</th>
                    <th className="py-3 px-3 text-right">Remaining Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
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
                      {/* Party Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-[#F5F3EE] group-hover:text-[#D6B36A] transition">
                            {item.party_name}
                          </div>
                          {item.party_type === 'distributor' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              Distributor
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                              State Head
                            </span>
                          )}
                        </div>
                        {item.phone && (
                          <div className="text-[11px] text-[#7A8699] flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-[#0B1220] text-[#AAB4C5] rounded-md border border-[#1E2B45] text-[11px]">
                          📍 {item.state_name}
                        </span>
                      </td>

                      {/* Total Billed Obligations */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#F5F3EE]">
                        ₹{item.total_obligations.toLocaleString('en-IN')}
                      </td>

                      {/* Payments Received */}
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-medium">
                        ₹{item.total_received.toLocaleString('en-IN')}
                      </td>

                      {/* Outstanding Due */}
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
                            onClick={() => setSelectedPartyDetails(item)}
                            className="px-2.5 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg text-xs font-semibold border border-[#1E2B45] transition active:scale-95"
                            title="View Payment & Invoices Breakdown"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setPayingParty(item);
                              setPayAmount(item.outstanding_amount > 0 ? item.outstanding_amount.toString() : '');
                            }}
                            className="px-2.5 py-1.5 bg-[#0B1220] hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/30 transition active:scale-95 flex items-center gap-1"
                            title="Record Payment from Party"
                          >
                            <DollarSign size={13} />
                            <span>Pay</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#1E2B45]">
              {filteredRecords.map(item => (
                <div key={item.party_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-[#F5F3EE]">{item.party_name}</h4>
                        {item.party_type === 'distributor' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Distributor
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                            State Head
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#AAB4C5] mt-0.5">📍 {item.state_name}</div>
                    </div>
                    <div>{renderStatusBadge(item.status, item.status_label)}</div>
                  </div>

                  {/* Financial Counters Row */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0B1220] p-2.5 rounded-xl border border-[#1E2B45] text-center">
                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Total Billed</span>
                      <span className="text-xs font-bold text-[#F5F3EE] font-mono">
                        ₹{item.total_obligations.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Received</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        ₹{item.total_received.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A8699] uppercase block">Outstanding</span>
                      <span className={`text-xs font-bold font-mono ${item.outstanding_amount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                        ₹{item.outstanding_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="text-[11px] text-[#7A8699]">
                      {item.last_payment_date ? (
                        <span>Last Paid: {formatDate(item.last_payment_date)}</span>
                      ) : (
                        <span>No payments logged</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPartyDetails(item)}
                        className="px-3 py-1 bg-[#16233B] hover:bg-[#1E2E4A] text-[#D6B36A] rounded-lg text-xs font-semibold border border-[#1E2B45]"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          setPayingParty(item);
                          setPayAmount(item.outstanding_amount > 0 ? item.outstanding_amount.toString() : '');
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <DollarSign size={13} />
                        <span>Pay</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SECTION 5: PARTY PAYMENT DETAILS MODAL */}
      {activePartyInDetails && (
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

              {/* Section A: Invoiced Obligations */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-[#D6B36A] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>Invoices & Obligations ({selectedPartySales.length + (activePartyInDetails.opening_balance !== 0 ? 1 : 0)})</span>
                </h4>

                {selectedPartySales.length === 0 && activePartyInDetails.opening_balance === 0 ? (
                  <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E2B45] text-center text-[#7A8699]">
                    No invoices or obligations recorded for this party.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Opening Balance Row if applicable */}
                    {activePartyInDetails.opening_balance !== 0 && (
                      <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-[#F5F3EE]">Opening Balance</div>
                          <span className="text-[11px] text-[#7A8699]">Initial Ledger Setup Balance</span>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-[#F5F3EE]">
                            ₹{Math.abs(activePartyInDetails.opening_balance).toLocaleString('en-IN')}
                          </div>
                          <span className="text-[10px] text-amber-300">
                            {activePartyInDetails.opening_balance > 0 ? 'Receivable' : 'Payable'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sales Invoices List */}
                    {selectedPartySales.map(sale => (
                      <div
                        key={sale.id}
                        className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#D6B36A]/30 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#F5F3EE] font-mono">
                              #{sale.invoice_number || 'INV'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sale.amount_due <= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : sale.amount_received > 0
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {sale.amount_due <= 0 ? 'Paid' : sale.amount_received > 0 ? 'Partially Paid' : 'Due Balance'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7A8699] flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(sale.sale_date)}
                            </span>
                            {sale.items && (
                              <span>• {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 text-right font-mono">
                          <div>
                            <span className="text-[10px] text-[#7A8699] block">Total Amount</span>
                            <span className="font-bold text-[#F5F3EE]">₹{sale.grand_total.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7A8699] block">Received</span>
                            <span className="font-bold text-emerald-400">₹{(sale.amount_received || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7A8699] block">Balance Due</span>
                            <span className={`font-bold ${sale.amount_due > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                              ₹{(sale.amount_due || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section B: Payments Received History */}
              <div className="space-y-3 pt-2 border-t border-[#1E2B45]">
                <h4 className="font-semibold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} />
                  <span>Direct Payments Received ({selectedPartyPaymentHistory.length})</span>
                </h4>

                {selectedPartyPaymentHistory.length === 0 ? (
                  <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E2B45] text-center text-[#7A8699]">
                    No direct payment transactions logged for this party yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPartyPaymentHistory.map(pay => (
                      <div
                        key={pay.id}
                        className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400 text-sm font-mono">
                              +₹{pay.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="px-2 py-0.5 bg-[#16233B] text-[#AAB4C5] rounded text-[10px]">
                              {pay.payment_method}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7A8699]">
                            {formatDate(pay.payment_date)} {pay.reference ? `• Ref: ${pay.reference}` : ''}
                          </div>
                          {pay.notes && (
                            <div className="text-[11px] text-[#AAB4C5] italic">"{pay.notes}"</div>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium">
                          Receipt Verified
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E2B45] flex justify-end bg-[#0B1220]">
              <button
                onClick={() => setSelectedPartyDetails(null)}
                className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RECORD PAYMENT MODAL */}
      {payingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#D6B36A]/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45]">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign size={20} />
                <h3 className="font-semibold text-sm text-[#F5F3EE]">
                  Record Payment from {payingParty.party_name}
                </h3>
              </div>
              <button
                onClick={() => setPayingParty(null)}
                className="text-[#7A8699] hover:text-[#F5F3EE]"
              >
                <X size={18} />
              </button>
            </div>

            {payingParty.outstanding_amount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                <span>Remaining Outstanding:</span>
                <span className="font-bold font-mono">₹{payingParty.outstanding_amount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-sm text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Reference / Cheque No / UTR</label>
                <input
                  type="text"
                  placeholder="Optional reference number"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D6B36A] mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional payment notes..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingParty(null)}
                  className="px-3 py-1.5 bg-[#16233B] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
                >
                  <DollarSign size={14} />
                  <span>{isSubmittingPay ? 'Recording...' : 'Confirm Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
