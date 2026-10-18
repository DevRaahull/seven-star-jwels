// Wholesale Jewellery Management System Data Models

export interface Item {
  id: string;
  user_id?: string;
  name: string;
  sku?: string;
  category: string;
  purchase_rate: number;
  default_sale_rate: number;
  current_stock: number;
  opening_stock: number;
  low_stock_threshold: number;
  description?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'Advance Paid'
  | 'Due Balance'
  | 'Payment Complete'
  | 'Paid'
  | 'Partially Paid'
  | 'Unpaid';

// --- WHOLESALE PURCHASE MODELS ---
export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  item_id?: string;
  item_name: string;
  quantity: number;
  unit_purchase_rate: number;
  gst_rate: number; // e.g. 3 for jewellery (1.5% CGST + 1.5% SGST or 3% IGST)
  taxable_amount: number;
  gst_amount: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  user_id?: string;
  purchase_date: string;
  supplier_name: string;
  supplier_gstin?: string;
  supplier_invoice_number: string;
  is_interstate?: boolean;
  total_taxable: number;
  total_gst: number;
  grand_total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  amount_due: number;
  notes?: string;
  status: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: PurchaseItem[];
}

// --- WHOLESALE SALE & INVOICE MODELS ---
export interface SaleItem {
  id?: string;
  sale_id?: string;
  item_id?: string;
  item_name: string;
  quantity: number;
  unit_cost: number; // Historical purchase cost snapshot (Weighted Average Cost at sale time)
  unit_sale_rate: number; // Actual negotiated sale rate on this bill
  gst_rate: number; // e.g. 3% for jewellery
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gst_amount: number;
  line_total: number;
  line_cost: number;
  line_profit: number;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  user_id?: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string;
  party_id?: string; // Optional link to registered party
  state_id?: string; // Optional state link
  deduct_from_party_stock?: boolean; // If sold from party's held consignment stock
  buyer_gstin?: string;
  buyer_address?: string;
  customer_phone?: string;
  is_interstate: boolean; // false = CGST + SGST, true = IGST
  payment_method: string;
  payment_status: PaymentStatus;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_gst: number;
  grand_total: number;
  total_cost: number; // COGS
  gross_profit: number;
  amount_received: number;
  amount_due: number;
  notes?: string;
  status: 'completed' | 'voided';
  void_reason?: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
  payments?: SalePayment[];
}

// --- STATES & PARTIES (MULTI-STATE MANAGEMENT) ---
export interface StateRecord {
  id: string;
  user_id?: string;
  name: string;
  notes?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartyRecord {
  id: string;
  user_id?: string;
  state_id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  opening_balance?: number; // Positive = Party owes us (Receivable), Negative = We owe party (Payable)
  opening_stock?: number;   // Optional initial stock count held by party
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export type StockTransferType = 'handover' | 'issue' | 'return' | 'settled' | 'sale' | 'adjustment';

export interface StockTransfer {
  id: string;
  user_id?: string;
  reference_no?: string;
  transfer_date: string;
  destination_state_id: string;
  destination_party_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate?: number;
  total_value?: number;
  transfer_type: StockTransferType;
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PartyPayment {
  id: string;
  user_id?: string;
  party_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'received' | 'paid'; // 'received' = money received from party, 'paid' = money paid to party
  payment_method: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface PartyStockItemLedger {
  item_id: string;
  item_name: string;
  handover_qty: number;
  handover_value: number;
  returned_qty: number;
  returned_value: number;
  sold_settled_qty: number;
  sold_settled_value: number;
  balance_qty: number;
  balance_value: number;
  due_qty: number;
  due_value: number;
  // Backwards compatibility aliases
  issued_qty: number;
  held_qty: number;
  sold_qty: number;
}

export interface PartyStockLedgerSummary {
  party_id: string;
  party_name: string;
  state_id: string;
  state_name: string;
  items: PartyStockItemLedger[];
  // Three Essential Displays:
  // A. Stock Handover
  total_handover_qty: number;
  total_handover_value: number;
  // B. Balanced Stock (Balance Stock)
  total_balance_qty: number;
  total_balance_value: number;
  // C. Due Stock
  total_due_qty: number;
  total_due_value: number;
  // Backwards compatibility alias:
  total_held_pieces: number;
}

export interface PartyMoneyLedgerSummary {
  party_id: string;
  party_name: string;
  state_id: string;
  state_name: string;
  phone?: string;
  opening_balance: number;
  total_sales: number;
  total_received: number;
  total_paid: number;
  net_receivable: number; // party owes us
  net_payable: number;    // we owe party
  net_position: number;   // >0 party owes us, <0 we owe party
}

// --- OPERATING EXPENSES ---
export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Salary'
  | 'Transport'
  | 'Packaging'
  | 'Repairs'
  | 'Internet / Phone'
  | 'Other';

export interface Expense {
  id: string;
  user_id?: string;
  expense_date: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  payment_status?: PaymentStatus;
  payment_method: string;
  notes?: string;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

// --- BUSINESS SETTINGS ---
export interface BusinessSettings {
  id: string;
  user_id?: string;
  business_name: string;
  hindi_header: string;
  tagline: string;
  business_address?: string;
  business_gstin?: string;
  state?: string;
  phone?: string;
  currency: string;
  currency_symbol: string;
  default_gst_rate: number; // default 3%
  invoice_prefix: string;
  next_invoice_number: number;
  invoice_notes?: string;
  updated_at: string;
}

// --- INVENTORY MOVEMENT & PERIOD LEDGER ---
export interface StockMovementPeriod {
  item_id: string;
  item_name: string;
  category: string;
  opening_stock: number;
  purchased_qty: number;
  transfers_returned_qty: number;
  sold_qty: number;
  transfers_issued_qty: number;
  current_stock: number;
  purchase_rate: number;
  default_sale_rate: number;
  stock_value: number;
}

// --- SIMPLIFIED WHOLESALE DASHBOARD STATS ---
export interface WholesaleDashboardStats {
  month_sales: number;
  month_purchases: number;
  current_stock_units: number;
  current_stock_value: number;
  month_income: number;
  month_expenditure: number;
  month_net_result: number;
  party_receivables_total?: number;
  party_payables_total?: number;
}

// --- 6 MAIN NAVIGATION FEATURES ---
export type ActiveNavTab =
  | 'dashboard'
  | 'create_sale'
  | 'create_purchase'
  | 'inventory'
  | 'states_parties'
  | 'reports'
  | 'settings'
  | 'backup'
  // Legacy aliases
  | 'purchase'
  | 'sales'
  | 'invoices'
  | 'accounts';

export type DateFilterPreset =
  | 'today'
  | 'this_month'
  | 'last_month'
  | 'financial_year'
  | 'custom';

export interface ItemUsageReport {
  item: Item;
  purchases: Array<{
    purchase: Purchase;
    item: PurchaseItem;
  }>;
  sales: Array<{
    sale: Sale;
    item: SaleItem;
  }>;
  transfers: StockTransfer[];
  totalPurchasedQty: number;
  totalSoldQty: number;
  totalTransferredHeldQty: number;
  canPermanentlyDelete: boolean;
  deleteBlockReason?: string;
}
