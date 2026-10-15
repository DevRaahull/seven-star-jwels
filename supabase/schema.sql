-- =========================================================================
-- SEVEN STAR JWELS — WHOLESALE JEWELLERY MANAGEMENT DATABASE SCHEMA
-- Midnight Ledger Wholesale Jewellery Inventory, GST Billing & Accounting
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'SEVEN STAR JWELS',
  hindi_header TEXT NOT NULL DEFAULT '॥ श्री ॥',
  tagline TEXT NOT NULL DEFAULT 'Jewellery Inventory & Accounting',
  business_address TEXT DEFAULT 'Shop No. 7, Jewel Market, Zaveri Bazaar, Mumbai',
  business_gstin TEXT DEFAULT '27AABCU9603R1ZM',
  state TEXT DEFAULT 'Maharashtra',
  phone TEXT DEFAULT '+91 98765 43210',
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  invoice_prefix TEXT NOT NULL DEFAULT 'SSJ-',
  next_invoice_number BIGINT NOT NULL DEFAULT 1001,
  invoice_notes TEXT DEFAULT 'Goods once sold will not be exchanged or returned without bill. Quality Builds Trust.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  purchase_rate NUMERIC(12,2) NOT NULL CHECK (purchase_rate >= 0),
  default_sale_rate NUMERIC(12,2) NOT NULL CHECK (default_sale_rate >= 0),
  current_stock NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  opening_stock NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_stock >= 0),
  low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PURCHASES (WHOLESALE STOCK INWARD)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supplier_name TEXT NOT NULL,
  supplier_gstin TEXT,
  supplier_invoice_number TEXT NOT NULL,
  is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
  total_taxable NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_taxable >= 0),
  total_gst NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_gst >= 0),
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Partially Paid', 'Unpaid')),
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_purchase_rate NUMERIC(12,2) NOT NULL CHECK (unit_purchase_rate >= 0),
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  taxable_amount NUMERIC(12,2) NOT NULL CHECK (taxable_amount >= 0),
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SALES (WHOLESALE INVOICE OUTWARD)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  buyer_gstin TEXT,
  buyer_address TEXT,
  customer_phone TEXT,
  is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_status TEXT NOT NULL DEFAULT 'Due Balance' CHECK (payment_status IN ('Advance Paid', 'Due Balance', 'Payment Complete', 'Paid', 'Partially Paid', 'Unpaid')),
  total_taxable NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_taxable >= 0),
  total_cgst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_sgst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_igst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  gross_profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SALE PAYMENTS (PAYMENT HISTORY)
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SALE ITEMS (LINE ITEMS)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0), -- Historical snapshot
  unit_sale_rate NUMERIC(12,2) NOT NULL CHECK (unit_sale_rate >= 0),
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  taxable_amount NUMERIC(12,2) NOT NULL CHECK (taxable_amount >= 0),
  cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  line_cost NUMERIC(12,2) NOT NULL CHECK (line_cost >= 0),
  line_profit NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. OPERATING EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_status TEXT DEFAULT 'Paid',
  notes TEXT,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own settings" ON business_settings FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users access own items" ON items FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users access own purchases" ON purchases FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users access purchase items" ON purchase_items FOR ALL USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND (purchases.user_id = auth.uid() OR purchases.user_id IS NULL)));
CREATE POLICY "Users access own sales" ON sales FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users access sale payments" ON sale_payments FOR ALL USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_payments.sale_id AND (sales.user_id = auth.uid() OR sales.user_id IS NULL)));
CREATE POLICY "Users access sale items" ON sale_items FOR ALL USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND (sales.user_id = auth.uid() OR sales.user_id IS NULL)));
CREATE POLICY "Users access own expenses" ON expenses FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
