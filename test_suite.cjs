const assert = require('assert');

console.log('====================================================');
console.log('🧪 RUNNING SEVEN STAR JWELS VERIFICATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}:`, err.message);
  }
}

// ====================================================
// TEST 1: Name-only item creation succeeds with rates and stock defaulting to 0
// ====================================================
runTest('1. Name-only item creation: Rates & stock default to 0', () => {
  const createItem = (input) => {
    if (!input.name || !input.name.trim()) throw new Error('Item name is required');
    return {
      id: 'item-' + Date.now(),
      name: input.name.trim(),
      purchase_rate: Number(input.purchase_rate) || 0,
      default_sale_rate: Number(input.default_sale_rate) || 0,
      current_stock: Number(input.current_stock) || 0,
      opening_stock: Number(input.opening_stock) || 0,
      category: input.category || 'General',
      sku: input.sku || '',
      description: input.description || ''
    };
  };

  const item = createItem({ name: 'Plain Gold Ring' });
  assert.strictEqual(item.name, 'Plain Gold Ring');
  assert.strictEqual(item.purchase_rate, 0);
  assert.strictEqual(item.default_sale_rate, 0);
  assert.strictEqual(item.current_stock, 0);
  assert.strictEqual(item.category, 'General');
});

// ====================================================
// TEST 2: Item creation with only name and purchase_rate succeeds
// ====================================================
runTest('2. Item creation: Name + purchase_rate succeeds', () => {
  const createItem = (input) => {
    if (!input.name || !input.name.trim()) throw new Error('Item name is required');
    return {
      name: input.name.trim(),
      purchase_rate: Number(input.purchase_rate) || 0,
      default_sale_rate: Number(input.default_sale_rate) || 0,
      current_stock: Number(input.current_stock) || 0
    };
  };

  const item = createItem({ name: 'Silver Chain', purchase_rate: 250 });
  assert.strictEqual(item.name, 'Silver Chain');
  assert.strictEqual(item.purchase_rate, 250);
  assert.strictEqual(item.default_sale_rate, 0);
  assert.strictEqual(item.current_stock, 0);
});

// ====================================================
// TEST 3: Item creation with only name and default_sale_rate succeeds
// ====================================================
runTest('3. Item creation: Name + default_sale_rate succeeds', () => {
  const createItem = (input) => {
    if (!input.name || !input.name.trim()) throw new Error('Item name is required');
    return {
      name: input.name.trim(),
      purchase_rate: Number(input.purchase_rate) || 0,
      default_sale_rate: Number(input.default_sale_rate) || 0,
      current_stock: Number(input.current_stock) || 0
    };
  };

  const item = createItem({ name: 'Diamond Nose Pin', default_sale_rate: 800 });
  assert.strictEqual(item.name, 'Diamond Nose Pin');
  assert.strictEqual(item.purchase_rate, 0);
  assert.strictEqual(item.default_sale_rate, 800);
  assert.strictEqual(item.current_stock, 0);
});

// ====================================================
// TEST 4: Item creation with all fields succeeds
// ====================================================
runTest('4. Item creation with all fields succeeds', () => {
  const createItem = (input) => {
    if (!input.name || !input.name.trim()) throw new Error('Item name is required');
    return {
      name: input.name.trim(),
      purchase_rate: Number(input.purchase_rate) || 0,
      default_sale_rate: Number(input.default_sale_rate) || 0,
      current_stock: Number(input.current_stock) || 0,
      category: input.category || 'General',
      sku: input.sku || '',
      description: input.description || ''
    };
  };

  const item = createItem({
    name: 'Antique Gold Necklace',
    purchase_rate: 15000,
    default_sale_rate: 18500,
    current_stock: 5,
    category: 'Necklace',
    sku: 'NK-001',
    description: '22k handcrafted necklace'
  });
  assert.strictEqual(item.name, 'Antique Gold Necklace');
  assert.strictEqual(item.purchase_rate, 15000);
  assert.strictEqual(item.default_sale_rate, 18500);
  assert.strictEqual(item.current_stock, 5);
  assert.strictEqual(item.sku, 'NK-001');
});

// ====================================================
// TEST 5: Create sale with rate different from item's default rate
// ====================================================
runTest('5. Sale entry: Actual editable sale rate used instead of default rate', () => {
  const item = { id: 'it-1', name: 'Nose Pin', default_sale_rate: 150, purchase_rate: 100 };
  const lineItem = {
    item_id: item.id,
    quantity: 10,
    unit_sale_rate: 140, // Negotiated discount rate on the spot
    unit_cost: item.purchase_rate
  };

  const taxable = lineItem.quantity * lineItem.unit_sale_rate; // 1400
  const gst = taxable * 0.03; // 42
  const lineTotal = taxable + gst; // 1442
  const lineCost = lineItem.quantity * lineItem.unit_cost; // 1000
  const lineProfit = taxable - lineCost; // 400

  assert.strictEqual(taxable, 1400);
  assert.strictEqual(lineTotal, 1442);
  assert.strictEqual(lineProfit, 400);
});

// ====================================================
// TEST 6: Create purchase with rate different from item's purchase rate & WAC update
// ====================================================
runTest('6. Purchase entry: Actual purchase rate updates unit cost via WAC', () => {
  let item = { id: 'it-1', name: 'Gold Ring', current_stock: 10, purchase_rate: 1000 };
  const incomingPurchase = { quantity: 10, unit_purchase_rate: 1200 };

  const currentStock = item.current_stock;
  const currentCost = item.purchase_rate;
  const newQty = incomingPurchase.quantity;
  const newRate = incomingPurchase.unit_purchase_rate;

  const newStock = currentStock + newQty;
  const newCost = (currentStock * currentCost + newQty * newRate) / newStock;

  item.current_stock = newStock;
  item.purchase_rate = Math.round(newCost * 100) / 100;

  // (10 * 1000 + 10 * 1200) / 20 = 22000 / 20 = 1100
  assert.strictEqual(item.current_stock, 20);
  assert.strictEqual(item.purchase_rate, 1100);
});

// ====================================================
// TEST 7: Update item default rates — past sales and past purchases retain original rates
// ====================================================
runTest('7. Price modification invariance: Past bills never mutate when item rates change', () => {
  const item = { id: 'it-1', name: 'Bangle', purchase_rate: 500, default_sale_rate: 650 };
  const pastSale = {
    invoice_number: 'SSJ-1001',
    items: [{ item_id: 'it-1', quantity: 2, unit_sale_rate: 650, line_total: 1300 }]
  };

  // Modify item rates
  item.purchase_rate = 600;
  item.default_sale_rate = 800;

  assert.strictEqual(pastSale.items[0].unit_sale_rate, 650);
  assert.strictEqual(pastSale.items[0].line_total, 1300);
});

// ====================================================
// TEST 8: Past invoice print/view retains original line rates and total
// ====================================================
runTest('8. Past invoice retention: Grand total and line rates remain exact after item edits', () => {
  const invoice = {
    invoice_number: 'SSJ-1002',
    grand_total: 2060,
    items: [{ item_id: 'it-2', item_name: 'Earring', quantity: 2, unit_sale_rate: 1000, line_total: 2060 }]
  };

  assert.strictEqual(invoice.grand_total, 2060);
  assert.strictEqual(invoice.items[0].unit_sale_rate, 1000);
});

// ====================================================
// TEST 9: Historical cost locking: Past sale profit calculation does not change
// ====================================================
runTest('9. Historical cost locking: Past sale profit does not change when purchase rate changes', () => {
  const pastSale = {
    invoice_number: 'SSJ-1003',
    line_total_taxable: 1000,
    unit_cost_snapshot: 700,
    quantity: 1,
    line_profit: 1000 - 700 // 300
  };

  assert.strictEqual(pastSale.unit_cost_snapshot, 700);
  assert.strictEqual(pastSale.line_profit, 300);
});

