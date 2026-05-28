const db = require('../db/index');

function detectSubscriptions() {
  // Find merchants that appear at roughly monthly intervals with similar amounts
  const rows = db.prepare(`
    SELECT merchant_name, amount, currency,
           COUNT(*) as occurrences,
           MIN(date) as first_seen,
           MAX(date) as last_seen
    FROM transactions
    WHERE amount < 0
      AND merchant_name != ''
      AND date >= date('now', '-6 months')
    GROUP BY merchant_name, ROUND(ABS(amount), 2)
    HAVING occurrences >= 2
    ORDER BY occurrences DESC
  `).all();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO subscriptions (merchant_name, amount, currency, frequency, next_billing)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const row of rows) {
    const days = daysBetween(row.first_seen, row.last_seen);
    const avgInterval = days / (row.occurrences - 1);

    let frequency;
    if (avgInterval < 10)       frequency = 'weekly';
    else if (avgInterval < 45)  frequency = 'monthly';
    else                        frequency = 'yearly';

    const next = nextBillingDate(row.last_seen, frequency);
    insert.run(row.merchant_name, Math.abs(row.amount), row.currency, frequency, next);
  }
}

function daysBetween(a, b) {
  return (new Date(b) - new Date(a)) / 86400000;
}

function nextBillingDate(lastDate, frequency) {
  const d = new Date(lastDate);
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

module.exports = { detectSubscriptions };
