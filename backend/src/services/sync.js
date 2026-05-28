const db = require('../db/index');
const gc = require('./gocardless');
const { categorise } = require('./categorise');
const { detectSubscriptions } = require('./subscriptions');

async function syncAllAccounts() {
  const accounts = await db.query('SELECT * FROM accounts WHERE gc_id IS NOT NULL');
  const results = [];
  for (const account of accounts) {
    try {
      const count = await syncAccount(account);
      results.push({ id: account.id, name: account.name, synced: count });
    } catch (err) {
      results.push({ id: account.id, name: account.name, error: err.message });
    }
  }
  await detectSubscriptions();
  return results;
}

async function syncAccount(account) {
  const dateFrom = account.last_synced
    ? new Date(account.last_synced).toISOString().slice(0, 10)
    : new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const txns  = await gc.getTransactions(account.gc_id, dateFrom);
  const booked = txns.booked || [];

  const client = await db.pool.connect();
  let inserted = 0;
  try {
    await client.query('BEGIN');
    for (const t of booked) {
      const amount       = parseFloat(t.transactionAmount?.amount || 0);
      const currency     = t.transactionAmount?.currency || account.currency;
      const date         = t.valueDate || t.bookingDate;
      const booking_date = t.bookingDate;
      const description  = t.remittanceInformationUnstructured || t.remittanceInformationStructured || '';
      const merchant     = t.creditorName || t.debtorName || '';
      const category     = await categorise(description, merchant);

      const { rowCount } = await client.query(`
        INSERT INTO transactions
          (gc_id, account_id, amount, currency, date, booking_date, description, merchant_name, category)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (gc_id) DO NOTHING
      `, [t.transactionId, account.id, amount, currency, date, booking_date, description, merchant, category]);
      inserted += rowCount;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const { balances } = await gc.getAccountDetails(account.gc_id);
  const bal     = balances?.balances?.find(b => b.balanceType === 'interimAvailable') || balances?.balances?.[0];
  const balance = bal ? parseFloat(bal.balanceAmount.amount) : account.balance;

  await db.query(
    'UPDATE accounts SET balance=$1, last_synced=NOW() WHERE id=$2',
    [balance, account.id]
  );

  return inserted;
}

module.exports = { syncAllAccounts, syncAccount };
