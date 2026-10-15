import { getSupabaseClient } from './supabase';
import {
  Item,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  Expense,
  BusinessSettings,
  StockMovementPeriod,
  StateRecord,
  PartyRecord,
  StockTransfer,
  PartyPayment,
  PartyStockLedgerSummary,
  PartyMoneyLedgerSummary,
  PaymentStatus
} from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(uuid?: string | null): boolean {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function encodeSalesNotes(userNotes?: string, partyId?: string, stateId?: string): string | null {
  const parts: string[] = [];
  if (userNotes?.trim()) parts.push(userNotes.trim());
  if (partyId) parts.push(`[SSJ_PARTY:${partyId}]`);
  if (stateId) parts.push(`[SSJ_STATE:${stateId}]`);
  return parts.length > 0 ? parts.join('\n') : null;
}

export function decodeSalesNotes(rawNotes?: string | null): { notes?: string; party_id?: string; state_id?: string } {
  if (!rawNotes) return {};
  let notes = rawNotes;
  let party_id: string | undefined;
  let state_id: string | undefined;

  const partyMatch = notes.match(/\[SSJ_PARTY:([^\]]+)\]/);
  if (partyMatch) {
    party_id = partyMatch[1];
    notes = notes.replace(partyMatch[0], '').trim();
  }
  const stateMatch = notes.match(/\[SSJ_STATE:([^\]]+)\]/);
  if (stateMatch) {
    state_id = stateMatch[1];
    notes = notes.replace(stateMatch[0], '').trim();
  }
  return { notes: notes || undefined, party_id, state_id };
}

const STORAGE_KEYS = {
  SETTINGS: 'SSJ_SETTINGS',
  ITEMS: 'SSJ_ITEMS',
  PURCHASES: 'SSJ_PURCHASES',
  SALES: 'SSJ_SALES',
  EXPENSES: 'SSJ_EXPENSES',
  STATES: 'SSJ_STATES',
  PARTIES: 'SSJ_PARTIES',
  STOCK_TRANSFERS: 'SSJ_STOCK_TRANSFERS',
  PARTY_PAYMENTS: 'SSJ_PARTY_PAYMENTS'
};

const DEFAULT_SETTINGS: BusinessSettings = {
  id: '00000000-0000-4000-8000-000000000001',
  business_name: 'SEVEN STAR JWELS',
  hindi_header: '॥ श्री ॥',
  tagline: 'Jewellery Inventory & Accounting',
  business_address: 'Shop No. 7, Jewel Market, Zaveri Bazaar, Mumbai - 400002',
  business_gstin: '27AABCU9603R1ZM',
  state: 'Maharashtra',
  phone: '+91 98765 43210',
  currency: 'INR',
  currency_symbol: '₹',
  default_gst_rate: 3.00,
  invoice_prefix: 'SSJ-',
  next_invoice_number: 2026008,
  invoice_notes: 'Goods once sold will not be exchanged without cash receipt. Quality Builds Trust.',
  updated_at: new Date().toISOString()
};

// Seed initial wholesale inventory items using canonical RFC4122 UUIDs
const INITIAL_SEED_ITEMS: Item[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'CZ Stone Studded Nose Pin 92.5',
    sku: 'NP-STN-001',
    category: 'Nose Pins',
    purchase_rate: 110.00,
    default_sale_rate: 150.00,
    opening_stock: 50,
    current_stock: 45,
    low_stock_threshold: 5,
    description: 'Wholesale 92.5 Sterling silver CZ nose pins',
    is_archived: false,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-03-08T10:00:00Z'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Silver Floral Nose Pin Oxidised',
    sku: 'NP-FLR-002',
    category: 'Nose Pins',
    purchase_rate: 100.00,
    default_sale_rate: 150.00,
    opening_stock: 35,
    current_stock: 32,
    low_stock_threshold: 5,
    description: 'Oxidised floral silver wholesale pieces',
    is_archived: false,
    created_at: '2026-02-05T11:00:00Z',
    updated_at: '2026-03-06T11:00:00Z'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    name: 'Lightweight Daily Wear Silver Earrings',
    sku: 'ER-JHM-003',
    category: 'Earrings',
    purchase_rate: 110.00,
    default_sale_rate: 150.00,
    opening_stock: 25,
    current_stock: 18,
    low_stock_threshold: 5,
    description: 'Bulk silver jhumki style daily earrings',
    is_archived: false,
    created_at: '2026-02-10T12:00:00Z',
    updated_at: '2026-03-03T12:00:00Z'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    name: 'Solitaire Finish Silver Band Ring',
    sku: 'RG-SLV-004',
    category: 'Rings',
    purchase_rate: 260.00,
    default_sale_rate: 350.00,
    opening_stock: 20,
    current_stock: 14,
    low_stock_threshold: 4,
    description: 'Wholesale adjustable band rings',
    is_archived: false,
    created_at: '2026-02-12T14:00:00Z',
    updated_at: '2026-02-28T14:00:00Z'
  }
];

// Seed initial wholesale purchases
const INITIAL_SEED_PURCHASES: Purchase[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    purchase_date: '2026-03-01T11:00:00Z',
    supplier_name: 'Shree Balaji Silver Refinery',
    supplier_gstin: '27AAACS1234F1Z9',
    supplier_invoice_number: 'BSR-9841',
    is_interstate: false,
    total_taxable: 1922.33,
    total_gst: 57.67,
    grand_total: 1980.00,
    payment_status: 'Paid',
    amount_paid: 1980.00,
    amount_due: 0.00,
    notes: 'Bulk stock inward batch #1',
    status: 'active',
    created_at: '2026-03-01T11:00:00Z',
    updated_at: '2026-03-01T11:00:00Z',
    items: [
      {
        id: 'b0000000-0000-4000-8000-000000000011',
        purchase_id: 'b0000000-0000-4000-8000-000000000001',
        item_id: 'a0000000-0000-4000-8000-000000000001',
        item_name: 'CZ Stone Studded Nose Pin 92.5',
        quantity: 10,
        unit_purchase_rate: 110.00,
        gst_rate: 3.00,
        taxable_amount: 1100.00,
        gst_amount: 33.00,
        line_total: 1133.00
      },
      {
        id: 'b0000000-0000-4000-8000-000000000012',
        purchase_id: 'b0000000-0000-4000-8000-000000000001',
        item_id: 'a0000000-0000-4000-8000-000000000002',
        item_name: 'Silver Floral Nose Pin Oxidised',
        quantity: 8,
        unit_purchase_rate: 100.00,
        gst_rate: 3.00,
        taxable_amount: 800.00,
        gst_amount: 24.00,
        line_total: 824.00
      }
    ]
  }
];

// Seed initial wholesale sales
const INITIAL_SEED_SALES: Sale[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    invoice_number: 'SSJ-2026007',
    sale_date: '2026-03-08T16:30:00Z',
    customer_name: 'Pooja Verma Jewellers',
    buyer_gstin: '27AABCP4432G1Z3',
    buyer_address: 'Main Bazaar, Pune',
    customer_phone: '9820011223',
    is_interstate: false,
    payment_method: 'Cash',
    payment_status: 'Payment Complete',
    total_taxable: 728.16,
    total_cgst: 10.92,
    total_sgst: 10.92,
    total_igst: 0.00,
    total_gst: 21.84,
    grand_total: 750.00,
    total_cost: 550.00,
    gross_profit: 178.16,
    amount_received: 750.00,
    amount_due: 0.00,
    notes: 'Bulk counter wholesale delivery',
    status: 'completed',
    created_at: '2026-03-08T16:30:00Z',
    updated_at: '2026-03-08T16:30:00Z',
    items: [
      {
        id: 'c0000000-0000-4000-8000-000000000011',
        sale_id: 'c0000000-0000-4000-8000-000000000001',
        item_id: 'a0000000-0000-4000-8000-000000000001',
        item_name: 'CZ Stone Studded Nose Pin 92.5',
        quantity: 5,
        unit_cost: 110.00,
        unit_sale_rate: 145.63,
        gst_rate: 3.00,
        taxable_amount: 728.16,
        cgst_amount: 10.92,
        sgst_amount: 10.92,
        igst_amount: 0.00,
        gst_amount: 21.84,
        line_total: 750.00,
        line_cost: 550.00,
        line_profit: 178.16
      }
    ],
    payments: [
      {
        id: 'c0000000-0000-4000-8000-000000000021',
        sale_id: 'c0000000-0000-4000-8000-000000000001',
        payment_date: '2026-03-08T16:30:00Z',
        amount: 750.00,
        payment_method: 'Cash',
        notes: 'Full payment received at counter',
        created_at: '2026-03-08T16:30:00Z'
      }
    ]
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    invoice_number: 'SSJ-2026006',
    sale_date: '2026-03-06T14:15:00Z',
    customer_name: 'Anjali Sharma Arts',
    buyer_gstin: '',
    buyer_address: 'Bandra, Mumbai',
    customer_phone: '9819988776',
    is_interstate: false,
    payment_method: 'UPI',
    payment_status: 'Payment Complete',
    total_taxable: 436.89,
    total_cgst: 6.55,
    total_sgst: 6.55,
    total_igst: 0.00,
    total_gst: 13.11,
    grand_total: 450.00,
    total_cost: 300.00,
    gross_profit: 136.89,
    amount_received: 450.00,
    amount_due: 0.00,
    notes: 'UPI payment received',
    status: 'completed',
    created_at: '2026-03-06T14:15:00Z',
    updated_at: '2026-03-06T14:15:00Z',
    items: [
      {
        id: 'c0000000-0000-4000-8000-000000000012',
        sale_id: 'c0000000-0000-4000-8000-000000000002',
        item_id: 'a0000000-0000-4000-8000-000000000002',
        item_name: 'Silver Floral Nose Pin Oxidised',
        quantity: 3,
        unit_cost: 100.00,
        unit_sale_rate: 145.63,
        gst_rate: 3.00,
        taxable_amount: 436.89,
        cgst_amount: 6.55,
        sgst_amount: 6.55,
        igst_amount: 0.00,
        gst_amount: 13.11,
        line_total: 450.00,
        line_cost: 300.00,
        line_profit: 136.89
      }
    ],
    payments: [
      {
        id: 'c0000000-0000-4000-8000-000000000022',
        sale_id: 'c0000000-0000-4000-8000-000000000002',
        payment_date: '2026-03-06T14:15:00Z',
        amount: 450.00,
        payment_method: 'UPI',
        notes: 'UPI instant settlement',
        created_at: '2026-03-06T14:15:00Z'
      }
    ]
  }
];

