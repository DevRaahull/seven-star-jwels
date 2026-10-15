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
  PartyMoneyLedgerSummary
} from '../types';

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
  id: 'default',
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

// Seed initial wholesale inventory items
const INITIAL_SEED_ITEMS: Item[] = [
  {
    id: 'item-1',
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
    id: 'item-2',
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
    id: 'item-3',
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
    id: 'item-4',
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
    id: 'pur-1',
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
        id: 'pitem-1',
        purchase_id: 'pur-1',
        item_id: 'item-1',
        item_name: 'CZ Stone Studded Nose Pin 92.5',
        quantity: 10,
        unit_purchase_rate: 110.00,
        gst_rate: 3.00,
        taxable_amount: 1100.00,
        gst_amount: 33.00,
        line_total: 1133.00
      },
      {
        id: 'pitem-2',
        purchase_id: 'pur-1',
        item_id: 'item-2',
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
    id: 'sale-1',
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
        id: 'sitem-1',
        sale_id: 'sale-1',
        item_id: 'item-1',
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
        id: 'spay-1',
        sale_id: 'sale-1',
        payment_date: '2026-03-08T16:30:00Z',
        amount: 750.00,
        payment_method: 'Cash',
        notes: 'Full payment received at counter',
        created_at: '2026-03-08T16:30:00Z'
      }
    ]
  },
  {
    id: 'sale-2',
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
        id: 'sitem-2',
        sale_id: 'sale-2',
        item_id: 'item-2',
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
        id: 'spay-2',
        sale_id: 'sale-2',
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
    id: 'exp-1',
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
    id: 'exp-2',
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
    id: 'state-1',
    name: 'Maharashtra',
    notes: 'Headquarters & local wholesale market',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'state-2',
    name: 'Gujarat',
    notes: 'Surat & Ahmedabad retail & wholesale counters',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'state-3',
    name: 'Rajasthan',
    notes: 'Jaipur artisanal wholesale network',
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const INITIAL_SEED_PARTIES: PartyRecord[] = [
  {
    id: 'party-1',
    state_id: 'state-1',
    name: 'Kothari Jewellers Pune',
    phone: '9820011223',
    notes: 'Primary wholesale dealer in Pune',
    opening_balance: 0,
    is_archived: false,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'party-2',
    state_id: 'state-2',
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
      console.error(`Error saving ${key}:`, e);
    }
  }

  // --- SETTINGS ---
  async getSettings(): Promise<BusinessSettings> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('business_settings').select('*').limit(1).maybeSingle();
      if (data) return data;
    }
    return this.getFromLocal<BusinessSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async updateSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.getSettings();
    const updated: BusinessSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    const client = getSupabaseClient();
    if (client) {
      await client.from('business_settings').upsert(updated);
    }
    this.saveToLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- ITEMS & INVENTORY ---
  async getItems(): Promise<Item[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('items').select('*').order('name', { ascending: true });
      if (data) return data;
    }
    let local = this.getFromLocal<Item[] | null>(STORAGE_KEYS.ITEMS, null);
    if (!local) {
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
    const id = itemData.id || `item-${Date.now()}`;

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
      is_archived: itemData.is_archived || false,
      created_at: itemData.created_at || now,
      updated_at: now
    };

    if (client) {
      const { data } = await client.from('items').upsert(itemRecord).select().single();
      if (data) return data;
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

  async adjustStock(itemId: string, quantityChange: number, reason: string): Promise<Item> {
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
        // Guard 1: Physical showroom stock
        if (itemToDelete.current_stock > 0) {
          throw new Error(`Cannot permanently delete "${itemToDelete.name}" because it still has ${itemToDelete.current_stock} units in stock. You can Archive it instead, or adjust stock to 0.`);
        }

        // Guard 2: Supplier purchases history
        const purchases = await this.getPurchases();
        const hasPurchases = purchases.some(p =>
          p.items?.some(it => it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemToDelete.name.toLowerCase().trim()))
        );
        if (hasPurchases) {
          throw new Error(`Cannot permanently delete "${itemToDelete.name}" because it has recorded supplier purchases. Please Archive it instead to keep historical accounts intact.`);
        }

        // Guard 3: Customer sales invoices history
        const sales = await this.getSales();
        const hasSales = sales.some(s =>
          s.items?.some(it => it.item_id === itemId || (it.item_name && it.item_name.toLowerCase().trim() === itemToDelete.name.toLowerCase().trim()))
        );
        if (hasSales) {
          throw new Error(`Cannot permanently delete "${itemToDelete.name}" because it appears on saved sales bills. Please Archive it instead to protect invoice records.`);
        }

        // Guard 4: Party consignment stock transfers
        const transfers = await this.getStockTransfers();
        const hasTransfers = transfers.some(t => t.item_id === itemId);
        if (hasTransfers) {
          throw new Error(`Cannot permanently delete "${itemToDelete.name}" because it is linked to party stock transfers. Please Archive it instead.`);
        }
      }

      this.saveToLocal(STORAGE_KEYS.ITEMS, items.filter(i => i.id !== itemId));
      const client = getSupabaseClient();
      if (client) await client.from('items').delete().eq('id', itemId);
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
      const { data } = await client.from('purchases').select('*, items:purchase_items(*)').order('purchase_date', { ascending: false });
      if (data) return data;
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
    const purchaseId = `pur-${Date.now()}`;

    let totalTaxable = 0;
    let totalGst = 0;

    const purchaseLines: PurchaseItem[] = [];

    // Process line items and auto-add new items to inventory
    for (const line of itemsData) {
      const qty = Number(line.quantity) || 1;
      const rate = Number(line.unit_purchase_rate) || 0;
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
        // Automatically add new item to inventory directly from purchase!
        matchedItem = {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: line.item_name.trim(),
          category: 'General',
          purchase_rate: rate,
          default_sale_rate: Math.round(rate * 1.35 * 100) / 100, // 35% default markup
          opening_stock: 0,
          current_stock: qty,
          low_stock_threshold: 5,
          is_archived: false,
          created_at: now,
          updated_at: now
        };
        allItems.push(matchedItem);
      } else {
        // Weighted Average Costing (WAC)
        const currentStock = Math.max(0, matchedItem.current_stock);
        const currentRate = Number(matchedItem.purchase_rate) || 0;
        let newWeightedCost = rate;
        if (currentStock > 0) {
          newWeightedCost = ((currentStock * currentRate) + (qty * rate)) / (currentStock + qty);
        }
        matchedItem.purchase_rate = Math.round(newWeightedCost * 100) / 100;
        matchedItem.current_stock += qty;
        matchedItem.updated_at = now;
      }

      purchaseLines.push({
        id: `pitem-${purchaseId}-${purchaseLines.length + 1}`,
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

    // Save updated items & purchases
    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    const purchases = await this.getPurchases();
    purchases.unshift(newPurchase);
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);

    const client = getSupabaseClient();
    if (client) {
      await client.from('purchases').insert(newPurchase);
      await client.from('purchase_items').insert(purchaseLines);
      await client.from('items').upsert(allItems);
    }

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

    // Verify reversing inward stock will not produce negative inventory
    if (purchase.items && purchase.items.length > 0) {
      for (const line of purchase.items) {
        let item: Item | undefined = line.item_id ? itemMap.get(line.item_id) : undefined;
        if (!item) {
          item = items.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        }
        if (item && item.current_stock < line.quantity) {
          throw new Error(
            `Cannot delete purchase bill: ${line.quantity - item.current_stock} pieces of "${item.name}" have already been sold or transferred. Reversing this bill would cause negative stock (${item.current_stock - line.quantity}).`
          );
        }
      }

      // Revert inward stock from items
      for (const line of purchase.items) {
        let item: Item | undefined = line.item_id ? itemMap.get(line.item_id) : undefined;
        if (!item) {
          item = items.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
        }
        if (item) {
          item.current_stock = Math.max(0, item.current_stock - line.quantity);
          item.updated_at = now;
        }
      }
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    }

    // Remove purchase
    purchases.splice(purchaseIndex, 1);
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);

    const client = getSupabaseClient();
    if (client) {
      await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
      await client.from('purchases').delete().eq('id', purchaseId);
      await client.from('items').upsert(items);
    }
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

    // 1. Temporarily revert previous purchase inward stock
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

    // 2. Validate that reverting + applying new stock doesn't produce negative stock
    for (const line of purchaseData.items) {
      let it = line.item_id ? itemMap.get(line.item_id) : undefined;
      if (!it) {
        it = allItems.find(i => i.name.toLowerCase().trim() === line.item_name.toLowerCase().trim());
      }
      if (it && (it.current_stock + line.quantity < 0)) {
        // Restore items to original before throwing
        if (existingPurchase.items) {
          for (const oldLine of existingPurchase.items) {
            let oit = oldLine.item_id ? itemMap.get(oldLine.item_id) : undefined;
            if (oit) oit.current_stock += oldLine.quantity;
          }
        }
        throw new Error(
          `Cannot update purchase: Reversing original stock would cause negative inventory for "${it.name}". Some pieces were already sold or moved.`
        );
      }
    }

    // 3. Process new purchase line items & calculate WAC + new stock
    let totalTaxable = 0;
    let totalGst = 0;
    const purchaseLines: PurchaseItem[] = [];

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
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
        itemMap.set(matchedItem.id, matchedItem);
      } else {
        // WAC update
        const currentStock = Math.max(0, matchedItem.current_stock);
        const currentRate = Number(matchedItem.purchase_rate) || 0;
        let newWeightedCost = rate;
        if (currentStock > 0) {
          newWeightedCost = ((currentStock * currentRate) + (qty * rate)) / (currentStock + qty);
        }
        matchedItem.purchase_rate = Math.round(newWeightedCost * 100) / 100;
        matchedItem.current_stock += qty;
        matchedItem.updated_at = now;
      }

      purchaseLines.push({
        id: `pitem-${purchaseId}-${purchaseLines.length + 1}`,
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

    // Save updated items & purchases
    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    purchases[purchaseIndex] = updatedPurchase;
    this.saveToLocal(STORAGE_KEYS.PURCHASES, purchases);

    const client = getSupabaseClient();
    if (client) {
      await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
      await client.from('purchase_items').insert(purchaseLines);
      await client.from('purchases').update(updatedPurchase).eq('id', purchaseId);
      await client.from('items').upsert(allItems);
    }

    return updatedPurchase;
  }

  // --- WHOLESALE SALES & BILLING ---
  async getSales(): Promise<Sale[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client
        .from('sales')
        .select('*, items:sale_items(*), payments:sale_payments(*)')
        .order('sale_date', { ascending: false });
      if (data) {
        return data.map((s: any) => ({
          ...s,
          payments: s.payments || []
        }));
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
        id: `pay-${s.id}-legacy`,
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

    // Step 1: Validate stock
    const isFromPartyStock = Boolean(saleData.deduct_from_party_stock && saleData.party_id);
    if (isFromPartyStock) {
      // Validate that party has enough stock for each item
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
          throw new Error(`Insufficient stock held by party for "${line.item_name}". Party has: ${partyHeldStock}, Requested: ${line.quantity}.`);
        }
      }
    } else {
      for (const line of itemsData) {
        const item = itemMap.get(line.item_id);
        if (!item) throw new Error(`Item "${line.item_name}" not found in inventory.`);
        if (item.current_stock < line.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Available: ${item.current_stock}, Requested: ${line.quantity}.`);
        }
      }
    }

    const saleId = `sale-${Date.now()}`;
    const now = new Date().toISOString();

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalCost = 0;

    const isInterstate = !!saleData.is_interstate;

    const saleLines: SaleItem[] = itemsData.map((line, idx) => {
      const item = itemMap.get(line.item_id) || {
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
      // Snapshot unit cost at time of sale
      const unitCost = Number(item.purchase_rate) || 0;
      const lineCost = Math.round(line.quantity * unitCost * 100) / 100;
      const lineProfit = Math.round((lineTaxable - lineCost) * 100) / 100;

      totalTaxable += lineTaxable;
      totalGst += lineGst;
      totalCost += lineCost;

      return {
        id: `sitem-${saleId}-${idx + 1}`,
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
      throw new Error(`Payment received (₹${rawReceived}) cannot exceed invoice total (₹${grandTotal}).`);
    }

    const amountReceived = Math.round(rawReceived * 100) / 100;
    const amountDue = Math.max(0, Math.round((grandTotal - amountReceived) * 100) / 100);

    let paymentStatus: PaymentStatus = 'Due Balance';
    if (amountDue === 0 && grandTotal > 0) {
      paymentStatus = 'Payment Complete';
    } else if (saleData.payment_status === 'Advance Paid' && amountReceived > 0) {
      paymentStatus = 'Advance Paid';
    } else if (saleData.payment_status === 'Payment Complete' && amountDue > 0) {
      throw new Error(`Cannot save as "Payment Complete" while an outstanding balance of ₹${amountDue} remains.`);
    } else {
      paymentStatus = 'Due Balance';
    }

    // Step 2: Deduct stock from main warehouse ONLY if not sold from party held consignment stock
    if (!isFromPartyStock) {
      for (const line of itemsData) {
        const item = itemMap.get(line.item_id);
        if (item) {
          item.current_stock -= line.quantity;
          item.updated_at = now;
        }
      }
    }

    // Create initial payment record if amountReceived > 0
    const initialPayments: SalePayment[] = [];
    if (amountReceived > 0) {
      initialPayments.push({
        id: `pay-${saleId}-1`,
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
      party_id: saleData.party_id || undefined,
      state_id: saleData.state_id || undefined,
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

    // Save updated items & sales
    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    const sales = await this.getSales();
    sales.unshift(newSale);
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    // Increment next invoice number
    const settings = await this.getSettings();
    await this.updateSettings({ next_invoice_number: settings.next_invoice_number + 1 });

    const client = getSupabaseClient();
    if (client) {
      await client.from('sales').insert(newSale);
      await client.from('sale_items').insert(saleLines);
      if (initialPayments.length > 0) {
        await client.from('sale_payments').insert(initialPayments);
      }
      await client.from('items').upsert(allItems);
    }

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
      throw new Error(`Payment amount (₹${rawAmount}) cannot exceed outstanding due balance (₹${currentDue}).`);
    }

    const now = new Date().toISOString();
    const appliedAmount = Math.min(rawAmount, currentDue);

    const paymentRecord: SalePayment = {
      id: `pay-${saleId}-${(sale.payments?.length || 0) + 1}-${Date.now()}`,
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
    if (client) {
      await client.from('sale_payments').insert(paymentRecord);
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

    // Restore stock
    if (sale.items) {
      for (const line of sale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
          item.updated_at = now;
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
    if (client) {
      await client.from('sales').update({ status: 'voided', void_reason: reason, updated_at: now }).eq('id', saleId);
      await client.from('items').upsert(items);
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

    // 1. Temporarily restore previous stock if old sale was active and not from consignment stock
    const wasFromPartyStock = existingSale.deduct_from_party_stock;
    if (existingSale.status !== 'voided' && !wasFromPartyStock && existingSale.items) {
      for (const line of existingSale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
        }
      }
    }

    // 2. Validate that each new item has enough stock (if deducting from warehouse)
    const isFromPartyStock = !!saleData.deduct_from_party_stock;
    if (!isFromPartyStock) {
      for (const line of saleData.items) {
        const item = itemMap.get(line.item_id);
        if (!item) throw new Error(`Item not found in inventory: ${line.item_name || line.item_id}`);
        if (item.current_stock < line.quantity) {
          // Re-deduct old items before throwing to keep memory clean
          if (existingSale.status !== 'voided' && !wasFromPartyStock && existingSale.items) {
            for (const oldLine of existingSale.items) {
              if (oldLine.item_id && itemMap.has(oldLine.item_id)) {
                itemMap.get(oldLine.item_id)!.current_stock -= oldLine.quantity;
              }
            }
          }
          throw new Error(
            `Insufficient stock for "${item.name}". Available: ${item.current_stock} pcs, Requested: ${line.quantity} pcs.`
          );
        }
      }

      // Deduct new quantities
      for (const line of saleData.items) {
        const item = itemMap.get(line.item_id);
        if (item) {
          item.current_stock -= line.quantity;
          item.updated_at = now;
        }
      }
    }

    // 3. Calculate financial totals
    const isInterstate = Boolean(saleData.is_interstate);
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCost = 0;
    const saleLines: SaleItem[] = [];

    // Map existing line items to preserve historical unit_cost snapshot if item was unchanged
    const oldLineCostMap = new Map(existingSale.items?.map(i => [i.item_id, i.unit_cost]) || []);

    for (const line of saleData.items) {
      const item = itemMap.get(line.item_id);
      const itemName = line.item_name || item?.name || 'Jewellery Item';
      const qty = Number(line.quantity) || 1;
      const rate = Number(line.unit_sale_rate) || 0;
      // Preserve historical cost snapshot if existed, else fallback to current purchase rate
      const unitCost = oldLineCostMap.has(line.item_id) ? oldLineCostMap.get(line.item_id)! : (item?.purchase_rate || 0);
      const gstRate = line.gst_rate !== undefined ? Number(line.gst_rate) : 3;

      const taxable = Math.round(qty * rate * 100) / 100;
      const lineCost = Math.round(qty * unitCost * 100) / 100;
      const lineProfit = Math.round((taxable - lineCost) * 100) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      if (isInterstate) {
        igst = Math.round(taxable * (gstRate / 100) * 100) / 100;
      } else {
        cgst = Math.round(taxable * (gstRate / 200) * 100) / 100;
        sgst = Math.round(taxable * (gstRate / 200) * 100) / 100;
      }
      const lineGst = cgst + sgst + igst;
      const lineTotal = Math.round((taxable + lineGst) * 100) / 100;

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCost += lineCost;

      saleLines.push({
        id: `sitem-${saleId}-${saleLines.length + 1}`,
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

    // Handle payment
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
        id: `pay-${saleId}-edit`,
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
      party_id: saleData.party_id || undefined,
      state_id: saleData.state_id || undefined,
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

    // Save items & sale
    this.saveToLocal(STORAGE_KEYS.ITEMS, allItems);
    sales[saleIndex] = updatedSale;
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    const client = getSupabaseClient();
    if (client) {
      await client.from('sale_items').delete().eq('sale_id', saleId);
      await client.from('sale_payments').delete().eq('sale_id', saleId);
      await client.from('sales').update(updatedSale).eq('id', saleId);
      await client.from('sale_items').insert(saleLines);
      if (payments.length > 0) {
        await client.from('sale_payments').insert(payments);
      }
      await client.from('items').upsert(allItems);
    }

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

    // 1. Revert inventory deduction (restore stock to warehouse) if sale wasn't already voided and wasn't from consignment
    if (sale.status !== 'voided' && !sale.deduct_from_party_stock && sale.items) {
      for (const line of sale.items) {
        if (line.item_id && itemMap.has(line.item_id)) {
          const item = itemMap.get(line.item_id)!;
          item.current_stock += line.quantity;
          item.updated_at = now;
        }
      }
      this.saveToLocal(STORAGE_KEYS.ITEMS, items);
    }

    // 2. Remove sale completely from active sales list
    sales.splice(saleIndex, 1);
    this.saveToLocal(STORAGE_KEYS.SALES, sales);

    const client = getSupabaseClient();
    if (client) {
      await client.from('sale_items').delete().eq('sale_id', saleId);
      await client.from('sale_payments').delete().eq('sale_id', saleId);
      await client.from('sales').delete().eq('id', saleId);
      await client.from('items').upsert(items);
    }
  }

  // --- OPERATING EXPENSES ---
  async getExpenses(): Promise<Expense[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('expenses').select('*').order('expense_date', { ascending: false });
      if (data) return data;
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
    const id = expenseData.id || `exp-${Date.now()}`;

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

    const expenses = await this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index >= 0) expenses[index] = { ...expenses[index], ...expenseRecord, updated_at: now };
    else expenses.unshift(expenseRecord);
    this.saveToLocal(STORAGE_KEYS.EXPENSES, expenses);

    const client = getSupabaseClient();
    if (client) await client.from('expenses').upsert(expenseRecord);

    return expenseRecord;
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = await this.getExpenses();
    this.saveToLocal(STORAGE_KEYS.EXPENSES, expenses.filter(e => e.id !== id));
    const client = getSupabaseClient();
    if (client) await client.from('expenses').delete().eq('id', id);
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
              // Only counts toward main warehouse outward if not sold from party held consignment stock
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
      const { data } = await client.from('states').select('*').order('name', { ascending: true });
      if (data && data.length > 0) return data;
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
      throw new Error(`State "${name}" already exists.`);
    }

    const now = new Date().toISOString();
    const id = stateData.id || `state-${Date.now()}`;
    const record: StateRecord = {
      id,
      name,
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
    if (client) await client.from('states').upsert(record);
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
      if (client) await client.from('states').update({ is_archived: true }).eq('id', id);
    }
  }

  async getParties(): Promise<PartyRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('parties').select('*').order('name', { ascending: true });
      if (data && data.length > 0) return data;
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
    const id = partyData.id || `party-${Date.now()}`;
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

    const index = parties.findIndex(p => p.id === id);
    if (index >= 0) {
      parties[index] = { ...parties[index], ...record, updated_at: now };
    } else {
      parties.push(record);
    }
    this.saveToLocal(STORAGE_KEYS.PARTIES, parties);

    const client = getSupabaseClient();
    if (client) await client.from('parties').upsert(record);
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
      if (client) await client.from('parties').update({ is_archived: true }).eq('id', id);
    }
  }

  // --- STOCK TRANSFERS & RETURNS ---
  async getStockTransfers(): Promise<StockTransfer[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('stock_transfers').select('*').order('transfer_date', { ascending: false });
      if (data) return data;
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
          `Insufficient main warehouse stock for "${item.name}". Available: ${item.current_stock}, Requested: ${qty}`
        );
      }
      // Decreases main warehouse inventory
      item.current_stock -= qty;
      item.updated_at = now;
    } else {
      // Returns increase main warehouse inventory
      item.current_stock += qty;
      item.updated_at = now;
    }

    const transferId = `trans-${Date.now()}`;
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

    const transfers = await this.getStockTransfers();
    transfers.unshift(transferRecord);
    this.saveToLocal(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
    this.saveToLocal(STORAGE_KEYS.ITEMS, items);

    const client = getSupabaseClient();
    if (client) {
      await client.from('stock_transfers').insert(transferRecord);
      await client.from('items').upsert(items);
    }

    return transferRecord;
  }

  // --- PARTY PAYMENTS ---
  async getPartyPayments(): Promise<PartyPayment[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('party_payments').select('*').order('payment_date', { ascending: false });
      if (data) return data;
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
    const paymentRecord: PartyPayment = {
      id: `ppay-${Date.now()}`,
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
      await client.from('party_payments').insert(paymentRecord);
    }

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

    // 1. Stock Ledger Breakdown by Item
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

    // 2. Money Ledger Breakdown
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
      message: `Successfully restored backup with items, purchases, sales, states, parties, and ledgers.`
    };
  }
}

export const storage = new StorageService();
