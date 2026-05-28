const db = require('../db/index');

async function detectSubscriptions() {
  const rows = await db.query(`
    SELECT merchant_name, amount, currency,
           COUNT(*)   AS occurrences,
           MIN(date)  AS first_seen,
           MAX(date)  AS last_seen
    FROM transactions
    WHERE amount < 0
      AND merchant_name != ''
      AND date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY merchant_name, ROUND(ABS(amount), 2), currency
    HAVING COUNT(*) >= 2
    ORDER BY COUNT(*) DESC
  `);

  // Clear previous auto-detected subscriptions and re-insert
  await db.query('DELETE FROM subscriptions WHERE is_manual = false');

  for (const row of rows) {
    const days = (new Date(row.last_seen) - new Date(row.first_seen)) / 86400000;
    const avgInterval = days / (row.occurrences - 1);

    let frequency;
    if (avgInterval < 10)      frequency = 'weekly';
    else if (avgInterval < 45) frequency = 'monthly';
    else                       frequency = 'yearly';

    const next = nextBillingDate(row.last_seen, frequency);

    await db.query(`
      INSERT INTO subscriptions (merchant_name, amount, currency, frequency, next_billing, category, is_manual)
      VALUES ($1, $2, $3, $4, $5, 'Subscriptions', false)
    `, [row.merchant_name, Math.abs(Number(row.amount)), row.currency, frequency, next]);
  }
}

function nextBillingDate(lastDate, frequency) {
  const d = new Date(lastDate);
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

module.exports = { detectSubscriptions };