const INITIAL_SEED_EXPENSES: Expense[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    expense_date: '2026-03-02T10:00:00Z',
    title: 'Packaging Pouches & Velvet Display Trays',
    category: 'Packaging',
    amount: 120.00,
    payment_method: 'Cash',
    payment_status: 'Paid',
    notes: 'Wholesale jewellery packing',
    is_cancelled: false,
    created_at: '2026-03-02T10:00:00Z',
    updated_at: '2026-03-02T10:00:00Z'
  },
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    expense_date: '2026-03-05T15:00:00Z',
    title: 'Silver Cleaning Solution & Karigar Touchstone',
    category: 'Repairs',
    amount: 80.00,
    payment_method: 'Cash',
    payment_status: 'Paid',
    notes: 'Workshop consumables',
    is_cancelled: false,
    created_at: '2026-03-05T15:00:00Z',
    updated_at: '2026-03-05T15:00:00Z'
  }
];

const INITIAL_SEED_STATES: StateRecord[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    name: 'Maharashtra',
    notes: 'Headquarters & local wholesale market',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    name: 'Gujarat',
    notes: 'Surat & Ahmedabad retail & wholesale counters',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003',
    name: 'Rajasthan',
    notes: 'Jaipur artisanal wholesale network',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const INITIAL_SEED_PARTIES: PartyRecord[] = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    state_id: 'd0000000-0000-4000-8000-000000000001',
    name: 'Kothari Jewellers Pune',
    phone: '9820011223',
    notes: 'Primary wholesale dealer in Pune',
    opening_balance: 0,
    is_archived: false,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    state_id: 'd0000000-0000-4000-8000-000000000002',
    name: 'Ambika Silver Art Surat',
    phone: '9819988776',
    notes: 'Silver ornament consignment counter Surat',
    opening_balance: 0,
    is_archived: false,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z'
  }
];

class StorageService {
  private isBrowser = typeof window !== 'undefined';

