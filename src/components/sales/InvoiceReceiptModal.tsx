import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Building, CreditCard, Share2 } from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAppData } from '../../context/AppDataContext';
import { GoldLogo } from '../common/GoldLogo';

interface InvoiceReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

// Helper to convert number to Indian Currency Words
function numberToWordsIndian(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundreds = remainder % 1000;

  let result = '';
  if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (hundreds > 0) result += convertLessThanOneThousand(hundreds);

  return `Rupees ${result.trim()} Only`;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ sale, onClose }) => {
  const { settings } = useAppData();
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVoided = sale.status === 'voided';
  const grandTotal = sale.grand_total || (sale as any).total_amount || 0;
  const taxableTotal = sale.total_taxable || (grandTotal / 1.03);
  const gstTotal = sale.total_gst || (grandTotal - taxableTotal);
  const isInterstate = Boolean(sale.is_interstate);
  const amountReceived = sale.amount_received !== undefined ? sale.amount_received : grandTotal;
  const amountDue = sale.amount_due !== undefined ? sale.amount_due : Math.max(0, grandTotal - amountReceived);

  const handleShareWhatsApp = async () => {
    const billSummary =
      `*${settings.hindi_header || '॥ श्री ॥'}*\n` +
      `*${settings.business_name || 'SEVEN STAR JWELS'}*\n` +
      `--------------------------------\n` +
      `*Tax Invoice:* ${sale.invoice_number}\n` +
      `*Date:* ${formatDate(sale.sale_date)}\n` +
      `*Customer:* ${sale.customer_name}\n` +
      `--------------------------------\n` +
      (sale.items || [])
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.item_name} x ${item.quantity} @ ₹${item.unit_sale_rate} = ₹${item.line_total}`
        )
        .join('\n') +
      `\n--------------------------------\n` +
      `*Grand Total:* ₹${grandTotal.toFixed(2)}\n` +
      `*Amount Received:* ₹${amountReceived.toFixed(2)}\n` +
      `*Balance Due:* ₹${amountDue.toFixed(2)}\n` +
      `*Status:* ${sale.payment_status}\n` +
      `--------------------------------\n` +
      `_Quality Builds Trust_`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale.invoice_number} - SEVEN STAR JWELS`,
          text: billSummary
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Native share failed, fallback to direct WhatsApp', err);
        } else {
          return;
        }
      }
    }

    const cleanPhone = sale.customer_phone ? sale.customer_phone.replace(/[^0-9]/g, '') : '';
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(billSummary)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(billSummary)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111B2E] border border-[#1E2B45] rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar (Non-Printable) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1E2B45] no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-semibold text-sm text-[#F5F3EE]">
                Wholesale Tax Invoice: {sale.invoice_number}
              </h3>
              <p className="text-[11px] text-[#AAB4C5]">Print-ready A4 GST Invoice</p>
            </div>
            {isVoided && (
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                Voided / Cancelled
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
              title="Share via WhatsApp"
            >
              <Share2 size={15} />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow transition active:scale-95"
            >
              <Printer size={15} />
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#AAB4C5] hover:text-[#F5F3EE] hover:bg-[#16233B] rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / A4 Printable Invoice Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0B1220]/70" ref={printRef}>
          <div className="printable-area bg-white text-slate-900 p-6 sm:p-8 rounded-lg shadow-xl border border-slate-300 max-w-3xl mx-auto font-sans text-xs">
            {/* Top Religious Invocation & Title */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <div className="text-sm font-bold tracking-[0.25em] text-[#B08E46] mb-1">
                {settings.hindi_header || '॥ श्री ॥'}
              </div>
              <div className="flex justify-center mb-1">
                <GoldLogo size={32} />
              </div>
              <h1 className="font-serif font-black text-2xl tracking-[0.18em] text-slate-900 uppercase">
                {settings.business_name || 'SEVEN STAR JWELS'}
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
                Wholesale Jewellery Merchants &bull; Gold & Silver Ornaments
              </p>
              {settings.address && (
                <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-x-4 text-[11px] text-slate-700 mt-1 font-mono">
                {settings.business_gstin && <span>GSTIN: <strong>{settings.business_gstin}</strong></span>}
                {settings.state && <span>State: <strong>{settings.state}</strong></span>}
                {settings.phone && <span>Mobile: <strong>{settings.phone}</strong></span>}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-100 border-b border-slate-300 py-1 px-4 text-center my-2 font-bold tracking-widest text-[11px] uppercase">
              TAX INVOICE (WHOLESALE SUPPLY)
            </div>

            {/* Invoice Meta & Buyer Details (GSTIN & Buyer Address Removed) */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-300 text-xs">
              <div className="space-y-1">
                <p className="text-slate-500 uppercase tracking-wide text-[10px] font-bold">Billed To (Party):</p>
                <p className="font-bold text-slate-900 text-sm">{sale.customer_name || 'Counter Wholesale Party'}</p>
                {sale.customer_phone && (
                  <p className="text-slate-700 text-[11px]">Phone: {sale.customer_phone}</p>
                )}
              </div>

              <div className="text-right space-y-1">
                <p className="text-slate-500 uppercase tracking-wide text-[10px] font-bold">Invoice Details:</p>
                <p className="font-bold font-mono text-slate-900 text-sm">Invoice #: {sale.invoice_number}</p>
                <p className="text-slate-700">Date: <span className="font-medium">{formatDate(sale.sale_date)}</span></p>
                <p className="text-slate-700">Supply: <span className="font-medium">{isInterstate ? 'Inter-state (IGST)' : 'Intra-state'}</span></p>
                <p className="text-slate-700">Payment: <span className="font-medium">{sale.payment_method}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-1.5 px-2 border-r border-slate-300 w-8 text-center">#</th>
                    <th className="py-1.5 px-2 border-r border-slate-300">Description of Goods</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 text-center w-16">HSN</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 text-right w-14">Qty</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 text-right w-20">Rate (₹)</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 text-right w-24">Taxable (₹)</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 text-center w-14">GST %</th>
                    <th className="py-1.5 px-2 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((line, idx) => {
                      const lineTaxable = line.taxable_amount || (line.quantity * (line.unit_sale_rate || (line as any).sale_rate));
                      const lineTotal = line.line_total || lineTaxable;
                      const lineRate = line.unit_sale_rate || (line as any).sale_rate || 0;
                      return (
                        <tr key={idx} className="text-slate-800 font-mono">
                          <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-500 font-sans">{idx + 1}</td>
                          <td className="py-2 px-2 border-r border-slate-300 font-sans font-medium text-slate-900">{line.item_name}</td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-600">7113</td>
                          <td className="py-2 px-2 border-r border-slate-300 text-right">{line.quantity}</td>
                          <td className="py-2 px-2 border-r border-slate-300 text-right">{lineRate.toFixed(2)}</td>
                          <td className="py-2 px-2 border-r border-slate-300 text-right">{lineTaxable.toFixed(2)}</td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center">{line.gst_rate || 3}%</td>
                          <td className="py-2 px-2 text-right font-bold">{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500">
                        No item breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Tax Calculation Breakdown */}
            <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-900 pt-3">
              {/* Left Column: Amount in words & Payment Status */}
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium">Amount in Words:</span>
                  <p className="font-bold text-slate-800 italic mt-0.5">{numberToWordsIndian(grandTotal)}</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <strong className="uppercase">{sale.payment_status || 'Paid'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(amountReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due / Receivable:</span>
                    <span className="font-mono font-bold text-rose-700">{formatCurrency(amountDue)}</span>
                  </div>
                </div>

                {sale.notes && (
                  <p className="text-slate-600 italic">
                    Note: &ldquo;{sale.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Right Column: Financial Figures */}
              <div className="space-y-1.5 text-right font-mono text-xs">
                <div className="flex justify-between text-slate-700 py-0.5">
                  <span className="font-sans">Total Taxable Value:</span>
                  <span>{formatCurrency(taxableTotal)}</span>
                </div>

                {isInterstate ? (
                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span className="font-sans">IGST (3%):</span>
                    <span>{formatCurrency(gstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span className="font-sans">CGST (1.5%):</span>
                      <span>{formatCurrency(gstTotal / 2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span className="font-sans">SGST (1.5%):</span>
                      <span>{formatCurrency(gstTotal / 2)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-slate-700 py-0.5">
                  <span className="font-sans">Total GST Amount:</span>
                  <span>{formatCurrency(gstTotal)}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-b-2 border-slate-900 text-sm font-black text-slate-900">
                  <span className="font-sans">Invoice Total:</span>
                  <span className="text-base">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions & Signatures */}
            <div className="mt-6 pt-3 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] text-slate-600">
              <div className="space-y-1">
                <p className="font-bold uppercase text-slate-800">Terms & Conditions:</p>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Goods once sold will not be accepted back without prior authorization.</li>
                  <li>Subject to local court jurisdiction.</li>
                  <li>Interest @ 18% p.a. will be levied if payment is delayed beyond agreed terms.</li>
                </ol>
                <div className="flex items-center gap-1 text-slate-500 pt-1">
                  <ShieldCheck size={11} />
                  <span>&ldquo;Quality Builds Trust&rdquo; &bull; Certified Hallmarked Jewellery</span>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between h-24">
                <p className="font-bold text-slate-800">For SEVEN STAR JWELS</p>
                <div className="pt-8">
                  <span className="border-t border-slate-400 pt-1 px-4 inline-block font-sans text-slate-700">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions (No print) */}
        <div className="px-6 py-3.5 border-t border-[#1E2B45] flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#16233B] hover:bg-[#1E2E4A] text-[#F5F3EE] rounded-xl text-xs font-medium transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#D6B36A] hover:bg-[#c9a356] text-[#0B1220] rounded-xl text-xs font-bold shadow transition active:scale-95"
          >
            <Printer size={15} />
            <span>Print Invoice (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
