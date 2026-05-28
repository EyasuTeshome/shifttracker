const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

function monthStr(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().slice(0, 7);
}

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const m = monthStr();

    const [[balRow], [incomeRow], [spendRow], [prevRow], byCategory, upcoming, recentTxns] =
      await Promise.all([
        db.query('SELECT COALESCE(SUM(balance),0) AS total FROM accounts'),
        db.query(`
          SELECT COALESCE(SUM(amount),0) AS total FROM transactions
          WHERE amount>0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
        `, [m]),
        db.query(`
          SELECT COALESCE(SUM(ABS(amount)),0) AS total FROM transactions
          WHERE amount<0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
        `, [m]),
        db.query(`
          SELECT COALESCE(SUM(ABS(amount)),0) AS total FROM transactions
          WHERE amount<0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
        `, [monthStr(-1)]),
        db.query(`
          SELECT category, COALESCE(SUM(ABS(amount)),0) AS total
          FROM transactions
          WHERE amount<0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
          GROUP BY category ORDER BY total DESC LIMIT 8
        `, [m]),
        db.query(`
          SELECT * FROM subscriptions
          WHERE next_billing BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          ORDER BY next_billing ASC
        `),
        db.query('SELECT * FROM transactions WHERE is_split=false ORDER BY date DESC, id DESC LIMIT 5'),
      ]);

    res.json({
      balance:     Number(balRow.total),
      income:      Number(incomeRow.total),
      spending:    Number(spendRow.total),
      prevSpending:Number(prevRow.total),
      byCategory,
      upcoming,
      recentTxns,
      month: m,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/charts', requireAuth, async (req, res) => {
  try {
    const monthly = await Promise.all(
      Array.from({ length: 6 }, (_, i) => 5 - i).map(async i => {
        const m = monthStr(-i);
        const [[inc], [spend]] = await Promise.all([
          db.query(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE amount>0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false`, [m]),
          db.query(`SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM transactions WHERE amount<0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false`, [m]),
        ]);
        return { month: m, income: Number(inc.v), spending: Number(spend.v) };
      })
    );

    const m = monthStr();
    const [byCategory, incomeSources] = await Promise.all([
      db.query(`
        SELECT category, COALESCE(SUM(ABS(amount)),0) AS total
        FROM transactions WHERE amount<0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
        GROUP BY category ORDER BY total DESC
      `, [m]),
      db.query(`
        SELECT COALESCE(merchant_name, description, 'Other') AS source, SUM(amount) AS total
        FROM transactions WHERE amount>0 AND TO_CHAR(date,'YYYY-MM')=$1 AND is_split=false
        GROUP BY source ORDER BY total DESC LIMIT 5
      `, [m]),
    ]);

    res.json({ monthly, byCategory, incomeSources });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/categories', requireAuth, async (req, res) => {
  try {
    const rows = await db.query('SELECT DISTINCT category FROM transactions ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
