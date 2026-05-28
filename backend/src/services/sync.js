const db = require('../db/index');
const gc = require('./gocardless');
const { categorise } = require('./categorise');
const { detectSubscriptions } = require('./subscriptions');

async function syncAllAccounts() {
  const accounts = db.prepare('SELECT * FROM accounts WHERE gc_id IS NOT NULL').all();
  const results = [];
  for (const account of accounts) {
    try {
      const count = await syncAccount(account);
      results.push({ id: account.id, name: account.name, synced: count });
    } catch (err) {
      results.push({ id: account.id, name: account.name, error: err.message });
    }
  }
  detectSubscriptions();
  return results;
}

async function syncAccount(account) {
  const dateFrom = account.last_synced
    ? account.last_synced.slice(0, 10)
    : new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const txns = await gc.getTransactions(account.gc_id, dateFrom);
  const booked = txns.booked || [];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO transactions
      (gc_id, account_id, amount, currency, date, booking_date, description, merchant_name, category)
    VALUES
      (@gc_id, @account_id, @amount, @currency, @date, @booking_date, @description, @merchant_name, @category)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) insert.run(r);
  });

  const rows = booked.map(t => {
    const amount        = parseFloat(t.transactionAmount?.amount || 0);
    const currency      = t.transactionAmount?.currency || account.currency;
    const date          = t.valueDate || t.bookingDate;
    const booking_date  = t.bookingDate;
    const description   = t.remittanceInformationUnstructured || t.remittanceInformationStructured || '';
    const merchant_name = t.creditorName || t.debtorName || '';
    return {
      gc_id: t.transactionId,
      account_id: account.id,
      amount,
      currency,
      date,
      booking_date,
      description,
      merchant_name,
      category: categorise(description, merchant_name),
    };
  });

  insertMany(rows);

  // Update balance
  const { balances } = await gc.getAccountDetails(account.gc_id);
  const bal = balances?.balances?.find(b => b.balanceType === 'interimAvailable') || balances?.balances?.[0];
  const balance = bal ? parseFloat(bal.balanceAmount.amount) : account.balance;

  db.prepare(`
    UPDATE accounts SET balance=?, last_synced=datetime('now') WHERE id=?
  `).run(balance, account.id);

  return rows.length;
}

module.exports = { syncAllAccounts, syncAccount };
