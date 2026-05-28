const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, async (req, res) => {
  try {
    const subs = await db.query('SELECT * FROM subscriptions ORDER BY next_billing ASC');
    const monthly_total = subs.reduce((sum, s) => {
      const amt = Number(s.amount);
      if (s.frequency === 'weekly')  return sum + amt * 4.33;
      if (s.frequency === 'monthly') return sum + amt;
      if (s.frequency === 'yearly')  return sum + amt / 12;
      return sum;
    }, 0);
    res.json({ subscriptions: subs, monthly_total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { merchant_name, amount, currency, frequency, next_billing, category } = req.body;
    const [row] = await db.query(`
      INSERT INTO subscriptions (merchant_name, amount, currency, frequency, next_billing, category, is_manual)
      VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id
    `, [merchant_name, amount, currency || 'EUR', frequency, next_billing || null, category || 'Subscriptions']);
    res.json({ id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM subscriptions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
