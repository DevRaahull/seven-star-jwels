import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building,
  DollarSign,
  FileText,
  Printer,
  ChevronRight,
  Search,
  Filter,
  Edit3,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Sale, PaymentStatus } from '../../types';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

interface SaleLineDraft {
  tempId: string;
  itemId: string;
  itemName: string;
  availableStock: number;
  quantity: number | '';
  unitCost: number; // Historical purchase cost (read-only for COGS)
  unitSaleRate: number | ''; // Negotiated wholesale rate
  gstRate: number; // default 3%
}

export const SalesEntryView: React.FC = () => {
  const { items, sales, states, parties, settings, createSale, updateSale, deleteSale } = useAppData();

  const activeItems = useMemo(() => {
    return items.filter(i => !i.is_archived);
  }, [items]);

  const activeStates = useMemo(() => {
    return states.filter(s => !s.is_archived);
  }, [states]);

  const activeParties = useMemo(() => {
    return parties.filter(p => !p.is_archived);
  }, [parties]);

  const defaultGst = settings.default_gst_rate || 3;

  // Form State
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `${settings.invoice_prefix || 'SSJ-'}${settings.next_invoice_number || Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deductFromPartyStock, setDeductFromPartyStock] = useState<boolean>(false);
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer / RTGS');
  const [notes, setNotes] = useState<string>('');

  // Line items
  const [lines, setLines] = useState<SaleLineDraft[]>([
    {
      tempId: 'line-1',
      itemId: '',
      itemName: '',
      availableStock: 0,
      quantity: 1,
      unitCost: 0,
      unitSaleRate: '',
      gstRate: defaultGst
    }
  ]);

  type PaymentOption = 'Advance Paid' | 'Due Balance' | 'Payment Complete';
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('Due Balance');
  const [paymentAmountInput, setPaymentAmountInput] = useState<number | ''>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successSale, setSuccessSale] = useState<Sale | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Edit Mode State
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  // Previous Sales History State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [salesStartDate, setSalesStartDate] = useState<string>('');
  const [salesEndDate, setSalesEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(15);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);

  // Line selection change
  const handleItemSelect = (index: number, selectedItemId: string) => {
    const updated = [...lines];
    const found = activeItems.find(i => i.id === selectedItemId);
    if (!found) {
      updated[index] = {
        ...updated[index],
        itemId: '',
        itemName: '',
        availableStock: 0,
        unitCost: 0,
        unitSaleRate: ''
      };
    } else {
      updated[index] = {
        ...updated[index],
        itemId: found.id,
        itemName: found.name,
        availableStock: found.current_stock,
        unitCost: found.purchase_rate,
        unitSaleRate: found.default_sale_rate,
        quantity: Math.min(
          typeof updated[index].quantity === 'number' && updated[index].quantity > 0
            ? (updated[index].quantity as number)
            : 1,
          found.current_stock > 0 ? found.current_stock : 1
        )
      };
    }
    setLines(updated);
  };

  const handleUpdateLine = (index: number, field: keyof SaleLineDraft, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        tempId: `line-${Date.now()}-${lines.length + 1}`,
        itemId: '',
        itemName: '',
        availableStock: 0,
        quantity: 1,
        unitCost: 0,
        unitSaleRate: '',
        gstRate: defaultGst
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Line calculations
  const calculatedLines = useMemo(() => {
    return lines.map(line => {
      const qty = typeof line.quantity === 'number' ? line.quantity : 0;
      const rate = typeof line.unitSaleRate === 'number' ? line.unitSaleRate : 0;
      const cost = line.unitCost || 0;

      const taxable = Math.round(qty * rate * 100) / 100;
      const totalCost = Math.round(qty * cost * 100) / 100;

      // Tax split
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      const gstRate = line.gstRate || 0;

      if (isInterstate) {
        igst = Math.round((taxable * (gstRate / 100)) * 100) / 100;
      } else {
        cgst = Math.round((taxable * ((gstRate / 2) / 100)) * 100) / 100;
        sgst = Math.round((taxable * ((gstRate / 2) / 100)) * 100) / 100;
      }

      const gstTotal = Math.round((cgst + sgst + igst) * 100) / 100;
      const lineTotal = Math.round((taxable + gstTotal) * 100) / 100;
      const lineProfit = Math.round((taxable - totalCost) * 100) / 100;

      const isStockExceeded = qty > line.availableStock;

      return {
        ...line,
        taxable,
        cgst,
        sgst,
        igst,
        gstTotal,
        lineTotal,
        totalCost,
        lineProfit,
        isStockExceeded
      };
    });
  }, [lines, isInterstate]);

  const totalTaxable = useMemo(() => {
    return calculatedLines.reduce((acc, l) => acc + l.taxable, 0);
  }, [calculatedLines]);

  const totalCgst = useMemo(() => {
    return calculatedLines.reduce((acc, l) => acc + l.cgst, 0);
  }, [calculatedLines]);

  const totalSgst = useMemo(() => {
    return calculatedLines.reduce((acc, l) => acc + l.sgst, 0);
  }, [calculatedLines]);

  const totalIgst = useMemo(() => {
    return calculatedLines.reduce((acc, l) => acc + l.igst, 0);
  }, [calculatedLines]);

  const totalGst = useMemo(() => {
    return Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
  }, [totalCgst, totalSgst, totalIgst]);

  const grandTotal = useMemo(() => {
    return Math.round((totalTaxable + totalGst) * 100) / 100;
  }, [totalTaxable, totalGst]);

  const totalCostOfGoods = useMemo(() => {
    return calculatedLines.reduce((acc, l) => acc + l.totalCost, 0);
  }, [calculatedLines]);

  const grossProfit = useMemo(() => {
    return Math.round((totalTaxable - totalCostOfGoods) * 100) / 100;
  }, [totalTaxable, totalCostOfGoods]);

  // Received amount calculation based on paymentOption
  const receivedValue = useMemo(() => {
    if (paymentOption === 'Payment Complete') {
      return grandTotal;
    }
    return typeof paymentAmountInput === 'number' ? paymentAmountInput : 0;
  }, [paymentOption, paymentAmountInput, grandTotal]);

  const balanceDue = Math.max(0, Math.round((grandTotal - receivedValue) * 100) / 100);

  const effectivePaymentStatus: PaymentStatus = useMemo(() => {
    if (balanceDue === 0 && grandTotal > 0) return 'Payment Complete';
    if (paymentOption === 'Advance Paid' && receivedValue > 0) return 'Advance Paid';
    return 'Due Balance';
  }, [balanceDue, grandTotal, paymentOption, receivedValue]);

  const handleSelectPaymentOption = (opt: PaymentOption) => {
    setPaymentOption(opt);
    setErrorMessage(null);
    if (opt === 'Payment Complete') {
      setPaymentAmountInput(grandTotal);
    } else if (opt === 'Due Balance') {
      if (typeof paymentAmountInput === 'number' && paymentAmountInput >= grandTotal) {
        setPaymentAmountInput(0);
      }
    } else if (opt === 'Advance Paid') {
      if (typeof paymentAmountInput === 'number' && (paymentAmountInput >= grandTotal || paymentAmountInput === 0)) {
        setPaymentAmountInput(Math.round(grandTotal * 0.5));
      }
    }
  };

  const handleAmountInputChange = (val: string) => {
    setErrorMessage(null);
    if (val === '') {
      setPaymentAmountInput('');
      return;
    }
    const num = parseFloat(val);
    setPaymentAmountInput(isNaN(num) ? '' : num);

    // Auto-switch to Payment Complete if full amount entered
    if (!isNaN(num) && num >= grandTotal && grandTotal > 0) {
      setPaymentOption('Payment Complete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerName.trim()) {
      setErrorMessage('Please enter Buyer / Customer Name.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setErrorMessage('Please enter Invoice Number.');
      return;
    }

    const validLines = lines.filter(l => l.itemId !== '');
    if (validLines.length === 0) {
      setErrorMessage('Please select at least one jewellery item.');
      return;
    }

    // Check duplicate items
    const itemIds = validLines.map(l => l.itemId);
    if (new Set(itemIds).size !== itemIds.length) {
      setErrorMessage('Duplicate item selected. Please merge rows for the same jewellery design.');
      return;
    }

    // Validate quantities & stock
    for (let i = 0; i < calculatedLines.length; i++) {
      const cl = calculatedLines[i];
      if (!cl.itemId) continue;
      const qty = typeof cl.quantity === 'number' ? cl.quantity : 0;
      if (qty <= 0) {
        setErrorMessage(`Row #${i + 1} (${cl.itemName}): Quantity must be greater than zero.`);
        return;
      }
      if (qty > cl.availableStock) {
        setErrorMessage(
          `Insufficient stock for "${cl.itemName}". Available: ${cl.availableStock}, requested: ${qty}.`
        );
        return;
      }
      const rate = typeof cl.unitSaleRate === 'number' ? cl.unitSaleRate : 0;
      if (rate <= 0) {
        setErrorMessage(`Row #${i + 1} (${cl.itemName}): Sale rate must be greater than zero.`);
        return;
      }
    }

    // Validate payment amounts
    const rawReceived = paymentOption === 'Payment Complete'
      ? grandTotal
      : (typeof paymentAmountInput === 'number' ? paymentAmountInput : 0);

    if (rawReceived < 0) {
      setErrorMessage('Payment received cannot be negative.');
      return;
    }

    if (rawReceived > grandTotal) {
      setErrorMessage(`Payment received (${formatCurrency(rawReceived)}) cannot exceed invoice total (${formatCurrency(grandTotal)}).`);
      return;
    }

    if (paymentOption === 'Payment Complete' && rawReceived < grandTotal) {
      setErrorMessage(`Cannot save as "Payment Complete" while an outstanding balance of ${formatCurrency(grandTotal - rawReceived)} remains.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSaleId) {
        const updatePayload = {
          sale_date: new Date(saleDate).toISOString(),
          customer_name: buyerName.trim(),
          party_id: selectedPartyId || undefined,
          state_id: selectedStateId || undefined,
          deduct_from_party_stock: deductFromPartyStock,
          customer_phone: customerPhone.trim() || undefined,
          is_interstate: isInterstate,
          payment_method: paymentMethod,
          payment_option: paymentOption,
          amount_received: rawReceived,
          notes: notes.trim() || undefined,
          items: calculatedLines
            .filter(l => l.itemId)
            .map(l => ({
              item_id: l.itemId,
              item_name: l.itemName,
              quantity: Number(l.quantity),
              unit_sale_rate: Number(l.unitSaleRate),
              gst_rate: l.gstRate
            }))
        };

        const updated = await updateSale(editingSaleId, updatePayload);
        setSuccessSale(updated);
        setSuccessMessage(`Wholesale Bill #${invoiceNumber} updated successfully! Stock and dues recalculated.`);
        handleCancelEdit();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const salePayload = {
          invoice_number: invoiceNumber.trim(),
          sale_date: new Date(saleDate).toISOString(),
          customer_name: buyerName.trim(),
          party_id: selectedPartyId || undefined,
          state_id: selectedStateId || undefined,
          deduct_from_party_stock: deductFromPartyStock,
          customer_phone: customerPhone.trim() || undefined,
          is_interstate: isInterstate,
          payment_method: paymentMethod,
          payment_status: effectivePaymentStatus,
          total_taxable: totalTaxable,
          total_cgst: totalCgst,
          total_sgst: totalSgst,
          total_igst: totalIgst,
          total_gst: totalGst,
          grand_total: grandTotal,
          total_cost: totalCostOfGoods,
          gross_profit: grossProfit,
          amount_received: rawReceived,
          amount_due: balanceDue,
          notes: notes.trim() || undefined,
          status: 'completed'
        };

        const itemsPayload = calculatedLines
          .filter(l => l.itemId)
          .map(l => ({
            item_id: l.itemId,
            item_name: l.itemName,
            quantity: Number(l.quantity),
            unit_cost: l.unitCost,
            unit_sale_rate: Number(l.unitSaleRate),
            gst_rate: l.gstRate,
            taxable_amount: l.taxable,
            cgst_amount: l.cgst,
            sgst_amount: l.sgst,
            igst_amount: l.igst,
            gst_amount: l.gstTotal,
            line_total: l.lineTotal,
            line_cost: l.totalCost,
            line_profit: l.lineProfit
          }));

        const created = await createSale(salePayload, itemsPayload);
        setSuccessSale(created);
        setShowPrintModal(true);
        handleCancelEdit();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to record wholesale sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSaleId(null);
    setSaleDate(new Date().toISOString().split('T')[0]);
    setInvoiceNumber(
      `${settings.invoice_prefix || 'SSJ-'}${settings.next_invoice_number || Math.floor(1000 + Math.random() * 9000)}`
    );
    setSelectedPartyId('');
    setSelectedStateId('');
    setBuyerName('');
    setCustomerPhone('');
    setDeductFromPartyStock(false);
    setIsInterstate(false);
    setPaymentMethod('Bank Transfer / RTGS');
    setNotes('');
    setPaymentOption('Due Balance');
    setPaymentAmountInput('');
    setLines([
      {
        tempId: `line-${Date.now()}`,
        itemId: '',
        itemName: '',
        availableStock: 0,
        quantity: 1,
        unitCost: 0,
        unitSaleRate: '',
        gstRate: defaultGst
      }
    ]);
  };

  const handleStartEdit = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setSaleDate(sale.sale_date ? sale.sale_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setInvoiceNumber(sale.invoice_number);
    setSelectedPartyId(sale.party_id || '');
    setSelectedStateId(sale.state_id || '');
    setBuyerName(sale.customer_name || '');
    setCustomerPhone(sale.customer_phone || '');
    setDeductFromPartyStock(Boolean(sale.deduct_from_party_stock));
    setIsInterstate(Boolean(sale.is_interstate));
    setPaymentMethod(sale.payment_method || 'Bank Transfer / RTGS');
    setNotes(sale.notes || '');

    if (sale.payment_status === 'Payment Complete') {
      setPaymentOption('Payment Complete');
      setPaymentAmountInput(sale.grand_total);
    } else if (sale.amount_received && sale.amount_received > 0) {
      setPaymentOption('Advance Paid');
      setPaymentAmountInput(sale.amount_received);
    } else {
      setPaymentOption('Due Balance');
      setPaymentAmountInput(0);
    }

    if (sale.items && sale.items.length > 0) {
      const editLines: SaleLineDraft[] = sale.items.map((it, idx) => {
        const found = items.find(i => i.id === it.item_id || i.name.toLowerCase() === it.item_name.toLowerCase());
        const currentStock = found?.current_stock || 0;
        const priorQty = it.quantity || 0;
        return {
          tempId: `edit-line-${idx}-${Date.now()}`,
          itemId: it.item_id || (found ? found.id : ''),
          itemName: it.item_name,
          availableStock: currentStock + priorQty,
          quantity: it.quantity,
          unitCost: it.unit_cost || (found ? found.purchase_rate : 0),
          unitSaleRate: it.unit_sale_rate,
          gstRate: it.gst_rate !== undefined ? it.gst_rate : defaultGst
        };
      });
      setLines(editLines);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteSale(saleToDelete.id);
      setSuccessMessage(`Wholesale Bill #${saleToDelete.invoice_number} deleted and stock restored.`);
      setSaleToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete sales bill');
    } finally {
      setIsDeleting(false);
    }
  };

  // Month-Year List for history filter
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => {
      if (s.sale_date) {
        set.add(s.sale_date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [sales]);

  const formatMonthLabel = (yyyyMm: string) => {
    if (!yyyyMm || !yyyyMm.includes('-')) return yyyyMm;
    const [year, month] = yyyyMm.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Filtered sales across all months & years
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // 1. Text Search: invoice #, buyer name, or item name
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchInv = s.invoice_number?.toLowerCase().includes(q);
        const matchBuyer = s.customer_name?.toLowerCase().includes(q);
        const matchItem = s.items?.some(it => it.item_name.toLowerCase().includes(q));
        if (!matchInv && !matchBuyer && !matchItem) return false;
      }

      // 2. Month Filter
      if (monthFilter !== 'all') {
        if (!s.sale_date || !s.sale_date.startsWith(monthFilter)) return false;
      }

      // 3. Custom Date Range
      if (salesStartDate && salesEndDate) {
        const sDate = s.sale_date ? s.sale_date.substring(0, 10) : '';
        if (sDate < salesStartDate || sDate > salesEndDate) return false;
      } else if (salesStartDate) {
        const sDate = s.sale_date ? s.sale_date.substring(0, 10) : '';
        if (sDate < salesStartDate) return false;
      } else if (salesEndDate) {
        const sDate = s.sale_date ? s.sale_date.substring(0, 10) : '';
        if (sDate > salesEndDate) return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'all') {
        if (s.payment_status !== statusFilter) return false;
      }

      return true;
    });
  }, [sales, searchTerm, monthFilter, salesStartDate, salesEndDate, statusFilter]);

  // Aggregate stats for filtered history
  const salesStats = useMemo(() => {
    let totalGrand = 0;
    let totalReceived = 0;
    let totalDue = 0;
    filteredSales.forEach(s => {
      if (s.status !== 'voided') {
        totalGrand += s.grand_total || 0;
        totalReceived += s.amount_received || 0;
        totalDue += s.amount_due || 0;
      }
    });
    return {
      count: filteredSales.length,
      totalGrand: Math.round(totalGrand * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100
    };
  }, [filteredSales]);

  // Visible page items
  const visibleSales = useMemo(() => {
    return filteredSales.slice(0, displayLimit);
  }, [filteredSales, displayLimit]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2B45]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-gold-gradient tracking-wide">
            Wholesale Sales & Bill Entry
          </h2>
          <p className="text-xs text-[#AAB4C5] mt-0.5">
            Bulk jewellery sales billing with buyer GSTIN, auto GST calculation, and print-ready tax invoice.
          </p>
        </div>

        {successSale && (
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow-md transition"
          >
            <Printer size={15} />
            <span>Reprint Bill ({successSale.invoice_number})</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Editing Mode Banner */}
      {editingSaleId && (
        <div className="p-4 bg-amber-500/15 border-2 border-amber-500/40 rounded-xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg shrink-0">
              <Edit3 size={18} />
            </div>
            <div>
              <span className="font-bold text-sm text-[#F5F3EE] block">
                Editing Wholesale Bill: #{invoiceNumber} ({buyerName || 'Buyer'})
              </span>
              <span className="text-[#AAB4C5] text-[11px]">
                Modifying this bill will adjust inventory stock levels and recalculate customer dues.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-4 py-2 bg-[#1E2B45] hover:bg-[#253655] text-[#F5F3EE] rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <RotateCcw size={14} />
            <span>Cancel Edit</span>
          </button>
        </div>
      )}

      {/* Main Billing Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Buyer & Bill Header */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider flex items-center gap-2">
            <Building size={16} />
            <span>Wholesale Buyer & Invoice Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Sale Date *
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Tax Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>

            {/* Select Registered Party or One-off */}
            <div>
              <label className="block text-xs font-medium text-[#D6B36A] mb-1">
                Select Registered Party (Optional)
              </label>
              <select
                value={selectedPartyId}
                onChange={e => {
                  const partyId = e.target.value;
                  setSelectedPartyId(partyId);
                  if (partyId) {
                    const party = activeParties.find(p => p.id === partyId);
                    if (party) {
                      setBuyerName(party.name);
                      setCustomerPhone(party.phone || '');
                      setSelectedStateId(party.state_id);
                    }
                  } else {
                    setSelectedStateId('');
                    setDeductFromPartyStock(false);
                  }
                }}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              >
                <option value="">-- One-Off Customer / Counter Sale --</option>
                {activeStates.map(state => {
                  const stateParties = activeParties.filter(p => p.state_id === state.id);
                  if (stateParties.length === 0) return null;
                  return (
                    <optgroup key={state.id} label={`📍 ${state.name}`}>
                      {stateParties.map(party => (
                        <option key={party.id} value={party.id}>
                          {party.name} {party.phone ? `(${party.phone})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Customer / Party Name */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Customer / Party Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Jewellers / Counter Wholesale"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>

            {/* Customer Phone (Optional) */}
            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              >
                <option value="Bank Transfer / RTGS">Bank Transfer / RTGS / NEFT</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit / Account</option>
              </select>
            </div>

            {/* Party Consignment Deduction Toggle (If Registered Party is Selected) */}
            {selectedPartyId && (
              <div className="sm:col-span-2 flex items-center gap-2 bg-[#0B1220] p-2.5 rounded-lg border border-[#D6B36A]/30">
                <input
                  type="checkbox"
                  id="deductPartyStock"
                  checked={deductFromPartyStock}
                  onChange={e => setDeductFromPartyStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#111B2E] border-[#1E2B45] text-[#D6B36A] focus:ring-0"
                />
                <label htmlFor="deductPartyStock" className="text-xs text-[#D6B36A] cursor-pointer">
                  <strong>Consignment Settlement:</strong> Deduct quantity from party&apos;s held stock (instead of main warehouse)
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#AAB4C5] select-none">
              <input
                type="checkbox"
                checked={isInterstate}
                onChange={e => setIsInterstate(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0B1220] border-[#1E2B45] text-[#D6B36A] focus:ring-0"
              />
              <span>Inter-state Sale (IGST)</span>
            </label>
            <span className="text-[11px] text-[#7A8699]">
              {isInterstate ? '(Calculates 3% IGST on wholesale value)' : '(Calculates 1.5% CGST + 1.5% SGST on intra-state wholesale value)'}
            </span>
          </div>
        </div>

        {/* Card 2: Line Items */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              <span>Jewellery Items (Stock Outward)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16233B] hover:bg-[#1E2E4A] border border-[#1E2B45] text-[#D6B36A] rounded-lg text-xs font-semibold transition"
            >
              <Plus size={14} />
              <span>Add Item Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2B45] text-[#AAB4C5]">
                  <th className="pb-2.5 font-medium min-w-[220px]">Select Jewellery Item</th>
                  <th className="pb-2.5 font-medium w-24 text-right">Available</th>
                  <th className="pb-2.5 font-medium w-28 text-right">Quantity</th>
                  <th className="pb-2.5 font-medium w-32 text-right">Sale Rate (₹)</th>
                  <th className="pb-2.5 font-medium w-24 text-right">GST %</th>
                  <th className="pb-2.5 font-medium w-28 text-right">Taxable (₹)</th>
                  <th className="pb-2.5 font-medium w-28 text-right">GST (₹)</th>
                  <th className="pb-2.5 font-medium w-32 text-right">Total (₹)</th>
                  <th className="pb-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2B45]/50">
                {lines.map((line, idx) => {
                  const calc = calculatedLines[idx];
                  return (
                    <tr key={line.tempId} className="group">
                      <td className="py-2.5 pr-3">
                        <select
                          required
                          value={line.itemId}
                          onChange={e => handleItemSelect(idx, e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-md px-2 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                        >
                          <option value="">-- Choose Item from Inventory --</option>
                          {activeItems.map(i => (
                            <option
                              key={i.id}
                              value={i.id}
                              disabled={i.current_stock <= 0}
                            >
                              {i.name} (Stock: {i.current_stock} | Rate: ₹{i.default_sale_rate})
                              {i.current_stock <= 0 ? ' [OUT OF STOCK]' : ''}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono text-[#AAB4C5]">
                        <span
                          className={`font-semibold ${
                            line.availableStock <= 0
                              ? 'text-rose-400'
                              : line.availableStock <= 5
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {line.availableStock}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          min="1"
                          max={line.availableStock > 0 ? line.availableStock : undefined}
                          step="1"
                          required
                          value={line.quantity}
                          onChange={e =>
                            handleUpdateLine(
                              idx,
                              'quantity',
                              e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0)
                            )
                          }
                          className={`w-full bg-[#0B1220] border rounded-md px-2 py-1.5 text-xs text-right font-mono focus:outline-none ${
                            calc.isStockExceeded
                              ? 'border-rose-500 text-rose-300'
                              : 'border-[#1E2B45] text-[#F5F3EE] focus:border-[#D6B36A]'
                          }`}
                        />
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={line.unitSaleRate}
                          onChange={e =>
                            handleUpdateLine(
                              idx,
                              'unitSaleRate',
                              e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-md px-2 py-1.5 text-xs text-right text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <select
                          value={line.gstRate}
                          onChange={e => handleUpdateLine(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-md px-2 py-1.5 text-xs text-right text-[#F5F3EE] font-mono focus:outline-none focus:border-[#D6B36A]"
                        >
                          <option value={3}>3%</option>
                          <option value={0}>0%</option>
                          <option value={1.5}>1.5%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono text-[#AAB4C5]">
                        {formatCurrency(calc.taxable)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono text-amber-400">
                        {formatCurrency(calc.gstTotal)}
                      </td>

                      <td className="py-2.5 pl-2 text-right font-mono font-semibold text-[#F5F3EE]">
                        {formatCurrency(calc.lineTotal)}
                      </td>

                      <td className="py-2.5 pl-2 text-center">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-[#7A8699] hover:text-rose-400 p-1 transition"
                            title="Delete Row"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Summary, Tax Breakdown & Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment & Remarks with 3-Option Toggle */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} />
              <span>Payment Terms & Status</span>
            </h3>

            {/* Prominent 3-Option Segmented Toggle */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#AAB4C5]">
                Select Payment Mode / Terms
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B1220] border border-[#1E2B45] rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSelectPaymentOption('Advance Paid')}
                  className={`py-2 px-1 sm:px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                    paymentOption === 'Advance Paid'
                      ? 'bg-[#1E2E4A] text-blue-400 border border-blue-500/40 shadow-sm'
                      : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
                  }`}
                >
                  Advance Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPaymentOption('Due Balance')}
                  className={`py-2 px-1 sm:px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                    paymentOption === 'Due Balance'
                      ? 'bg-[#1E2E4A] text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
                  }`}
                >
                  Due Balance
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPaymentOption('Payment Complete')}
                  className={`py-2 px-1 sm:px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                    paymentOption === 'Payment Complete'
                      ? 'bg-[#1E2E4A] text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-[#AAB4C5] hover:text-[#F5F3EE]'
                  }`}
                >
                  Payment Complete
                </button>
              </div>
            </div>

            {/* Dynamic Content based on selected toggle */}
            {paymentOption === 'Advance Paid' && (
              <div className="space-y-3 bg-[#0B1220]/60 border border-blue-500/20 rounded-xl p-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                      <span>Advance Amount Received (₹)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-[#AAB4C5] font-mono">
                      Total: {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D6B36A] font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={grandTotal}
                      step="any"
                      placeholder="0.00"
                      value={paymentAmountInput}
                      onChange={e => handleAmountInputChange(e.target.value)}
                      className={`w-full bg-[#0B1220] border rounded-lg pl-7 pr-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none transition ${
                        typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-[#1E2B45] focus:border-[#D6B36A]'
                      }`}
                      required
                    />
                  </div>
                  {typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      Advance amount cannot exceed total bill ({formatCurrency(grandTotal)}).
                    </p>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleAmountInputChange((Math.round(grandTotal * 0.25)).toString())}
                      className="text-[10px] text-[#AAB4C5] hover:text-[#D6B36A]"
                    >
                      25%
                    </button>
                    <span className="text-[10px] text-[#7A8699]">•</span>
                    <button
                      type="button"
                      onClick={() => handleAmountInputChange((Math.round(grandTotal * 0.5)).toString())}
                      className="text-[10px] text-[#AAB4C5] hover:text-[#D6B36A]"
                    >
                      50%
                    </button>
                    <span className="text-[10px] text-[#7A8699]">•</span>
                    <button
                      type="button"
                      onClick={() => handleAmountInputChange(grandTotal.toString())}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Full (₹{grandTotal})
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#1E2B45] flex items-center justify-between text-xs">
                  <span className="text-[#AAB4C5]">Due Balance:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
                <p className="text-[10px] text-[#7A8699]">
                  Due Balance = Total Amount ({formatCurrency(grandTotal)}) - Advance ({formatCurrency(receivedValue)})
                </p>
              </div>
            )}

            {paymentOption === 'Due Balance' && (
              <div className="space-y-3 bg-[#0B1220]/60 border border-amber-500/20 rounded-xl p-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-amber-400">
                      Payment Received Now (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAmountInputChange('0')}
                      className="text-[10px] text-[#7A8699] hover:text-[#D6B36A]"
                    >
                      ₹0 (Full Credit)
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D6B36A] font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={grandTotal}
                      step="any"
                      placeholder="0.00 (defaults to ₹0)"
                      value={paymentAmountInput}
                      onChange={e => handleAmountInputChange(e.target.value)}
                      className={`w-full bg-[#0B1220] border rounded-lg pl-7 pr-3 py-2 text-xs text-[#F5F3EE] font-mono focus:outline-none transition ${
                        typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-[#1E2B45] focus:border-[#D6B36A]'
                      }`}
                    />
                  </div>
                  {typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      Payment received cannot exceed total bill ({formatCurrency(grandTotal)}).
                    </p>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#1E2B45] flex items-center justify-between text-xs">
                  <span className="text-[#AAB4C5]">Outstanding Due Balance:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            )}

            {paymentOption === 'Payment Complete' && (
              <div className="space-y-3 bg-[#0B1220]/60 border border-emerald-500/20 rounded-xl p-3.5">
                {balanceDue > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>Remaining Balance of {formatCurrency(balanceDue)}!</span>
                    </div>
                    <p className="text-[11px] text-[#AAB4C5] leading-relaxed">
                      Cannot save as &ldquo;Payment Complete&rdquo; while an outstanding balance remains. Pay remaining balance now to settle.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={`Enter ₹${balanceDue} to complete`}
                        value={paymentAmountInput}
                        onChange={e => handleAmountInputChange(e.target.value)}
                        className="flex-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-1.5 text-xs text-[#F5F3EE] font-mono focus:border-[#D6B36A] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmountInput(grandTotal);
                          setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] font-bold text-xs rounded-lg transition shrink-0"
                      >
                        Pay Full Balance
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 size={16} />
                      <span>Payment Complete — Bill Fully Settled</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                      <div className="bg-[#111B2E] p-2 rounded-lg border border-[#1E2B45]">
                        <span className="text-[10px] text-[#AAB4C5] block font-sans">Total Bill</span>
                        <span className="text-[#F5F3EE] font-bold">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="bg-[#111B2E] p-2 rounded-lg border border-[#1E2B45]">
                        <span className="text-[10px] text-[#AAB4C5] block font-sans">Received</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="bg-[#111B2E] p-2 rounded-lg border border-[#1E2B45]">
                        <span className="text-[10px] text-[#AAB4C5] block font-sans">Due</span>
                        <span className="text-emerald-400 font-bold">₹0.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Mode Selector & Status Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer / RTGS">Bank Transfer / RTGS</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                  Active Payment Status
                </label>
                <div className="p-2 rounded-lg border bg-[#0B1220] flex items-center justify-between text-xs h-[35px]">
                  <span className="text-[#AAB4C5]">Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      effectivePaymentStatus === 'Payment Complete'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : effectivePaymentStatus === 'Advance Paid'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {effectivePaymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAB4C5] mb-1">
                Invoice Notes / Payment Terms (Printed on bill)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Advance paid ₹3,000 via UPI, balance due upon delivery."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg p-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A] transition"
              />
            </div>
          </div>

          {/* Calculations Bill Summary */}
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#D6B36A] uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={16} />
                <span>Invoice Totals & GST Summary</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-[#AAB4C5]">
                  <span>Total Taxable Wholesale Value:</span>
                  <span className="font-mono text-[#F5F3EE]">{formatCurrency(totalTaxable)}</span>
                </div>

                {isInterstate ? (
                  <div className="flex justify-between text-[#AAB4C5]">
                    <span>Total IGST (3%):</span>
                    <span className="font-mono text-amber-400">{formatCurrency(totalIgst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[#AAB4C5]">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono text-amber-400">{formatCurrency(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-[#AAB4C5]">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono text-amber-400">{formatCurrency(totalSgst)}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-[#1E2B45] flex justify-between text-sm font-bold">
                  <span className="text-[#D6B36A]">Invoice Grand Total:</span>
                  <span className="font-mono text-[#D6B36A] text-base">{formatCurrency(grandTotal)}</span>
                </div>

                <div className="pt-2 border-t border-[#1E2B45]/50 flex justify-between text-xs text-[#AAB4C5]">
                  <span>Amount Received:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(receivedValue)}</span>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-400">Balance Due / Receivable:</span>
                  <span className="font-mono text-rose-400">{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Submit Button */}
            <div className="hidden lg:flex pt-6 items-center justify-end gap-3">
              {editingSaleId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-2.5 bg-[#1E2B45] hover:bg-[#253655] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || (typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>
                  {isSubmitting
                    ? (editingSaleId ? 'Updating Wholesale Bill...' : 'Generating Bill...')
                    : (editingSaleId ? 'Update Wholesale Bill' : 'Generate Bill & Print Invoice')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Submit Bar */}
        <div className="lg:hidden sticky bottom-0 -mx-4 -mb-6 px-4 py-3 bg-[#0B1220]/95 backdrop-blur border-t border-[#1E2B45] flex items-center justify-between gap-3 z-30 shadow-2xl">
          <div>
            <span className="text-[10px] text-[#AAB4C5] block font-mono">Total: {formatCurrency(grandTotal)}</span>
            <span className="text-xs font-mono font-bold text-rose-400">Due: {formatCurrency(balanceDue)}</span>
          </div>
          <div className="flex items-center gap-2">
            {editingSaleId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-2.5 px-3 bg-[#1E2B45] text-[#AAB4C5] rounded-xl text-xs font-semibold shrink-0"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || (typeof paymentAmountInput === 'number' && paymentAmountInput > grandTotal)}
              className="flex-1 py-2.5 px-4 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              <span>
                {isSubmitting
                  ? (editingSaleId ? 'Updating...' : 'Generating...')
                  : (editingSaleId ? 'Update Bill' : 'Save & Print Invoice')}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* SECTION 2: PREVIOUS SALES / SALES HISTORY (ALL MONTHS & YEARS) */}
      {/* ========================================================================= */}
      <div className="pt-8 border-t border-[#1E2B45] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg lg:text-xl font-serif font-bold text-gold-gradient tracking-wide flex items-center gap-2">
              <FileText className="text-[#D6B36A]" size={20} />
              <span>Previous Sales / Sales History</span>
            </h3>
            <p className="text-xs text-[#AAB4C5] mt-0.5">
              Complete history of wholesale bills across all months and years. Inspect invoices, edit bills, or safely delete transactions.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-[#111B2E] border border-[#1E2B45] rounded-full text-[#D6B36A] self-start sm:self-auto font-semibold">
            {filteredSales.length} {filteredSales.length === 1 ? 'Bill' : 'Bills'} Found
          </span>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
            <span className="text-[11px] text-[#AAB4C5] block">Total Invoices</span>
            <span className="text-base lg:text-lg font-bold font-mono text-[#F5F3EE] mt-0.5 block">
              {salesStats.count}
            </span>
          </div>
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
            <span className="text-[11px] text-[#AAB4C5] block">Total Wholesale Sales</span>
            <span className="text-base lg:text-lg font-bold font-mono text-[#D6B36A] mt-0.5 block">
              {formatCurrency(salesStats.totalGrand)}
            </span>
          </div>
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
            <span className="text-[11px] text-[#AAB4C5] block">Total Received</span>
            <span className="text-base lg:text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
              {formatCurrency(salesStats.totalReceived)}
            </span>
          </div>
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-3.5">
            <span className="text-[11px] text-[#AAB4C5] block">Outstanding Dues</span>
            <span className="text-base lg:text-lg font-bold font-mono text-rose-400 mt-0.5 block">
              {formatCurrency(salesStats.totalDue)}
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]" />
              <input
                type="text"
                placeholder="Search invoice #, customer name, or jewellery item..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setDisplayLimit(15);
                }}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F5F3EE] placeholder-[#7A8699] focus:outline-none focus:border-[#D6B36A] transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8699] hover:text-[#F5F3EE]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Month/Year Filter */}
            <div className="w-full lg:w-48">
              <select
                value={monthFilter}
                onChange={e => {
                  setMonthFilter(e.target.value);
                  setDisplayLimit(15);
                }}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              >
                <option value="all">All Months & Years</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="w-full lg:w-44">
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setDisplayLimit(15);
                }}
                className="w-full bg-[#0B1220] border border-[#1E2B45] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              >
                <option value="all">All Statuses</option>
                <option value="Payment Complete">Payment Complete</option>
                <option value="Advance Paid">Advance Paid</option>
                <option value="Due Balance">Due Balance</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E2B45]/60 text-xs">
            <span className="text-[#AAB4C5] text-[11px] font-medium flex items-center gap-1">
              <Calendar size={13} className="text-[#D6B36A]" />
              <span>Custom Date Range:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={salesStartDate}
                onChange={e => {
                  setSalesStartDate(e.target.value);
                  setDisplayLimit(15);
                }}
                className="bg-[#0B1220] border border-[#1E2B45] rounded-md px-2 py-1 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              />
              <span className="text-[#7A8699]">to</span>
              <input
                type="date"
                value={salesEndDate}
                onChange={e => {
                  setSalesEndDate(e.target.value);
                  setDisplayLimit(15);
                }}
                className="bg-[#0B1220] border border-[#1E2B45] rounded-md px-2 py-1 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#D6B36A]"
              />
              {(salesStartDate || salesEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSalesStartDate('');
                    setSalesEndDate('');
                  }}
                  className="px-2 py-1 bg-[#1E2B45] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-md text-[11px]"
                >
                  Clear Range
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile View: Cards (< sm) */}
        <div className="sm:hidden space-y-3">
          {visibleSales.length === 0 ? (
            <div className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-8 text-center text-xs text-[#7A8699]">
              No sales transactions matching your filters.
            </div>
          ) : (
            visibleSales.map(sale => {
              const party = parties.find(p => p.id === sale.party_id);
              return (
                <div key={sale.id} className="bg-[#111B2E] border border-[#1E2B45] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-[#F5F3EE] block">
                        {sale.customer_name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-[#D6B36A]">
                          #{sale.invoice_number}
                        </span>
                        <span className="text-[10px] text-[#7A8699]">
                          • {formatDate(sale.sale_date)}
                        </span>
                        {party && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#1E2B45] text-[#AAB4C5] rounded font-medium">
                            Party: {party.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        sale.payment_status === 'Payment Complete'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : sale.payment_status === 'Advance Paid'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {sale.payment_status}
                    </span>
                  </div>

                  {/* Items Summary */}
                  {sale.items && sale.items.length > 0 && (
                    <div className="bg-[#0B1220]/60 p-2 rounded-lg border border-[#1E2B45]/50 space-y-1">
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-[#AAB4C5] truncate max-w-[65%]">
                            {it.item_name} <span className="font-mono text-[#F5F3EE]">× {it.quantity}</span>
                          </span>
                          <span className="font-mono text-[#F5F3EE] text-[11px]">
                            {formatCurrency(it.line_total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Financial Figures */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E2B45]/60 text-xs">
                    <div>
                      <span className="text-[10px] text-[#AAB4C5] block">Total</span>
                      <span className="font-mono font-bold text-[#F5F3EE]">
                        {formatCurrency(sale.grand_total)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#AAB4C5] block">Received</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(sale.amount_received)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#AAB4C5] block">Due</span>
                      <span className={`font-mono font-bold ${sale.amount_due > 0 ? 'text-rose-400' : 'text-[#7A8699]'}`}>
                        {formatCurrency(sale.amount_due)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1E2B45]/60">
                    <button
                      type="button"
                      onClick={() => setSelectedSaleForModal(sale)}
                      className="flex-1 py-1.5 px-2 bg-[#1E2B45] hover:bg-[#253655] text-[#D6B36A] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(sale)}
                      className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleToDelete(sale)}
                      className="py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table (hidden sm:block) */}
        <div className="hidden sm:block bg-[#111B2E] border border-[#1E2B45] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0E1726] border-b border-[#1E2B45] text-[#AAB4C5]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Buyer / Party</th>
                  <th className="py-3 px-4 font-semibold">Jewellery Items Sold</th>
                  <th className="py-3 px-4 font-semibold text-right">Total (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Received (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Due (₹)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2B45]/60">
                {visibleSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-[#7A8699]">
                      No wholesale sales transactions matching your filters.
                    </td>
                  </tr>
                ) : (
                  visibleSales.map(sale => {
                    const party = parties.find(p => p.id === sale.party_id);
                    return (
                      <tr key={sale.id} className="hover:bg-[#16233B]/50 transition">
                        <td className="py-3 px-4 text-[#AAB4C5] whitespace-nowrap">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#D6B36A] whitespace-nowrap">
                          #{sale.invoice_number}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#F5F3EE] block">
                            {sale.customer_name}
                          </span>
                          {party && (
                            <span className="text-[10px] text-[#AAB4C5] block">
                              Party: {party.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.map((it, idx) => (
                                <div key={idx} className="text-[#AAB4C5] truncate">
                                  <span className="text-[#F5F3EE] font-medium">{it.item_name}</span>{' '}
                                  <span className="font-mono text-[11px]">({it.quantity} pcs @ {formatCurrency(it.unit_sale_rate)})</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[#7A8699] italic">Jewellery Items</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#F5F3EE] whitespace-nowrap">
                          {formatCurrency(sale.grand_total)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 whitespace-nowrap">
                          {formatCurrency(sale.amount_received)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                          <span className={sale.amount_due > 0 ? 'text-rose-400' : 'text-[#7A8699]'}>
                            {formatCurrency(sale.amount_due)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sale.payment_status === 'Payment Complete'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sale.payment_status === 'Advance Paid'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSaleForModal(sale)}
                              className="p-1.5 rounded-lg bg-[#1E2B45] hover:bg-[#253655] text-[#D6B36A] hover:text-[#e4c478] transition"
                              title="View & Share Invoice"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(sale)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition"
                              title="Edit Wholesale Bill"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSaleToDelete(sale)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                              title="Delete & Restore Stock"
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

        {/* Load More Button */}
        {filteredSales.length > displayLimit && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setDisplayLimit(prev => prev + 15)}
              className="px-6 py-2.5 bg-[#111B2E] hover:bg-[#16233B] border border-[#1E2B45] rounded-xl text-xs font-semibold text-[#D6B36A] transition active:scale-95 shadow-sm"
            >
              Load More Sales ({filteredSales.length - displayLimit} remaining)
            </button>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F3EE]">Delete Wholesale Bill #{saleToDelete.invoice_number}?</h3>
                <p className="text-xs text-[#AAB4C5] mt-1">
                  Customer: <span className="text-[#F5F3EE] font-semibold">{saleToDelete.customer_name}</span> • Amount: <span className="text-[#D6B36A] font-mono font-semibold">{formatCurrency(saleToDelete.grand_total)}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertCircle size={15} className="shrink-0" />
                <span>Stock Reversal Guard</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-300">
                All jewellery pieces ({saleToDelete.items?.reduce((sum, it) => sum + it.quantity, 0) || 0} units) sold on this bill will be automatically restored and added back to warehouse inventory stock.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 bg-[#1E2B45] hover:bg-[#253655] text-[#AAB4C5] hover:text-[#F5F3EE] rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSale}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting & Restoring...' : 'Yes, Delete & Restore Stock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Sale Preview Modal */}
      {selectedSaleForModal && (
        <InvoiceReceiptModal
          sale={selectedSaleForModal}
          onClose={() => setSelectedSaleForModal(null)}
        />
      )}

      {/* Global Invoice Preview Modal (After Create) */}
      {showPrintModal && successSale && (
        <InvoiceReceiptModal
          sale={successSale}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
