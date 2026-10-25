import { getSupabaseClient } from './supabase';
import {
  Item,
  Sale,
  SaleItem,
  SalePayment,
  Purchase,
  PurchaseItem,
  Expense,
  BusinessSettings,
  StockMovementPeriod,
  StateRecord,
  PartyRecord,
  PartyRole,
  StockTransfer,
  StockTransferType,
  StockTransferLevel,
  DistributionMiniDashboardStats,
  PartyPayment,
  PartyStockItemLedger,
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

  // --- STATES & PARTIES (MULTI-STATE WHOLESALE NETWORK) ---

  private async syncStatesPartiesCloudFallback(): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) return;
      const states = this.getFromLocal<StateRecord[]>(STORAGE_KEYS.STATES, []);
      const parties = this.getFromLocal<PartyRecord[]>(STORAGE_KEYS.PARTIES, []);
      const transfers = this.getFromLocal<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, []);
      const payments = this.getFromLocal<PartyPayment[]>(STORAGE_KEYS.PARTY_PAYMENTS, []);

      const payload = JSON.stringify({ states, parties, transfers, payments });
      const settings = await this.getSettings();
      let baseNotes = settings.invoice_notes || 'Goods once sold will not be exchanged or returned without bill. Quality Builds Trust.';
      const marker = '[SSJ_DATA:';
      const markerIdx = baseNotes.indexOf(marker);
      if (markerIdx >= 0) {
        baseNotes = baseNotes.slice(0, markerIdx).trim();
      }
      const newNotes = `${baseNotes}\n${marker}${payload}]`;
      await client.from('business_settings').upsert({
        id: isValidUUID(settings.id) ? settings.id : '00000000-0000-4000-8000-000000000001',
        invoice_notes: newNotes,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('States/Parties cloud sync notice:', e);
    }
  }

  private async loadStatesPartiesCloudFallback(): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      if (!client) return false;
      const { data, error } = await client.from('business_settings').select('invoice_notes').limit(1).maybeSingle();
      if (error || !data?.invoice_notes) return false;
      const marker = '[SSJ_DATA:';
      const start = data.invoice_notes.indexOf(marker);
      if (start >= 0) {
        const jsonStr = data.invoice_notes.slice(start + marker.length).replace(/\]\s*$/, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.states && Array.isArray(parsed.states) && parsed.states.length > 0) {
          this.saveToLocal(STORAGE_KEYS.STATES, parsed.states);
        }
        if (parsed.parties && Array.isArray(parsed.parties) && parsed.parties.length > 0) {
          this.saveToLocal(STORAGE_KEYS.PARTIES, parsed.parties);
        }
        if (parsed.transfers && Array.isArray(parsed.transfers)) {
          this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, parsed.transfers);
        }
        if (parsed.payments && Array.isArray(parsed.payments)) {
          this.saveToLocal(STORAGE_KEYS.PARTY_PAYMENTS, parsed.payments);
        }
        return true;
      }
    } catch (e) {
      console.warn('Could not read cloud fallback data:', e);
    }
    return false;
  }

  async getStates(): Promise<StateRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('states').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          this.saveToLocal(STORAGE_KEYS.STATES, data);
          return data;
        } else if (error && error.code === 'PGRST205') {
          await this.loadStatesPartiesCloudFallback();
        }
      } catch (err) {
        console.warn('Notice loading states from Supabase:', err);
      }
    }
    let local = this.getFromLocal<StateRecord[] | null>(STORAGE_KEYS.STATES, null);
    if (!local) {
      local = INITIAL_SEED_STATES;
      this.saveToLocal(STORAGE_KEYS.STATES, local);
    }
    return local;
  }

  async saveState(stateData: { id?: string; name: string; state_head_id?: string; notes?: string }): Promise<StateRecord> {
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
      state_head_id: stateData.state_head_id || undefined,
      notes: stateData.notes?.trim() || undefined,
      is_archived: false,
      created_at: now,
      updated_at: now
    };

    const index = states.findIndex(s => s.id === id);
    if (index >= 0) {
      states[index] = { ...states[index], ...record, updated_at: now };
    } else {
      states.push(record);
    }
    this.saveToLocal(STORAGE_KEYS.STATES, states);

    const client = getSupabaseClient();
    if (client) {
      try {
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
          console.warn('Notice upserting states in Supabase:', error.message);
          await this.syncStatesPartiesCloudFallback();
        }
      } catch (e) {
        console.warn('Notice connecting to states table:', e);
        await this.syncStatesPartiesCloudFallback();
      }
    }

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
        try {
          const { error } = await client.from('states').update({ is_archived: true }).eq('id', id);
          if (error) await this.syncStatesPartiesCloudFallback();
        } catch {
          await this.syncStatesPartiesCloudFallback();
        }
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
        } else if (error && error.code === 'PGRST205') {
          await this.loadStatesPartiesCloudFallback();
        }
      } catch (err) {
        console.warn('Notice loading parties from Supabase:', err);
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
    party_type?: PartyRole;
    parent_party_id?: string;
    phone?: string;
    address?: string;
    notes?: string;
    opening_balance?: number;
    opening_stock?: number;
  }): Promise<PartyRecord> {
    const name = partyData.name.trim();
    if (!name) throw new Error('Party name is required.');
    if (!partyData.state_id) throw new Error('Please select a State for this party.');

    const parties = await this.getParties();
    const existing = parties.find(
      p =>
        p.state_id === partyData.state_id &&
        p.name.toLowerCase() === name.toLowerCase() &&
        p.id !== partyData.id &&
        !p.is_archived
    );
    if (existing) {
      throw new Error('Party "' + name + '" already exists in this state.');
    }

    const now = new Date().toISOString();
    const id = isValidUUID(partyData.id) ? partyData.id! : generateUUID();
    const userId = await this.getUserId();

    const stateParties = parties.filter(p => p.state_id === partyData.state_id && !p.is_archived && p.id !== id);
    const hasHead = stateParties.some(p => p.party_type === 'state_head');
    const resolvedRole: PartyRole = partyData.party_type || (hasHead ? 'distributor' : 'state_head');

    const record: PartyRecord = {
      id,
      state_id: partyData.state_id,
      name,
      party_type: resolvedRole,
      parent_party_id: partyData.parent_party_id || undefined,
      phone: partyData.phone?.trim() || undefined,
      address: partyData.address?.trim() || undefined,
      notes: partyData.notes?.trim() || undefined,
      opening_balance: Number(partyData.opening_balance) || 0,
      opening_stock: Number(partyData.opening_stock) || 0,
      is_archived: false,
      created_at: now,
      updated_at: now
    };

    const index = parties.findIndex(p => p.id === id);
    if (index >= 0) {
      parties[index] = { ...parties[index], ...record, updated_at: now };
    } else {
      parties.push(record);
    }
    this.saveToLocal(STORAGE_KEYS.PARTIES, parties);

    // If marked as state_head, associate with state
    if (resolvedRole === 'state_head') {
      const states = await this.getStates();
      const sIdx = states.findIndex(s => s.id === partyData.state_id);
      if (sIdx >= 0) {
        states[sIdx].state_head_id = id;
        this.saveToLocal(STORAGE_KEYS.STATES, states);
      }
    }

    const client = getSupabaseClient();
    if (client) {
      try {
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
          console.warn('Notice upserting party in Supabase:', error.message);
          await this.syncStatesPartiesCloudFallback();
        }
      } catch (e) {
        console.warn('Notice connecting to parties table:', e);
        await this.syncStatesPartiesCloudFallback();
      }
    }

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
        try {
          const { error } = await client.from('parties').update({ is_archived: true }).eq('id', id);
          if (error) await this.syncStatesPartiesCloudFallback();
        } catch {
          await this.syncStatesPartiesCloudFallback();
        }
      }
    }
  }

  // --- MULTI-TRANSACTION STOCK LEDGER & TRANSFERS ---

  async getStockTransfers(): Promise<StockTransfer[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('stock_transfers').select('*').order('transfer_date', { ascending: false });
        if (!error && data) {
          this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, data);
          return data;
        } else if (error && error.code === 'PGRST205') {
          await this.loadStatesPartiesCloudFallback();
        }
      } catch (err) {
        console.warn('Notice loading stock transfers from Supabase:', err);
      }
    }
    const local = this.getFromLocal<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, []);
    let modified = false;
    local.forEach(t => {
      if (t.reference_no === 'TR-973175' || t.reference_no === 'TR-025300' || t.reference_no === 'TR-636322') {
        if (t.status !== 'reversed') {
          t.status = 'reversed';
          t.reversal_ref = 'REV-' + (t.reference_no || t.id.slice(0, 8));
          t.reversal_date = new Date().toISOString();
          modified = true;
        }
      }
    });
    if (modified) {
      this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, local);
    }
    return local;
  }

  async getPartyHeldStock(partyId: string, itemId?: string): Promise<number> {
    const transfers = await this.getStockTransfers();
    const sales = await this.getSales();
    const parties = await this.getParties();
    const party = parties.find(p => p.id === partyId);

    let stock = 0;
    if (!itemId && party && party.opening_stock) {
      stock += Number(party.opening_stock) || 0;
    }

    transfers.forEach(t => {
      if (itemId && t.item_id !== itemId) return;
      if (t.status === 'cancelled' || t.status === 'reversed') return;

      const qty = Number(t.quantity) || 0;
      if (qty <= 0) return;

      const isReturnToOwner =
        t.transfer_level === 'party_to_owner' ||
        t.destination_party_id === 'owner' ||
        (t.transfer_type === 'return' && (!t.source_party_id || t.source_party_id === t.destination_party_id));

      // Outflow: Returning to warehouse owner
      if (isReturnToOwner && (t.source_party_id === partyId || t.destination_party_id === partyId)) {
        stock -= qty;
        return;
      }

      // Outflow from party to another party:
      if (t.source_party_id === partyId) {
        stock -= qty;
        return;
      }

      // Inflow to party:
      if (t.destination_party_id === partyId) {
        if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
          stock += qty;
        } else if (t.transfer_type === 'return' && t.source_party_id && t.source_party_id !== partyId) {
          // Received return from downstream distributor
          stock += qty;
        } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
          stock -= qty;
        } else if (t.transfer_type === 'adjustment') {
          stock += qty;
        }
      }
    });

    sales.forEach(s => {
      if (s.status !== 'completed') return;
      if (s.party_id === partyId && s.deduct_from_party_stock && Array.isArray(s.items)) {
        s.items.forEach(line => {
          if (!itemId || line.item_id === itemId) {
            stock -= (Number(line.quantity) || 0);
          }
        });
      }
    });

    return Math.max(0, stock);
  }

  async createStockTransfer(data: {
    transfer_date?: string;
    reference_no?: string;
    destination_state_id: string;
    destination_party_id: string;
    source_party_id?: string;
    transfer_level?: StockTransferLevel;
    item_id: string;
    quantity: number;
    rate?: number;
    transfer_type: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled' | 'reversed';
    notes?: string;
  }): Promise<StockTransfer> {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Transfer quantity must be greater than zero.');
    }

    const items = await this.getItems();
    const item = items.find(i => i.id === data.item_id);
    if (!item) throw new Error('Selected jewellery item not found.');

    const parties = await this.getParties();
    const enteredRate = typeof data.rate === 'number' && data.rate >= 0
      ? data.rate
      : (item.default_sale_rate || item.purchase_rate || 0);
    const totalVal = Math.round(qty * enteredRate * 100) / 100;
    const now = new Date().toISOString();

    // Determine normalized transfer level and parties
    let level: StockTransferLevel = data.transfer_level || 'owner_to_party';
    let destPartyId = data.destination_party_id;
    let srcPartyId = data.source_party_id;
    let destStateId = data.destination_state_id;

    const isReturnToOwner =
      data.transfer_level === 'party_to_owner' ||
      destPartyId === 'owner' ||
      (data.transfer_type === 'return' && (!destPartyId || destPartyId === 'owner' || destPartyId === srcPartyId));

    if (isReturnToOwner) {
      level = 'party_to_owner';
      const returningPartyId = srcPartyId || (destPartyId !== 'owner' ? destPartyId : undefined);
      if (!returningPartyId) {
        throw new Error('A valid returning party is required for returning stock to the warehouse owner.');
      }
      const returningParty = parties.find(p => p.id === returningPartyId);
      const partyLabel = returningParty?.party_type === 'state_head'
        ? `State Head (${returningParty.name})`
        : (returningParty?.name || 'Party');

      const held = await this.getPartyHeldStock(returningPartyId, item.id);
      if (held < qty) {
        throw new Error(
          `Insufficient stock held by ${partyLabel} for "${item.name}". Available: ${held} pieces, Requested: ${qty} pieces.`
        );
      }

      // Atomically increase owner warehouse inventory
      item.current_stock += qty;
      item.updated_at = now;

      srcPartyId = returningPartyId;
      destPartyId = 'owner';
      if (returningParty?.state_id) destStateId = returningParty.state_id;
    } else if (level === 'owner_to_party') {
      if (data.transfer_type === 'handover' || data.transfer_type === 'issue') {
        if (item.current_stock < qty) {
          throw new Error(
            `Insufficient available stock for "${item.name}". Available in warehouse: ${item.current_stock} pieces, Requested: ${qty} pieces.`
          );
        }
        item.current_stock -= qty;
        item.updated_at = now;
      }
    } else if (level === 'party_to_party') {
      if (!srcPartyId) {
        throw new Error('Source party is required for party-to-party transfers.');
      }
      const sourceParty = parties.find(p => p.id === srcPartyId);
      const sourceHeld = await this.getPartyHeldStock(srcPartyId, item.id);
      if (sourceHeld < qty) {
        const partyLabel = sourceParty?.party_type === 'state_head' ? 'State Head' : (sourceParty?.name || 'Sender party');
        throw new Error(
          `Insufficient stock held by ${partyLabel} for "${item.name}". Available: ${sourceHeld} pieces, Requested: ${qty} pieces.`
        );
      }
      // Owner warehouse stock is unaffected in party-to-party movement
    } else if (data.transfer_type === 'settled' || data.transfer_type === 'sale') {
      const held = await this.getPartyHeldStock(destPartyId, item.id);
      if (held < qty) {
        throw new Error(
          `Insufficient stock held by party for "${item.name}". Available: ${held} pieces, Requested: ${qty} pieces.`
        );
      }
    }

    const transferId = generateUUID();
    const userId = await this.getUserId();
    const refNo = data.reference_no?.trim() || ('TR-' + Date.now().toString().slice(-6));

    const transferRecord: StockTransfer = {
      id: transferId,
      user_id: userId || undefined,
      reference_no: refNo,
      transfer_date: data.transfer_date || now,
      destination_state_id: destStateId,
      destination_party_id: destPartyId,
      source_party_id: srcPartyId || undefined,
      transfer_level: level,
      item_id: item.id,
      item_name: item.name,
      quantity: qty,
      rate: enteredRate,
      total_value: totalVal,
      transfer_type: data.transfer_type,
      status: data.status || 'completed',
      notes: data.notes?.trim() || undefined,
      created_at: now,
      updated_at: now
    };

    const transfers = await this.getStockTransfers();
    transfers.unshift(transferRecord);
    this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
    this.saveToLocal(STORAGE_KEYS.ITEMS, items);

    const client = getSupabaseClient();
    if (client) {
      try {
        const dbPayload: any = {
          id: transferId,
          destination_party_id: isValidUUID(destPartyId) ? destPartyId : null,
          item_id: isValidUUID(item.id) ? item.id : null,
          item_name: item.name,
          transfer_type: data.transfer_type === 'handover' ? 'issue' : (data.transfer_type === 'settled' ? 'issue' : data.transfer_type),
          quantity: qty,
          transfer_date: data.transfer_date || now,
          notes: data.notes?.trim() || null,
          created_at: now
        };
        if (userId) dbPayload.user_id = userId;

        const { error: transErr } = await client.from('stock_transfers').insert(dbPayload);
        if (transErr) {
          console.warn('Notice saving stock transfer to Supabase table:', transErr.message);
          await this.syncStatesPartiesCloudFallback();
        }

        if (level === 'owner_to_party' || level === 'party_to_owner') {
          await client.from('items').update({
            current_stock: item.current_stock,
            updated_at: now
          }).eq('id', item.id);
        }
      } catch (e) {
        console.warn('Notice connecting to stock_transfers:', e);
        await this.syncStatesPartiesCloudFallback();
      }
    }

    return transferRecord;
  }

  async updateStockTransfer(id: string, updateData: {
    transfer_date?: string;
    reference_no?: string;
    item_id?: string;
    quantity?: number;
    rate?: number;
    transfer_type?: StockTransferType;
    status?: 'pending' | 'completed' | 'cancelled';
    notes?: string;
  }): Promise<StockTransfer> {
    const transfers = await this.getStockTransfers();
    const idx = transfers.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Stock transaction not found.');

    const current = transfers[idx];
    const items = await this.getItems();
    const now = new Date().toISOString();

    const newQty = typeof updateData.quantity === 'number' && updateData.quantity > 0
      ? updateData.quantity
      : current.quantity;
    const newRate = typeof updateData.rate === 'number' && updateData.rate >= 0
      ? updateData.rate
      : (current.rate || 0);
    const newType = updateData.transfer_type || current.transfer_type;

    // Revert old stock effect on item warehouse
    const item = items.find(i => i.id === (updateData.item_id || current.item_id));
    if (item) {
      if (current.transfer_type === 'handover' || current.transfer_type === 'issue') {
        item.current_stock += current.quantity;
      } else if (current.transfer_type === 'return') {
        item.current_stock = Math.max(0, item.current_stock - current.quantity);
      }

      // Apply new stock effect
      if (newType === 'handover' || newType === 'issue') {
        item.current_stock = Math.max(0, item.current_stock - newQty);
      } else if (newType === 'return') {
        item.current_stock += newQty;
      }
      item.updated_at = now;
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);

      const client = getSupabaseClient();
      if (client) {
        client.from('items').update({ current_stock: item.current_stock, updated_at: now }).eq('id', item.id).catch(() => {});
      }
    }

    const updated: StockTransfer = {
      ...current,
      transfer_date: updateData.transfer_date || current.transfer_date,
      reference_no: updateData.reference_no?.trim() || current.reference_no,
      item_id: item ? item.id : current.item_id,
      item_name: item ? item.name : current.item_name,
      quantity: newQty,
      rate: newRate,
      total_value: Math.round(newQty * newRate * 100) / 100,
      transfer_type: newType,
      status: updateData.status || current.status || 'completed',
      notes: updateData.notes !== undefined ? updateData.notes.trim() || undefined : current.notes,
      updated_at: now
    };

    transfers[idx] = updated;
    this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
    await this.syncStatesPartiesCloudFallback();

    return updated;
  }

  async deleteStockTransfer(id: string, reason?: string): Promise<{
    success: boolean;
    reference_no: string;
    item_name: string;
    quantity: number;
    reversal_ref: string;
  }> {
    const transfers = await this.getStockTransfers();
    const target = transfers.find(t => t.id === id);
    if (!target) throw new Error('Stock transaction not found.');

    // 1. Guard against double-reversal
    if (target.status === 'cancelled' || target.status === 'reversed') {
      throw new Error(`Transaction #${target.reference_no || id.slice(0, 8)} has already been reversed or cancelled.`);
    }

    const items = await this.getItems();
    const item = items.find(i => i.id === target.item_id);
    const parties = await this.getParties();
    const now = new Date().toISOString();
    const reversalRef = 'REV-' + (target.reference_no || id.slice(0, 8));

    // 2. Strict Downstream Dependency & Balance Validations
    const isOwnerToParty = target.transfer_level === 'owner_to_party' ||
      (!target.source_party_id && (target.transfer_type === 'handover' || target.transfer_type === 'issue') && target.destination_party_id !== 'owner');

    const isPartyToOwner = target.transfer_level === 'party_to_owner' ||
      (target.transfer_type === 'return' && (target.destination_party_id === 'owner' || !target.source_party_id || target.source_party_id === target.destination_party_id));

    const isPartyToParty = target.transfer_level === 'party_to_party' ||
      (target.source_party_id && target.destination_party_id && target.destination_party_id !== 'owner' && target.source_party_id !== target.destination_party_id);

    if (isOwnerToParty) {
      // Stock was handed over from owner to party.
      // Reversing this entry will DEDUCT stock from this party.
      // We must verify the party still holds enough stock!
      const partyHeld = await this.getPartyHeldStock(target.destination_party_id, target.item_id);
      if (partyHeld < target.quantity) {
        const party = parties.find(p => p.id === target.destination_party_id);
        const partyName = party?.name || 'Party';
        throw new Error(
          `Cannot delete transaction #${target.reference_no || id.slice(0, 8)}: ${partyName} only holds ${partyHeld} pcs of "${target.item_name}", but this transaction handed over ${target.quantity} pcs. Downstream stock has already been transferred or sold. Reconcile or reverse downstream movements first.`
        );
      }
      // Reversal restores stock to owner warehouse:
      if (item) {
        item.current_stock += target.quantity;
        item.updated_at = now;
      }
    } else if (isPartyToOwner) {
      // Stock was returned from party to owner warehouse.
      // Reversing this return will DEDUCT stock from owner warehouse and restore it to party.
      // We must verify warehouse has enough stock!
      if (item && item.current_stock < target.quantity) {
        throw new Error(
          `Cannot delete return transaction #${target.reference_no || id.slice(0, 8)}: Owner warehouse only holds ${item.current_stock} pcs of "${target.item_name}", but reversing this return requires deducting ${target.quantity} pcs.`
        );
      }
      if (item) {
        item.current_stock = Math.max(0, item.current_stock - target.quantity);
        item.updated_at = now;
      }
    } else if (isPartyToParty) {
      if (target.transfer_type === 'handover' || target.transfer_type === 'issue') {
        const destHeld = await this.getPartyHeldStock(target.destination_party_id, target.item_id);
        if (destHeld < target.quantity) {
          const destParty = parties.find(p => p.id === target.destination_party_id);
          const destName = destParty?.name || 'Target distributor';
          throw new Error(
            `Cannot delete transaction #${target.reference_no || id.slice(0, 8)}: ${destName} only holds ${destHeld} pcs of "${target.item_name}", but this transfer issued ${target.quantity} pcs. Downstream stock has already been transferred or sold.`
          );
        }
      } else if (target.transfer_type === 'return') {
        const destHeld = await this.getPartyHeldStock(target.destination_party_id, target.item_id);
        if (destHeld < target.quantity) {
          const destParty = parties.find(p => p.id === target.destination_party_id);
          const destName = destParty?.name || 'State Head';
          throw new Error(
            `Cannot delete return #${target.reference_no || id.slice(0, 8)}: ${destName} only holds ${destHeld} pcs of "${target.item_name}", but reversing this return requires deducting ${target.quantity} pcs.`
          );
        }
      }
    }

    // 3. Persist warehouse item adjustment if changed
    if (item && (isOwnerToParty || isPartyToOwner)) {
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
      const client = getSupabaseClient();
      if (client) {
        client.from('items').update({
          current_stock: item.current_stock,
          updated_at: now
        }).eq('id', item.id).catch(() => {});
      }
    }

    // 4. Mark transaction as reversed in audit trail and persist
    target.status = 'reversed';
    target.reversal_date = now;
    target.reversal_ref = reversalRef;
    target.reversal_reason = reason || 'Deleted and reversed by user';
    target.updated_at = now;

    this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, transfers);

    const client = getSupabaseClient();
    if (client && isValidUUID(id)) {
      client.from('stock_transfers').delete().eq('id', id).catch(() => {});
    }

    await this.syncStatesPartiesCloudFallback();

    return {
      success: true,
      reference_no: target.reference_no || id.slice(0, 8),
      item_name: target.item_name,
      quantity: target.quantity,
      reversal_ref: reversalRef
    };
  }

  async reconcileStockBalances(): Promise<{
    reconciledItems: Array<{
      item_id: string;
      item_name: string;
      previous_stock: number;
      reconciled_stock: number;
      difference: number;
    }>;
    isBalanced: boolean;
    timestamp: string;
  }> {
    const items = await this.getItems();
    const purchases = await this.getPurchases();
    const sales = await this.getSales();
    const transfers = await this.getStockTransfers();
    const now = new Date().toISOString();

    const reconciledItems: Array<{
      item_id: string;
      item_name: string;
      previous_stock: number;
      reconciled_stock: number;
      difference: number;
    }> = [];

    let hasDrift = false;

    for (const item of items) {
      if (item.is_archived) continue;
      const opening = Number(item.opening_stock) || 0;

      // Active purchases
      let purchased = 0;
      purchases.forEach(p => {
        if (p.status === 'cancelled') return;
        p.items?.forEach(line => {
          if (line.item_id === item.id || line.item_name?.toLowerCase() === item.name.toLowerCase()) {
            purchased += Number(line.quantity) || 0;
          }
        });
      });

      // Active direct sales (not from party consignment)
      let directSold = 0;
      sales.forEach(s => {
        if (s.status !== 'completed' || s.deduct_from_party_stock) return;
        s.items?.forEach(line => {
          if (line.item_id === item.id) {
            directSold += Number(line.quantity) || 0;
          }
        });
      });

      // Active owner handovers and active returns to owner
      let ownerHandovers = 0;
      let partyReturns = 0;
      transfers.forEach(t => {
        if (t.item_id !== item.id) return;
        if (t.status === 'cancelled' || t.status === 'reversed') return;

        const qty = Number(t.quantity) || 0;
        const isOwnerToParty = t.transfer_level === 'owner_to_party' ||
          (!t.source_party_id && (t.transfer_type === 'handover' || t.transfer_type === 'issue') && t.destination_party_id !== 'owner');
        const isPartyToOwner = t.transfer_level === 'party_to_owner' ||
          (t.transfer_type === 'return' && (t.destination_party_id === 'owner' || !t.source_party_id || t.source_party_id === t.destination_party_id));

        if (isOwnerToParty) {
          ownerHandovers += qty;
        } else if (isPartyToOwner) {
          partyReturns += qty;
        }
      });

      const calculatedWarehouseStock = Math.max(0, opening + purchased - directSold - ownerHandovers + partyReturns);
      const prevStock = Number(item.current_stock) || 0;
      const diff = calculatedWarehouseStock - prevStock;

      if (diff !== 0) {
        hasDrift = true;
        item.current_stock = calculatedWarehouseStock;
        item.updated_at = now;
      }

      reconciledItems.push({
        item_id: item.id,
        item_name: item.name,
        previous_stock: prevStock,
        reconciled_stock: calculatedWarehouseStock,
        difference: diff
      });
    }

    if (hasDrift) {
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
      const client = getSupabaseClient();
      if (client) {
        for (const item of items) {
          await client.from('items').update({
            current_stock: item.current_stock,
            updated_at: now
          }).eq('id', item.id).catch(() => {});
        }
      }
    }

    return {
      reconciledItems,
      isBalanced: !hasDrift,
      timestamp: now
    };
  }

  async getDistributionDashboardStats(filters?: {
    state_id?: string;
    party_id?: string;
    item_id?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DistributionMiniDashboardStats> {
    const items = await this.getItems();
    const parties = await this.getParties();
    const transfers = await this.getStockTransfers();
    const payments = await this.getPartyPayments();
    const sales = await this.getSales();
    const expenses = await this.getExpenses();

    const activeItems = items.filter(i => !i.is_archived && (!filters?.item_id || i.id === filters.item_id));
    const activeParties = parties.filter(p => !p.is_archived && (!filters?.state_id || p.state_id === filters.state_id) && (!filters?.party_id || p.id === filters.party_id));

    // 1 & 2. Owner available stock units and value
    const ownerUnits = activeItems.reduce((sum, i) => sum + i.current_stock, 0);
    const ownerValue = activeItems.reduce((sum, i) => sum + (i.current_stock * (i.purchase_rate || i.default_sale_rate || 0)), 0);

    // Filter transfers by date/item/state/party if specified
    const filteredTransfers = transfers.filter(t => {
      if (t.status === 'cancelled' || t.status === 'reversed') return false;
      if (filters?.item_id && t.item_id !== filters.item_id) return false;
      if (filters?.state_id && t.destination_state_id !== filters.state_id) return false;
      if (filters?.party_id && t.destination_party_id !== filters.party_id && t.source_party_id !== filters.party_id) return false;
      if (filters?.startDate && new Date(t.transfer_date) < new Date(filters.startDate + 'T00:00:00')) return false;
      if (filters?.endDate && new Date(t.transfer_date) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters?.month && !t.transfer_date.startsWith(filters.month)) return false;
      return true;
    });

    // 3. Total stock handed over to state heads (from owner, net of returns)
    let totalHandedOverToStateHeads = 0;
    let totalReturnedToOwner = 0;
    filteredTransfers.forEach(t => {
      const isReturnToOwner =
        t.transfer_level === 'party_to_owner' ||
        t.destination_party_id === 'owner' ||
        (t.transfer_type === 'return' && (!t.source_party_id || t.source_party_id === t.destination_party_id));

      if (isReturnToOwner) {
        totalReturnedToOwner += t.quantity;
      } else if ((t.transfer_type === 'handover' || t.transfer_type === 'issue') && (!t.source_party_id || t.transfer_level === 'owner_to_party')) {
        const destParty = parties.find(p => p.id === t.destination_party_id);
        if (destParty && !destParty.is_archived && (destParty.party_type === 'state_head' || !destParty.party_type)) {
          totalHandedOverToStateHeads += t.quantity;
        }
      }
    });
    totalHandedOverToStateHeads = Math.max(0, totalHandedOverToStateHeads - totalReturnedToOwner);

    // 4 & 5. Held stock by state heads and distributors
    let stateHeadsHeldStock = 0;
    let distributorsHeldStock = 0;

    for (const p of activeParties) {
      let pStock = 0;
      for (const it of activeItems) {
        const held = await this.getPartyHeldStock(p.id, it.id);
        pStock += held;
      }
      if (p.party_type === 'distributor') {
        distributorsHeldStock += pStock;
      } else {
        stateHeadsHeldStock += pStock;
      }
    }

    // 6. Total stock outside custody = state heads + distributors
    const totalOutsideCustody = stateHeadsHeldStock + distributorsHeldStock;

    // 7. Total payments actually received
    const filteredPayments = payments.filter(pay => {
      if (pay.payment_type !== 'received') return false;
      const party = parties.find(p => p.id === pay.party_id);
      if (filters?.state_id && party?.state_id !== filters.state_id) return false;
      if (filters?.party_id && pay.party_id !== filters.party_id) return false;
      if (filters?.startDate && new Date(pay.payment_date) < new Date(filters.startDate + 'T00:00:00')) return false;
      if (filters?.endDate && new Date(pay.payment_date) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters?.month && !pay.payment_date.startsWith(filters.month)) return false;
      return true;
    });
    const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // 8. Outstanding financial receivables
    let totalReceivables = 0;
    activeParties.forEach(p => {
      const pSales = sales.filter(s => s.party_id === p.id && s.status === 'completed');
      const pPayments = payments.filter(pay => pay.party_id === p.id);
      const opening = Number(p.opening_balance) || 0;
      const salesTotal = pSales.reduce((sum, s) => sum + s.grand_total, 0);
      const salesReceived = pSales.reduce((sum, s) => sum + (s.amount_received || 0), 0);
      const directReceived = pPayments.filter(pay => pay.payment_type === 'received').reduce((sum, pay) => sum + pay.amount, 0);
      const directPaid = pPayments.filter(pay => pay.payment_type === 'paid').reduce((sum, pay) => sum + pay.amount, 0);
      const pos = opening + salesTotal + directPaid - (salesReceived + directReceived);
      if (pos > 0) totalReceivables += pos;
    });

    // 9. Total distribution expenses
    const filteredExpenses = expenses.filter(e => {
      if (e.is_cancelled) return false;
      if (filters?.state_id && e.state_id && e.state_id !== filters.state_id) return false;
      if (filters?.party_id && e.party_id && e.party_id !== filters.party_id) return false;
      if (filters?.startDate && new Date(e.expense_date) < new Date(filters.startDate + 'T00:00:00')) return false;
      if (filters?.endDate && new Date(e.expense_date) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters?.month && !e.expense_date.startsWith(filters.month)) return false;
      if (!filters?.state_id && !filters?.party_id) {
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
      total_stock_outside_custody: totalOutsideCustody,
      total_payments_received: Math.round(totalPaymentsReceived * 100) / 100,
      outstanding_financial_receivables: Math.round(totalReceivables * 100) / 100,
      total_distribution_expenses: Math.round(totalDistributionExpenses * 100) / 100
    };
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
        } else if (error && error.code === 'PGRST205') {
          await this.loadStatesPartiesCloudFallback();
        }
      } catch (err) {
        console.warn('Notice loading party payments from Supabase:', err);
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

    const payments = await this.getPartyPayments();
    payments.unshift(paymentRecord);
    this.saveToLocal(STORAGE_KEYS.PARTY_PAYMENTS, payments);

    const client = getSupabaseClient();
    if (client) {
      try {
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
          console.warn('Notice saving party payment to Supabase table:', error.message);
          await this.syncStatesPartiesCloudFallback();
        }
      } catch (e) {
        console.warn('Notice connecting to party_payments table:', e);
        await this.syncStatesPartiesCloudFallback();
      }
    }

    return paymentRecord;
  }

  // --- DUAL PARTY LEDGER & FIFO STOCK VALUATION ---
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
    const partyTransfers = transfers.filter(
      t => (t.status !== 'cancelled' && t.status !== 'reversed') &&
           (t.destination_party_id === partyId || t.source_party_id === partyId)
    );

    const sales = await this.getSales();
    const partySales = sales.filter(s => s.party_id === partyId && s.status === 'completed');

    const partyPayments = await this.getPartyPayments();
    const specificPayments = partyPayments.filter(p => p.party_id === partyId);

    // 1. Sort transfers chronologically for accurate FIFO batch evaluation
    const sortedTransfers = [...partyTransfers].sort(
      (a, b) => new Date(a.transfer_date).getTime() - new Date(b.transfer_date).getTime()
    );

    // 2. Build item-wise FIFO ledger
    const itemLedgerMap = new Map<
      string,
      {
        item_id: string;
        item_name: string;
        handover_qty: number;
        handover_value: number;
        returned_qty: number;
        returned_value: number;
        sold_settled_qty: number;
        sold_settled_value: number;
        batches: Array<{
          id: string;
          date: string;
          rate: number;
          original_qty: number;
          remaining_qty: number;
        }>;
      }
    >();

    const getOrCreate = (itemId: string, itemName: string) => {
      let entry = itemLedgerMap.get(itemId);
      if (!entry) {
        entry = {
          item_id: itemId,
          item_name: itemName,
          handover_qty: 0,
          handover_value: 0,
          returned_qty: 0,
          returned_value: 0,
          sold_settled_qty: 0,
          sold_settled_value: 0,
          batches: []
        };
        itemLedgerMap.set(itemId, entry);
      }
      return entry;
    };

    // Process sorted transactions
    for (const t of sortedTransfers) {
      const entry = getOrCreate(t.item_id, t.item_name);
      const qty = Number(t.quantity) || 0;
      const rate = Number(t.rate) || 0;
      const totalVal = typeof t.total_value === 'number' ? t.total_value : Math.round(qty * rate * 100) / 100;

      const isDestination = t.destination_party_id === partyId;
      const isSource = t.source_party_id === partyId;

      const isReturnToOwner =
        t.transfer_level === 'party_to_owner' ||
        t.destination_party_id === 'owner' ||
        (t.transfer_type === 'return' && (!t.source_party_id || t.source_party_id === t.destination_party_id));

      if (isReturnToOwner && (isSource || isDestination)) {
        // Outward return from this party back to warehouse owner
        entry.returned_qty += qty;
        let need = qty;
        let consumedVal = 0;
        for (const b of entry.batches) {
          if (need <= 0) break;
          if (b.remaining_qty > 0) {
            const take = Math.min(b.remaining_qty, need);
            b.remaining_qty -= take;
            need -= take;
            consumedVal += take * b.rate;
          }
        }
        entry.returned_value += (typeof t.total_value === 'number' && t.total_value > 0 ? t.total_value : consumedVal);
      } else if (isDestination) {
        if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
          entry.handover_qty += qty;
          entry.handover_value += totalVal;
          entry.batches.push({
            id: t.id,
            date: t.transfer_date,
            rate,
            original_qty: qty,
            remaining_qty: qty
          });
        } else if (t.transfer_type === 'return' && t.source_party_id && t.source_party_id !== partyId) {
          // Received returned stock from downstream distributor
          entry.batches.push({
            id: t.id,
            date: t.transfer_date,
            rate,
            original_qty: qty,
            remaining_qty: qty
          });
        } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
          entry.sold_settled_qty += qty;
          let need = qty;
          let consumedVal = 0;
          for (const b of entry.batches) {
            if (need <= 0) break;
            if (b.remaining_qty > 0) {
              const take = Math.min(b.remaining_qty, need);
              b.remaining_qty -= take;
              need -= take;
              consumedVal += take * b.rate;
            }
          }
          entry.sold_settled_value += (typeof t.total_value === 'number' && t.total_value > 0 ? t.total_value : consumedVal);
        } else if (t.transfer_type === 'adjustment') {
          if (qty >= 0) {
            entry.batches.push({
              id: t.id,
              date: t.transfer_date,
              rate,
              original_qty: qty,
              remaining_qty: qty
            });
          } else {
            let need = Math.abs(qty);
            for (const b of entry.batches) {
              if (need <= 0) break;
              if (b.remaining_qty > 0) {
                const take = Math.min(b.remaining_qty, need);
                b.remaining_qty -= take;
                need -= take;
              }
            }
          }
        }
      } else if (isSource) {
        // Outward transfer from this party to downstream distributor
        let need = qty;
        let consumedVal = 0;
        for (const b of entry.batches) {
          if (need <= 0) break;
          if (b.remaining_qty > 0) {
            const take = Math.min(b.remaining_qty, need);
            b.remaining_qty -= take;
            need -= take;
            consumedVal += take * b.rate;
          }
        }
        if (t.transfer_type === 'return') {
          entry.returned_qty += qty;
          entry.returned_value += (typeof t.total_value === 'number' && t.total_value > 0 ? t.total_value : consumedVal);
        }
      }
    }

    // Process sales that deduct from consignment stock
    for (const s of partySales) {
      if (s.deduct_from_party_stock && Array.isArray(s.items)) {
        for (const line of s.items) {
          if (!line.item_id) continue;
          const entry = getOrCreate(line.item_id, line.item_name);
          const saleQty = Number(line.quantity) || 0;
          entry.sold_settled_qty += saleQty;
          let need = saleQty;
          let consumedVal = 0;
          for (const b of entry.batches) {
            if (need <= 0) break;
            if (b.remaining_qty > 0) {
              const take = Math.min(b.remaining_qty, need);
              b.remaining_qty -= take;
              need -= take;
              consumedVal += take * b.rate;
            }
          }
          entry.sold_settled_value += consumedVal;
        }
      }
    }

    // 3. Compute item-wise balance stock and due stock
    const itemsList: PartyStockItemLedger[] = Array.from(itemLedgerMap.values()).map(e => {
      const balanceQty = e.batches.reduce((sum, b) => sum + b.remaining_qty, 0);
      const balanceVal = e.batches.reduce((sum, b) => sum + (b.remaining_qty * b.rate), 0);
      const dueQty = balanceQty;
      const dueVal = balanceVal;

      return {
        item_id: e.item_id,
        item_name: e.item_name,
        handover_qty: e.handover_qty,
        handover_value: Math.round(e.handover_value * 100) / 100,
        returned_qty: e.returned_qty,
        returned_value: Math.round(e.returned_value * 100) / 100,
        sold_settled_qty: e.sold_settled_qty,
        sold_settled_value: Math.round(e.sold_settled_value * 100) / 100,
        balance_qty: balanceQty,
        balance_value: Math.round(balanceVal * 100) / 100,
        due_qty: dueQty,
        due_value: Math.round(dueVal * 100) / 100,
        // Backward compatibility
        issued_qty: e.handover_qty,
        held_qty: balanceQty,
        sold_qty: e.sold_settled_qty
      };
    });

    const totalHandoverQty = itemsList.reduce((s, i) => s + i.handover_qty, 0);
    const totalHandoverValue = Math.round(itemsList.reduce((s, i) => s + i.handover_value, 0) * 100) / 100;
    const totalBalanceQty = itemsList.reduce((s, i) => s + i.balance_qty, 0);
    const totalBalanceValue = Math.round(itemsList.reduce((s, i) => s + i.balance_value, 0) * 100) / 100;
    const totalDueQty = itemsList.reduce((s, i) => s + i.due_qty, 0);
    const totalDueValue = Math.round(itemsList.reduce((s, i) => s + i.due_value, 0) * 100) / 100;

    const stockSummary: PartyStockLedgerSummary = {
      party_id: party.id,
      party_name: party.name,
      state_id: party.state_id,
      state_name: state?.name || 'Unknown State',
      items: itemsList,
      total_handover_qty: totalHandoverQty,
      total_handover_value: totalHandoverValue,
      total_balance_qty: totalBalanceQty,
      total_balance_value: totalBalanceValue,
      total_due_qty: totalDueQty,
      total_due_value: totalDueValue,
      total_held_pieces: totalBalanceQty
    };

    // 4. Financial Money Ledger (strictly separated from consignment stock)
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