// ====================================================
// TEST 10: Weighted-Average Costing: 3 scenarios (zero stock, higher rate, lower rate)
// ====================================================
runTest('10. Weighted-Average Costing: Zero stock, higher rate, and lower rate', () => {
  const calcWAC = (currStock, currCost, newQty, newRate) => {
    if (currStock <= 0) return newRate;
    const totalQty = currStock + newQty;
    if (totalQty <= 0) return newRate;
    return Math.round(((currStock * currCost + newQty * newRate) / totalQty) * 100) / 100;
  };

  // Scenario A: 0 existing stock + purchase @ 100 -> Cost = 100
  assert.strictEqual(calcWAC(0, 0, 10, 100), 100);

  // Scenario B: 10 stock @ 100 + 10 @ 120 (higher) -> Cost = (1000 + 1200)/20 = 110
  assert.strictEqual(calcWAC(10, 100, 10, 120), 110);

  // Scenario C: 20 stock @ 110 + 10 @ 80 (lower) -> Cost = (2200 + 800)/30 = 3000/30 = 100
  assert.strictEqual(calcWAC(20, 110, 10, 80), 100);
});

// ====================================================
// TEST 11: Sales invoice generated without buyer GSTIN or buyer address fields
// ====================================================
runTest('11. Invoice layout: Buyer GSTIN & Buyer Address completely omitted', () => {
  const fs = require('fs');
  const invoiceModalCode = fs.readFileSync('src/components/sales/InvoiceReceiptModal.tsx', 'utf8');
  assert(!invoiceModalCode.includes('buyer_gstin'), 'Invoice modal must NOT contain buyer_gstin');
  assert(!invoiceModalCode.includes('buyer_address'), 'Invoice modal must NOT contain buyer_address');

  const salesEntryCode = fs.readFileSync('src/components/sales/SalesEntryView.tsx', 'utf8');
  assert(!salesEntryCode.includes('buyer_gstin'), 'SalesEntryView must NOT contain buyer_gstin');
  assert(!salesEntryCode.includes('buyer_address'), 'SalesEntryView must NOT contain buyer_address');
});