  private getFromLocal<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser) return defaultValue;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToLocal(key: string, data: any): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving ' + key + ':', e);
    }
  }

  private async getUserId(): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id && isValidUUID(session.user.id)) {
        return session.user.id;
      }
    } catch {}
    return null;
  }

  // --- SETTINGS ---
  async getSettings(): Promise<BusinessSettings> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('business_settings').select('*').limit(1).maybeSingle();
        if (!error && data) {
          this.saveToLocal(STORAGE_KEYS.SETTINGS, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load settings from Supabase:', err);
      }
    }
    return this.getFromLocal<BusinessSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async updateSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.getSettings();
    const updated: BusinessSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    const client = getSupabaseClient();
    if (client) {
      try {
        const userId = await this.getUserId();
        const payload: any = {
          ...updated,
          id: isValidUUID(updated.id) ? updated.id : DEFAULT_SETTINGS.id
        };
        if (userId) payload.user_id = userId;
        await client.from('business_settings').upsert(payload);
      } catch (e) {
        console.warn('Failed to sync settings to Supabase:', e);
      }
    }
    this.saveToLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- ITEMS & INVENTORY ---
  async getItems(): Promise<Item[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('items').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          this.saveToLocal(STORAGE_KEYS.ITEMS, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to fetch items from Supabase:', err);
      }
    }
    let local = this.getFromLocal<Item[] | null>(STORAGE_KEYS.ITEMS, null);
    if (!local || local.length === 0) {
      local = INITIAL_SEED_ITEMS;
      this.saveToLocal(STORAGE_KEYS.ITEMS, local);
    }
    return local;
  }

  async saveItem(itemData: Partial<Item> & { name: string }): Promise<Item> {
    if (!itemData.name || !itemData.name.trim()) {
      throw new Error('Item name is required and cannot be empty.');
    }
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const id = isValidUUID(itemData.id) ? itemData.id! : generateUUID();
    const userId = await this.getUserId();

    const itemRecord: Item = {
      id,
      name: itemData.name.trim(),
      sku: itemData.sku?.trim() || undefined,
      category: itemData.category?.trim() || 'General',
      purchase_rate: Number(itemData.purchase_rate) || 0,
      default_sale_rate: Number(itemData.default_sale_rate) || 0,
      current_stock: Number(itemData.current_stock) || 0,
      opening_stock: Number(itemData.opening_stock) || 0,
      low_stock_threshold: itemData.low_stock_threshold !== undefined ? Number(itemData.low_stock_threshold) : 5,
      description: itemData.description?.trim() || '',
      is_archived: Boolean(itemData.is_archived),
      created_at: itemData.created_at || now,
      updated_at: now
    };

    // Clean payload strictly matching Supabase table columns
    const dbPayload: any = {
      id: itemRecord.id,
      name: itemRecord.name,
      sku: itemRecord.sku || null,
      category: itemRecord.category,
      purchase_rate: itemRecord.purchase_rate,
      default_sale_rate: itemRecord.default_sale_rate,
      current_stock: itemRecord.current_stock,
      opening_stock: itemRecord.opening_stock,
      low_stock_threshold: itemRecord.low_stock_threshold,
      description: itemRecord.description || null,
      is_archived: itemRecord.is_archived,
      created_at: itemRecord.created_at,
      updated_at: itemRecord.updated_at
    };
    if (userId) dbPayload.user_id = userId;

    if (client) {
      const { data, error } = await client.from('items').upsert(dbPayload).select().single();
      if (error) {
        console.error('Supabase saveItem error:', error);
        throw new Error('Failed to save jewellery item to database: ' + error.message);
      }
      if (data) {
        const items = await this.getItems();
        const index = items.findIndex(i => i.id === id);
        if (index >= 0) items[index] = data;
        else items.push(data);
        this.saveToLocal(STORAGE_KEYS.ITEMS, items);
        return data;
      }
    }

    const items = await this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...itemRecord, updated_at: now };
    } else {
      items.push(itemRecord);
    }
    this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    return itemRecord;
  }

  async adjustStock(itemId: string, quantityChange: number, _reason?: string): Promise<Item> {
    const items = await this.getItems();
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    const newStock = Math.max(0, item.current_stock + quantityChange);
    return await this.saveItem({ ...item, current_stock: newStock });
  }

  async archiveOrDeleteItem(itemId: string, action: 'archive' | 'unarchive' | 'delete'): Promise<void> {
    const items = await this.getItems();
    if (action === 'delete') {
      const itemToDelete = items.find(i => i.id === itemId);
      if (itemToDelete) {
        if (itemToDelete.current_stock > 0) {
          throw new Error('Cannot permanently delete "' + itemToDelete.name + '" because it still has ' + itemToDelete.current_stock + ' units in stock. You can Archive it instead, or adjust stock to 0.');
        }

        const purchases = await this.getPurchases();
        const hasPurchases = purchases.some(p =>
          p.items?.some(it => it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemToDelete.name.toLowerCase().trim()))
        );
        if (hasPurchases) {
          throw new Error('Cannot permanently delete "' + itemToDelete.name + '" because it has recorded supplier purchases. Please Archive it instead to keep historical accounts intact.');
        }

        const sales = await this.getSales();
        const hasSales = sales.some(s =>
          s.items?.some(it => it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemToDelete.name.toLowerCase().trim()))
        );
        if (hasSales) {
          throw new Error('Cannot permanently delete "' + itemToDelete.name + '" because it appears on saved sales bills. Please Archive it instead to protect invoice records.');
        }

        const transfers = await this.getStockTransfers();
        const hasTransfers = transfers.some(t => t.item_id === itemId);
        if (hasTransfers) {
          throw new Error('Cannot permanently delete "' + itemToDelete.name + '" because it is linked to party stock transfers. Please Archive it instead.');
        }
      }

      const client = getSupabaseClient();
      if (client && isValidUUID(itemId)) {
        const { error } = await client.from('items').delete().eq('id', itemId);
        if (error) {
          console.error('Supabase delete item error:', error);
          throw new Error('Failed to delete item from database: ' + error.message);
        }
      }
      this.saveToLocal(STORAGE_KEYS.ITEMS, items.filter(i => i.id !== itemId));
    } else {
      const item = items.find(i => i.id === itemId);
      if (item) {
        await this.saveItem({ ...item, is_archived: action === 'archive' });
      }
    }
  }

  // --- WHOLESALE PURCHASES ---
  async getPurchases(): Promise<Purchase[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('purchases')
          .select('*, items:purchase_items(*)')
          .order('purchase_date', { ascending: false });
        if (!error && data) {
          const mapped: Purchase[] = data.map((p: any) => ({
            ...p,
            items: p.items || []
          }));
          this.saveToLocal(STORAGE_KEYS.PURCHASES, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Failed to fetch purchases from Supabase:', err);
      }
    }
    let local = this.getFromLocal<Purchase[] | null>(STORAGE_KEYS.PURCHASES, null);
    if (!local) {
      local = INITIAL_SEED_PURCHASES;
      this.saveToLocal(STORAGE_KEYS.PURCHASES, local);
    }
    return local;
  }

  async createPurchase(
    purchaseData: {
      purchase_date: string;
      supplier_name: string;
      supplier_gstin?: string;
      supplier_invoice_number: string;
      is_interstate?: boolean;
      amount_paid: number;
      notes?: string;
    },
    itemsData: Array<{
      item_name: string;
      item_id?: string;
      quantity: number;
      unit_purchase_rate: number;
      gst_rate?: number;
    }>
  ): Promise<Purchase> {
    if (!itemsData || itemsData.length === 0) {
      throw new Error('Purchase entry must contain at least one item.');
    }

    const allItems = await this.getItems();
    const now = new Date().toISOString();
    const purchaseId = generateUUID();
    const userId = await this.getUserId();

    let totalTaxable = 0;
    let totalGst = 0;

    const purchaseLines: PurchaseItem[] = [];
    const affectedItems: Item[] = [];

    // Process line items and auto-add new items to inventory
    for (const line of itemsData) {
      const qty = Number(line.quantity) || 0;
      if (qty <= 0) {
        throw new Error('Quantity for "' + line.item_name + '" must be greater than zero.');
      }
      const rate = Number(line.unit_purchase_rate) || 0;
      if (rate < 0) {
        throw new Error('Purchase rate for "' + line.item_name + '" cannot be negative.');
      }
      const gstRate = Number(line.gst_rate ?? 3.00);

      const lineTaxable = Math.round(qty * rate * 100) / 100;
      const lineGst = Math.round((lineTaxable * (gstRate / 100)) * 100) / 100;
      const lineTotal = Math.round((lineTaxable + lineGst) * 100) / 100;

      totalTaxable += lineTaxable;
      totalGst += lineGst;

      // Find or create item
      let matchedItem = allItems.find(i => 
        (line.item_id && i.id === line.item_id) || 
        i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim()
      );

      if (!matchedItem) {
        matchedItem = {
          id: generateUUID(),
          name: line.item_name.trim(),
          category: 'General',
          purchase_rate: rate,
          default_sale_rate: Math.round(rate * 1.35 * 100) / 100,
          opening_stock: 0,
          current_stock: qty,
          low_stock_threshold: 5,
          is_archived: false,
          created_at: now,
          updated_at: now
        };
        allItems.push(matchedItem);
        affectedItems.push(matchedItem);
      } else {
        const currentStock = Math.max(0, Number(matchedItem.current_stock) || 0);
        const currentRate = Number(matchedItem.purchase_rate) || 0;
        let newWeightedCost = rate;
        if (currentStock > 0) {
          newWeightedCost = ((currentStock * currentRate) + (qty * rate)) / (currentStock + qty);
        }
        matchedItem.purchase_rate = Math.round(newWeightedCost * 100) / 100;
        matchedItem.current_stock = currentStock + qty;
        matchedItem.updated_at = now;
        if (!affectedItems.some(i => i.id === matchedItem!.id)) {
          affectedItems.push(matchedItem);
        }
      }

      purchaseLines.push({
        id: generateUUID(),
        purchase_id: purchaseId,
        item_id: matchedItem.id,
        item_name: matchedItem.name,
        quantity: qty,
        unit_purchase_rate: rate,
        gst_rate: gstRate,
        taxable_amount: lineTaxable,
        gst_amount: lineGst,
        line_total: lineTotal
      });
    }

    const grandTotal = Math.round((totalTaxable + totalGst) * 100) / 100;
    const amountPaid = Math.min(grandTotal, Number(purchaseData.amount_paid) || 0);
    const amountDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Paid';
    if (amountPaid <= 0) paymentStatus = 'Unpaid';
    else if (amountPaid < grandTotal) paymentStatus = 'Partially Paid';

    const newPurchase: Purchase = {
      id: purchaseId,
      purchase_date: purchaseData.purchase_date,
      supplier_name: purchaseData.supplier_name.trim(),
      supplier_gstin: purchaseData.supplier_gstin?.trim() || undefined,
      supplier_invoice_number: purchaseData.supplier_invoice_number.trim(),
      is_interstate: !!purchaseData.is_interstate,
      total_taxable: totalTaxable,
      total_gst: totalGst,
      grand_total: grandTotal,
      payment_status: paymentStatus,
      amount_paid: amountPaid,
      amount_due: amountDue,
      notes: purchaseData.notes?.trim() || undefined,
      status: 'active',
      created_at: now,
      updated_at: now,
      items: purchaseLines
    };

    const purchaseHeaderDb: any = {
      id: purchaseId,
      purchase_date: newPurchase.purchase_date,
      supplier_name: newPurchase.supplier_name,
      supplier_gstin: newPurchase.supplier_gstin || null,
      supplier_invoice_number: newPurchase.supplier_invoice_number,
      is_interstate: newPurchase.is_interstate,
      total_taxable: newPurchase.total_taxable,
      total_gst: newPurchase.total_gst,
      grand_total: newPurchase.grand_total,
      payment_status: newPurchase.payment_status,
      amount_paid: newPurchase.amount_paid,
      amount_due: newPurchase.amount_due,
      notes: newPurchase.notes || null,
      status: 'active',
      created_at: now,
      updated_at: now
    };
    if (userId) purchaseHeaderDb.user_id = userId;

    const purchaseLinesDb = purchaseLines.map(line => ({
      id: line.id,
      purchase_id: purchaseId,
      item_id: isValidUUID(line.item_id) ? line.item_id : null,
      item_name: line.item_name,
      quantity: line.quantity,
      unit_purchase_rate: line.unit_purchase_rate,
      gst_rate: line.gst_rate,
      taxable_amount: line.taxable_amount,
      gst_amount: line.gst_amount,
      line_total: line.line_total,
      created_at: now
    }));

    const client = getSupabaseClient();
    if (client) {
      const itemsPayload = affectedItems.map(item => ({
        id: item.id,
        ...(userId ? { user_id: userId } : {}),
        name: item.name,
        sku: item.sku || null,
        category: item.category,
        purchase_rate: item.purchase_rate,
        default_sale_rate: item.default_sale_rate,
        current_stock: item.current_stock,
        opening_stock: item.opening_stock,
        low_stock_threshold: item.low_stock_threshold,
        description: item.description || null,
        is_archived: item.is_archived,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      const { error: itemsErr } = await client.from('items').upsert(itemsPayload);
      if (itemsErr) {
        console.error('Supabase items upsert error:', itemsErr);
        throw new Error('Failed to update item stock in database: ' + itemsErr.message);
      }

      const { error: purErr } = await client.from('purchases').insert(purchaseHeaderDb);
      if (purErr) {
        console.error('Supabase purchases insert error:', purErr);
        throw new Error('Failed to save purchase bill in database: ' + purErr.message);
      }

      const { error: linesErr } = await client.from('purchase_items').insert(purchaseLinesDb);
      if (linesErr) {
        console.error('Supabase purchase_items insert error:', linesErr);
        await client.from('purchases').delete().eq('id', purchaseId);
        throw new Error('Failed to save purchase line items: ' + linesErr.message);
      }
    }

    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    const purchases = await this.getPurchases();
    purchases.unshift(newPurchase);
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);

    return newPurchase;
  }

  async deletePurchase(purchaseId: string): Promise<void> {
    const purchases = await this.getPurchases();
    const purchaseIndex = purchases.findIndex(p => p.id === purchaseId);
    if (purchaseIndex === -1) throw new Error('Purchase bill not found');

    const purchase = purchases[purchaseIndex];
    const items = await this.getItems();
    const itemMap = new Map(items.map(i => [i.id, i]));
    const now = new Date().toISOString();
    const affectedItems: Item[] = [];

    if (purchase.items && purchase.items.length > 0) {
      for (const line of purchase.items) {
        let item: Item | undefined = line.item_id ? itemMap.get(line.item_id) : undefined;
        if (!item) {
          item = items.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        }
        if (item && item.current_stock < line.quantity) {
          throw new Error(
            'Cannot delete purchase bill: ' + (line.quantity - item.current_stock) + ' pieces of "' + item.name + '" have already been sold or transferred. Reversing this bill would cause negative stock (' + (item.current_stock - line.quantity) + ').'
          );
        }
      }

      for (const line of purchase.items) {
        let item: Item | undefined = line.item_id ? itemMap.get(line.item_id) : undefined;
        if (!item) {
          item = items.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        }
        if (item) {
          item.current_stock = Math.max(0, item.current_stock - line.quantity);
          item.updated_at = now;
          if (!affectedItems.some(i => i.id === item!.id)) {
            affectedItems.push(item);
          }
        }
      }
    }

    const client = getSupabaseClient();
    if (client && isValidUUID(purchaseId)) {
      const { error: lineErr } = await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
      if (lineErr) console.warn('Supabase delete purchase_items notice:', lineErr);

      const { error: purErr } = await client.from('purchases').delete().eq('id', purchaseId);
      if (purErr) throw new Error('Failed to delete purchase from database: ' + purErr.message);

      if (affectedItems.length > 0) {
        const userId = await this.getUserId();
        const itemsPayload = affectedItems.map(item => ({
          id: item.id,
          ...(userId ? { user_id: userId } : {}),
          name: item.name,
          sku: item.sku || null,
          category: item.category,
          purchase_rate: item.purchase_rate,
          default_sale_rate: item.default_sale_rate,
          current_stock: item.current_stock,
          opening_stock: item.opening_stock,
          low_stock_threshold: item.low_stock_threshold,
          description: item.description || null,
          is_archived: item.is_archived,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        await client.from('items').upsert(itemsPayload);
      }
    }

    this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    purchases.splice(purchaseIndex, 1);
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);
  }

  async updatePurchase(
    purchaseId: string,
    purchaseData: {
      purchase_date: string;
      supplier_name: string;
      supplier_gstin?: string;
      supplier_invoice_number: string;
      is_interstate?: boolean;
      notes?: string;
      amount_paid?: number;
      items: Array<{
        item_id?: string;
        item_name: string;
        category?: string;
        quantity: number;
        unit_purchase_rate: number;
        gst_rate?: number;
      }>;
    }
  ): Promise<Purchase> {
    const purchases = await this.getPurchases();
    const purchaseIndex = purchases.findIndex(p => p.id === purchaseId);
    if (purchaseIndex === -1) throw new Error('Purchase bill not found');

    const existingPurchase = purchases[purchaseIndex];
    const allItems = await this.getItems();
    const itemMap = new Map(allItems.map(i => [i.id, i]));
    const now = new Date().toISOString();

    if (existingPurchase.items && existingPurchase.items.length > 0) {
      for (const line of existingPurchase.items) {
        let it = line.item_id ? itemMap.get(line.item_id) : undefined;
        if (!it) {
          it = allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        }
        if (it) {
          it.current_stock -= line.quantity;
        }
      }
    }

    for (const line of purchaseData.items) {
      let it = line.item_id ? itemMap.get(line.item_id) : undefined;
      if (!it) {
        it = allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
      }
      if (it && (it.current_stock + line.quantity < 0)) {
        if (existingPurchase.items) {
          for (const oldLine of existingPurchase.items) {
            let oit = oldLine.item_id ? itemMap.get(oldLine.item_id) : undefined;
            if (oit) oit.current_stock += oldLine.quantity;
          }
        }
        throw new Error(
          'Cannot update purchase: Reversing original stock would cause negative inventory for "' + it.name + '". Some pieces were already sold or moved.'
        );
      }
    }

    let totalTaxable = 0;
    let totalGst = 0;
    const purchaseLines: PurchaseItem[] = [];
    const affectedItems: Item[] = [];

    for (const line of purchaseData.items) {
      const qty = Number(line.quantity) || 0;
      const rate = Number(line.unit_purchase_rate) || 0;
      const gstRate = line.gst_rate !== undefined ? Number(line.gst_rate) : 3;

      const lineTaxable = Math.round(qty * rate * 100) / 100;
      const lineGst = Math.round(lineTaxable * (gstRate / 100) * 100) / 100;
      const lineTotal = Math.round((lineTaxable + lineGst) * 100) / 100;

      totalTaxable += lineTaxable;
      totalGst += lineGst;

      let matchedItem = line.item_id ? itemMap.get(line.item_id) : undefined;
      if (!matchedItem) {
        matchedItem = allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
      }

      if (!matchedItem) {
        matchedItem = {
          id: generateUUID(),
          name: line.item_name.trim(),
          category: line.category || 'General',
          purchase_rate: rate,
          default_sale_rate: Math.round(rate * 1.35 * 100) / 100,
          opening_stock: 0,
          current_stock: qty,
          low_stock_threshold: 5,
          is_archived: false,
          created_at: now,
          updated_at: now
        };
        allItems.push(matchedItem);
        affectedItems.push(matchedItem);
      } else {
        const currentStock = Math.max(0, matchedItem.current_stock);
        const currentRate = Number(matchedItem.purchase_rate) || 0;
        let newWeightedCost = rate;
        if (currentStock > 0) {
          newWeightedCost = ((currentStock * currentRate) + (qty * rate)) / (currentStock + qty);
        }
        matchedItem.purchase_rate = Math.round(newWeightedCost * 100) / 100;
        matchedItem.current_stock += qty;
        matchedItem.updated_at = now;
        if (!affectedItems.some(i => i.id === matchedItem!.id)) {
          affectedItems.push(matchedItem);
        }
      }

      purchaseLines.push({
        id: generateUUID(),
        purchase_id: purchaseId,
        item_id: matchedItem.id,
        item_name: matchedItem.name,
        quantity: qty,
        unit_purchase_rate: rate,
        gst_rate: gstRate,
        taxable_amount: lineTaxable,
        gst_amount: lineGst,
        line_total: lineTotal
      });
    }

    const grandTotal = Math.round((totalTaxable + totalGst) * 100) / 100;
    const amountPaid = Math.min(grandTotal, Number(purchaseData.amount_paid ?? existingPurchase.amount_paid) || 0);
    const amountDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Paid';
    if (amountPaid <= 0) paymentStatus = 'Unpaid';
    else if (amountPaid < grandTotal) paymentStatus = 'Partially Paid';

    const updatedPurchase: Purchase = {
      ...existingPurchase,
      purchase_date: purchaseData.purchase_date,
      supplier_name: purchaseData.supplier_name.trim(),
      supplier_gstin: purchaseData.supplier_gstin?.trim() || undefined,
      supplier_invoice_number: purchaseData.supplier_invoice_number.trim(),
      is_interstate: !!purchaseData.is_interstate,
      total_taxable: totalTaxable,
      total_gst: totalGst,
      grand_total: grandTotal,
      payment_status: paymentStatus,
      amount_paid: amountPaid,
      amount_due: amountDue,
      notes: purchaseData.notes?.trim() || undefined,
      updated_at: now,
      items: purchaseLines
    };

    const client = getSupabaseClient();
    if (client && isValidUUID(purchaseId)) {
      const userId = await this.getUserId();
      const purchaseHeaderDb: any = {
        purchase_date: updatedPurchase.purchase_date,
        supplier_name: updatedPurchase.supplier_name,
        supplier_gstin: updatedPurchase.supplier_gstin || null,
        supplier_invoice_number: updatedPurchase.supplier_invoice_number,
        is_interstate: updatedPurchase.is_interstate,
        total_taxable: updatedPurchase.total_taxable,
        total_gst: updatedPurchase.total_gst,
        grand_total: updatedPurchase.grand_total,
        payment_status: updatedPurchase.payment_status,
        amount_paid: updatedPurchase.amount_paid,
        amount_due: updatedPurchase.amount_due,
        notes: updatedPurchase.notes || null,
        updated_at: now
      };
      if (userId) purchaseHeaderDb.user_id = userId;

      const purchaseLinesDb = purchaseLines.map(line => ({
        id: line.id,
        purchase_id: purchaseId,
        item_id: isValidUUID(line.item_id) ? line.item_id : null,
        item_name: line.item_name,
        quantity: line.quantity,
        unit_purchase_rate: line.unit_purchase_rate,
        gst_rate: line.gst_rate,
        taxable_amount: line.taxable_amount,
        gst_amount: line.gst_amount,
        line_total: line.line_total,
        created_at: now
      }));

      await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
      await client.from('purchase_items').insert(purchaseLinesDb);
      await client.from('purchases').update(purchaseHeaderDb).eq('id', purchaseId);

      if (affectedItems.length > 0) {
        const itemsPayload = affectedItems.map(item => ({
          id: item.id,
          ...(userId ? { user_id: userId } : {}),
          name: item.name,
          sku: item.sku || null,
          category: item.category,
          purchase_rate: item.purchase_rate,
          default_sale_rate: item.default_sale_rate,
          current_stock: item.current_stock,
          opening_stock: item.opening_stock,
          low_stock_threshold: item.low_stock_threshold,
          description: item.description || null,
          is_archived: item.is_archived,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        await client.from('items').upsert(itemsPayload);
      }
    }

    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    purchases[purchaseIndex] = updatedPurchase;
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);

    return updatedPurchase;
  }

  // --- WHOLESALE SALES & BILLING ---
  async getSales(): Promise<Sale[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('sales')
          .select('*, items:sale_items(*), payments:sale_payments(*)')
          .order('sale_date', { ascending: false });
        if (!error && data) {
          const mapped: Sale[] = data.map((s: any) => {
            const decoded = decodeSalesNotes(s.notes);
            return {
              ...s,
              notes: decoded.notes,
              party_id: s.party_id || decoded.party_id,
              state_id: s.state_id || decoded.state_id,
              items: s.items || [],
              payments: s.payments || []
            };
          });
          this.saveToLocal(STORAGE_KEYS.SALES, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Failed to fetch sales from Supabase:', err);
      }
    }
    let local = this.getFromLocal<Sale[] | null>(STORAGE_KEYS.SALES, null);
    if (!local) {
      local = INITIAL_SEED_SALES;
      this.saveToLocal(STORAGE_KEYS.SALES, local);
    }
    return local.map(s => ({
      ...s,
      payments: s.payments || (s.amount_received > 0 ? [{
        id: generateUUID(),
        sale_id: s.id,
        payment_date: s.sale_date,
        amount: s.amount_received,
        payment_method: s.payment_method || 'Cash',
        notes: 'Initial recorded payment',
        created_at: s.created_at
      }] : [])
    }));
  }

  async createSale(
    saleData: {
      sale_date: string;
      invoice_number: string;
      customer_name: string;
      party_id?: string;
      state_id?: string;
      deduct_from_party_stock?: boolean;
      buyer_gstin?: string;
      buyer_address?: string;
      customer_phone?: string;
      is_interstate: boolean;
      payment_method?: string;
      payment_status?: PaymentStatus;
      amount_received: number;
      notes?: string;
    },
    itemsData: Array<{
      item_id: string;
      item_name: string;
      quantity: number;
      unit_sale_rate: number;
      gst_rate?: number;
    }>
  ): Promise<Sale> {
    if (!itemsData || itemsData.length === 0) {
      throw new Error('Invoice must contain at least one item.');
    }

    const allItems = await this.getItems();
    const itemMap = new Map(allItems.map(i => [i.id, i]));
    const now = new Date().toISOString();
    const saleId = generateUUID();
    const userId = await this.getUserId();

    const isFromPartyStock = Boolean(saleData.deduct_from_party_stock && saleData.party_id);
    if (isFromPartyStock) {
      const partyTransfers = (await this.getStockTransfers()).filter(t => t.destination_party_id === saleData.party_id);
      const existingSales = (await this.getSales()).filter(s => s.party_id === saleData.party_id && s.deduct_from_party_stock && s.status === 'completed');

      for (const line of itemsData) {
        let issued = 0;
        let returned = 0;
        let alreadySold = 0;

        partyTransfers.forEach(t => {
          if (t.item_id === line.item_id) {
            if (t.transfer_type === 'issue') issued += t.quantity;
            else returned += t.quantity;
          }
        });

        existingSales.forEach(s => {
          s.items?.forEach(si => {
            if (si.item_id === line.item_id) alreadySold += si.quantity;
          });
        });

        const partyHeldStock = Math.max(0, issued - returned - alreadySold);
        if (partyHeldStock < line.quantity) {
          throw new Error('Insufficient stock held by party for "' + line.item_name + '". Party has: ' + partyHeldStock + ', Requested: ' + line.quantity + '.');
        }
      }
    } else {
      for (const line of itemsData) {
        const item = itemMap.get(line.item_id) || allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        if (!item) throw new Error('Item "' + line.item_name + '" not found in inventory.');
        if (item.current_stock < line.quantity) {
          throw new Error('Insufficient stock for "' + item.name + '". Available: ' + item.current_stock + ', Requested: ' + line.quantity + '.');
        }
      }
    }

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalCost = 0;

    const isInterstate = !!saleData.is_interstate;

    const saleLines: SaleItem[] = itemsData.map((line) => {
      const item = itemMap.get(line.item_id) || allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim()) || {
        id: line.item_id,
        name: line.item_name,
        purchase_rate: 0
      } as Item;
      const gstRate = Number(line.gst_rate ?? 3.00);
      const lineTaxable = Math.round(line.quantity * line.unit_sale_rate * 100) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let lineGst = 0;

      if (isInterstate) {
        igst = Math.round((lineTaxable * (gstRate / 100)) * 100) / 100;
        lineGst = igst;
        totalIgst += igst;
      } else {
        cgst = Math.round((lineTaxable * (gstRate / 200)) * 100) / 100;
        sgst = Math.round((lineTaxable * (gstRate / 200)) * 100) / 100;
        lineGst = cgst + sgst;
        totalCgst += cgst;
        totalSgst += sgst;
      }

      const lineTotal = Math.round((lineTaxable + lineGst) * 100) / 100;
      const unitCost = Number(item.purchase_rate) || 0;
      const lineCost = Math.round(line.quantity * unitCost * 100) / 100;
      const lineProfit = Math.round((lineTaxable - lineCost) * 100) / 100;

      totalTaxable += lineTaxable;
      totalGst += lineGst;
      totalCost += lineCost;

      return {
        id: generateUUID(),
        sale_id: saleId,
        item_id: item.id,
        item_name: item.name,
        quantity: line.quantity,
        unit_cost: unitCost,
        unit_sale_rate: line.unit_sale_rate,
        gst_rate: gstRate,
        taxable_amount: lineTaxable,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        gst_amount: lineGst,
        line_total: lineTotal,
        line_cost: lineCost,
        line_profit: lineProfit
      };
    });

    const grandTotal = Math.round((totalTaxable + totalGst) * 100) / 100;
    const grossProfit = Math.round((totalTaxable - totalCost) * 100) / 100;

    const rawReceived = Number(saleData.amount_received) || 0;
    if (rawReceived < 0) {
      throw new Error('Payment received cannot be negative.');
    }
    if (rawReceived > grandTotal) {
      throw new Error('Payment received (₹' + rawReceived + ') cannot exceed invoice total (₹' + grandTotal + ').');
    }

    const amountReceived = Math.round(rawReceived * 100) / 100;
    const amountDue = Math.max(0, Math.round((grandTotal - amountReceived) * 100) / 100);

    let paymentStatus: PaymentStatus = 'Due Balance';
    if (amountDue === 0 && grandTotal > 0) {
      paymentStatus = 'Payment Complete';
    } else if (saleData.payment_status === 'Advance Paid' && amountReceived > 0) {
      paymentStatus = 'Advance Paid';
    } else if (saleData.payment_status === 'Payment Complete' && amountDue > 0) {
      throw new Error('Cannot save as "Payment Complete" while an outstanding balance of ₹' + amountDue + ' remains.');
    } else {
      paymentStatus = 'Due Balance';
    }

    const affectedItems: Item[] = [];
    if (!isFromPartyStock) {
      for (const line of itemsData) {
        const item = itemMap.get(line.item_id) || allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        if (item) {
          item.current_stock -= line.quantity;
          item.updated_at = now;
          if (!affectedItems.some(i => i.id === item.id)) {
            affectedItems.push(item);
          }
        }
      }
    }

    const initialPayments: SalePayment[] = [];
    if (amountReceived > 0) {
      initialPayments.push({
        id: generateUUID(),
        sale_id: saleId,
        payment_date: saleData.sale_date,
        amount: amountReceived,
        payment_method: saleData.payment_method || 'Cash',
        notes: paymentStatus === 'Advance Paid' ? 'Advance Payment' : 'Initial Payment',
        created_at: now
      });
    }

    const newSale: Sale = {
      id: saleId,
      invoice_number: saleData.invoice_number,
      sale_date: saleData.sale_date,
      customer_name: saleData.customer_name.trim(),
      party_id: isValidUUID(saleData.party_id) ? saleData.party_id : undefined,
      state_id: isValidUUID(saleData.state_id) ? saleData.state_id : undefined,
      deduct_from_party_stock: isFromPartyStock,
      buyer_gstin: saleData.buyer_gstin?.trim() || undefined,
      buyer_address: saleData.buyer_address?.trim() || undefined,
      customer_phone: saleData.customer_phone?.trim() || undefined,
      is_interstate: isInterstate,
      payment_method: saleData.payment_method || 'Cash',
      payment_status: paymentStatus,
      total_taxable: totalTaxable,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_igst: totalIgst,
      total_gst: totalGst,
      grand_total: grandTotal,
      total_cost: totalCost,
      gross_profit: grossProfit,
      amount_received: amountReceived,
      amount_due: amountDue,
      notes: saleData.notes?.trim() || undefined,
      status: 'completed',
      created_at: now,
      updated_at: now,
      items: saleLines,
      payments: initialPayments
    };

    const saleHeaderDb: any = {
      id: saleId,
      invoice_number: newSale.invoice_number,
      sale_date: newSale.sale_date,
      customer_name: newSale.customer_name,
      buyer_gstin: newSale.buyer_gstin || null,
      buyer_address: newSale.buyer_address || null,
      customer_phone: newSale.customer_phone || null,
      is_interstate: newSale.is_interstate,
      payment_method: newSale.payment_method,
      payment_status: newSale.payment_status,
      total_taxable: newSale.total_taxable,
      total_cgst: newSale.total_cgst,
      total_sgst: newSale.total_sgst,
      total_igst: newSale.total_igst,
      total_gst: newSale.total_gst,
      grand_total: newSale.grand_total,
      total_cost: newSale.total_cost,
      gross_profit: newSale.gross_profit,
      amount_received: newSale.amount_received,
      amount_due: newSale.amount_due,
      notes: encodeSalesNotes(newSale.notes, newSale.party_id, newSale.state_id),
      status: 'completed',
      created_at: now,
      updated_at: now
    };
    if (userId) saleHeaderDb.user_id = userId;

    const saleLinesDb = saleLines.map(line => ({
      id: line.id,
      sale_id: saleId,
      item_id: isValidUUID(line.item_id) ? line.item_id : null,
      item_name: line.item_name,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      unit_sale_rate: line.unit_sale_rate,
      gst_rate: line.gst_rate,
      taxable_amount: line.taxable_amount,
      cgst_amount: line.cgst_amount,
      sgst_amount: line.sgst_amount,
      igst_amount: line.igst_amount,
      gst_amount: line.gst_amount,
      line_total: line.line_total,
      line_cost: line.line_cost,
      line_profit: line.line_profit,
      created_at: now
    }));

    const client = getSupabaseClient();
    if (client) {
      const { error: saleErr } = await client.from('sales').insert(saleHeaderDb);
      if (saleErr) {
        console.error('Supabase sales insert error:', saleErr);
        throw new Error('Failed to save sale invoice in database: ' + saleErr.message);
      }

      const { error: linesErr } = await client.from('sale_items').insert(saleLinesDb);
      if (linesErr) {
        console.error('Supabase sale_items insert error:', linesErr);
        await client.from('sales').delete().eq('id', saleId);
        throw new Error('Failed to save sale items in database: ' + linesErr.message);
      }

      if (initialPayments.length > 0) {
        const paymentDb = {
          id: initialPayments[0].id,
          sale_id: saleId,
          payment_date: initialPayments[0].payment_date,
          amount: initialPayments[0].amount,
          payment_method: initialPayments[0].payment_method,
          notes: initialPayments[0].notes || null,
          created_at: now
        };
        const { error: payErr } = await client.from('sale_payments').insert(paymentDb);
        if (payErr) console.warn('Supabase sale_payments notice:', payErr);
      }

      if (affectedItems.length > 0) {
        const itemsPayload = affectedItems.map(item => ({
          id: item.id,
          ...(userId ? { user_id: userId } : {}),
          name: item.name,
          sku: item.sku || null,
          category: item.category,
          purchase_rate: item.purchase_rate,
          default_sale_rate: item.default_sale_rate,
          current_stock: item.current_stock,
          opening_stock: item.opening_stock,
          low_stock_threshold: item.low_stock_threshold,
          description: item.description || null,
          is_archived: item.is_archived,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        await client.from('items').upsert(itemsPayload);
      }
    }

    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    const sales = await this.getSales();
    sales.unshift(newSale);
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    const settings = await this.getSettings();
    await this.updateSettings({ next_invoice_number: settings.next_invoice_number + 1 });

    return newSale;
  }

  async recordSalePayment(
    saleId: string,
    amount: number,
    paymentMethod: string = 'Cash',
    paymentDate?: string,
    notes?: string
  ): Promise<Sale> {
    const rawAmount = Number(amount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const sales = await this.getSales();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale invoice not found.');

    const sale = sales[saleIndex];
    if (sale.status === 'voided') {
      throw new Error('Cannot add payment to a voided invoice.');
    }

    const currentDue = sale.amount_due !== undefined ? sale.amount_due : Math.max(0, sale.grand_total - (sale.amount_received || 0));
    if (currentDue <= 0) {
      throw new Error('This invoice is already fully paid.');
    }

    if (rawAmount > currentDue + 0.01) {
      throw new Error('Payment amount (₹' + rawAmount + ') cannot exceed outstanding due balance (₹' + currentDue + ').');
    }

    const now = new Date().toISOString();
    const appliedAmount = Math.min(rawAmount, currentDue);
    const paymentId = generateUUID();

    const paymentRecord: SalePayment = {
      id: paymentId,
      sale_id: saleId,
      payment_date: paymentDate ? new Date(paymentDate).toISOString() : now,
      amount: appliedAmount,
      payment_method: paymentMethod || 'Cash',
      notes: notes?.trim() || undefined,
      created_at: now
    };

    const existingPayments = sale.payments || [];
    const updatedPayments = [...existingPayments, paymentRecord];
    const totalReceived = Math.round(updatedPayments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const newDue = Math.max(0, Math.round((sale.grand_total - totalReceived) * 100) / 100);

    let newStatus: PaymentStatus = 'Due Balance';
    if (newDue <= 0.001) {
      newStatus = 'Payment Complete';
    } else {
      newStatus = 'Due Balance';
    }

    const updatedSale: Sale = {
      ...sale,
      payments: updatedPayments,
      amount_received: totalReceived,
      amount_due: newDue,
      payment_status: newStatus,
      updated_at: now
    };

    sales[saleIndex] = updatedSale;
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    const client = getSupabaseClient();
    if (client && isValidUUID(saleId)) {
      await client.from('sale_payments').insert({
        id: paymentId,
        sale_id: saleId,
        payment_date: paymentRecord.payment_date,
        amount: paymentRecord.amount,
        payment_method: paymentRecord.payment_method,
        notes: paymentRecord.notes || null,
        created_at: now
      });
      await client.from('sales').update({
        amount_received: totalReceived,
        amount_due: newDue,
        payment_status: newStatus,
        updated_at: now
      }).eq('id', saleId);
    }

    return updatedSale;
  }

  async voidSale(saleId: string, reason: string): Promise<void> {
    const sales = await this.getSales();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale not found');

    const sale = sales[saleIndex];
    if (sale.status === 'voided') throw new Error('Sale is already voided');

    const items = await this.getItems();
    const itemMap = new Map(items.map(i => [i.id, i]));
    const now = new Date().toISOString();
    const affectedItems: Item[] = [];

    if (sale.items) {
      for (const line of sale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
          item.updated_at = now;
          if (!affectedItems.some(i => i.id === item.id)) {
            affectedItems.push(item);
          }
        }
      }
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    }

    sale.status = 'voided';
    sale.void_reason = reason;
    sale.updated_at = now;
    sales[saleIndex] = sale;
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    const client = getSupabaseClient();
    if (client && isValidUUID(saleId)) {
      await client.from('sales').update({ status: 'voided', void_reason: reason, updated_at: now }).eq('id', saleId);
      if (affectedItems.length > 0) {
        const userId = await this.getUserId();
        const itemsPayload = affectedItems.map(item => ({
          id: item.id,
          ...(userId ? { user_id: userId } : {}),
          name: item.name,
          sku: item.sku || null,
          category: item.category,
          purchase_rate: item.purchase_rate,
          default_sale_rate: item.default_sale_rate,
          current_stock: item.current_stock,
          opening_stock: item.opening_stock,
          low_stock_threshold: item.low_stock_threshold,
          description: item.description || null,
          is_archived: item.is_archived,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        await client.from('items').upsert(itemsPayload);
      }
    }
  }

  async updateSale(
    saleId: string,
    saleData: {
      sale_date: string;
      customer_name: string;
      party_id?: string;
      state_id?: string;
      deduct_from_party_stock?: boolean;
      customer_phone?: string;
      is_interstate?: boolean;
      payment_method?: string;
      payment_option?: 'Advance Paid' | 'Due Balance' | 'Payment Complete';
      amount_received?: number;
      notes?: string;
      items: Array<{
        item_id: string;
        item_name?: string;
        quantity: number;
        unit_sale_rate: number;
        gst_rate?: number;
      }>;
    }
  ): Promise<Sale> {
    const sales = await this.getSales();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale not found');

    const existingSale = sales[saleIndex];
    const allItems = await this.getItems();
    const itemMap = new Map(allItems.map(i => [i.id, i]));
    const now = new Date().toISOString();

    const wasFromPartyStock = existingSale.deduct_from_party_stock;
    if (existingSale.status !== 'voided' && !wasFromPartyStock && existingSale.items) {
      for (const line of existingSale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
        }
      }
    }

    const isFromPartyStock = !!saleData.deduct_from_party_stock;
    if (!isFromPartyStock) {
      for (const line of saleData.items) {
        const item = itemMap.get(line.item_id);
        if (!item) throw new Error('Item not found in inventory: ' + (line.item_name || line.item_id));
        if (item.current_stock < line.quantity) {
          if (existingSale.status !== 'voided' && !wasFromPartyStock && existingSale.items) {
            for (const oldLine of existingSale.items) {
              if (oldLine.item_id && itemMap.has(oldLine.item_id)) {
                itemMap.get(oldLine.item_id)!.current_stock -= oldLine.quantity;
              }
            }
          }
          throw new Error(
            'Insufficient stock for "' + item.name + '". Available: ' + item.current_stock + ' pcs, Requested: ' + line.quantity + ' pcs.'
          );
        }
      }

      for (const line of saleData.items) {
        const item = itemMap.get(line.item_id);
        if (item) {
          item.current_stock -= line.quantity;
          item.updated_at = now;
        }
      }
    }

    const isInterstate = Boolean(saleData.is_interstate);
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCost = 0;
    const saleLines: SaleItem[] = [];

    const oldLineCostMap = new Map(existingSale.items?.map(i => [i.item_id, i.unit_cost]) || []);

    for (const line of saleData.items) {
      const item = itemMap.get(line.item_id);
      const itemName = line.item_name || item?.name || 'Jewellery Item';
      const qty = Number(line.quantity) || 1;
      const rate = Number(line.unit_sale_rate) || 0;
      const unitCost = oldLineCostMap.has(line.item_id) ? oldLineCostMap.get(line.item_id)! : (item?.purchase_rate || 0);
      const gstRate = line.gst_rate !== undefined ? Number(line.gst_rate) : 3;

      const taxable = Math.round(qty * rate * 100) / 100;
      const lineCost = Math.round(qty * unitCost * 100) / 100;
      const lineProfit = Math.round((taxable - lineCost) * 100) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      if (isInterstate) {
        igst = Math.round((taxable * (gstRate / 100)) * 100) / 100;
      } else {
        cgst = Math.round((taxable * (gstRate / 200)) * 100) / 100;
        sgst = Math.round((taxable * (gstRate / 200)) * 100) / 100;
      }
      const lineGst = cgst + sgst + igst;
      const lineTotal = Math.round((taxable + lineGst) * 100) / 100;

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCost += lineCost;

      saleLines.push({
        id: generateUUID(),
        sale_id: saleId,
        item_id: line.item_id,
        item_name: itemName,
        quantity: qty,
        unit_cost: unitCost,
        unit_sale_rate: rate,
        gst_rate: gstRate,
        taxable_amount: taxable,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        gst_amount: lineGst,
        line_total: lineTotal,
        line_cost: lineCost,
        line_profit: lineProfit
      });
    }

    const totalGst = totalCgst + totalSgst + totalIgst;
    const grandTotal = Math.round((totalTaxable + totalGst) * 100) / 100;
    const grossProfit = Math.round((totalTaxable - totalCost) * 100) / 100;

    let amountReceived = 0;
    let paymentStatus: PaymentStatus = 'Due Balance';
    if (saleData.payment_option === 'Payment Complete') {
      amountReceived = grandTotal;
      paymentStatus = 'Payment Complete';
    } else if (saleData.payment_option === 'Advance Paid') {
      amountReceived = Math.min(grandTotal, Number(saleData.amount_received) || 0);
      paymentStatus = amountReceived >= grandTotal ? 'Payment Complete' : 'Advance Paid';
    } else {
      amountReceived = Math.min(grandTotal, Number(saleData.amount_received) || 0);
      paymentStatus = amountReceived >= grandTotal ? 'Payment Complete' : 'Due Balance';
    }
    const amountDue = Math.max(0, Math.round((grandTotal - amountReceived) * 100) / 100);

    const payments: SalePayment[] = [];
    if (amountReceived > 0) {
      payments.push({
        id: generateUUID(),
        sale_id: saleId,
        payment_date: saleData.sale_date,
        amount: amountReceived,
        payment_method: saleData.payment_method || 'Cash',
        notes: paymentStatus === 'Advance Paid' ? 'Advance Payment' : 'Recorded Payment',
        created_at: now
      });
    }

    const updatedSale: Sale = {
      ...existingSale,
      sale_date: saleData.sale_date,
      customer_name: saleData.customer_name.trim(),
      party_id: isValidUUID(saleData.party_id) ? saleData.party_id : undefined,
      state_id: isValidUUID(saleData.state_id) ? saleData.state_id : undefined,
      deduct_from_party_stock: isFromPartyStock,
      customer_phone: saleData.customer_phone?.trim() || undefined,
      is_interstate: isInterstate,
      payment_method: saleData.payment_method || 'Cash',
      payment_status: paymentStatus,
      total_taxable: totalTaxable,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_igst: totalIgst,
      total_gst: totalGst,
      grand_total: grandTotal,
      total_cost: totalCost,
      gross_profit: grossProfit,
      amount_received: amountReceived,
      amount_due: amountDue,
      notes: saleData.notes?.trim() || undefined,
      status: 'completed',
      updated_at: now,
      items: saleLines,
      payments
    };

    const client = getSupabaseClient();
    if (client && isValidUUID(saleId)) {
      const userId = await this.getUserId();
      const saleHeaderDb: any = {
        sale_date: updatedSale.sale_date,
        customer_name: updatedSale.customer_name,
        buyer_gstin: updatedSale.buyer_gstin || null,
        buyer_address: updatedSale.buyer_address || null,
        customer_phone: updatedSale.customer_phone || null,
        is_interstate: updatedSale.is_interstate,
        payment_method: updatedSale.payment_method,
        payment_status: updatedSale.payment_status,
        total_taxable: updatedSale.total_taxable,
        total_cgst: updatedSale.total_cgst,
        total_sgst: updatedSale.total_sgst,
        total_igst: updatedSale.total_igst,
        total_gst: updatedSale.total_gst,
        grand_total: updatedSale.grand_total,
        total_cost: updatedSale.total_cost,
        gross_profit: updatedSale.gross_profit,
        amount_received: updatedSale.amount_received,
        amount_due: updatedSale.amount_due,
        notes: encodeSalesNotes(updatedSale.notes, updatedSale.party_id, updatedSale.state_id),
        status: 'completed',
        updated_at: now
      };
      if (userId) saleHeaderDb.user_id = userId;

      const saleLinesDb = saleLines.map(line => ({
        id: line.id,
        sale_id: saleId,
        item_id: isValidUUID(line.item_id) ? line.item_id : null,
        item_name: line.item_name,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        unit_sale_rate: line.unit_sale_rate,
        gst_rate: line.gst_rate,
        taxable_amount: line.taxable_amount,
        cgst_amount: line.cgst_amount,
        sgst_amount: line.sgst_amount,
        igst_amount: line.igst_amount,
        gst_amount: line.gst_amount,
        line_total: line.line_total,
        line_cost: line.line_cost,
        line_profit: line.line_profit,
        created_at: now
      }));

      await client.from('sale_items').delete().eq('sale_id', saleId);
      await client.from('sale_payments').delete().eq('sale_id', saleId);
      await client.from('sales').update(saleHeaderDb).eq('id', saleId);
      await client.from('sale_items').insert(saleLinesDb);
      if (payments.length > 0) {
        await client.from('sale_payments').insert(payments.map(p => ({
          id: p.id,
          sale_id: saleId,
          payment_date: p.payment_date,
          amount: p.amount,
          payment_method: p.payment_method,
          notes: p.notes || null,
          created_at: now
        })));
      }
      const itemsPayload = allItems.map(item => ({
        id: item.id,
        ...(userId ? { user_id: userId } : {}),
        name: item.name,
        sku: item.sku || null,
        category: item.category,
        purchase_rate: item.purchase_rate,
        default_sale_rate: item.default_sale_rate,
        current_stock: item.current_stock,
        opening_stock: item.opening_stock,
        low_stock_threshold: item.low_stock_threshold,
        description: item.description || null,
        is_archived: item.is_archived,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      await client.from('items').upsert(itemsPayload);
    }

    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    sales[saleIndex] = updatedSale;
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    return updatedSale;
  }

  async deleteSale(saleId: string): Promise<void> {
    const sales = await this.getSales();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale not found');

    const sale = sales[saleIndex];
    const items = await this.getItems();
    const itemMap = new Map(items.map(i => [i.id, i]));
    const now = new Date().toISOString();
    const affectedItems: Item[] = [];

    if (sale.status !== 'voided' && !sale.deduct_from_party_stock && sale.items) {
      for (const line of sale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
          item.updated_at = now;
          if (!affectedItems.some(i => i.id === item.id)) {
            affectedItems.push(item);
          }
        }
      }
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    }

    const client = getSupabaseClient();
    if (client && isValidUUID(saleId)) {
      await client.from('sale_items').delete().eq('sale_id', saleId);
      await client.from('sale_payments').delete().eq('sale_id', saleId);
      await client.from('sales').delete().eq('id', saleId);
      if (affectedItems.length > 0) {
        const userId = await this.getUserId();
        const itemsPayload = affectedItems.map(item => ({
          id: item.id,
          ...(userId ? { user_id: userId } : {}),
          name: item.name,
          sku: item.sku || null,
          category: item.category,
          purchase_rate: item.purchase_rate,
          default_sale_rate: item.default_sale_rate,
          current_stock: item.current_stock,
          opening_stock: item.opening_stock,
          low_stock_threshold: item.low_stock_threshold,
          description: item.description || null,
          is_archived: item.is_archived,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        await client.from('items').upsert(itemsPayload);
      }
    }

    sales.splice(saleIndex, 1);
    this.saveToLocal(STORAGE_KEYS.SALES, sales);
  }

  // --- OPERATING EXPENSES ---
  async getExpenses(): Promise<Expense[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('expenses').select('*').order('expense_date', { ascending: false });
        if (!error && data) {
          this.saveToLocal(STORAGE_KEYS.EXPENSES, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to fetch expenses from Supabase:', err);
      }
    }
    let local = this.getFromLocal<Expense[] | null>(STORAGE_KEYS.EXPENSES, null);
    if (!local) {
      local = INITIAL_SEED_EXPENSES;
      this.saveToLocal(STORAGE_KEYS.EXPENSES, local);
    }
    return local;
  }

  async saveExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Expense> {
    const now = new Date().toISOString();
    const id = isValidUUID(expenseData.id) ? expenseData.id! : generateUUID();
    const userId = await this.getUserId();

    const expenseRecord: Expense = {
      id,
      expense_date: expenseData.expense_date,
      title: expenseData.title.trim(),
      category: expenseData.category || 'Other',
      amount: Number(expenseData.amount) || 0,
      payment_method: expenseData.payment_method || 'Cash',
      payment_status: expenseData.payment_status || 'Paid',
      notes: expenseData.notes || '',
      is_cancelled: expenseData.is_cancelled || false,
      created_at: now,
      updated_at: now
    };

    const client = getSupabaseClient();
    if (client) {
      const dbPayload: any = {
        ...expenseRecord
      };
      if (userId) dbPayload.user_id = userId;
      const { error } = await client.from('expenses').upsert(dbPayload);
      if (error) {
        console.error('Supabase expenses upsert error:', error);
        throw new Error('Failed to save expense: ' + error.message);
      }
    }

    const expenses = await this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index >= 0) expenses[index] = { ...expenses[index], ...expenseRecord, updated_at: now };
    else expenses.unshift(expenseRecord);
    this.saveToLocal(STORAGE_KEYS.EXPENSES, expenses);

    return expenseRecord;
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = await this.getExpenses();
    this.saveToLocal(STORAGE_KEYS.EXPENSES, expenses.filter(e => e.id !== id));
    const client = getSupabaseClient();
    if (client && isValidUUID(id)) {
      await client.from('expenses').delete().eq('id', id);
    }
  }

  // --- PERIOD-BASED INVENTORY MOVEMENT (OPENING + IN - OUT = CLOSING) ---
  async getStockMovementPeriod(startDate: Date, endDate: Date): Promise<StockMovementPeriod[]> {
    const items = await this.getItems();
    const purchases = await this.getPurchases();
    const sales = await this.getSales();
    const transfers = await this.getStockTransfers();

    return items.map(item => {
      let purchasedInPeriod = 0;
      let soldInPeriod = 0;
      let transfersIssuedInPeriod = 0;
      let transfersReturnedInPeriod = 0;

      purchases.forEach(p => {
        if (p.status !== 'active') return;
        const pDate = new Date(p.purchase_date);
        if (pDate >= startDate && pDate <= endDate) {
          p.items?.forEach(line => {
            if (line.item_id === item.id || line.item_name.toLowerCase() === item.name.toLowerCase()) {
              purchasedInPeriod += line.quantity;
            }
          });
        }
      });

      sales.forEach(s => {
        if (s.status !== 'completed') return;
        const sDate = new Date(s.sale_date);
        if (sDate >= startDate && sDate <= endDate) {
          s.items?.forEach(line => {
            if (line.item_id === item.id || line.item_name.toLowerCase() === item.name.toLowerCase()) {
              if (!s.deduct_from_party_stock) {
                soldInPeriod += line.quantity;
              }
            }
          });
        }
      });

      transfers.forEach(t => {
        if (t.item_id === item.id) {
          const tDate = new Date(t.transfer_date);
          if (tDate >= startDate && tDate <= endDate) {
            if (t.transfer_type === 'issue') {
              transfersIssuedInPeriod += t.quantity;
            } else {
              transfersReturnedInPeriod += t.quantity;
            }
          }
        }
      });

      const openingStock = item.opening_stock || 0;
      const currentStock = item.current_stock;
      const stockValuation = currentStock * item.purchase_rate;

      return {
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        opening_stock: openingStock,
        purchased_qty: purchasedInPeriod,
        transfers_returned_qty: transfersReturnedInPeriod,
        sold_qty: soldInPeriod,
        transfers_issued_qty: transfersIssuedInPeriod,
        current_stock: currentStock,
        purchase_rate: item.purchase_rate,
        default_sale_rate: item.default_sale_rate,
        stock_value: stockValuation
      };
    });
  }

  // --- STATES & PARTIES (MULTI-STATE MANAGEMENT) ---
  async getStates(): Promise<StateRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('states').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          this.saveToLocal(STORAGE_KEYS.STATES, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load states from Supabase:', err);
      }
    }
    let local = this.getFromLocal<StateRecord[] | null>(STORAGE_KEYS.STATES, null);
    if (!local) {
      local = INITIAL_SEED_STATES;
      this.saveToLocal(STORAGE_KEYS.STATES, local);
    }
    return local;
  }

  async saveState(stateData: { id?: string; name: string; notes?: string }): Promise<StateRecord> {
    const name = stateData.name.trim();
    if (!name) throw new Error('State name is required.');
    const states = await this.getStates();
    const existing = states.find(
      s => s.name.toLowerCase() === name.toLowerCase() && s.id !== stateData.id && !s.is_archived
    );
    if (existing) {
      throw new Error('State "' + name + '" already exists.');
    }

    const now = new Date().toISOString();
    const id = isValidUUID(stateData.id) ? stateData.id! : generateUUID();
    const userId = await this.getUserId();
    const record: StateRecord = {
      id,
      name,
      notes: stateData.notes?.trim() || undefined,
      is_archived: false,
      created_at: now,
      updated_at: now
    };

    const client = getSupabaseClient();
    if (client) {
      const dbPayload: any = {
        id: record.id,
        name: record.name,
        notes: record.notes || null,
        is_archived: record.is_archived,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      if (userId) dbPayload.user_id = userId;
      const { error } = await client.from('states').upsert(dbPayload);
      if (error) {
        console.error('Supabase states upsert error:', error);
        throw new Error('Failed to save state in database: ' + error.message);
      }
    }

    const index = states.findIndex(s => s.id === id);
    if (index >= 0) {
      states[index] = { ...states[index], ...record, updated_at: now };
    } else {
      states.push(record);
    }
    this.saveToLocal(STORAGE_KEYS.STATES, states);

    return record;
  }

  async archiveState(id: string): Promise<void> {
    const states = await this.getStates();
    const index = states.findIndex(s => s.id === id);
    if (index >= 0) {
      states[index].is_archived = true;
      states[index].updated_at = new Date().toISOString();
      this.saveToLocal(STORAGE_KEYS.STATES, states);
      const client = getSupabaseClient();
      if (client && isValidUUID(id)) {
        await client.from('states').update({ is_archived: true }).eq('id', id);
      }
    }
  }

  async getParties(): Promise<PartyRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('parties').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          this.saveToLocal(STORAGE_KEYS.PARTIES, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load parties from Supabase:', err);
      }
    }
    let local = this.getFromLocal<PartyRecord[] | null>(STORAGE_KEYS.PARTIES, null);
    if (!local) {
      local = INITIAL_SEED_PARTIES;
      this.saveToLocal(STORAGE_KEYS.PARTIES, local);
    }
    return local;
  }

  async saveParty(partyData: {
    id?: string;
    state_id: string;
    name: string;
    phone?: string;
    notes?: string;
    opening_balance?: number;
  }): Promise<PartyRecord> {
    const name = partyData.name.trim();
    if (!name) throw new Error('Party name is required.');
    if (!partyData.state_id) throw new Error('State is required for party.');

    const parties = await this.getParties();
    const now = new Date().toISOString();
    const id = isValidUUID(partyData.id) ? partyData.id! : generateUUID();
    const userId = await this.getUserId();

    const record: PartyRecord = {
      id,
      state_id: partyData.state_id,
      name,
      phone: partyData.phone?.trim() || undefined,
      notes: partyData.notes?.trim() || undefined,
      opening_balance: Number(partyData.opening_balance) || 0,
      is_archived: false,
      created_at: now,
      updated_at: now
    };

    const client = getSupabaseClient();
    if (client) {
      const dbPayload: any = {
        id: record.id,
        state_id: isValidUUID(record.state_id) ? record.state_id : null,
        name: record.name,
        phone: record.phone || null,
        notes: record.notes || null,
        opening_balance: record.opening_balance,
        is_archived: record.is_archived,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      if (userId) dbPayload.user_id = userId;
      const { error } = await client.from('parties').upsert(dbPayload);
      if (error) {
        console.error('Supabase parties upsert error:', error);
        throw new Error('Failed to save party in database: ' + error.message);
      }
    }

    const index = parties.findIndex(p => p.id === id);
    if (index >= 0) {
      parties[index] = { ...parties[index], ...record, updated_at: now };
    } else {
      parties.push(record);
    }
    this.saveToLocal(STORAGE_KEYS.PARTIES, parties);

    return record;
  }

  async archiveParty(id: string): Promise<void> {
    const parties = await this.getParties();
    const index = parties.findIndex(p => p.id === id);
    if (index >= 0) {
      parties[index].is_archived = true;
      parties[index].updated_at = new Date().toISOString();
      this.saveToLocal(STORAGE_KEYS.PARTIES, parties);
      const client = getSupabaseClient();
      if (client && isValidUUID(id)) {
        await client.from('parties').update({ is_archived: true }).eq('id', id);
      }
    }
  }

  // --- STOCK TRANSFERS & RETURNS ---
  async getStockTransfers(): Promise<StockTransfer[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('stock_transfers').select('*').order('transfer_date', { ascending: false });
        if (!error && data) {
          this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load stock transfers from Supabase:', err);
      }
    }
    return this.getFromLocal<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, []);
  }

  async createStockTransfer(data: {
    transfer_date?: string;
    destination_state_id: string;
    destination_party_id: string;
    item_id: string;
    quantity: number;
    transfer_type: 'issue' | 'return';
    notes?: string;
  }): Promise<StockTransfer> {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Transfer quantity must be greater than zero.');
    }

    const items = await this.getItems();
    const item = items.find(i => i.id === data.item_id);
    if (!item) throw new Error('Selected item not found.');

    const now = new Date().toISOString();

    if (data.transfer_type === 'issue') {
      if (item.current_stock < qty) {
        throw new Error(
          'Insufficient main warehouse stock for "' + item.name + '". Available: ' + item.current_stock + ', Requested: ' + qty
        );
      }
      item.current_stock -= qty;
      item.updated_at = now;
    } else {
      item.current_stock += qty;
      item.updated_at = now;
    }

    const transferId = generateUUID();
    const userId = await this.getUserId();

    const transferRecord: StockTransfer = {
      id: transferId,
      transfer_date: data.transfer_date || now,
      destination_state_id: data.destination_state_id,
      destination_party_id: data.destination_party_id,
      item_id: item.id,
      item_name: item.name,
      quantity: qty,
      transfer_type: data.transfer_type,
      notes: data.notes?.trim() || undefined,
      created_at: now
    };

    const client = getSupabaseClient();
    if (client) {
      const dbPayload: any = {
        id: transferId,
        destination_party_id: isValidUUID(data.destination_party_id) ? data.destination_party_id : null,
        item_id: isValidUUID(item.id) ? item.id : null,
        item_name: item.name,
        transfer_type: data.transfer_type,
        quantity: qty,
        transfer_date: data.transfer_date || now,
        notes: data.notes?.trim() || null,
        created_at: now
      };
      if (userId) dbPayload.user_id = userId;

      const { error: transErr } = await client.from('stock_transfers').insert(dbPayload);
      if (transErr) {
        console.error('Supabase stock_transfers insert error:', transErr);
        throw new Error('Failed to save stock transfer in database: ' + transErr.message);
      }

      await client.from('items').update({
        current_stock: item.current_stock,
        updated_at: now
      }).eq('id', item.id);
    }

    const transfers = await this.getStockTransfers();
    transfers.unshift(transferRecord);
    this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
    this.saveToLocal(STORAGE_KEYS.ITEMS, items);

    return transferRecord;
  }

  // --- PARTY PAYMENTS ---
  async getPartyPayments(): Promise<PartyPayment[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('party_payments').select('*').order('payment_date', { ascending: false });
        if (!error && data) {
          this.saveToLocal(STORAGE_KEYS.PARTY_PAYMENTS, data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load party payments from Supabase:', err);
      }
    }
    return this.getFromLocal<PartyPayment[]>(STORAGE_KEYS.PARTY_PAYMENTS, []);
  }

  async recordPartyPayment(data: {
    party_id: string;
    payment_date?: string;
    amount: number;
    payment_type: 'received' | 'paid';
    payment_method?: string;
    reference?: string;
    notes?: string;
  }): Promise<PartyPayment> {
    const amt = Number(data.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const now = new Date().toISOString();
    const paymentId = generateUUID();
    const userId = await this.getUserId();

    const paymentRecord: PartyPayment = {
      id: paymentId,
      party_id: data.party_id,
      payment_date: data.payment_date || now,
      amount: amt,
      payment_type: data.payment_type,
      payment_method: data.payment_method || 'Cash',
      reference: data.reference?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      created_at: now
    };

    const client = getSupabaseClient();
    if (client) {
      const dbPayload: any = {
        id: paymentId,
        party_id: isValidUUID(data.party_id) ? data.party_id : null,
        amount: amt,
        payment_type: data.payment_type,
        payment_mode: data.payment_method || 'Cash',
        reference_no: data.reference?.trim() || null,
        payment_date: data.payment_date || now,
        notes: data.notes?.trim() || null,
        created_at: now
      };
      if (userId) dbPayload.user_id = userId;

      const { error } = await client.from('party_payments').insert(dbPayload);
      if (error) {
        console.error('Supabase party_payments insert error:', error);
        throw new Error('Failed to save party payment in database: ' + error.message);
      }
    }

    const payments = await this.getPartyPayments();
    payments.unshift(paymentRecord);
    this.saveToLocal(STORAGE_KEYS.PARTY_PAYMENTS, payments);

    return paymentRecord;
  }

  // --- DUAL PARTY LEDGER COMPUTATION ---
  async getPartyLedger(partyId: string): Promise<{
    party: PartyRecord;
    state?: StateRecord;
    stockSummary: PartyStockLedgerSummary;
    moneySummary: PartyMoneyLedgerSummary;
    transfers: StockTransfer[];
    sales: Sale[];
    payments: PartyPayment[];
  }> {
    const parties = await this.getParties();
    const party = parties.find(p => p.id === partyId);
    if (!party) throw new Error('Party not found.');

    const states = await this.getStates();
    const state = states.find(s => s.id === party.state_id);

    const transfers = await this.getStockTransfers();
    const partyTransfers = transfers.filter(t => t.destination_party_id === partyId);

    const sales = await this.getSales();
    const partySales = sales.filter(s => s.party_id === partyId && s.status === 'completed');

    const partyPayments = await this.getPartyPayments();
    const specificPayments = partyPayments.filter(p => p.party_id === partyId);

    const itemMap = new Map<
      string,
      {
        item_id: string;
        item_name: string;
        issued_qty: number;
        returned_qty: number;
        sold_qty: number;
        held_qty: number;
      }
    >();

    partyTransfers.forEach(t => {
      let entry = itemMap.get(t.item_id);
      if (!entry) {
        entry = { item_id: t.item_id, item_name: t.item_name, issued_qty: 0, returned_qty: 0, sold_qty: 0, held_qty: 0 };
        itemMap.set(t.item_id, entry);
      }
      if (t.transfer_type === 'issue') {
        entry.issued_qty += t.quantity;
      } else {
        entry.returned_qty += t.quantity;
      }
    });

    partySales.forEach(s => {
      s.items?.forEach(line => {
        if (!line.item_id) return;
        let entry = itemMap.get(line.item_id);
        if (!entry) {
          entry = { item_id: line.item_id, item_name: line.item_name, issued_qty: 0, returned_qty: 0, sold_qty: 0, held_qty: 0 };
          itemMap.set(line.item_id, entry);
        }
        if (s.deduct_from_party_stock) {
          entry.sold_qty += line.quantity;
        }
      });
    });

    const stockItems = Array.from(itemMap.values()).map(item => ({
      ...item,
      held_qty: Math.max(0, item.issued_qty - item.returned_qty - item.sold_qty)
    }));

    const totalHeldPieces = stockItems.reduce((sum, i) => sum + i.held_qty, 0);

    const stockSummary: PartyStockLedgerSummary = {
      party_id: party.id,
      party_name: party.name,
      state_id: party.state_id,
      state_name: state?.name || 'Unknown State',
      items: stockItems,
      total_held_pieces: totalHeldPieces
    };

    const openingBalance = Number(party.opening_balance) || 0;
    const totalSalesAmount = partySales.reduce((sum, s) => sum + s.grand_total, 0);

    let totalSalePaymentsReceived = 0;
    partySales.forEach(s => {
      totalSalePaymentsReceived += s.amount_received || 0;
    });

    const partyPaymentsReceived = specificPayments
      .filter(p => p.payment_type === 'received')
      .reduce((sum, p) => sum + p.amount, 0);

    const partyPaymentsMade = specificPayments
      .filter(p => p.payment_type === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReceived = Math.round((totalSalePaymentsReceived + partyPaymentsReceived) * 100) / 100;
    const totalPaid = Math.round(partyPaymentsMade * 100) / 100;

    const netPosition = Math.round((openingBalance + totalSalesAmount + totalPaid - totalReceived) * 100) / 100;
    const netReceivable = netPosition > 0 ? netPosition : 0;
    const netPayable = netPosition < 0 ? Math.abs(netPosition) : 0;

    const moneySummary: PartyMoneyLedgerSummary = {
      party_id: party.id,
      party_name: party.name,
      state_id: party.state_id,
      state_name: state?.name || 'Unknown State',
      phone: party.phone,
      opening_balance: openingBalance,
      total_sales: totalSalesAmount,
      total_received: totalReceived,
      total_paid: totalPaid,
      net_receivable: netReceivable,
      net_payable: netPayable,
      net_position: netPosition
    };

    return {
      party,
      state,
      stockSummary,
      moneySummary,
      transfers: partyTransfers,
      sales: partySales,
      payments: specificPayments
    };
  }

  // --- BACKUP & RESTORE ---
  async restoreFromBackup(payload: any): Promise<{ success: boolean; message: string }> {
    if (payload.business_settings) await this.updateSettings(payload.business_settings);
    if (Array.isArray(payload.items)) this.saveToLocal(STORAGE_KEYS.ITEMS, payload.items);
    if (Array.isArray(payload.purchases)) this.saveToLocal(STORAGE_KEYS.PURCHASES, payload.purchases);
    if (Array.isArray(payload.sales)) this.saveToLocal(STORAGE_KEYS.SALES, payload.sales);
    if (Array.isArray(payload.expenses)) this.saveToLocal(STORAGE_KEYS.EXPENSES, payload.expenses);
    if (Array.isArray(payload.states)) this.saveToLocal(STORAGE_KEYS.STATES, payload.states);
    if (Array.isArray(payload.parties)) this.saveToLocal(STORAGE_KEYS.PARTIES, payload.parties);
    if (Array.isArray(payload.stock_transfers)) this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, payload.stock_transfers);
    if (Array.isArray(payload.party_payments)) this.saveToLocal(STORAGE_KEYS.PARTY_PAYMENTS, payload.party_payments);

    return {
      success: true,
      message: 'Successfully restored backup with items, purchases, sales, states, parties, and ledgers.'
    };
  }
}

export const storage = new StorageService();
