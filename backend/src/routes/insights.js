const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

function month(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().slice(0, 7);
}

router.get('/dashboard', requireAuth, (req, res) => {
  const m = month();

  const balance = db.prepare('SELECT COALESCE(SUM(balance),0) as total FROM accounts').get().total;

  const income = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total FROM transactions
    WHERE amount>0 AND strftime('%Y-%m',date)=? AND is_split=0
  `).get(m).total;

  const spending = db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)),0) as total FROM transactions
    WHERE amount<0 AND strftime('%Y-%m',date)=? AND is_split=0
  `).get(m).total;

  const prevSpending = db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)),0) as total FROM transactions
    WHERE amount<0 AND strftime('%Y-%m',date)=? AND is_split=0
  `).get(month(-1)).total;

  const byCategory = db.prepare(`
    SELECT category, COALESCE(SUM(ABS(amount)),0) as total
    FROM transactions
    WHERE amount<0 AND strftime('%Y-%m',date)=? AND is_split=0
    GROUP BY category ORDER BY total DESC LIMIT 8
  `).all(m);

  const upcoming = db.prepare(`
    SELECT * FROM subscriptions
    WHERE next_billing BETWEEN date('now') AND date('now','+7 days')
    ORDER BY next_billing ASC
  `).all();

  const recentTxns = db.prepare(`
    SELECT * FROM transactions WHERE is_split=0 ORDER BY date DESC, id DESC LIMIT 5
  `).all();

  res.json({ balance, income, spending, prevSpending, byCategory, upcoming, recentTxns, month: m });
});

router.get('/charts', requireAuth, (req, res) => {
  // Monthly spending last 6 months
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const m = month(-i);
    const { income } = db.prepare(`
      SELECT COALESCE(SUM(amount),0) as income FROM transactions
      WHERE amount>0 AND strftime('%Y-%m',date)=? AND is_split=0
    `).get(m);
    const { spending } = db.prepare(`
      SELECT COALESCE(SUM(ABS(amount)),0) as spending FROM transactions
      WHERE amount<0 AND strftime('%Y-%m',date)=? AND is_split=0
    `).get(m);
    monthly.push({ month: m, income, spending });
  }

  // By category this month
  const byCategory = db.prepare(`
    SELECT category, COALESCE(SUM(ABS(amount)),0) as total
    FROM transactions
    WHERE amount<0 AND strftime('%Y-%m',date)=? AND is_split=0
    GROUP BY category ORDER BY total DESC
  `).all(month());

  // Sankey: income sources → spending categories
  const incomeSources = db.prepare(`
    SELECT COALESCE(merchant_name, description, 'Other') as source, SUM(amount) as total
    FROM transactions WHERE amount>0 AND strftime('%Y-%m',date)=? AND is_split=0
    GROUP BY source ORDER BY total DESC LIMIT 5
  `).all(month());

  res.json({ monthly, byCategory, incomeSources });
});

router.get('/categories', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM transactions ORDER BY category').all()
    .map(r => r.category);
  res.json(categories);
});

module.exports = router;