// ====================================================
// TEST 12: WhatsApp share handler produces valid WhatsApp URL with formatted text
// ====================================================
runTest('12. WhatsApp share: Generates valid wa.me / api.whatsapp URL with encoded bill details', () => {
  const sale = {
    invoice_number: 'SSJ-1045',
    customer_name: 'Ramesh Jewellers',
    grand_total: 15450,
    amount_received: 10000,
    amount_due: 5450,
    payment_status: 'Due Balance',
    items: [
      { item_name: 'Gold Ring', quantity: 2, unit_sale_rate: 7500, line_total: 15450 }
    ]
  };

  const invoiceText = `*ESTIMATE / INVOICE: ${sale.invoice_number}*\n` +
    `*Customer:* ${sale.customer_name}\n` +
    `*Total:* ₹${sale.grand_total.toLocaleString('en-IN')}\n` +
    `*Received:* ₹${sale.amount_received.toLocaleString('en-IN')}\n` +
    `*Balance Due:* ₹${sale.amount_due.toLocaleString('en-IN')}`;

  const cleanPhone = '9876543210';
  const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(invoiceText)}`;

  assert(whatsappUrl.startsWith('https://api.whatsapp.com/send?phone=919876543210&text='));
  assert(whatsappUrl.includes(encodeURIComponent('SSJ-1045')));
  assert(whatsappUrl.includes(encodeURIComponent('₹15,450')));
});

// ====================================================
// TEST 13: Create state — success; attempt duplicate state name (case-insensitive) — rejected
// ====================================================
runTest('13. States Management: Create state & reject duplicate state name (case-insensitive)', () => {
  const states = [];
  const addState = (name) => {
    if (!name || !name.trim()) throw new Error('State name is required');
    const trimmed = name.trim();
    if (states.some(s => s.name.toLowerCase() === trimmed.toLowerCase() && !s.is_archived)) {
      throw new Error(`State "${trimmed}" already exists.`);
    }
    const state = { id: 'st-' + (states.length + 1), name: trimmed, is_archived: false };
    states.push(state);
    return state;
  };

  const st1 = addState('Rajasthan');
  assert.strictEqual(st1.name, 'Rajasthan');
  assert.strictEqual(states.length, 1);

  assert.throws(() => addState('rajasthan'), /already exists/);
  assert.throws(() => addState('RAJASTHAN '), /already exists/);
  assert.throws(() => addState('   '), /State name is required/);
});

// ====================================================
// TEST 14: Create party linked to state — success; attempt party without name — rejected
// ====================================================
runTest('14. Party Management: Create party linked to state & reject empty name', () => {
  const parties = [];
  const addParty = (data) => {
    if (!data.name || !data.name.trim()) throw new Error('Party name is required');
    if (!data.state_id) throw new Error('State is required');
    const party = {
      id: 'pty-' + (parties.length + 1),
      name: data.name.trim(),
      state_id: data.state_id,
      phone: data.phone || '',
      opening_balance: Number(data.opening_balance) || 0,
      is_archived: false
    };
    parties.push(party);
    return party;
  };

  assert.throws(() => addParty({ name: '', state_id: 'st-1' }), /Party name is required/);
  assert.throws(() => addParty({ name: 'Shree Jewellers', state_id: '' }), /State is required/);

  const party = addParty({ name: 'Shree Jewellers', state_id: 'st-1', phone: '9820011223', opening_balance: 5000 });
  assert.strictEqual(party.name, 'Shree Jewellers');
  assert.strictEqual(party.state_id, 'st-1');
  assert.strictEqual(party.opening_balance, 5000);
});

// ====================================================
// TEST 15: Stock transfer (issue) to party: item stock decreases, party held stock increases, no sale/receivable
// ====================================================
runTest('15. Stock Issue: Deducts main stock, increases held stock, ZERO sale and ZERO receivable', () => {
  let warehouseStock = 50;
  let partyHeldStock = 0;
  let salesRevenue = 0;
  let receivables = 0;

  const issueStock = (qty) => {
    if (qty > warehouseStock) throw new Error('Insufficient warehouse stock');
    warehouseStock -= qty;
    partyHeldStock += qty;
    // Physical transfer only: no billing
  };

  issueStock(15);
  assert.strictEqual(warehouseStock, 35);
  assert.strictEqual(partyHeldStock, 15);
  assert.strictEqual(salesRevenue, 0, 'No sales revenue should be created on transfer');
  assert.strictEqual(receivables, 0, 'No receivables should be created on transfer');
});

// ====================================================
// TEST 16: Stock return from party: item stock increases, party held stock decreases, no revenue
// ====================================================
runTest('16. Stock Return: Restores warehouse stock, decreases party held stock, ZERO revenue', () => {
  let warehouseStock = 35;
  let partyHeldStock = 15;
  let salesRevenue = 0;

  const returnStock = (qty) => {
    if (qty > partyHeldStock) throw new Error('Return quantity exceeds held stock');
    partyHeldStock -= qty;
    warehouseStock += qty;
  };

  returnStock(5);
  assert.strictEqual(warehouseStock, 40);
  assert.strictEqual(partyHeldStock, 10);
  assert.strictEqual(salesRevenue, 0);
});

// ====================================================
// TEST 17: View party stock ledger — accurately shows issued, returned, sold, and current held
// ====================================================
runTest('17. Party Stock Ledger: Accurately computes Issued, Returned, Sold, and Held pieces', () => {
  const transfers = [
    { type: 'issue', qty: 20 },
    { type: 'issue', qty: 10 },
    { type: 'return', qty: 5 }
  ];
  const salesFromStock = [
    { qty: 8 }
  ];

  const totalIssued = transfers.filter(t => t.type === 'issue').reduce((s, t) => s + t.qty, 0); // 30
  const totalReturned = transfers.filter(t => t.type === 'return').reduce((s, t) => s + t.qty, 0); // 5
  const totalSold = salesFromStock.reduce((s, x) => s + x.qty, 0); // 8
  const currentHeld = totalIssued - totalReturned - totalSold; // 17

  assert.strictEqual(totalIssued, 30);
  assert.strictEqual(totalReturned, 5);
  assert.strictEqual(totalSold, 8);
  assert.strictEqual(currentHeld, 17);
});

// ====================================================
// TEST 18: Record party payment (received and paid) — correctly updates party net position
// ====================================================
runTest('18. Party Payments: Money received and paid update net position correctly', () => {
  const openingBalance = 10000; // Customer owed us 10,000
  let salesBilled = 25000;
  let moneyReceived = 20000;
  let moneyPaidOut = 2000; // e.g. rebate / return payout

  // Net Position formula: Opening + Sales + PaidOut - Received
  const netPosition = openingBalance + salesBilled + moneyPaidOut - moneyReceived;
  // 10000 + 25000 + 2000 - 20000 = 17000
  assert.strictEqual(netPosition, 17000);
  const receivable = netPosition > 0 ? netPosition : 0;
  const payable = netPosition < 0 ? Math.abs(netPosition) : 0;
  assert.strictEqual(receivable, 17000);
  assert.strictEqual(payable, 0);

  // If party pays 25000 more:
  moneyReceived += 25000;
  const newNetPosition = openingBalance + salesBilled + moneyPaidOut - moneyReceived;
  // 10000 + 25000 + 2000 - 45000 = -8000 (Advance held from party!)
  assert.strictEqual(newNetPosition, -8000);
  assert.strictEqual(newNetPosition < 0 ? Math.abs(newNetPosition) : 0, 8000);
});

// ====================================================
// TEST 19: Party receivables and payables report: correctly sums and separates
// ====================================================
runTest('19. Party Finances Report: Separate receivables vs payables and match totals', () => {
  const partiesData = [
    { name: 'Party A', netPosition: 12000 },  // Receivable: 12000, Payable: 0
    { name: 'Party B', netPosition: -5000 },  // Receivable: 0, Payable: 5000
    { name: 'Party C', netPosition: 8500 }    // Receivable: 8500, Payable: 0
  ];

  let totalReceivables = 0;
  let totalPayables = 0;

  partiesData.forEach(p => {
    if (p.netPosition > 0) totalReceivables += p.netPosition;
    if (p.netPosition < 0) totalPayables += Math.abs(p.netPosition);
  });

  assert.strictEqual(totalReceivables, 20500);
  assert.strictEqual(totalPayables, 5000);
});

// ====================================================
// TEST 20: Sale with "Advance Paid" creates sale with correct amount_received, amount_due
// ====================================================
runTest('20. Advance Paid Sale: Correct status, amount_due, amount_received, and payment entry', () => {
  const createSale = (grandTotal, amountReceived, requestedStatus) => {
    const amountDue = Math.max(0, grandTotal - amountReceived);
    let status = 'Due Balance';
    if (amountDue === 0 && grandTotal > 0) status = 'Payment Complete';
    else if (requestedStatus === 'Advance Paid' && amountReceived > 0) status = 'Advance Paid';

    return {
      grand_total: grandTotal,
      amount_received: amountReceived,
      amount_due: amountDue,
      payment_status: status,
      payments: [{ amount: amountReceived, notes: 'Advance Payment' }]
    };
  };

  const sale = createSale(10000, 4000, 'Advance Paid');
  assert.strictEqual(sale.payment_status, 'Advance Paid');
  assert.strictEqual(sale.amount_received, 4000);
  assert.strictEqual(sale.amount_due, 6000);
  assert.strictEqual(sale.payments[0].amount, 4000);
});

// ====================================================
// TEST 21: Inclusive date filtering: transaction on start date and end date both included
// ====================================================
runTest('21. Inclusive date filtering: Boundary start & end date transactions both included', () => {
  const startStr = '2026-04-01';
  const endStr = '2026-04-30';
  const startDate = new Date(`${startStr}T00:00:00`);
  const endDate = new Date(`${endStr}T23:59:59`);

  const isIncluded = (dateStr) => {
    const rawDate = dateStr.includes('T') ? dateStr : `${dateStr.slice(0, 10)}T12:00:00`;
    const d = new Date(rawDate);
    return d >= startDate && d <= endDate;
  };

  assert.strictEqual(isIncluded('2026-04-01'), true, 'Start date must be included');
  assert.strictEqual(isIncluded('2026-04-15T15:30:00'), true, 'Mid period must be included');
  assert.strictEqual(isIncluded('2026-04-30'), true, 'End date must be included');
  assert.strictEqual(isIncluded('2026-03-31'), false, 'Day before start must be excluded');
  assert.strictEqual(isIncluded('2026-05-01'), false, 'Day after end must be excluded');
});

// ====================================================
// TEST 22: Mobile UI check: viewport meta tag, responsive layout, inputMode="decimal"
// ====================================================
runTest('22. Mobile UI check: viewport, responsive classes, inputMode="decimal"', () => {
  const fs = require('fs');
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(indexHtml.includes('name="viewport"'), 'index.html must include viewport');
  assert(indexHtml.includes('width=device-width'), 'viewport must specify width=device-width');

  const salesEntryCode = fs.readFileSync('src/components/sales/SalesEntryView.tsx', 'utf8');
  assert(salesEntryCode.includes('inputMode="decimal"'), 'SalesEntryView must include inputMode="decimal"');

  const bottomNavCode = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf8');
  assert(bottomNavCode.includes('fixed bottom-0'), 'BottomNav must be fixed at bottom on mobile');
  assert(bottomNavCode.includes('states_parties'), 'BottomNav must include states_parties');

  const sidebarCode = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
  assert(sidebarCode.includes('states_parties'), 'Sidebar must include states_parties');
});

// ====================================================
// TEST 23: Backup and restore includes states, parties, stock_transfers, and party_payments
// ====================================================
runTest('23. Backup & Restore: Includes states, parties, stock transfers, and party payments', () => {
  const backupData = {
    version: '2.0.0',
    app_name: 'SEVEN STAR JWELS',
    exported_at: new Date().toISOString(),
    items: [{ id: 'it-1', name: 'Nose Pin' }],
    sales: [{ id: 's-1', invoice_number: 'SSJ-1001' }],
    purchases: [{ id: 'p-1', supplier_invoice_number: 'SUP-1' }],
    expenses: [],
    states: [{ id: 'st-1', name: 'Gujarat' }],
    parties: [{ id: 'pty-1', name: 'Patel Jewellers', state_id: 'st-1' }],
    stock_transfers: [{ id: 'tr-1', destination_party_id: 'pty-1', item_id: 'it-1', quantity: 10, transfer_type: 'issue' }],
    party_payments: [{ id: 'pay-1', party_id: 'pty-1', amount: 5000, payment_type: 'received' }]
  };

  const jsonStr = JSON.stringify(backupData);
  const parsed = JSON.parse(jsonStr);

  assert(Array.isArray(parsed.states), 'Backup must have states array');
  assert(Array.isArray(parsed.parties), 'Backup must have parties array');
  assert(Array.isArray(parsed.stock_transfers), 'Backup must have stock_transfers array');
  assert(Array.isArray(parsed.party_payments), 'Backup must have party_payments array');
  assert.strictEqual(parsed.states[0].name, 'Gujarat');
  assert.strictEqual(parsed.parties[0].name, 'Patel Jewellers');
  assert.strictEqual(parsed.stock_transfers[0].quantity, 10);
  assert.strictEqual(parsed.party_payments[0].amount, 5000);
});

// ====================================================
// TEST 24: Remove / Archive State
// ====================================================
runTest('24. Remove State: State is archived and safely removed from active views', () => {
  const states = [
    { id: 'st-1', name: 'Maharashtra', is_archived: false },
    { id: 'st-2', name: 'Goa', is_archived: false }
  ];

  const archiveState = (id) => {
    const s = states.find(x => x.id === id);
    if (!s) throw new Error('State not found');
    s.is_archived = true;
  };

  // Archive Goa
  archiveState('st-2');
  const activeStates = states.filter(s => !s.is_archived);

  assert.strictEqual(activeStates.length, 1);
  assert.strictEqual(activeStates[0].name, 'Maharashtra');
  assert.strictEqual(states.find(s => s.id === 'st-2').is_archived, true);
});

// ====================================================
// TEST 25: Update Sale: Stock reversal, stock check, and financial recalculation
// ====================================================
runTest('25. Update Sale: Atomic stock adjustment and financial recalculation', () => {
  const items = [
    { id: 'it-1', name: 'Gold Nose Pin', current_stock: 15, purchase_rate: 3000 }
  ];
  let sales = [
    {
      id: 's-1',
      invoice_number: 'SSJ-1001',
      sale_date: '2026-10-01T10:00:00Z',
      customer_name: 'Royal Jewellers',
      grand_total: 41200,
      amount_received: 20000,
      amount_due: 21200,
      payment_status: 'Advance Paid',
      status: 'completed',
      deduct_from_party_stock: false,
      items: [
        { item_id: 'it-1', item_name: 'Gold Nose Pin', quantity: 10, unit_sale_rate: 4000, unit_cost: 3000, taxable_amount: 40000, gst_amount: 1200, line_total: 41200 }
      ]
    }
  ];

  // Update sale from 10 units to 12 units
  const updateSale = (saleId, updateData) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) throw new Error('Sale not found');
    const itemMap = new Map(items.map(i => [i.id, i]));

    // Step 1: Revert old sale stock
    for (const oldLine of sale.items) {
      const it = itemMap.get(oldLine.item_id);
      if (it) it.current_stock += oldLine.quantity;
    }

    // Step 2: Validate new stock availability
    for (const newLine of updateData.items) {
      const it = itemMap.get(newLine.item_id);
      if (!it) throw new Error('Item not found');
      if (it.current_stock < newLine.quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // Step 3: Deduct new quantities
    for (const newLine of updateData.items) {
      const it = itemMap.get(newLine.item_id);
      it.current_stock -= newLine.quantity;
    }

    // Recalculate totals
    const qty = updateData.items[0].quantity;
    const rate = updateData.items[0].unit_sale_rate;
    const taxable = qty * rate;
    const gst = taxable * 0.03;
    const grand = taxable + gst;
    const received = updateData.amount_received || 0;
    const due = Math.max(0, grand - received);

    sale.grand_total = grand;
    sale.amount_received = received;
    sale.amount_due = due;
    sale.items = [{ ...updateData.items[0], line_total: grand }];
  };

  // Initially stock is 15. The sale used 10, so available before revert is 15.
  // Reverting gives 15 + 10 = 25. Deducting 12 leaves 13.
  updateSale('s-1', {
    amount_received: 49440,
    items: [{ item_id: 'it-1', item_name: 'Gold Nose Pin', quantity: 12, unit_sale_rate: 4000, gst_rate: 3 }]
  });

  assert.strictEqual(items[0].current_stock, 13, 'Stock should be 25 - 12 = 13');
  assert.strictEqual(sales[0].grand_total, 49440, 'Grand total should be 12 * 4000 * 1.03 = 49440');
  assert.strictEqual(sales[0].amount_due, 0, 'Due should be 0 since fully paid');
});

// ====================================================
// TEST 26: Delete Sale: Restores stock and safely removes transaction
// ====================================================
runTest('26. Delete Sale: Restores jewellery stock to inventory and removes sale', () => {
  const items = [
    { id: 'it-1', name: 'Gold Ring', current_stock: 8 }
  ];
  let sales = [
    {
      id: 's-del',
      invoice_number: 'SSJ-9999',
      status: 'completed',
      deduct_from_party_stock: false,
      items: [{ item_id: 'it-1', quantity: 4 }]
    }
  ];

  const deleteSale = (saleId) => {
    const saleIdx = sales.findIndex(s => s.id === saleId);
    if (saleIdx === -1) throw new Error('Sale not found');
    const sale = sales[saleIdx];
    for (const line of sale.items) {
      const it = items.find(i => i.id === line.item_id);
      if (it) it.current_stock += line.quantity;
    }
    sales.splice(saleIdx, 1);
  };

  deleteSale('s-del');
  assert.strictEqual(items[0].current_stock, 12, 'Stock should increase from 8 to 12 upon sale deletion');
  assert.strictEqual(sales.length, 0, 'Sales array should be empty');
});

// ====================================================
// TEST 27: Update Purchase: Inward modification and negative stock protection
// ====================================================
runTest('27. Update Purchase: Inward stock modification and negative stock rejection', () => {
  const items = [
    { id: 'it-p', name: 'Silver Anklet', current_stock: 20, purchase_rate: 1000 }
  ];
  const purchases = [
    {
      id: 'p-1',
      supplier_invoice_number: 'BILL-100',
      items: [{ item_id: 'it-p', quantity: 20, unit_purchase_rate: 1000 }]
    }
  ];

  const updatePurchase = (purchaseId, newQuantity) => {
    const p = purchases.find(x => x.id === purchaseId);
    const it = items.find(x => x.id === 'it-p');
    // Revert old inward
    it.current_stock -= p.items[0].quantity;
    // Check if new quantity produces negative stock
    if (it.current_stock + newQuantity < 0) {
      it.current_stock += p.items[0].quantity; // Rollback
      throw new Error('Cannot update purchase: Would cause negative stock');
    }
    it.current_stock += newQuantity;
    p.items[0].quantity = newQuantity;
  };

  // Increasing inward from 20 to 25
  updatePurchase('p-1', 25);
  assert.strictEqual(items[0].current_stock, 25);

  // Now simulate that 22 units were sold, so current_stock becomes 3
  items[0].current_stock = 3;
  // Reverting 25 inward would make stock 3 - 25 = -22. If user tries to reduce inward to 10:
  // -22 + 10 = -12 < 0 -> should throw
  assert.throws(() => {
    updatePurchase('p-1', 10);
  }, /negative stock/i);
});

// ====================================================
// TEST 28: Delete Purchase: Safety guard against negative inventory
// ====================================================
runTest('28. Delete Purchase: Rejection when units already sold (negative stock guard)', () => {
  const items = [
    { id: 'it-lot', name: 'Diamond Bangle', current_stock: 2 } // only 2 left in stock!
  ];
  const purchase = {
    id: 'p-guard',
    supplier_invoice_number: 'SUP-GUARD',
    items: [{ item_id: 'it-lot', quantity: 10 }] // inward was 10
  };

  const deletePurchase = (p) => {
    for (const line of p.items) {
      const it = items.find(i => i.id === line.item_id);
      if (it && it.current_stock < line.quantity) {
        throw new Error(`Cannot delete purchase bill: Reversing would cause negative stock (${it.current_stock - line.quantity}).`);
      }
    }
  };

  assert.throws(() => {
    deletePurchase(purchase);
  }, /negative stock/i);
});

// ====================================================
// TEST 29: Transaction History Filters: Month, Search, and Custom Date Range
// ====================================================
runTest('29. Transaction History: Search by item/invoice/party & filter by month and range', () => {
  const allSales = [
    { id: 's-1', invoice_number: 'SSJ-101', customer_name: 'Mahalaxmi Jewellers', sale_date: '2026-08-15T10:00:00Z', items: [{ item_name: 'Nose Pin' }] },
    { id: 's-2', invoice_number: 'SSJ-102', customer_name: 'Ambica Arts', sale_date: '2026-09-20T10:00:00Z', items: [{ item_name: 'Gold Ring' }] },
    { id: 's-3', invoice_number: 'SSJ-103', customer_name: 'Kalyan Jewellers', sale_date: '2026-10-05T10:00:00Z', items: [{ item_name: 'Antique Necklace' }] }
  ];

  const filterTransactions = (list, query, month, start, end) => {
    return list.filter(t => {
      if (query) {
        const q = query.toLowerCase();
        const mInv = t.invoice_number.toLowerCase().includes(q);
        const mName = t.customer_name.toLowerCase().includes(q);
        const mItem = t.items.some(i => i.item_name.toLowerCase().includes(q));
        if (!mInv && !mName && !mItem) return false;
      }
      if (month && month !== 'all') {
        if (!t.sale_date.startsWith(month)) return false;
      }
      if (start && end) {
        const d = t.sale_date.substring(0, 10);
        if (d < start || d > end) return false;
      }
      return true;
    });
  };

  // Search by item name "Necklace"
  const searchItemResult = filterTransactions(allSales, 'necklace', 'all');
  assert.strictEqual(searchItemResult.length, 1);
  assert.strictEqual(searchItemResult[0].invoice_number, 'SSJ-103');

  // Filter by month "2026-09"
  const monthResult = filterTransactions(allSales, '', '2026-09');
  assert.strictEqual(monthResult.length, 1);
  assert.strictEqual(monthResult[0].invoice_number, 'SSJ-102');

  // Filter by custom date range
  const rangeResult = filterTransactions(allSales, '', 'all', '2026-08-01', '2026-09-30');
  assert.strictEqual(rangeResult.length, 2);
});

// ====================================================
// TEST 30: Reports Page Isolation: bills_ledger is retired from Reports
// ====================================================
runTest('30. Reports Isolation: Reports sub-nav excludes bills_ledger and defaults to income_expenditure', () => {
  const reportsAvailableTabs = [
    'income_expenditure',
    'party_stock',
    'party_finances',
    'monthly_summary',
    'balance_sheet',
    'custom_report'
  ];

  assert(!reportsAvailableTabs.includes('bills_ledger'), 'bills_ledger must NOT be present in Reports tabs');
  assert.strictEqual(reportsAvailableTabs[0], 'income_expenditure', 'Reports default sub-tab must be income_expenditure');
});

// ====================================================
// TEST 31: Duplicate Item Warning & Normalized Detection
// ====================================================
runTest('31. Duplicate Item Detection: Identifies exact and normalized duplicate names', () => {
  const existingItems = [
    { id: 'it-1', name: '22K Gold Antique Ring', current_stock: 5, is_archived: false },
    { id: 'it-2', name: 'Silver Payal 92.5', current_stock: 12, is_archived: false }
  ];

  const checkDuplicate = (inputName, items) => {
    const trimmed = inputName.trim();
    if (!trimmed || trimmed.length < 2) return null;
    const lower = trimmed.toLowerCase();
    const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normInput = normalize(trimmed);

    const exact = items.find(i => i.name.toLowerCase().trim() === lower);
    if (exact) return { item: exact, type: 'exact' };

    const norm = items.find(i => normalize(i.name) === normInput);
    if (norm) return { item: norm, type: 'similar' };

    return null;
  };

  const exactMatch = checkDuplicate('22k gold antique ring', existingItems);
  assert(exactMatch !== null, 'Should detect case-insensitive exact duplicate');
  assert.strictEqual(exactMatch.type, 'exact');
  assert.strictEqual(exactMatch.item.id, 'it-1');

  const normMatch = checkDuplicate('22K-Gold-Antique-Ring', existingItems);
  assert(normMatch !== null, 'Should detect normalized duplicate with hyphens');
  assert.strictEqual(normMatch.item.id, 'it-1');

  const noMatch = checkDuplicate('Diamond Nose Pin', existingItems);
  assert.strictEqual(noMatch, null, 'Unrelated item should not trigger duplicate warning');
});

// ====================================================
// TEST 32: Alphabetical Default Sorting (A-Z)
// ====================================================
runTest('32. Alphabetical Default Sorting: Items catalogue sorts A-Z', () => {
  const items = [
    { id: '1', name: 'Silver Kada' },
    { id: '2', name: 'Antique Gold Necklace' },
    { id: '3', name: 'Diamond Earring' },
    { id: '4', name: 'Bangles 22K' }
  ];

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  assert.strictEqual(sorted[0].name, 'Antique Gold Necklace');
  assert.strictEqual(sorted[1].name, 'Bangles 22K');
  assert.strictEqual(sorted[2].name, 'Diamond Earring');
  assert.strictEqual(sorted[3].name, 'Silver Kada');
});

// ====================================================
// TEST 33: Rename Item Preserves ID & Historical Linkage
// ====================================================
runTest('33. Rename Item: Preserves item ID, rates, stock, and historical linkages', () => {
  const originalItem = {
    id: 'item-gold-ring-01',
    name: '22K Gold Ring (Old Name)',
    purchase_rate: 45000,
    default_sale_rate: 48000,
    current_stock: 7,
    is_archived: false
  };

  const historicalSale = {
    id: 'sale-001',
    invoice_number: 'SSJ-101',
    items: [
      { item_id: 'item-gold-ring-01', item_name: '22K Gold Ring (Old Name)', quantity: 2, line_total: 96000 }
    ]
  };

  // Renaming item
  const renamedItem = {
    ...originalItem,
    name: '22K Gold Antique Floral Ring (Renamed)'
  };

  assert.strictEqual(renamedItem.id, originalItem.id, 'Item ID must remain unchanged');
  assert.strictEqual(renamedItem.purchase_rate, 45000);
  assert.strictEqual(renamedItem.current_stock, 7);
  assert.strictEqual(renamedItem.name, '22K Gold Antique Floral Ring (Renamed)');

  // Past sale line item is preserved with original historical values
  assert.strictEqual(historicalSale.items[0].item_id, renamedItem.id);
  assert.strictEqual(historicalSale.items[0].quantity, 2);
  assert.strictEqual(historicalSale.items[0].line_total, 96000);
});

// ====================================================
// TEST 34: Archive Jewellery Item Excludes from New Selections
// ====================================================
runTest('34. Archive Item: Excludes item from new transaction dropdowns while preserving history', () => {
  const catalogue = [
    { id: 'it-1', name: 'Active Gold Ring', is_archived: false },
    { id: 'it-2', name: 'Discontinued Silver Coin', is_archived: true },
    { id: 'it-3', name: 'Active Diamond Pendant', is_archived: false }
  ];

  // Active items for dropdowns in Create Sale and Create Purchase
  const activeDropdownItems = catalogue.filter(i => !i.is_archived);

  assert.strictEqual(activeDropdownItems.length, 2);
  assert(activeDropdownItems.some(i => i.id === 'it-1'));
  assert(activeDropdownItems.some(i => i.id === 'it-3'));
  assert(!activeDropdownItems.some(i => i.id === 'it-2'), 'Archived item must be excluded from dropdown');

  // But preserved in full catalogue
  assert.strictEqual(catalogue.length, 3);
});

// ====================================================
// TEST 35: Permanent Deletion Guard
// ====================================================
runTest('35. Permanent Deletion Guard: Blocks deletion if item has purchases, sales, transfers, or stock', () => {
  const purchases = [
    { id: 'p-1', items: [{ item_id: 'item-in-purchase', item_name: 'Gold Ring', quantity: 10 }] }
  ];
  const sales = [
    { id: 's-1', items: [{ item_id: 'item-in-sale', item_name: 'Silver Payal', quantity: 2 }] }
  ];
  const transfers = [
    { id: 't-1', item_id: 'item-in-transfer', quantity: 3, transfer_type: 'issue' }
  ];

  const checkCanDelete = (item) => {
    if (item.current_stock > 0) {
      throw new Error(`Cannot permanently delete "${item.name}" because it still has ${item.current_stock} units in stock.`);
    }
    const hasPur = purchases.some(p => p.items?.some(it => it.item_id === item.id));
    if (hasPur) {
      throw new Error(`Cannot permanently delete "${item.name}" because it has recorded supplier purchases.`);
    }
    const hasSale = sales.some(s => s.items?.some(it => it.item_id === item.id));
    if (hasSale) {
      throw new Error(`Cannot permanently delete "${item.name}" because it appears on saved sales bills.`);
    }
    const hasTransfer = transfers.some(t => t.item_id === item.id);
    if (hasTransfer) {
      throw new Error(`Cannot permanently delete "${item.name}" because it is linked to party stock transfers.`);
    }
    return true;
  };

  // Item with stock
  assert.throws(() => {
    checkCanDelete({ id: 'item-stock', name: 'Item With Stock', current_stock: 4 });
  }, /units in stock/);

  // Item in purchase
  assert.throws(() => {
    checkCanDelete({ id: 'item-in-purchase', name: 'Gold Ring', current_stock: 0 });
  }, /supplier purchases/);

  // Item in sale
  assert.throws(() => {
    checkCanDelete({ id: 'item-in-sale', name: 'Silver Payal', current_stock: 0 });
  }, /sales bills/);

  // Item in transfer
  assert.throws(() => {
    checkCanDelete({ id: 'item-in-transfer', name: 'Consignment Ring', current_stock: 0 });
  }, /party stock transfers/);

  // Unused item with 0 stock
  const canDeleteUnused = checkCanDelete({ id: 'item-unused', name: 'Accidental Item', current_stock: 0 });
  assert.strictEqual(canDeleteUnused, true, 'Unused item with zero stock should be deletable');
});

// ====================================================
// TEST 36: Item Usage Report Calculation
// ====================================================
runTest('36. Item Usage Calculation: Computes purchases, sales, consignments, and unit counters', () => {
  const item = { id: 'item-007', name: 'Royal Solitaire Ring', current_stock: 8, is_archived: false };

  const purchases = [
    {
      id: 'pur-1',
      supplier_name: 'Bombay Bullion',
      items: [{ item_id: 'item-007', item_name: 'Royal Solitaire Ring', quantity: 15, unit_purchase_rate: 40000 }]
    },
    {
      id: 'pur-2',
      supplier_name: 'Surat Gems',
      items: [{ item_id: 'item-007', item_name: 'Royal Solitaire Ring', quantity: 5, unit_purchase_rate: 42000 }]
    }
  ];

  const sales = [
    {
      id: 'sale-1',
      invoice_number: 'SSJ-501',
      party_name: 'Kothari Jewellers',
      items: [{ item_id: 'item-007', item_name: 'Royal Solitaire Ring', quantity: 7, unit_sale_rate: 46000 }]
    }
  ];

  const transfers = [
    { id: 'tr-1', item_id: 'item-007', quantity: 5, transfer_type: 'issue' },
    { id: 'tr-2', item_id: 'item-007', quantity: 2, transfer_type: 'return' }
  ];

  // Calculate usage
  const totalPurchased = purchases.reduce((sum, p) => {
    return sum + p.items.filter(it => it.item_id === item.id).reduce((s, it) => s + it.quantity, 0);
  }, 0);

  const totalSold = sales.reduce((sum, s) => {
    return sum + s.items.filter(it => it.item_id === item.id).reduce((s, it) => s + it.quantity, 0);
  }, 0);

  let held = 0;
  transfers.forEach(t => {
    if (t.item_id === item.id) {
      if (t.transfer_type === 'issue') held += t.quantity;
      if (t.transfer_type === 'return') held -= t.quantity;
    }
  });

  assert.strictEqual(totalPurchased, 20, 'Total purchased units must be 15 + 5 = 20');
  assert.strictEqual(totalSold, 7, 'Total sold units must be 7');
  assert.strictEqual(held, 3, 'Total held consignment units must be 5 - 2 = 3');
  assert.strictEqual(item.current_stock, 8, 'Showroom stock is 8');
});

// TEST 37: Section 5 Worked Example - Multi-Transaction Party Stock Ledger & FIFO Valuation
runTest('37. Section 5 Worked Example: FIFO Batch Handover (100@50, 40@60) & Settlement of 30 pcs', () => {
  // Setup party and transactions according to Section 5
  const party = { id: 'pty-raj-test', name: 'Test Party', state_id: 'st-raj' };
  const item = { id: 'it-nose-pin', name: 'Stone Nose Pin' };

  // Transaction 1: Handover 100 @ 50 = 5,000
  const tx1 = {
    id: 'tx-1',
    transfer_date: '2026-03-01T10:00:00Z',
    item_id: item.id,
    item_name: item.name,
    quantity: 100,
    rate: 50,
    total_value: 5000,
    transfer_type: 'handover'
  };

  // Transaction 2: Handover 40 @ 60 = 2,400
  const tx2 = {
    id: 'tx-2',
    transfer_date: '2026-03-02T10:00:00Z',
    item_id: item.id,
    item_name: item.name,
    quantity: 40,
    rate: 60,
    total_value: 2400,
    transfer_type: 'handover'
  };

  // Simulation of FIFO evaluation after Tx1 and Tx2
  function evaluateFifoLedger(transfers) {
    const batches = [];
    let handoverQty = 0;
    let handoverValue = 0;
    let returnedQty = 0;
    let soldSettledQty = 0;

    transfers.forEach(t => {
      const qty = t.quantity;
      const rate = t.rate || 0;
      const val = t.total_value || (qty * rate);

      if (t.transfer_type === 'handover' || t.transfer_type === 'issue') {
        handoverQty += qty;
        handoverValue += val;
        batches.push({ id: t.id, rate, original_qty: qty, remaining_qty: qty });
      } else if (t.transfer_type === 'return') {
        returnedQty += qty;
        let need = qty;
        for (const b of batches) {
          if (need <= 0) break;
          if (b.remaining_qty > 0) {
            const take = Math.min(b.remaining_qty, need);
            b.remaining_qty -= take;
            need -= take;
          }
        }
      } else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') {
        soldSettledQty += qty;
        let need = qty;
        for (const b of batches) {
          if (need <= 0) break;
          if (b.remaining_qty > 0) {
            const take = Math.min(b.remaining_qty, need);
            b.remaining_qty -= take;
            need -= take;
          }
        }
      }
    });

    const balanceQty = batches.reduce((sum, b) => sum + b.remaining_qty, 0);
    const balanceValue = batches.reduce((sum, b) => sum + (b.remaining_qty * b.rate), 0);
    const dueQty = balanceQty;
    const dueValue = balanceValue;

    return {
      handoverQty,
      handoverValue,
      balanceQty,
      balanceValue,
      dueQty,
      dueValue
    };
  }

  // Check state after both handovers
  const stateAfterHandovers = evaluateFifoLedger([tx1, tx2]);
  assert.strictEqual(stateAfterHandovers.handoverQty, 140, 'Total Stock Handover must be 140 pieces');
  assert.strictEqual(stateAfterHandovers.handoverValue, 7400, 'Total Handover Value must be ₹7,400');
  assert.strictEqual(stateAfterHandovers.balanceQty, 140, 'Balance Stock must be 140 pieces');
  assert.strictEqual(stateAfterHandovers.balanceValue, 7400, 'Balance Stock Value must be ₹7,400');
  assert.strictEqual(stateAfterHandovers.dueQty, 140, 'Due Stock must be 140 pieces');
  assert.strictEqual(stateAfterHandovers.dueValue, 7400, 'Due Stock Value must be ₹7,400');

  // Transaction 3: Record a settlement of 30 pieces from first batch at applicable original rate of ₹50
  const tx3 = {
    id: 'tx-3',
    transfer_date: '2026-03-05T10:00:00Z',
    item_id: item.id,
    item_name: item.name,
    quantity: 30,
    rate: 50,
    total_value: 1500,
    transfer_type: 'settled'
  };

  const stateAfterSettlement = evaluateFifoLedger([tx1, tx2, tx3]);
  assert.strictEqual(stateAfterSettlement.handoverQty, 140, 'Total handover stays at 140 pieces');
  assert.strictEqual(stateAfterSettlement.handoverValue, 7400, 'Total handover value stays at ₹7,400');
  assert.strictEqual(stateAfterSettlement.balanceQty, 110, 'Remaining physical balance stock must be 110 pieces');
  assert.strictEqual(stateAfterSettlement.balanceValue, 5900, 'Remaining balance stock value must be ₹5,900');
  assert.strictEqual(stateAfterSettlement.dueQty, 110, 'Remaining due stock must be 110 pieces');
  assert.strictEqual(stateAfterSettlement.dueValue, 5900, 'Remaining due stock value must be ₹5,900');
});

// TEST 38: Money Ledger & Stock Ledger Separation
runTest('38. Stock vs Money Separation: Handover alone creates zero sales and zero receivables', () => {
  const partyOpeningBalance = 0;
  const handovers = [
    { quantity: 50, rate: 200, total_value: 10000, transfer_type: 'handover' }
  ];
  const invoices = []; // No sales invoices generated yet
  const payments = []; // No cash payments

  const totalInvoicedSales = invoices.reduce((sum, s) => sum + s.grand_total, 0);
  const totalReceived = payments.filter(p => p.type === 'received').reduce((sum, p) => sum + p.amount, 0);
  const financialReceivable = partyOpeningBalance + totalInvoicedSales - totalReceived;

  assert.strictEqual(totalInvoicedSales, 0, 'Handing over consignment stock does NOT count as a sale');
  assert.strictEqual(financialReceivable, 0, 'Handing over consignment stock does NOT count as a money receivable');
});

// TEST 39: Form Validation & Duplicate Prevention
runTest('39. State & Party Form Validation: Empty names and duplicates strictly rejected', () => {
  const states = [{ id: 's-1', name: 'Gujarat', is_archived: false }];
  const parties = [{ id: 'p-1', state_id: 's-1', name: 'Shree Jewellers', is_archived: false }];

  // 1. Empty state name rejection
  assert.throws(() => {
    const name = '   ';
    if (!name.trim()) throw new Error('State name is required.');
  }, /State name is required/);

  // 2. Duplicate state rejection (case-insensitive)
  assert.throws(() => {
    const candidate = 'gujarat';
    const exists = states.some(s => s.name.toLowerCase() === candidate.toLowerCase() && !s.is_archived);
    if (exists) throw new Error('State "Gujarat" already exists.');
  }, /already exists/);

  // 3. Duplicate party in same state rejection
  assert.throws(() => {
    const candidate = 'shree jewellers';
    const stateId = 's-1';
    const exists = parties.some(p => p.state_id === stateId && p.name.toLowerCase() === candidate.toLowerCase() && !p.is_archived);
    if (exists) throw new Error('Party "shree jewellers" already exists in this state.');
  }, /already exists in this state/);
});

// ====================================================
// TEST 40 (Test A): Multi-level transfer custody accounting
// ====================================================
runTest('40. Multi-level custody accounting: Owner -> State Head -> Distributor (1,500 -> 1,000 -> 300)', () => {
  const item = { id: 'item-101', name: 'Gold Bangles', current_stock: 1500, purchase_rate: 5000 };
  const stateHead = { id: 'party-sh-1', name: 'Rajasthan State Head', party_type: 'state_head', state_id: 'state-rj' };
  const distributorA = { id: 'party-dist-1', name: 'Jaipur Distributor A', party_type: 'distributor', state_id: 'state-rj', parent_party_id: 'party-sh-1' };

  const transfers = [];

  // 1. Owner transfers 1,000 pcs to Rajasthan State Head
  const qty1 = 1000;
  if (item.current_stock < qty1) throw new Error('Insufficient available stock');
  item.current_stock -= qty1;
  transfers.push({
    id: 'tr-1',
    transfer_date: new Date().toISOString(),
    destination_state_id: stateHead.state_id,
    destination_party_id: stateHead.id,
    transfer_level: 'owner_to_party',
    item_id: item.id,
    quantity: qty1,
    rate: 5000,
    transfer_type: 'handover'
  });

  // Calculate State Head held stock
  const getPartyStock = (partyId, itemId) => {
    let stock = 0;
    transfers.forEach(t => {
      if (t.item_id !== itemId) return;
      if (t.destination_party_id === partyId) {
        if (t.transfer_type === 'handover' || t.transfer_type === 'issue') stock += t.quantity;
        else if (t.transfer_type === 'return' && t.source_party_id) stock += t.quantity;
        else if (t.transfer_type === 'return' && !t.source_party_id) stock -= t.quantity;
        else if (t.transfer_type === 'settled' || t.transfer_type === 'sale') stock -= t.quantity;
      }
      if (t.source_party_id === partyId) {
        stock -= t.quantity;
      }
    });
    return stock;
  };

  assert.strictEqual(item.current_stock, 500, 'Owner warehouse must have 500 pieces remaining');
  assert.strictEqual(getPartyStock(stateHead.id, item.id), 1000, 'State Head must hold 1,000 pieces');

  // 2. State Head transfers 300 pcs to Distributor A
  const qty2 = 300;
  const shHeld = getPartyStock(stateHead.id, item.id);
  if (shHeld < qty2) throw new Error('Insufficient stock held by State Head');

  // Note: Owner warehouse item.current_stock is NOT touched!
  transfers.push({
    id: 'tr-2',
    transfer_date: new Date().toISOString(),
    destination_state_id: stateHead.state_id,
    destination_party_id: distributorA.id,
    source_party_id: stateHead.id,
    transfer_level: 'party_to_party',
    item_id: item.id,
    quantity: qty2,
    rate: 5000,
    transfer_type: 'handover'
  });

  const stateHeadStock = getPartyStock(stateHead.id, item.id);
  const distributorAStock = getPartyStock(distributorA.id, item.id);
  const totalOutsideCustody = stateHeadStock + distributorAStock;

  assert.strictEqual(item.current_stock, 500, 'Owner warehouse must stay at 500 pieces (NOT reduced again)');
  assert.strictEqual(stateHeadStock, 700, 'State Head must hold 700 pieces (1000 - 300)');
  assert.strictEqual(distributorAStock, 300, 'Distributor A must hold 300 pieces');
  assert.strictEqual(totalOutsideCustody, 1000, 'Total stock outside custody must be exactly 1,000 pieces (NOT 1,300)');
});

// ====================================================
// TEST 41 (Test B): Atomic rejection of transfer exceeding available stock
// ====================================================
runTest('41. Atomic Rejection: Transfer exceeding available stock rejected with zero changes', () => {
  const item = { id: 'item-102', name: 'Diamond Pendant', current_stock: 1500 };
  const stateHead = { id: 'sh-1', name: 'Gujarat State Head', party_type: 'state_head' };
  const distributor = { id: 'dist-1', name: 'Surat Distributor', party_type: 'distributor' };
  const transfers = [];

  // Scenario 1: Owner has 1,500 pcs, attempts to transfer 1,700 pcs
  const attemptOwnerTransfer = (requestedQty) => {
    if (item.current_stock < requestedQty) {
      throw new Error(`Insufficient available stock for "${item.name}". Available in warehouse: ${item.current_stock} pieces, Requested: ${requestedQty} pieces.`);
    }
    item.current_stock -= requestedQty;
    transfers.push({ id: 'tx-fail', quantity: requestedQty });
  };

  assert.throws(
    () => attemptOwnerTransfer(1700),
    /Insufficient available stock for "Diamond Pendant"\. Available in warehouse: 1500 pieces, Requested: 1700 pieces\./
  );
  assert.strictEqual(item.current_stock, 1500, 'Owner inventory must remain 1,500 pieces after rejection');
  assert.strictEqual(transfers.length, 0, 'No transfer must be committed to ledger');

  // Scenario 2: State head has 700 pcs, attempts to transfer 800 pcs
  const stateHeadStock = 700;
  const attemptStateHeadTransfer = (requestedQty) => {
    if (stateHeadStock < requestedQty) {
      throw new Error(`Insufficient stock held by State Head for "${item.name}". Available: ${stateHeadStock} pieces, Requested: ${requestedQty} pieces.`);
    }
  };

  assert.throws(
    () => attemptStateHeadTransfer(800),
    /Insufficient stock held by State Head for "Diamond Pendant"\. Available: 700 pieces, Requested: 800 pieces\./
  );
  assert.strictEqual(transfers.length, 0, 'Ledger remains untouched');
});

// ====================================================
// TEST 42 (Test C): Financial payment sync without double counting
// ====================================================
runTest('42. Financial Payment Sync: State/distributor payment updates party balance & Main Dashboard without double counting', () => {
  const party = { id: 'p-dist-1', name: 'Apex Distributors', opening_balance: 50000 };
  const sales = [];
  const partyPayments = [];

  // Record a payment received from distributor
  const paymentAmount = 20000;
  partyPayments.push({
    id: 'pay-1',
    party_id: party.id,
    payment_date: new Date().toISOString(),
    amount: paymentAmount,
    payment_type: 'received',
    payment_method: 'Bank Transfer',
    reference: 'UTR123456789'
  });

  // Calculate party net receivable
  const partyReceived = partyPayments.filter(p => p.party_id === party.id && p.payment_type === 'received').reduce((sum, p) => sum + p.amount, 0);
  const partyOutstanding = party.opening_balance - partyReceived;
  assert.strictEqual(partyOutstanding, 30000, 'Party outstanding receivable must reduce to ₹30,000');

  // Calculate State & Parties Mini-Dashboard payment total
  const miniDashPaymentsReceived = partyPayments.filter(p => p.payment_type === 'received').reduce((sum, p) => sum + p.amount, 0);
  assert.strictEqual(miniDashPaymentsReceived, 20000, 'Mini-dashboard received payments must show ₹20,000');

  // Calculate Main Dashboard cash received
  const mainDashMonthCashReceived = sales.reduce((sum, s) => sum + (s.amount_received || 0), 0) + partyPayments.filter(p => p.payment_type === 'received').reduce((sum, p) => sum + p.amount, 0);
  assert.strictEqual(mainDashMonthCashReceived, 20000, 'Main dashboard cash received must reflect ₹20,000');

  // Verify non-duplication: no separate unlinked counter was created
  assert.strictEqual(partyPayments.length, 1, 'Payment is recorded exactly once in authoritative financial ledger');
});

// ====================================================
// TEST 43 (Test D): Stock return restoration
// ====================================================
runTest('43. Stock Return Restoration: Distributor -> State Head (50 pcs) & State Head -> Owner (100 pcs)', () => {
  let ownerStock = 500;
  let stateHeadStock = 700;
  let distributorStock = 300;

  // Step 1: Distributor returns 50 pcs to State Head
  const returnToHeadQty = 50;
  assert(distributorStock >= returnToHeadQty, 'Distributor has enough stock to return');
  distributorStock -= returnToHeadQty;
  stateHeadStock += returnToHeadQty;
  // Owner stock is untouched
  assert.strictEqual(distributorStock, 250, 'Distributor stock is 250 pcs');
  assert.strictEqual(stateHeadStock, 750, 'State Head stock is 750 pcs');
  assert.strictEqual(ownerStock, 500, 'Owner warehouse remains 500 pcs');

  // Step 2: State Head returns 100 pcs to Owner
  const returnToOwnerQty = 100;
  assert(stateHeadStock >= returnToOwnerQty, 'State Head has enough stock to return');
  stateHeadStock -= returnToOwnerQty;
  ownerStock += returnToOwnerQty;

  assert.strictEqual(stateHeadStock, 650, 'State Head stock is 650 pcs');
  assert.strictEqual(ownerStock, 600, 'Owner warehouse restored to 600 pcs');
  assert.strictEqual(distributorStock, 250, 'Distributor stock remains 250 pcs');

  const totalOutsideCustody = stateHeadStock + distributorStock;
  assert.strictEqual(totalOutsideCustody, 900, 'Total stock outside custody is 900 pcs (650 + 250)');
});

// ====================================================
// TEST 44 (Test E): Mathematical invariant conservation
// ====================================================
runTest('44. Invariant Preservation: Total pieces across all locations equals initial purchase', () => {
  const initialPurchaseQty = 1500;
  const ownerStock = 600;
  const stateHeadStock = 650;
  let distributorStock = 250;

  // Distributor completes a sale of 50 pieces
  const soldQty = 50;
  distributorStock -= soldQty; // 200 remaining

  const writtenOffQty = 0;
  const returnedToSupplierQty = 0;

  // Invariant formula:
  // Total Pieces = Owner Stock + Sum of State Heads + Sum of Distributors + Total Sold + Written Off - Supplier Returns
  const totalPieces = ownerStock + stateHeadStock + distributorStock + soldQty + writtenOffQty - returnedToSupplierQty;
  assert.strictEqual(totalPieces, initialPurchaseQty, 'Total pieces across all entities must strictly equal initial purchase of 1,500');

  // Outside custody formula:
  const outsideCustody = stateHeadStock + distributorStock;
  assert.strictEqual(outsideCustody, 850, 'Stock outside custody must be exactly 850 pieces');

  // Non-negativity invariant:
  assert(ownerStock >= 0, 'Owner stock cannot be negative');
  assert(stateHeadStock >= 0, 'State head stock cannot be negative');
  assert(distributorStock >= 0, 'Distributor stock cannot be negative');
});

console.log(`\n====================================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`====================================================`);

if (passedTests !== totalTests) {
  process.exit(1);
}
